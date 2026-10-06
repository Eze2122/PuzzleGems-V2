import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { Sparkles } from "@/src/components/Sparkles";

const BG = require("../../assets/images/bg-fantasy.jpg");

/** Soft pastel fantasy backdrop derived from the approved splash art. */
export function AmbientBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image source={BG} contentFit="cover" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={["rgba(255,255,255,0.18)", "rgba(240,230,255,0.08)", "rgba(120,80,220,0.22)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Sparkles />
    </View>
  );
}
