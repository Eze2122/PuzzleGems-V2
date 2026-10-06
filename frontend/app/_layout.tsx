import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { LogBox } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { initAds } from "@/src/ads";
import { AudioProvider } from "@/src/audio/AudioProvider";
import { ErrorBoundary } from "@/src/components/error-boundary";
import { I18nProvider } from "@/src/i18n";
import { queryClient } from "@/src/query-client";
import { GameProvider } from "@/src/state/GameProvider";
import { colors } from "@/src/theme";

// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true);

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // Fonts (and the icon font, pre-warmed so icons never render blank in Expo Go).
  const [fontsLoaded, fontError] = useFonts({
    LilitaOne: require("../assets/fonts/LilitaOne-Regular.ttf"),
    "Fredoka-Medium": require("../assets/fonts/Fredoka-Medium.ttf"),
    "Fredoka-SemiBold": require("../assets/fonts/Fredoka-SemiBold.ttf"),
    "Fredoka-Bold": require("../assets/fonts/Fredoka-Bold.ttf"),
    Ionicons: require("@react-native-vector-icons/ionicons/fonts/Ionicons.ttf"),
  });
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // AdMob + Google UMP consent (no-op in Expo Go / web).
  useEffect(() => {
    void initAds();
  }, []);

  if (!ready) return null;

  // One app level ErrorBoundary; a render crash shows a reload screen
  // instead of a blank app.
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <KeyboardProvider>
          <StatusBar style="light" />
          <I18nProvider>
            <GameProvider>
              <AudioProvider>
                <Stack screenOptions={{ headerShown: false, animation: "fade", contentStyle: { backgroundColor: colors.surface } }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="home" />
                  <Stack.Screen name="levels" />
                  <Stack.Screen name="settings" />
                  <Stack.Screen name="game" options={{ animation: "slide_from_right" }} />
                </Stack>
              </AudioProvider>
            </GameProvider>
          </I18nProvider>
        </KeyboardProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
