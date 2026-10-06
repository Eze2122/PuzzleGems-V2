import { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/src/theme";

/** In-app modal panel (replaces system Alert dialogs). */
export function Sheet({ visible, onClose, children, testID }: {
  visible: boolean; onClose?: () => void; children: ReactNode; testID: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.backdrop, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="close" testID={`${testID}-backdrop`} />
        <Animated.View entering={ZoomIn.springify().damping(16)} testID={testID} style={styles.card}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.backdrop, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  card: {
    width: "100%", maxWidth: 420, borderRadius: 32, padding: 22, alignItems: "center",
    backgroundColor: colors.surfaceTertiary, borderWidth: 3, borderColor: colors.surfaceInverse,
    shadowColor: colors.brandDeep, shadowOpacity: 0.35, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12,
  },
});
