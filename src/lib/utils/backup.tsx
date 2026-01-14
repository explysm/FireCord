import { NativeCacheModule, NativeFileModule } from "@lib/api/native/modules";
import { showToast } from "@lib/ui/toasts";
import { findAssetId } from "@lib/api/assets";
import { BundleUpdaterManager } from "@lib/api/native/modules";
import { openAlert } from "@lib/ui/alerts";
import { AlertModal, AlertActions, AlertActionButton, TextInput } from "@metro/common/components";
import { logger } from "@lib/utils/logger";
import { Clipboard } from "react-native";
import React from "react";

const KNOWN_MMKV_KEYS = [
    "VENDETTA_SETTINGS",
    "VENDETTA_THEMES",
    "VENDETTA_UPDATER_SETTINGS",
    "BUNNY_FONTS",
    "FANCY_FONTS",
    "BUNNY_COLOR_PREFS"
];

function showManualCopyModal(json: string) {
    openAlert(
        "firecord-manual-copy",
        <AlertModal
            title="Manual Copy"
            content="Automated copy failed or restricted. Please copy the backup data below manually:"
            extraContent={
                <TextInput
                    multiline
                    editable={false}
                    value={json}
                    style={{ maxHeight: 200, fontFamily: "monospace", fontSize: 10 }}
                />
            }
            actions={
                <AlertActions>
                    <AlertActionButton text="Done" variant="secondary" />
                </AlertActions>
            }
        />
    );
}

export async function exportBackup() {
    let generatedJson = "";
    try {
        const backup: Record<string, any> = {
            mmkv: {},
            files: {}
        };
        
        logger.log("Starting backup export...");

        // 1. Get MMKV data
        if (typeof NativeCacheModule.refresh === "function") {
            try {
                backup.mmkv = await NativeCacheModule.refresh([]);
                logger.log(`Backed up ${Object.keys(backup.mmkv).length} MMKV keys via refresh`);
            } catch (e) {
                logger.error("NativeCacheModule.refresh failed, falling back to manual keys", e);
            }
        }

        // Fallback or additional keys
        for (const key of KNOWN_MMKV_KEYS) {
            if (backup.mmkv[key]) continue;
            try {
                const val = await NativeCacheModule.getItem(key);
                if (val) backup.mmkv[key] = val;
            } catch (e) {
                logger.error(`Failed to backup MMKV key: ${key}`, e);
            }
        }

        // 2. Get File-based data
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
            try {
                if (await NativeFileModule.fileExists(path)) {
                    backup.files[file] = await NativeFileModule.readFile(path, "utf8");
                }
            } catch (e) {
                logger.error(`Failed to backup file: ${file}`, e);
            }
        }

        generatedJson = JSON.stringify(backup);
        logger.log(`Backup JSON generated (${generatedJson.length} chars). Copying to clipboard...`);
        
        try {
            await Clipboard.setString(generatedJson);
            showToast("Backup copied to clipboard!", findAssetId("Check"));
            logger.log("Backup export successful");
        } catch (clipErr) {
            logger.error("Clipboard.setString failed, showing manual copy modal", clipErr);
            showManualCopyModal(generatedJson);
        }
    } catch (e) {
        logger.error("Failed to export backup", e);
        if (generatedJson) {
            showManualCopyModal(generatedJson);
        } else {
            showToast("Failed to generate backup", findAssetId("Small"));
        }
    }
}

export async function importBackup() {
    try {
        const json = await Clipboard.getString();
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

