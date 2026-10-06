import { Ionicons } from "@react-native-vector-icons/ionicons";
import Constants from "expo-constants";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { showPrivacyOptions } from "@/src/ads";
import { useAudio } from "@/src/audio/AudioProvider";
import { AmbientBackground } from "@/src/components/AmbientBackground";
import { NavBar } from "@/src/components/NavBar";
import { GameButton, IconName, Panel, text, useToast } from "@/src/components/ui";
import { useI18n } from "@/src/i18n";
import { Language } from "@/src/storage/save";
import { colors, fonts } from "@/src/theme";

const LANGUAGES: { code: Language; flag: string; label: string }[] = [
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "en", flag: "🇬🇧", label: "English" },
];

function Toggle({ testID, icon, label, value, onPress, onText, offText }: {
  testID: string; icon: IconName; label: string; value: boolean; onPress: () => void; onText: string; offText: string;
}) {
  return (
    <Pressable testID={testID} accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={label} onPress={onPress} style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: value ? colors.brandPrimary : colors.locked }]}>
        <Ionicons name={icon} size={20} color={colors.textOnColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub}>{value ? onText : offText}</Text>
      </View>
      <View style={[styles.switch, value && styles.switchOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t, language, setLanguage } = useI18n();
  const audio = useAudio();
  const { toast, showToast } = useToast();

  const privacy = async () => {
    const shown = await showPrivacyOptions();
    if (!shown) showToast(t("settings.privacyUnavailable"));
  };

  return (
    <View style={styles.root}>
      <AmbientBackground />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[text.display, styles.title]}>{t("settings.title")}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Panel style={styles.section}>
          <Text style={[text.title, styles.sectionTitle]}>{t("settings.language")}</Text>
          <View style={styles.langRow}>
            {LANGUAGES.map((l) => {
              const on = l.code === language;
              return (
                <Pressable
                  key={l.code}
                  testID={`language-${l.code}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => setLanguage(l.code)}
                  style={[styles.lang, on && styles.langOn]}
                >
                  <Text style={styles.flag}>{l.flag}</Text>
                  <Text style={[styles.langLabel, on && styles.langLabelOn]}>{l.label}</Text>
                  {on && <Ionicons name="checkmark-circle" size={20} color={colors.success} />}
                </Pressable>
              );
            })}
          </View>
        </Panel>

        <Panel style={styles.section}>
          <Text style={[text.title, styles.sectionTitle]}>{t("settings.audio")}</Text>
          <Toggle testID="toggle-music" icon="musical-notes" label={t("settings.music")} value={audio.musicEnabled} onPress={audio.toggleMusic} onText={t("settings.on")} offText={t("settings.off")} />
          <View style={styles.divider} />
          <Toggle testID="toggle-sfx" icon="volume-high" label={t("settings.sfx")} value={audio.sfxEnabled} onPress={audio.toggleSfx} onText={t("settings.on")} offText={t("settings.off")} />
        </Panel>

        <Panel style={styles.section}>
          <Text style={[text.title, styles.sectionTitle]}>{t("settings.privacy")}</Text>
          <GameButton testID="privacy-options-button" label={t("settings.privacyBtn")} icon="shield-checkmark" variant="white" size="sm" onPress={privacy} />
        </Panel>

        <Panel style={styles.section}>
          <Text style={[text.title, styles.sectionTitle]}>{t("settings.about")}</Text>
          <Text style={styles.about}>{t("app.name")} · {t("app.by")}</Text>
          <Text testID="settings-version" style={styles.aboutSub}>{t("settings.version", { v: Constants.expoConfig?.version ?? "1.0.0" })}</Text>
        </Panel>
      </ScrollView>
      <NavBar active="settings" />
      {toast}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: 20, paddingBottom: 10, width: "100%", maxWidth: 600, alignSelf: "center" },
  title: { fontSize: 34 },
  content: { paddingHorizontal: 16, paddingBottom: 16, width: "100%", maxWidth: 600, alignSelf: "center" },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 18, marginBottom: 12 },
  langRow: { flexDirection: "row", gap: 10 },
  lang: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8, height: 56, paddingHorizontal: 12, borderRadius: 18,
    backgroundColor: colors.surfaceTertiary, borderWidth: 2, borderColor: "transparent",
  },
  langOn: { borderColor: colors.brandPrimary, backgroundColor: colors.surfaceInverse },
  flag: { fontSize: 24 },
  langLabel: { flex: 1, fontFamily: fonts.semibold, fontSize: 16, color: colors.muted },
  langLabelOn: { color: colors.onSurface },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56 },
  rowIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontFamily: fonts.bold, fontSize: 16, color: colors.onSurface },
  rowSub: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  switch: { width: 54, height: 32, borderRadius: 16, backgroundColor: colors.locked, padding: 3, justifyContent: "center" },
  switchOn: { backgroundColor: colors.success },
  knob: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.surfaceInverse },
  knobOn: { alignSelf: "flex-end" },
  divider: { height: 1.5, backgroundColor: colors.divider, marginVertical: 8 },
  about: { fontFamily: fonts.semibold, fontSize: 15, color: colors.onSurface },
  aboutSub: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted, marginTop: 2 },
});
