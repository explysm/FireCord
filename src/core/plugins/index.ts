import { PluginInstanceInternal } from "@lib/addons/plugins/types";
import { lazyRegistry } from "@lib/utils/lazyRegistry";

interface CorePlugin {
  default: PluginInstanceInternal;
  preenabled: boolean;
}

// Register core plugins in the registry for deferred loading
[
  "quickinstall", "badges", "notrack", "messagefix", "fixembed", "shiggyenhancements", "cloudsync"
].forEach(id => {
  lazyRegistry.register(`core.plugin.${id}`, () => require(`./${id}`).default);
});

// Called from @lib/plugins
export const getCorePlugins = (): Record<string, CorePlugin> => ({
  "bunny.quickinstall": { default: lazyRegistry.get("core.plugin.quickinstall"), preenabled: true },
  "bunny.badges": { default: lazyRegistry.get("core.plugin.badges"), preenabled: true },
  "bunny.notrack": { default: lazyRegistry.get("core.plugin.notrack"), preenabled: true },
  "bunny.messagefix": { default: lazyRegistry.get("core.plugin.messagefix"), preenabled: true },
  "bunny.fixembed": { default: lazyRegistry.get("core.plugin.fixembed"), preenabled: true },
  "bunny.enhancements": { default: lazyRegistry.get("core.plugin.shiggyenhancements"), preenabled: true },
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