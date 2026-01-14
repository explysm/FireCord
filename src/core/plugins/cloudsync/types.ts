import { FontDefinition } from "@lib/addons/fonts";

export interface UserData {
	plugins: Record<string, { enabled: boolean; storage?: string }>;
	themes: Record<string, { enabled: boolean }>;
	fonts: {
		installed: Record<string, { enabled: boolean; data: FontDefinition }>;
	};
}
