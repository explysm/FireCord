import { defineCorePlugin } from "..";
import { findByProps } from "@metro";
import { before } from "@lib/api/patcher";
import { logger } from "@lib/utils/logger";

// Find the MessageActions module
const MessageActions = findByProps("sendMessage");
let unpatch: (() => void) | null = null;

export default defineCorePlugin({
  manifest: {
    id: "bunny.messagefix",
    version: "1.0.1",
    type: "plugin",
    spec: 3,
    main: "",
    display: {
      name: "MessageFix",
      description: "Ensures messages include the required nonce parameter",
      authors: [{ name: "Win8.1VMUser (plugin by ShiggyCord Team)" }],
    },
  },

  start() {
    unpatch = before("sendMessage", MessageActions, (args) => {
      const options = args[3] || {};
      options.nonce = options.nonce || (BigInt(Date.now() - 1420070400000) << 22n).toString();
      args[3] = options;
    });

    logger.log("MessageFix: Enabled - adding nonce to all messages");
  },

  stop() {
    if (unpatch) unpatch();
    unpatch = null;
    logger.log("MessageFix: Disabled");
  },
});