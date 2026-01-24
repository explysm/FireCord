import { findAssetId } from "@lib/api/assets";
import { settings } from "@lib/api/settings";
import { lazyDestructure } from "@lib/utils/lazy";
import {
  Card,
  FormRadio,
  FormSwitch,
  IconButton,
  LegacyFormRow,
  Stack,
  Text,
} from "@metro/common/components";
import { findByProps } from "@metro/wrappers";
import { semanticColors } from "@ui/color";
import { createStyles, TextStyleSheet } from "@ui/styles";
import { TouchableOpacity, View, Image } from "react-native";

const { hideActionSheet } = lazyDestructure(() =>
  findByProps("openLazy", "hideActionSheet"),
);
const { showSimpleActionSheet } = lazyDestructure(() =>
  findByProps("showSimpleActionSheet"),
);

const useStyles = createStyles({
  card: {
    backgroundColor: semanticColors?.CARD_SECONDARY_BG,
    borderRadius: 12,
    overflow: "hidden",
  },
  header: {
    padding: 0,
  },
  headerLeading: {
    flexDirection: "column",
    justifyContent: "center",
    flex: 1,
    paddingRight: 12,
  },
  headerTrailing: {
    display: "flex",
    flexDirection: "row",
    gap: 15,
    alignItems: "center",
  },
  headerLabel: {
    ...TextStyleSheet["heading-lg/semibold"],
    color: semanticColors.MOBILE_TEXT_HEADING_PRIMARY,
  },
  headerLabelCompact: {
    ...TextStyleSheet["heading-md/semibold"],
    color: semanticColors.MOBILE_TEXT_HEADING_PRIMARY,
  },
  headerSubtitle: {
    ...TextStyleSheet["text-md/semibold"],
    color: semanticColors.TEXT_MUTED,
  },
  headerSubtitleCompact: {
    ...TextStyleSheet["text-sm/semibold"],
    color: semanticColors.TEXT_MUTED,
  },
  descriptionLabel: {
    ...TextStyleSheet["text-md/semibold"],
    color: semanticColors.TEXT_NORMAL,
  },
  actions: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
  },
});

interface Action {
  icon: string;
  disabled?: boolean;
  onPress: () => void;
}

interface OverflowAction extends Action {
  label: string;
  isDestructive?: boolean;
}

export interface CardWrapper<T> {
  item: T;
  result: Fuzzysort.KeysResult<T>;
}

interface CardProps {
  index?: number;
  headerLabel: string;
  headerSublabel?: string;
  headerIcon?: string;
  toggleType?: "switch" | "radio";
  toggleValue: () => boolean;
  onToggleChange?: (v: boolean) => void;
  descriptionLabel?: string;
  actions?: Action[];
  overflowTitle?: string;
  overflowActions?: OverflowAction[];
  children?: React.ReactNode;
}

export default function AddonCard(props: CardProps) {
  const styles = useStyles();
  const isCompact = settings.compactMode;

  return (
    <Card>
      <Stack spacing={isCompact ? 8 : 16}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {props.headerIcon && (
            <Image
              style={{ width: isCompact ? 24 : 32, height: isCompact ? 24 : 32, marginRight: 12, borderRadius: 8 }}
              source={findAssetId(props.headerIcon)}
            />
          )}
          <View style={styles.headerLeading}>
            <Text numberOfLines={1} style={isCompact ? styles.headerLabelCompact : styles.headerLabel}>{props.headerLabel}</Text>
            {props.headerSublabel && (
              <Text numberOfLines={1} style={isCompact ? styles.headerSubtitleCompact : styles.headerSubtitle}>{props.headerSublabel}</Text>
            )}
          </View>
          <View style={styles.headerTrailing}>
            <View style={styles.actions}>
              {props.overflowActions && (
                <IconButton
                  onPress={() =>
                    showSimpleActionSheet({
                      key: "CardOverflow",
                      header: {
                        title: props.overflowTitle,
                        icon: props.headerIcon && (
                          <LegacyFormRow.Icon
                            style={{ marginRight: 8 }}
                            source={findAssetId(props.headerIcon)}
                          />
                        ),
                      },
                      options: props.overflowActions?.map((i) => ({
                        ...i,
                        icon: findAssetId(i.icon),
                      })),
                    })
                  }
                  size={isCompact ? "xs" : "sm"}
                  variant="secondary"
                  icon={findAssetId("CircleInformationIcon-primary")}
                />
              )}
              {props.actions?.map(({ icon, onPress, disabled }) => (
                <IconButton
                  onPress={onPress}
                  disabled={disabled}
                  size={isCompact ? "xs" : "sm"}
                  variant="secondary"
                  icon={findAssetId(icon)}
                />
              ))}
            </View>
            {props.toggleType &&
              (props.toggleType === "switch" ? (
                <FormSwitch
                  value={props.toggleValue()}
                  onValueChange={props.onToggleChange}
                  style={isCompact ? { transform: [{ scale: 0.8 }] } : undefined}
                />
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    props.onToggleChange?.(!props.toggleValue());
                  }}
                >
                  <FormRadio selected={props.toggleValue()} style={isCompact ? { transform: [{ scale: 0.8 }] } : undefined} />
                </TouchableOpacity>
              ))}
          </View>
        </View>
        {!isCompact && props.descriptionLabel && (
          <Text variant="text-md/medium">{props.descriptionLabel}</Text>
        )}
        {props.children}
      </Stack>
    </Card>
  );
}
