import { findByProps, findByName } from "@metro";
import { React, NavigationNative } from "@metro/common";
import { ScrollView, ActivityIndicator } from "react-native";
import { 
    TableRowGroup, 
    TableRow, 
    TableSwitchRow, 
    Button,
    TableRowIcon,
    Stack
} from "@metro/common/components";
import { findAssetId } from "@lib/api/assets";
import { useProxy } from "@core/vendetta/storage";
import { showToast } from "@lib/ui/toasts";
import { showConfirmationAlert, showInputAlert } from "@core/vendetta/alerts";
import { VdPluginManager } from "@core/vendetta/plugins";
import { themes } from "@lib/addons/themes";
import { fonts } from "@lib/addons/fonts";
import { logger } from "@lib/utils/logger";
import { NativeCacheModule } from "@lib/api/native/modules";
import { UserData } from "./types";
import { defaultHost, defaultClientId, redirectRoute } from "./constants";
import { vstorage, grabEverything } from "./index";

const { pushModal, popModal } = findByProps("pushModal", "popModal") as any;
const OAuth2AuthorizeModal = findByName("OAuth2AuthorizeModal");

export default function CloudSyncSettings() {
    useProxy(vstorage);
    const [isBusy, setIsBusy] = React.useState(false);

    const openOauth2Modal = () => {
        const host = vstorage.host || defaultHost;
        const clientId = vstorage.clientId || defaultClientId;
        const redirectUri = `${host}${redirectRoute}`;

        pushModal({
            key: "oauth2-authorize",
            modal: {
                key: "oauth2-authorize",
                modal: OAuth2AuthorizeModal,
                animation: "slide-up",
                shouldPersistUnderModals: false,
                props: {
                    clientId: clientId,
                    redirectUri: redirectUri,
                    scopes: ["identify"],
                    responseType: "code",
                    permissions: 0n,
                    cancelCompletesFlow: false,
                    callback: async ({ location }: any) => {
                        if (!location) return;
                        try {
                            const res = await fetch(location);
                            const token = await res.text();
                            vstorage.token = token;
                            showToast("Authorized with CloudSync", findAssetId("Check"));
                        } catch (e) {
                            logger.error("OAuth2 callback failed", e);
                        }
                    },
                    dismissOAuthModal: () => popModal("oauth2-authorize"),
                },
                closable: true,
            },
        });
    };

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
                content: `This will install ${Object.keys(data.plugins).length} plugins, ${Object.keys(data.themes).length} themes, and ${Object.keys(data.fonts.installed).length} fonts.`,
                onConfirm: async () => {
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
                    for (const [name, fontData] of Object.entries(data.fonts.installed)) {
                        if (!fonts[name]) {
                            try {
                                const { saveFont, selectFont } = require("@lib/addons/fonts");
                                await saveFont(fontData.data, fontData.enabled);
                                if (fontData.enabled) await selectFont(name);
                            } catch (e) {
                                logger.error(`Failed to import font ${name}`, e);
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
                                        showConfirmationAlert({
                                            title: "Authorize",
                                            content: "Would you like to authorize via OAuth2 or manual token?",
                                            confirmText: "OAuth2",
                                            secondaryConfirmText: "Manual",
                                            onConfirm: openOauth2Modal,
                                            onConfirmSecondary: () => {
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
                                        } as any);
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
                            subLabel="Automatically sync changes"
                            icon={<TableRowIcon source={findAssetId("RefreshIcon")} />}
                            value={vstorage.autoSync}
                            onValueChange={(v: boolean) => vstorage.autoSync = v}
                        />
                    </TableRowGroup>
                )}

                <TableRowGroup title="Configuration">
                    <TableRow 
                        label="Server URL"
                        subLabel={vstorage.host || defaultHost}
                        icon={<TableRowIcon source={findAssetId("PencilIcon")} />}
                        onPress={() => {
                            showInputAlert({
                                title: "Server URL",
                                initialValue: vstorage.host || defaultHost,
                                onConfirm: (v) => {
                                    if (v) vstorage.host = v.endsWith("/") ? v : v + "/";
                                }
                            });
                        }}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
