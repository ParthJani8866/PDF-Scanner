import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/contexts/ThemeContext";
import { BRAND, fonts } from "@/src/theme";

export default function Privacy() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom"]}
      testID="privacy-screen"
    >
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.textPrimary }]}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.badge}>
            <Ionicons name="lock-closed" size={16} color={BRAND.teal} />
            <Text style={styles.badgeText}>Fully offline • On-device</Text>
          </View>

          <P color={colors.textSecondary}>
            DocVault is a fully offline document utility. All scans, PDFs, tags and preferences
            are stored locally on your device.
          </P>
          <H color={colors.textPrimary}>What we collect</H>
          <P color={colors.textSecondary}>
            Nothing. We do not collect, transmit, or share any personal data or documents. No
            analytics, no telemetry, no cloud sync.
          </P>
          <H color={colors.textPrimary}>Permissions</H>
          <P color={colors.textSecondary}>
            The app requests access to your camera and photo library only when you initiate a
            scan or import. These are used exclusively on-device.
          </P>
          <H color={colors.textPrimary}>Sharing</H>
          <P color={colors.textSecondary}>
            When you tap Share, your device&apos;s native share sheet appears. What happens next is
            controlled by the app you choose (Mail, Messages, cloud drive, etc.).
          </P>
          <H color={colors.textPrimary}>Data deletion</H>
          <P color={colors.textSecondary}>
            You can delete a single document, or clear everything in Settings → Storage. This
            action is immediate and irreversible.
          </P>
          <H color={colors.textPrimary}>Contact</H>
          <P color={colors.textSecondary}>
            Questions? Reach us at support@docvault.local. Last updated: February 2026.
          </P>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function H({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <Text style={{ color, fontFamily: fonts.heading, fontSize: 15, fontWeight: "700", marginTop: 16, marginBottom: 6 }}>
      {children}
    </Text>
  );
}
function P({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <Text style={{ color, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 }}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: "700",
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15,209,199,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  badgeText: {
    color: BRAND.teal,
    fontFamily: fonts.regular,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
});
