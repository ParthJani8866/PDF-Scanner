import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { BRAND, fonts } from "@/src/theme";

interface Props {
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  testID?: string;
  icon?: React.ReactNode;
}

export default function GradientButton({
  label,
  onPress,
  disabled,
  loading,
  style,
  testID,
  icon,
}: Props) {
  return (
    <Pressable
      testID={testID}
      disabled={disabled || loading}
      onPress={async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        await onPress();
      }}
      style={({ pressed }) => [
        styles.wrap,
        style,
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
        (disabled || loading) && { opacity: 0.5 },
      ]}
    >
      <LinearGradient
        colors={BRAND.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.grad}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            {icon}
            <Text style={styles.label}>{label}</Text>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, overflow: "hidden" },
  grad: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
  },
  label: {
    color: "#fff",
    fontFamily: fonts.regular,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
});
