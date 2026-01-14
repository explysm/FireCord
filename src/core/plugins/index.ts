import { PluginInstanceInternal } from "@lib/addons/plugins/types";

interface CorePlugin {
  default: PluginInstanceInternal;
  preenabled: boolean;
}

// Called from @lib/plugins
export const getCorePlugins = (): Record<string, CorePlugin> => ({
  "bunny.quickinstall": { default: require("./quickinstall").default, preenabled: true },
  "bunny.badges": { default: require("./badges").default, preenabled: true },
  "bunny.notrack": { default: require("./notrack").default, preenabled: true },
  "bunny.messagefix": { default: require("./messagefix").default, preenabled: true },
  "bunny.fixembed": { default: require("./fixembed").default, preenabled: true },
  "bunny.enhancements": { default: require("./shiggyenhancements").default, preenabled: true },
  "firecord.cloudsync": { default: require("./cloudsync").default, preenabled: true }
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