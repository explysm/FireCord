import patchChatBackground from "./patches/background";
import { themeEngine } from "./engine";
import patchStorage from "./patches/storage";
import { ColorManifest } from "./types";
import { updateBunnyColor } from "./updater";

/** @internal */
export default function initColors(manifest: ColorManifest | null) {
    if (manifest) updateBunnyColor(manifest, { update: false });

    const patches = [
        patchStorage(),
        themeEngine.patch(),
        patchChatBackground()
    ];

    return () => patches.forEach(p => p());
}