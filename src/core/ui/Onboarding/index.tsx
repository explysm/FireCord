import { React, NavigationNative, clipboard } from "@metro/common";
import { View, Image, Linking, Dimensions } from "react-native";
import {
  Stack,
  Button,
  Text,
  ActionSheet,
  BottomSheetTitleHeader,
  TableRow,
  TableRowIcon,
} from "@metro/common/components";
import { findAssetId } from "@lib/api/assets";
import { Strings } from "@core/i18n";
import { settings } from "@lib/api/settings";
import { hideSheet } from "@lib/ui/sheets";
import { firecordIcon } from "@core/ui/settings";

const { width } = Dimensions.get("window");

export default function OnboardingSheet() {
  const [step, setStep] = React.useState(0);
  const navigation = NavigationNative.useNavigation();

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const finish = () => {
    settings.firstLaunch = false;
    hideSheet("firecord-onboarding");
  };

  const steps = [
    {
      title: Strings.ONBOARDING_WELCOME_TITLE,
      description: Strings.ONBOARDING_WELCOME_DESC,
      icon: { uri: firecordIcon },
      color: "rgba(114, 137, 218, 0.1)",
      content: (
        <View style={{ alignItems: "center", gap: 16 }}>
             <Image 
                source={{ uri: firecordIcon }} 
                style={{ width: 100, height: 100, borderRadius: 20 }} 
             />
             <Text variant="text-md/medium" style={{ textAlign: "center", paddingHorizontal: 20 }}>
                {Strings.ONBOARDING_WELCOME_DESC}
             </Text>
        </View>
      )
    },
    {
      title: Strings.ONBOARDING_PLUGINS_TITLE,
      description: Strings.ONBOARDING_PLUGINS_DESC,
      icon: findAssetId("ActivitiesIcon"),
      color: "rgba(67, 181, 129, 0.1)",
      content: (
        <Stack spacing={12}>
           <TableRow
             label="Browse Plugins"
             subLabel="Discover and install from the app"
             icon={<TableRowIcon source={findAssetId("SearchIcon")} />}
             onPress={() => {
                 finish();
                 navigation.navigate("SHIGGYCORD_CUSTOM_PAGE", {
                    title: Strings.PLUGINS,
                    render: () => {
                        const Plugins = require("@core/ui/settings/pages/Plugins").default;
                        return <Plugins />;
                    }
                 });
             }}
           />
           <TableRow
             label="plugins-list.pages.dev"
             subLabel="View the official web repository"
             icon={<TableRowIcon source={findAssetId("LinkIcon")} />}
             onPress={() => Linking.openURL("https://plugins-list.pages.dev/")}
           />
        </Stack>
      )
    },
    {
      title: Strings.ONBOARDING_THEMES_TITLE,
      description: Strings.ONBOARDING_THEMES_DESC,
      icon: findAssetId("PaintPaletteIcon"),
      color: "rgba(235, 69, 158, 0.1)",
      content: (
        <Stack spacing={12}>
           <TableRow
             label="Browse Themes"
             icon={<TableRowIcon source={findAssetId("SearchIcon")} />}
             onPress={() => {
                 finish();
                 navigation.navigate("SHIGGYCORD_CUSTOM_PAGE", {
                    title: Strings.THEMES,
                    render: () => {
                        const Themes = require("@core/ui/settings/pages/Themes").default;
                        return <Themes />;
                    }
                 });
             }}
           />
           <TableRow
             label="Revenge Discord"
             subLabel="Join the community for more themes"
             icon={<TableRowIcon source={findAssetId("Discord")} />}
             onPress={() => Linking.openURL("https://discord.gg/revenge-1205207689832038522")}
           />
        </Stack>
      )
    },
    {
      title: Strings.ONBOARDING_FONTS_TITLE,
      description: Strings.ONBOARDING_FONTS_DESC,
      icon: findAssetId("LettersIcon"),
      color: "rgba(88, 101, 242, 0.1)",
      content: (
        <Stack spacing={12}>
           <TableRow
             label="Bunny Google Fonts"
             icon={<TableRowIcon source={findAssetId("LinkIcon")} />}
             onPress={() => Linking.openURL("https://bunny-google-fonts.vercel.app/")}
           />
           <TableRow
             label="Special Fonts"
             subLabel="explysm.github.io/discord-things/fonts"
             icon={<TableRowIcon source={findAssetId("LinkIcon")} />}
             onPress={() => Linking.openURL("https://explysm.github.io/discord-things/fonts/index.html#fonts")}
           />
        </Stack>
      )
    },
    {
      title: Strings.ONBOARDING_CLOUDSYNC_TITLE,
      description: Strings.ONBOARDING_CLOUDSYNC_DESC,
      icon: findAssetId("LaptopPhoneIcon"),
      color: "rgba(255, 170, 0, 0.1)",
      content: (
        <Stack spacing={12}>
           <Text variant="text-sm/medium" style={{ textAlign: "center", marginBottom: 8 }}>
              Quickly restore your setup by logging into Cloud Sync.
           </Text>
           <Button
             text="Configure Cloud Sync"
             variant="primary"
             onPress={() => {
                 finish();
                 navigation.navigate("SHIGGYCORD_CUSTOM_PAGE", {
                    title: "Cloud Sync",
                    render: () => {
                        const CloudSync = require("@core/ui/settings/pages/CloudSync").default;
                        return <CloudSync />;
                    }
                 });
             }}
           />
        </Stack>
      )
    }
  ];

  const currentStep = steps[step];

  return (
    <ActionSheet>
      <BottomSheetTitleHeader 
        title={currentStep.title} 
        trailing={
            <Text variant="text-sm/semibold" color="text-muted">
                {step + 1} / {steps.length}
            </Text>
        }
      />
      <View style={{ padding: 16, gap: 24 }}>
        
        <View style={{ 
            backgroundColor: currentStep.color, 
            borderRadius: 24, 
            padding: 24,
            minHeight: 200,
            justifyContent: "center"
        }}>
           {currentStep.content}
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          {step > 0 && (
            <Button
              style={{ flex: 1 }}
              text="Back"
              variant="secondary"
              onPress={prevStep}
            />
          )}
          <Button
            style={{ flex: 2 }}
            text={step === steps.length - 1 ? Strings.ONBOARDING_FINISH : Strings.ONBOARDING_NEXT}
            variant="primary"
            onPress={step === steps.length - 1 ? finish : nextStep}
          />
        </View>
      </View>
    </ActionSheet>
  );
}
