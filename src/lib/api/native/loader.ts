import { VdThemeInfo } from "@lib/addons/themes";
import { removeCacheFile } from "./fs";

// @ts-ignore
const pyonLoaderIdentity = globalThis.__PYON_LOADER__;

// @ts-ignore
const rainLoaderIdentity = globalThis.__RAIN_LOADER__;

// @ts-ignore
const firecordLoaderIdentity = globalThis.__firecord_loader;

export interface FirecordLoaderIdentity {
    name: string;
    features: {
        loaderConfig?: boolean;
        devtools?: {
            prop: string;
            version: string;
        },
        themes?: {
            prop: string;
        };
    };
}

export function isFirecordLoader() {
    return firecordLoaderIdentity != null;
}

export function isPyonLoader() {
    return pyonLoaderIdentity != null;
}

export function isRa1nLoader() {
    return rainLoaderIdentity != null;
}

function polyfillFirecordLoaderIdentity() {
    if (!isPyonLoader() || isFirecordLoader() || !isRa1nLoader()) return null;

    let loader: { name: string; features: Record<string, any> };

    if (isRa1nLoader() == true) {
        loader = {
            name: rainLoaderIdentity.loaderName,
            features: {} as Record<string, any>,
        };
    } else {
        loader = {
            name: pyonLoaderIdentity.loaderName,
            features: {} as Record<string, any>,
        };
    }

    if (isLoaderConfigSupported()) loader.features.loaderConfig = true;
    if (isSysColorsSupported()) {
        loader.features.syscolors = {
            prop: "__firecord_syscolors"
        };

        Object.defineProperty(globalThis, "__firecord_syscolors", {
            get: () => getSysColors(),
            configurable: true
        });
    }
    if (isThemeSupported()) {
        loader.features.themes = {
            prop: "__firecord_theme"
        };

        Object.defineProperty(globalThis, "__firecord_theme", {
            // get: () => getStoredTheme(),
            get: () => {
                // PyonXposed only returns keys it parses, making custom keys like Themes+' to gone
                const id = getStoredTheme()?.id;
                if (!id) return null;

                const { themes } = require("@lib/addons/themes");
                return themes[id] ?? getStoredTheme() ?? null;
            },
            configurable: true
        });
    }

    Object.defineProperty(globalThis, "__firecord_loader", {
        get: () => loader,
        configurable: true
    });

    return loader as FirecordLoaderIdentity;
}

export function getLoaderIdentity() {
    if (isPyonLoader()) {
        return pyonLoaderIdentity;
    } else if (isFirecordLoader()) {
        return getFirecordLoaderIdentity();
    } else if (isRa1nLoader()) {
        return rainLoaderIdentity();
    }

    return null;
}

export function getFirecordLoaderIdentity(): FirecordLoaderIdentity | null {
    // @ts-ignore
    if (globalThis.__firecord_loader) return globalThis.__firecord_loader;
    return polyfillFirecordLoaderIdentity();
}

// add to __firecord_loader anyway
getFirecordLoaderIdentity();

export function getLoaderName() {
    if (isPyonLoader()) return pyonLoaderIdentity.loaderName;
    else if (isRa1nLoader()) return rainLoaderIdentity.loadername;
    else if (isFirecordLoader()) return firecordLoaderIdentity.name;

    return "Unknown";
}

export function getLoaderVersion(): string | null {
    if (isPyonLoader()) return pyonLoaderIdentity.loaderVersion;
    else if (isRa1nLoader()) return rainLoaderIdentity.loaderVersion;
    return null;
}

export function isLoaderConfigSupported() {
    if (isPyonLoader()) {
        return true;
    } else if (isFirecordLoader()) {
        return firecordLoaderIdentity!!.features.loaderConfig;
    } else if (isRa1nLoader()) {
        return true;
    }

    return false;
}

export function isThemeSupported() {
    if (isPyonLoader()) {
        return pyonLoaderIdentity.hasThemeSupport;
    } else if (isFirecordLoader()) {
        return firecordLoaderIdentity!!.features.themes != null;
    } else if (isRa1nLoader()) {
        return false; // Ra1n has theme support disabled, this is here just to make sure it doesnt think it does
    }

    return false;
}

export function getStoredTheme(): VdThemeInfo | null {
    if (isPyonLoader()) {
        return pyonLoaderIdentity.storedTheme;
    } else if (isFirecordLoader()) {
        const themeProp = firecordLoaderIdentity!!.features.themes?.prop;
        if (!themeProp) return null;
        // @ts-ignore
        return globalThis[themeProp] || null;
    }

    return null;
}

export function getThemeFilePath() {
    if (isPyonLoader()) {
        return "pyoncord/current-theme.json";
    } else if (isFirecordLoader()) {
        return "firecord_theme.json";
    }

    return null;
}

export function isReactDevToolsPreloaded() {
    if (isPyonLoader()) {
        return Boolean(window.__REACT_DEVTOOLS__);
    }
    if (isFirecordLoader()) {
        return firecordLoaderIdentity!!.features.devtools != null;
    }

    return false;
}

export function getReactDevToolsProp(): string | null {
    if (!isReactDevToolsPreloaded()) return null;

    if (isPyonLoader()) {
        window.__pyoncord_rdt = window.__REACT_DEVTOOLS__.exports;
        return "__pyoncord_rdt";
    }

    if (isFirecordLoader()) {
        return firecordLoaderIdentity!!.features.devtools!!.prop;
    }

    return null;
}

export function getReactDevToolsVersion() {
    if (!isReactDevToolsPreloaded()) return null;

    if (isPyonLoader()) {
        return window.__REACT_DEVTOOLS__.version || null;
    }
    if (isFirecordLoader()) {
        return firecordLoaderIdentity!!.features.devtools!!.version;
    }

    return null;
}

export function isSysColorsSupported() {
    return true;
}

export function getSysColors() {
    if (!isSysColorsSupported()) return null;
    if (isPyonLoader()) {
        return pyonLoaderIdentity.sysColors;
    } else if (isFirecordLoader()) {
        return firecordLoaderIdentity!!.features.syscolors!!.prop;
    }

    return null;
}

export function getLoaderConfigPath() {
    if (isPyonLoader()) {
        return "pyoncord/loader.json";
    } else if (isFirecordLoader()) {
        return "firecord_loader.json";
    } else if (isRa1nLoader()) {
        return "rain/loader.json";
    }

    return "loader.json";
}

export function isFontSupported() {
    if (isPyonLoader()) return pyonLoaderIdentity.fontPatch === 2;

    return false;
}

export async function clearBundle() {
    // TODO: This should be not be hardcoded, maybe put in loader.json?
    return void await removeCacheFile("bundle.js");
}