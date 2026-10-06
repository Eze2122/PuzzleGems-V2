import { Ionicons } from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AdBanner } from "@/src/ads/AdBanner";
import { IconName } from "@/src/components/ui";
import { useI18n } from "@/src/i18n";
import { colors, fonts } from "@/src/theme";

type Tab = "home" | "levels" | "settings";
const ITEMS: { key: Tab; icon: IconName; route: "/home" | "/levels" | "/settings"; label: "nav.home" | "nav.levels" | "nav.settings" }[] = [
  { key: "home", icon: "home", route: "/home", label: "nav.home" },
  { key: "levels", icon: "grid", route: "/levels", label: "nav.levels" },
  { key: "settings", icon: "settings", route: "/settings", label: "nav.settings" },
];

/** Menu footer: banner ad (native builds only) + pill navigation bar. Never used on the game screen. */
export function NavBar({ active }: { active: Tab }) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  return (
    <View style={{ paddingBottom: insets.bottom + 8 }}>
      <AdBanner />
      <View style={styles.bar}>
        {ITEMS.map((item) => {
          const on = item.key === active;
          return (
            <Pressable
              key={item.key}
              testID={`nav-${item.key}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => { if (!on) router.replace(item.route); }}
              style={[styles.item, on && styles.itemOn]}
            >
              <Ionicons name={item.icon} size={24} color={on ? colors.textOnColor : colors.brandPrimary} />
              <Text style={[styles.label, on && styles.labelOn]}>{t(item.label)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row", marginHorizontal: 16, marginTop: 8, padding: 6, borderRadius: 28,
    backgroundColor: colors.surfaceSecondary, borderWidth: 2, borderColor: colors.border,
    shadowColor: colors.brandDeep, shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6,
    alignSelf: "center", width: "92%", maxWidth: 520,
  },
  item: { flex: 1, height: 60, borderRadius: 22, alignItems: "center", justifyContent: "center", gap: 2 },
  itemOn: { backgroundColor: colors.brand, borderWidth: 2, borderColor: "rgba(255,255,255,0.8)" },
  label: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
  labelOn: { color: colors.textOnColor },
});
