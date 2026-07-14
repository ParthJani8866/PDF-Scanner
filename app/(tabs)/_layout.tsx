import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/contexts/ThemeContext";
import { BRAND, fonts } from "@/src/theme";

function TabIcon({
  name,
  focused,
  color,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
}) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons name={name} size={22} color={color} />
      {focused ? (
        <View style={[styles.dot, { backgroundColor: BRAND.teal }]} />
      ) : (
        <View style={styles.dotSpacer} />
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          Haptics.selectionAsync().catch(() => {});
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BRAND.teal,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: fonts.regular,
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.6,
          marginTop: -2,
        },
        tabBarStyle: {
          position: "absolute",
          height: 64 + insets.bottom,
          paddingTop: 10,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          borderTopWidth: 0,
          backgroundColor: "transparent",
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView
            tint={mode === "dark" ? "dark" : "light"}
            intensity={Platform.OS === "ios" ? 60 : 90}
            style={StyleSheet.absoluteFill}
          >
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.tabBar },
              ]}
            />
          </BlurView>
        ),
        tabBarButton: (props) => (
          <Pressable
            {...(props as any)}
            android_ripple={{ color: "transparent" }}
            style={props.style as any}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="scan-outline" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: "Docs",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name="document-text-outline"
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: "Tools",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name="hammer"
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="settings-outline" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    height: 30,
  },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 4 },
  dotSpacer: { height: 8 },
  fabWrap: { alignItems: "center", justifyContent: "center" },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
