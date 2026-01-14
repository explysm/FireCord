import { defineCorePlugin } from "..";
import { useProxy, createStorage, createMMKVBackend, wrapSync } from "@core/vendetta/storage";
import { VdPluginManager } from "@core/vendetta/plugins";
import { themes } from "@lib/addons/themes";
import { fonts } from "@lib/addons/fonts";
import { logger } from "@lib/utils/logger";
import { UserData } from "./types";
import { defaultHost, defaultClientId } from "./constants";

export interface CloudSyncStorage {
    token?: string;
    host?: string;
    clientId?: string;
    autoSync: boolean;
}

export const vstorage = wrapSync(createStorage<CloudSyncStorage>(createMMKVBackend("FIRE_CLOUD_SYNC", {
    autoSync: false,
    host: defaultHost,
    clientId: defaultClientId
})));

export async function grabEverything(): Promise<UserData> {
    const sync = {
        plugins: {},
        themes: {},
        fonts: {
            installed: {},
        },
    } as UserData;

    for (const item of Object.values(VdPluginManager.plugins)) {
        const storage = await createMMKVBackend(item.id).get();
        sync.plugins[item.id] = {
            enabled: item.enabled,
            storage: JSON.stringify(storage),
        };
    }

    for (const item of Object.values(themes)) {
        sync.themes[item.id] = {
            enabled: item.selected,
        };
    }

    const { __selected, ...installedFonts } = fonts;
    for (const [name, data] of Object.entries(installedFonts)) {
        sync.fonts.installed[name] = {
            enabled: __selected === name,
            data: data as any,
        };
    }

    return sync;
}

export default defineCorePlugin({
    manifest: {
        id: "firecord.cloudsync",
        version: "1.0.0",
        type: "plugin",
        spec: 3,
        main: "",
        display: {
            name: "Cloud Sync",
            description: "Syncs your plugins, themes and fonts to the cloud",
            authors: [{ name: "nexpid" }, { name: "FireCord Team" }],
        },
    },

    start() {
        const emitterSymbol = Symbol.for("vendetta.storage.emitter");
        const autoSync = async () => {
            if (!vstorage.autoSync || !vstorage.token) return;
            try {
                const data = await grabEverything();
                const host = vstorage.host || defaultHost;
                await fetch(`${host}api/data`, {
                    method: "PUT",
                    body: JSON.stringify(data),
                    headers: {
                        "content-type": "application/json",
                        "authorization": vstorage.token
                    },
                });
            } catch (e) {
                logger.error("CloudSync auto-save failed", e);
            }
        };

        const emitters = {
            plugins: (VdPluginManager.plugins as any)[emitterSymbol],
            themes: (themes as any)[emitterSymbol],
        };

        if (emitters.plugins) {
            emitters.plugins.on("SET", autoSync);
            emitters.plugins.on("DEL", autoSync);
        }
        if (emitters.themes) {
            emitters.themes.on("SET", autoSync);
            emitters.themes.on("DEL", autoSync);
        }

        logger.log("CloudSync started");
    },

    stop() {
        logger.log("CloudSync stopped");
    },

    SettingsComponent: () => require("./Settings").default
});