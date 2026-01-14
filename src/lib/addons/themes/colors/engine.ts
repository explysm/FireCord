import { findByProps, findByPropsLazy, findByStoreNameLazy } from "@metro";
import { byMutableProp } from "@metro/filters";
import { createLazyModule } from "@metro/lazy";
import { NativeThemeModule } from "@lib/api/native/modules";
import { before, instead } from "@lib/api/patcher";
import chroma from "chroma-js";
import { parseColorManifest } from "./parser";
import { ColorManifest, InternalColorDefinition } from "./types";
import { colorsPref } from "./preferences";
import { logger } from "@lib/utils/logger";

const tokenRef = findByProps("SemanticColor");
const ThemeStore = findByStoreNameLazy("ThemeStore");
const AppearanceManager = findByPropsLazy("updateTheme");
const FormDivider = findByPropsLazy("DIVIDER_COLORS");
const isThemeModule = createLazyModule(byMutableProp("isThemeDark"));

const SEMANTIC_FALLBACK_MAP: Record<string, string> = {
    "BG_BACKDROP": "BACKGROUND_FLOATING",
    "BG_BASE_PRIMARY": "BACKGROUND_PRIMARY",
    "BG_BASE_SECONDARY": "BACKGROUND_SECONDARY",
    "BG_BASE_TERTIARY": "BACKGROUND_SECONDARY_ALT",
    "BG_MOD_FAINT": "BACKGROUND_MODIFIER_ACCENT",
    "BG_MOD_STRONG": "BACKGROUND_MODIFIER_ACCENT",
    "BG_MOD_SUBTLE": "BACKGROUND_MODIFIER_ACCENT",
    "BG_SURFACE_OVERLAY": "BACKGROUND_FLOATING",
    "BG_SURFACE_OVERLAY_TMP": "BACKGROUND_FLOATING",
    "BG_SURFACE_RAISED": "BACKGROUND_MOBILE_PRIMARY"
};

const origRawColor = { ...tokenRef.RawColor };

export class ThemeEngine {
    private static instance: ThemeEngine;
    private _inc = 1;
    
    public current: InternalColorDefinition | null = null;
    public key: `bn-theme-${number}` | "dark" = "bn-theme-1";
    public lastSetDiscordTheme: string = "darker";

    private constructor() {}

    static getInstance() {
        if (!ThemeEngine.instance) {
            ThemeEngine.instance = new ThemeEngine();
        }
        return ThemeEngine.instance;
    }

    applyTheme(manifest: ColorManifest | null, update = true) {
        const internalDef = manifest ? parseColorManifest(manifest) : null;
        this.current = internalDef;

        const resolveType = (type = "dark") => (colorsPref.type ?? type) === "dark" ? "darker" : "light";
        const themeType = resolveType();

        if (themeType === "light" || update) {
            this.key = `bn-theme-${++this._inc}`;
            if (!ThemeStore.theme.startsWith("bn-theme-") && !ThemeStore.theme.startsWith("darker")) {
                this.lastSetDiscordTheme = ThemeStore.theme;
            }
        } else {
            this.key = "dark";
        }

        if (this.current) {
            const refKey = this.key;
            const reference = this.current.reference;

            tokenRef.Theme[refKey.toUpperCase()] = refKey;
            FormDivider.DIVIDER_COLORS[refKey] = FormDivider.DIVIDER_COLORS[reference];

            Object.keys(tokenRef.Shadow).forEach(k => tokenRef.Shadow[k][refKey] = tokenRef.Shadow[k][reference]);
            Object.keys(tokenRef.SemanticColor).forEach(k => {
                tokenRef.SemanticColor[k][refKey] = {
                    ...tokenRef.SemanticColor[k][reference]
                };
            });
        }

        if (update) {
            AppearanceManager.setShouldSyncAppearanceSettings(false);
            AppearanceManager.updateTheme(this.current ? this.key : "darker");
        }
    }

    patch() {
        const callback = ([theme]: any[]) => theme === this.key ? [this.current!.reference] : void 0;

        // Patch RawColor with getters
        Object.keys(tokenRef.RawColor).forEach(key => {
            Object.defineProperty(tokenRef.RawColor, key, {
                configurable: true,
                enumerable: true,
                get: () => {
                    return this.current?.raw[key] ?? origRawColor[key];
                }
            });
        });

        const unpatches = [
            before("isThemeDark", isThemeModule, callback),
            before("isThemeLight", isThemeModule, callback),
            before("updateTheme", NativeThemeModule, callback),
            instead("resolveSemanticColor", tokenRef.default.meta ?? tokenRef.default.internal, (args: any[], orig: any) => {
                if (!this.current || args[0] !== this.key) return orig(...args);

                const reference = this.current.reference;
                args[0] = reference;

                const [name, colorDef] = this.extractInfo(reference, args[1]);

                let semanticDef = this.current.semantic[name];
                if (!semanticDef && this.current.spec === 2 && name in SEMANTIC_FALLBACK_MAP) {
                    semanticDef = this.current.semantic[SEMANTIC_FALLBACK_MAP[name]];
                }

                if (semanticDef?.value) {
                    if (semanticDef.opacity === 1) return semanticDef.value;
                    return chroma(semanticDef.value).alpha(semanticDef.opacity).hex();
                }

                const rawValue = this.current.raw[colorDef.raw];
                if (rawValue) {
                    return colorDef.opacity === 1 ? rawValue : chroma(rawValue).alpha(colorDef.opacity).hex();
                }

                return orig(...args);
            }),
            () => {
                Object.defineProperty(tokenRef, "RawColor", {
                    configurable: true,
                    writable: true,
                    value: origRawColor
                });
            }
        ];

        return () => unpatches.forEach(p => p());
    }

    private extractInfo(themeName: string, colorObj: any): [name: string, colorDef: any] {
        // @ts-ignore
        const propName = colorObj[this.extractInfo._sym ??= Object.getOwnPropertySymbols(colorObj)[0]];
        const colorDef = tokenRef.SemanticColor[propName];
        return [propName, colorDef[themeName]];
    }
}

export const themeEngine = ThemeEngine.getInstance();
