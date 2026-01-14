import { FcPluginManager, FirecordPlugin } from "@core/firecord/plugins";
import { useProxy, createProxy } from "@core/firecord/storage";

import { UnifiedPluginModel } from ".";

export default function unifyVdPlugin(
  vdPlugin: FirecordPlugin,
): UnifiedPluginModel {
  return {
    id: vdPlugin.id,
    name: vdPlugin.manifest.name,
    description: vdPlugin.manifest.description,
    authors: vdPlugin.manifest.authors,
    icon: vdPlugin.manifest.firecord?.icon,

    getBadges() {
      return [];
    },
    isEnabled: () => vdPlugin.enabled,
    isInstalled: () =>
      Boolean(vdPlugin && FcPluginManager.plugins[vdPlugin.id]),
    usePluginState() {
      const dummyProxy = createProxy({}).proxy;
      useProxy(FcPluginManager.plugins[vdPlugin.id] ?? dummyProxy);
    },
    toggle(start: boolean) {
      start
        ? FcPluginManager.startPlugin(vdPlugin.id)
        : FcPluginManager.stopPlugin(vdPlugin.id);
    },
    resolveSheetComponent() {
      return import("../sheets/FcPluginInfoActionSheet");
    },
    getPluginSettingsComponent() {
      return FcPluginManager.getSettings(vdPlugin.id);
    },
  };
}
