import { Strings } from "@core/i18n";
import AddonCard, { CardWrapper } from "@core/ui/components/AddonCard";
import { showConfirmationAlert } from "@core/vendetta/alerts";
import { VdThemeInfo, themes, selectTheme } from "@lib/addons/themes";
import { parseColorManifest } from "@lib/addons/themes/colors/parser";
import { findAssetId } from "@lib/api/assets";
import { BundleUpdaterManager } from "@lib/api/native/modules";
import { settings } from "@lib/api/settings";
import { showSheet } from "@lib/ui/sheets";
import { NavigationNative, React } from "@metro/common";
import { View } from "react-native";

function ThemePreview({ theme }: { theme: VdThemeInfo }) {
  const parsed = React.useMemo(() => {
    try {
      return parseColorManifest(theme.data);
    } catch (e) {
      console.error("Failed to parse theme for preview", e);
      return null;
    }
  }, [theme.data]);

  if (!parsed) return null;

  const getThemeColor = (key: string, fallback: string) => {
    return parsed.semantic[key]?.value ?? parsed.raw[key] ?? fallback;
  };

  const bgColor = getThemeColor("BACKGROUND_PRIMARY", "#313338");
  const secondaryBgColor = getThemeColor("BACKGROUND_SECONDARY", "#2b2d31");
  const textColor = getThemeColor("TEXT_NORMAL", "#dbdee1");
  const mutedTextColor = getThemeColor("TEXT_MUTED", "#949ba4");
  const accentColor = getThemeColor("BRAND_EXPERIMENT", "#5865f2");

  return (
    <View
      style={{
        marginTop: 8,
        borderRadius: 8,
        backgroundColor: bgColor,
        padding: 12,
        borderWidth: 1,
        borderColor: secondaryBgColor,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: accentColor,
          }}
        />
        <View style={{ gap: 2, flex: 1 }}>
          <View
            style={{
              height: 8,
              width: "60%",
              backgroundColor: textColor,
              borderRadius: 4,
            }}
          />
          <View
            style={{
              height: 6,
              width: "40%",
              backgroundColor: mutedTextColor,
              borderRadius: 3,
            }}
          />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              backgroundColor: secondaryBgColor,
              borderRadius: 2,
            }}
          />
        ))}
      </View>
    </View>
  );
}

export default function ThemeCard({ item: theme }: CardWrapper<VdThemeInfo>) {
  const navigation = NavigationNative.useNavigation();
  const [removed, setRemoved] = React.useState(false);

  // This is needed because of React™
  if (removed) return null;

  const { authors } = theme.data;

  return (
    <AddonCard
      headerLabel={theme.data.name}
      headerIcon="PaintPaletteIcon"
      headerSublabel={
        authors ? `by ${authors.map((i) => i.name).join(", ")}` : ""
      }
      descriptionLabel={theme.data.description ?? "No description."}
      toggleType={!settings.safeMode?.enabled ? "radio" : undefined}
      toggleValue={() => themes[theme.id].selected}
      onToggleChange={(v: boolean) => {
        try {
          selectTheme(v ? theme : null);
          showConfirmationAlert({
            title: Strings.HOLD_UP,
            content: Strings.THEMES_RELOAD_FOR_CHANGES,
            confirmText: Strings.RELOAD,
            cancelText: Strings.CANCEL,
            confirmColor: "red",
            onConfirm: BundleUpdaterManager.reload,
          });
        } catch (e: any) {
          console.error("Error while selecting theme:", e);
        }
      }}
      overflowTitle={theme.data.name}
      actions={[
        {
          icon: "CircleInformationIcon-primary",
          onPress: () => {
            // Using dynamic import directly (without wrapping in function)
            // This returns a Promise that resolves to the module
            const importPromise = import("./sheets/ThemeInfoActionSheet");
            showSheet("ThemeInfoActionSheet", importPromise, {
              theme,
              navigation,
            });
          },
        },
      ]}
    >
      <ThemePreview theme={theme} />
    </AddonCard>
  );
}
