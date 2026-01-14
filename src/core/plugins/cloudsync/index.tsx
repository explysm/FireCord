import { defineCorePlugin } from "..";
import { React, NavigationNative } from "@metro/common";
import { ScrollView, View, ActivityIndicator } from "react-native";
import { 
    TableRowGroup, 
    TableRow, 
    TableSwitchRow, 
    Text, 
    Card, 
    Button,
    IconButton,
    TableRowIcon
} from "@metro/common/components";
import { findAssetId } from "@lib/api/assets";
import { settings } from "@lib/api/settings";
import { useProxy, createStorage, createMMKVBackend } from "@core/vendetta/storage";
import { showToast } from "@lib/ui/toasts";
import { showConfirmationAlert, showInputAlert } from "@core/vendetta/alerts";
import { VdPluginManager } from "@core/vendetta/plugins";
import { themes, selectTheme } from "@lib/addons/themes";
import { fonts, saveFont, installFont as installFontAddon } from "@lib/addons/fonts";
import { logger } from "@lib/utils/logger";
import { NativeCacheModule } from "@lib/api/native/modules";
import { UserData } from "./types";
import { defaultHost, defaultClientId, redirectRoute } from "./constants";

interface CloudSyncStorage {
    token?: string;
    host?: string;
    clientId?: string;
    autoSync: boolean;
}

const vstorage = createStorage<CloudSyncStorage>(createMMKVBackend("FIRE_CLOUD_SYNC", {
    autoSync: false,
    host: defaultHost,
    clientId: defaultClientId
}));

async function grabEverything(): Promise<UserData> {
    const sync = {
        plugins: {},
        themes: {},
        fonts: {
            installed: {},
            custom: [],
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

    // TODO: Font syncing logic if needed, fonts addon structure differs slightly
    // For now we keep it simple for plugins and themes

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
        logger.log("CloudSync started");
    },

    stop() {
        logger.log("CloudSync stopped");
    },

    SettingsComponent() {
        useProxy(vstorage);
        const [isBusy, setIsBusy] = React.useState(false);

        const handleSave = async () => {
            if (!vstorage.token) {
                showToast("Not authorized", findAssetId("Small"));
                return;
            }
            setIsBusy(true);
            try {
                const data = await grabEverything();
                const host = vstorage.host || defaultHost;
                const res = await fetch(`${host}api/data`, {
                    method: "PUT",
                    body: JSON.stringify(data),
                    headers: {
                        "content-type": "application/json",
                        "authorization": vstorage.token
                    },
                });
                if (res.ok) {
                    showToast("Synced to cloud", findAssetId("Check"));
                } else {
                    throw new Error(await res.text());
                }
            } catch (e) {
                logger.error("CloudSync save failed", e);
                showToast("Failed to save", findAssetId("Small"));
            } finally {
                setIsBusy(false);
            }
        };

        const handleImport = async () => {
            if (!vstorage.token) return;
            setIsBusy(true);
            try {
                const host = vstorage.host || defaultHost;
                const res = await fetch(`${host}api/data`, {
                    headers: { "authorization": vstorage.token }
                });
                if (!res.ok) throw new Error("Fetch failed");
                const data: UserData = await res.json();

                showConfirmationAlert({
                    title: "Import Data?",
                    content: `This will install ${Object.keys(data.plugins).length} plugins and ${Object.keys(data.themes).length} themes.`,
                    onConfirm: async () => {
                        // Logic to install plugins and themes
                        for (const [id, pluginData] of Object.entries(data.plugins)) {
                            if (!VdPluginManager.plugins[id]) {
                                try {
                                    if (pluginData.storage) NativeCacheModule.setItem(id, pluginData.storage);
                                    await VdPluginManager.installPlugin(id, pluginData.enabled);
                                } catch (e) {
                                    logger.error(`Failed to import plugin ${id}`, e);
                                }
                            }
                        }
                        for (const [id, themeData] of Object.entries(data.themes)) {
                            if (!themes[id]) {
                                try {
                                    await (require("@lib/addons/themes").fetchTheme(id, themeData.enabled));
                                } catch (e) {
                                    logger.error(`Failed to import theme ${id}`, e);
                                }
                            }
                        }
                        showToast("Import complete", findAssetId("Check"));
                    }
                });
            } catch (e) {
                logger.error("CloudSync import failed", e);
                showToast("Failed to import", findAssetId("Small"));
            } finally {
                setIsBusy(false);
            }
        };

        return (
            <ScrollView style={{ flex: 1 }}>
                <Stack spacing={24} style={{ padding: 12 }}>
                    <TableRowGroup title="Status">
                        <TableRow 
                            label="Authorization"
                            subLabel={vstorage.token ? "Authorized" : "Not Authorized"}
                            icon={<TableRowIcon source={findAssetId("LockIcon")} />}
                            trailing={
                                <Button 
                                    size="sm" 
                                    text={vstorage.token ? "Log Out" : "Authorize"} 
                                    variant={vstorage.token ? "destructive" : "primary"}
                                    onPress={() => {
                                        if (vstorage.token) {
                                            vstorage.token = undefined;
                                        } else {
                                            showInputAlert({
                                                title: "Enter Token",
                                                placeholder: "CloudSync Token",
                                                onConfirm: (val) => {
                                                    if (val) {
                                                        vstorage.token = val;
                                                        showToast("Token set", findAssetId("Check"));
                                                    }
                                                }
                                            });
                                        }
                                    }}
                                />
                            }
                        />
                    </TableRowGroup>

                    {vstorage.token && (
                        <TableRowGroup title="Sync">
                            <TableRow 
                                label="Save to Cloud"
                                subLabel="Upload current configuration"
                                icon={<TableRowIcon source={findAssetId("UploadIcon")} />}
                                onPress={handleSave}
                                trailing={isBusy && <ActivityIndicator />}
                            />
                            <TableRow 
                                label="Import from Cloud"
                                subLabel="Download and apply configuration"
                                icon={<TableRowIcon source={findAssetId("DownloadIcon")} />}
                                onPress={handleImport}
                                trailing={isBusy && <ActivityIndicator />}
                            />
                            <TableSwitchRow 
                                label="Auto Sync"
                                subLabel="Automatically sync changes (Coming soon)"
                                icon={<TableRowIcon source={findAssetId("RefreshIcon")} />}
                                value={vstorage.autoSync}
                                onValueChange={(v: boolean) => vstorage.autoSync = v}
                                disabled
                            />
                        </TableRowGroup>
                    )}

                    <TableRowGroup title="Configuration">
                        <TableRow 
                            label="Server URL"
                            subLabel={vstorage.host || defaultHost}
                            icon={<TableRowIcon source={findAssetId("PencilIcon")} />}
                        />
                    </TableRowGroup>
                </Stack>
            </ScrollView>
        );
    }
});
