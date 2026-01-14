import { NativeCacheModule, NativeFileModule } from "@lib/api/native/modules";
import { showToast } from "@lib/ui/toasts";
import { findAssetId } from "@lib/api/assets";
import { clipboard } from "@metro/common";
import { BundleUpdaterManager } from "@lib/api/native/modules";
import { openAlert } from "@lib/ui/alerts";
import { AlertModal, AlertActions, AlertActionButton } from "@metro/common/components";
import React from "react";

export async function exportBackup() {
    try {
        const backup: Record<string, any> = {};
        
        // 1. Get MMKV data
        const allMMKV = await NativeCacheModule.refresh([]);
        backup.mmkv = allMMKV;

        // 2. Get File-based data
        const files: Record<string, string> = {};
        const docsPath = NativeFileModule.getConstants().DocumentsDirPath;
        
        const filesToBackup = [
            "pyoncord/plugins/settings.json",
            "pyoncord/plugins/repositories.json",
            "pyoncord/loader.json",
            "pyoncord/vd_mmkv/VENDETTA_SETTINGS",
            "pyoncord/vd_mmkv/VENDETTA_THEMES",
            "pyoncord/vd_mmkv/VENDETTA_UPDATER_SETTINGS",
            "pyoncord/vd_mmkv/BUNNY_FONTS"
        ];

        for (const file of filesToBackup) {
            const path = `${docsPath}/${file}`;
            if (await NativeFileModule.fileExists(path)) {
                files[file] = await NativeFileModule.readFile(path, "utf8");
            }
        }
        backup.files = files;

        const json = JSON.stringify(backup);
        clipboard.setString(json);
        
        showToast("Backup copied to clipboard!", findAssetId("Check"));
    } catch (e) {
        console.error("Failed to export backup", e);
        showToast("Failed to export backup", findAssetId("Small"));
    }
}

export async function importBackup() {
    try {
        const json = await clipboard.getString();
        if (!json) {
            showToast("Clipboard is empty!", findAssetId("Small"));
            return;
        }

        const backup = JSON.parse(json);
        if (!backup.mmkv && !backup.files) {
            showToast("Invalid backup data!", findAssetId("Small"));
            return;
        }

        openAlert(
            "firecord-import-backup",
            <AlertModal
                title="Import Backup?"
                content="This will overwrite your current settings and plugins. The app will reload after import."
                actions={
                    <AlertActions>
                        <AlertActionButton
                            text="Import & Reload"
                            variant="destructive"
                            onPress={async () => {
                                if (backup.mmkv) {
                                    for (const key in backup.mmkv) {
                                        NativeCacheModule.setItem(key, backup.mmkv[key]);
                                    }
                                }

                                if (backup.files) {
                                    for (const file in backup.files) {
                                        await NativeFileModule.writeFile("documents", file, backup.files[file], "utf8");
                                    }
                                }

                                BundleUpdaterManager.reload();
                            }}
                        />
                        <AlertActionButton text="Cancel" variant="secondary" />
                    </AlertActions>
                }
            />
        );
    } catch (e) {
        console.error("Failed to import backup", e);
        showToast("Failed to import backup", findAssetId("Small"));
    }
}

export async function clearCache() {
    openAlert(
        "firecord-clear-cache",
        <AlertModal
            title="Clear Cache?"
            content="This will remove all downloaded plugin scripts and cached files. Settings will be preserved. The app will reload."
            actions={
                <AlertActions>
                    <AlertActionButton
                        text="Clear & Reload"
                        variant="destructive"
                        onPress={async () => {
                            try {
                                await NativeFileModule.clearFolder("documents", "pyoncord/plugins/scripts");
                                await NativeFileModule.clearFolder("cache", "pyoncord");
                                BundleUpdaterManager.reload();
                            } catch (e) {
                                console.error("Failed to clear cache", e);
                                showToast("Failed to clear cache", findAssetId("Small"));
                            }
                        }}
                    />
                    <AlertActionButton text="Cancel" variant="secondary" />
                </AlertActions>
            }
        />
    );
}

