import { createFileBackend, createMMKVBackend, createStorage, wrapSync } from "@core/firecord/storage";
import { getLoaderConfigPath } from "@lib/api/native/loader";

export interface Settings {
    debuggerUrl: string;
    devToolsUrl: string;
    autoDebugger: boolean;
    autoDevTools: boolean;
    developerSettings: boolean;
    enableDiscordDeveloperSettings: boolean;
    safeMode?: {
        enabled: boolean;
        currentThemeId?: string;
    };
    enableEvalCommand?: boolean;
}

export interface LoaderConfig {
    customLoadUrl: {
        enabled: boolean;
        url: string;
    };
    loadReactDevTools: boolean;
}

export const settings = wrapSync(createStorage<Settings>(createMMKVBackend("FIRE_CORD_SETTINGS")));

export const loaderConfig = wrapSync(createStorage<LoaderConfig>(
    createFileBackend(getLoaderConfigPath(), {
        customLoadUrl: {
            enabled: false,
            url: "http://localhost:4040/kettu.js"
        }
    })
));

export interface UpdaterSettings {
    fetchPluginsOnStart?: boolean;
    repoAutoFetchOverrides?: Record<string, boolean>;
}

export const updaterSettings = wrapSync(createStorage<UpdaterSettings>(createMMKVBackend("FIRE_CORD_UPDATER_SETTINGS")));
