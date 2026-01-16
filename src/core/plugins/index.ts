import { PluginInstanceInternal } from "@lib/addons/plugins/types";
import { lazyRegistry } from "@lib/utils/lazyRegistry";

interface CorePlugin {
  default: PluginInstanceInternal;
  preenabled: boolean;
}

// Register core plugins in the registry for deferred loading
lazyRegistry.register("core.plugin.quickinstall", () => require("./quickinstall").default);
lazyRegistry.register("core.plugin.badges", () => require("./badges").default);
lazyRegistry.register("core.plugin.notrack", () => require("./notrack").default);
lazyRegistry.register("core.plugin.messagefix", () => require("./messagefix").default);
lazyRegistry.register("core.plugin.fixembed", () => require("./fixembed").default);
lazyRegistry.register("core.plugin.fireenhancements", () => require("./fireenhancements").default);
lazyRegistry.register("core.plugin.cloudsync", () => require("./cloudsync").default);

// Called from @lib/plugins
export const getCorePlugins = (): Record<string, CorePlugin> => ({
  "bunny.quickinstall": { default: lazyRegistry.get("core.plugin.quickinstall"), preenabled: true },
  "bunny.badges": { default: lazyRegistry.get("core.plugin.badges"), preenabled: true },
  "bunny.notrack": { default: lazyRegistry.get("core.plugin.notrack"), preenabled: true },
  "bunny.messagefix": { default: lazyRegistry.get("core.plugin.messagefix"), preenabled: true },
  "bunny.fixembed": { default: lazyRegistry.get("core.plugin.fixembed"), preenabled: true },
  "bunny.enhancements": { default: lazyRegistry.get("core.plugin.fireenhancements"), preenabled: true },
  "firecord.cloudsync": { default: lazyRegistry.get("core.plugin.cloudsync"), preenabled: true }
});

/**
 * @internal
 */
export function defineCorePlugin(
  instance: PluginInstanceInternal,
): PluginInstanceInternal {
  // @ts-expect-error
  instance[Symbol.for("bunny.core.plugin")] = true;
  return instance;
}
