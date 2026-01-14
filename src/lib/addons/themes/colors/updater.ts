import { settings } from "@lib/api/settings";
import { ColorManifest } from "./types";
import { themeEngine } from "./engine";

/** @internal */
export const _colorRef = new Proxy({} as any, {
    get: (_, prop) => (themeEngine as any)[prop],
    set: (_, prop, value) => {
        (themeEngine as any)[prop] = value;
        return true;
    }
});

export function updateBunnyColor(colorManifest: ColorManifest | null, { update = true } ) {
    if (settings.safeMode?.enabled) return;
    themeEngine.applyTheme(colorManifest, update);
}