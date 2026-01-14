export interface UserData {
	plugins: Record<string, { enabled: boolean; storage?: string }>;
	themes: Record<string, { enabled: boolean }>;
	fonts: {
		installed: Record<string, { enabled: boolean }>;
		custom: (any & { enabled: boolean })[];
	};
}
