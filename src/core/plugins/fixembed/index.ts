import { defineCorePlugin } from "..";
import { findByProps } from "@metro";
import { before } from "@lib/api/patcher";
import { logger } from "@lib/utils/logger";
import { settings } from "@lib/api/settings";
import { React } from "@metro/common";

const { ScrollView, Text } = require("react-native");

type FixEmbedSettings = {
  twitter: boolean;
  instagram: boolean;
  tiktok: boolean;
  reddit: boolean;
};

declare module "@lib/api/settings" {
  interface Settings {
    fixembed?: FixEmbedSettings;
  }
}

const MessageActions = findByProps("sendMessage");
let unpatch: (() => void) | null = null;

function transformLinks(content: string, config: FixEmbedSettings): string {
  let result = content;
  // Twitter/X: Replace domain, keep path
  if (config.twitter) {
    result = result.replace(
      /https?:\/\/(?:www\.)?(twitter\.com|x\.com)(\/[^\s]+)/gi,
      "https://fxtwitter.com$2",
    );
  }
  // Instagram: Replace domain, keep path
  if (config.instagram) {
    result = result.replace(
      /https?:\/\/(?:www\.)?instagram\.com(\/[^\s]+)/gi,
      "https://uuinstagram.com$1",
    );
  }
  // TikTok: Replace domain, keep path
  if (config.tiktok) {
    result = result.replace(
      /https?:\/\/(?:www\.)?tiktok\.com(\/[^\s]+)/gi,
      "https://tnktok.com$1",
    );
    // TikTok short links (vm.tiktok.com)
    result = result.replace(
      /https?:\/\/vm\.tiktok\.com\/([A-Za-z0-9]+)\/?/gi,
      "https://vm.tnktok.com/$1",
    );
  }
  // Reddit: Replace domain, keep path
  if (config.reddit) {
    result = result.replace(
      /https?:\/\/(?:www\.)?reddit\.com(\/[^\s]+)/gi,
      "https://rxddit.com$1",
    );
  }
  return result;
}

export default defineCorePlugin({
  manifest: {
    id: "bunny.fixembed",
    version: "1.0.1",
    type: "plugin",
    spec: 3,
    main: "",
    display: {
      name: "FixEmbed",
      description:
        "Improves social media embeds by using privacy-friendly alternative frontends.",
      authors: [{ name: "ShiggyCord Team" }],
    },
  },

  SettingsComponent() {
    const { useState, useEffect } = React;
    const [config, setConfig] = useState<FixEmbedSettings>({
      twitter: settings.fixembed?.twitter ?? true,
      instagram: settings.fixembed?.instagram ?? true,
      tiktok: settings.fixembed?.tiktok ?? true,
      reddit: settings.fixembed?.reddit ?? true,
    });

    useEffect(() => {
      settings.fixembed = config;
    }, [config]);

    const updateConfig = (key: keyof FixEmbedSettings, value: boolean) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    };

    // Prefer table-style rows (TableRowGroup / TableSwitchRow) and Stack layout similar to other core plugins.
    const {
      TableRowGroup,
      TableRow,
      TableSwitchRow,
      Stack,
    } = findByProps("TableRowGroup", "TableRow", "TableSwitchRow", "Stack") || {};

    // Fallback if the table-style components are not available in the host environment
    if (!TableRowGroup || !TableSwitchRow || !TableRow || !Stack) {
      return React.createElement(
        ScrollView,
        { style: { flex: 1, padding: 12 } },
        React.createElement(
          Text,
          null,
          "FixEmbed UI unavailable (missing TableRow components).",
        ),
      );
    }

    return React.createElement(ScrollView, { style: { flex: 1 } }, [
      React.createElement(
        Stack,
        { spacing: 8, style: { padding: 10 } },

        React.createElement(
          TableRowGroup,
          { title: "Platforms" },
          React.createElement(TableSwitchRow, {
            label: "Twitter/X",
            value: config.twitter,
            onValueChange: (v: boolean) => updateConfig("twitter", v),
          }),
          React.createElement(TableSwitchRow, {
            label: "Instagram",
            value: config.instagram,
            onValueChange: (v: boolean) => updateConfig("instagram", v),
          }),
          React.createElement(TableSwitchRow, {
            label: "TikTok",
            value: config.tiktok,
            onValueChange: (v: boolean) => updateConfig("tiktok", v),
          }),
          React.createElement(TableSwitchRow, {
            label: "Reddit",
            value: config.reddit,
            onValueChange: (v: boolean) => updateConfig("reddit", v),
          }),
        ),
        React.createElement(
          TableRowGroup,
          { title: "About" },
          React.createElement(TableRow, {
            label: "Description",
            subLabel:
              "This plugin automatically converts social media links to privacy-friendly alternative frontends for better embeds.",
            disabled: true,
          }),
        ),
      ),
    ]);
  },

  start() {
    logger.log("FixEmbed: Starting plugin");
    settings.fixembed = settings.fixembed || {
      twitter: true,
      instagram: true,
      tiktok: true,
      reddit: true,
    };

    if (!unpatch) {
      unpatch = before("sendMessage", MessageActions, (args) => {
        const config = settings.fixembed!;
        if (args[1]?.content) {
          args[1].content = transformLinks(args[1].content, config);
        }
      });
    }
    logger.log("FixEmbed: Patched outgoing messages");
  },

  stop() {
    logger.log("FixEmbed: Stopping plugin");
    if (unpatch) {
      unpatch();
      unpatch = null;
    }
    logger.log("FixEmbed: Unpatched outgoing messages");
  },
});