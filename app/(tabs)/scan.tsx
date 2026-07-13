import React, { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/src/contexts/ThemeContext";
import { BRAND, fonts } from "@/src/theme";
import ScreenHeader from "@/src/components/ScreenHeader";
import GradientButton from "@/src/components/GradientButton";
import { listDocuments } from "@/src/services/documents";
import { DocumentItem } from "@/src/types";

export default function ScanTab() {
  const { colors, shadow } = useTheme();
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      listDocuments().then(setDocs);
    }, []),
  );

  const totalPages = docs.reduce((n, d) => n + d.pages.length, 0);

  const openCamera = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push({ pathname: "/camera", params: { mode: "scan" } });
  };

  const importFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to import images.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      quality: 0.9,
      selectionLimit: 20,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri).join(",");
      router.push({ pathname: "/preview", params: { uris } });
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
      testID="scan-screen"
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow="DocVault"
          title="Ready to Scan"
          subtitle="Digitize any page in seconds. Fully offline, privacy-first."
        />

        <View style={{ paddingHorizontal: 24 }}>
          <LinearGradient
            colors={BRAND.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, shadow]}
          >
            <View style={styles.heroGrid}>
              <View style={styles.heroCell}>
                <Text style={styles.heroNum}>{docs.length}</Text>
                <Text style={styles.heroLabel}>Documents</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroCell}>
                <Text style={styles.heroNum}>{totalPages}</Text>
                <Text style={styles.heroLabel}>Pages</Text>
              </View>
            </View>

            <Pressable
              onPress={openCamera}
              style={styles.heroCta}
              testID="scan-hero-camera-button"
            >
              <Ionicons name="camera" size={20} color="#0D082A" />
              <Text style={styles.heroCtaText}>Open Camera</Text>
            </Pressable>
          </LinearGradient>

          <Text
            style={[styles.section, { color: colors.textPrimary, marginTop: 24 }]}
          >
            Quick actions
          </Text>

          <View style={styles.quickGrid}>
            <QuickCard
              icon="scan"
              label="New Scan"
              onPress={openCamera}
              testID="quick-new-scan"
              accent
            />
            <QuickCard
              icon="images"
              label="Image → PDF"
              onPress={importFromGallery}
              testID="quick-image-to-pdf"
            />
            <QuickCard
              icon="folder-open"
              label="My Docs"
              onPress={() => router.push("/(tabs)/documents")}
              testID="quick-my-docs"
            />
            <QuickCard
              icon="construct"
              label="PDF Tools"
              onPress={() => router.push("/(tabs)/tools")}
              testID="quick-pdf-tools"
            />
          </View>

          <View style={[styles.tipCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadow]}>
            <View style={styles.tipRow}>
              <View style={styles.tipIcon}>
                <Ionicons name="sparkles" size={16} color={BRAND.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>
                  Multi-page scan
                </Text>
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  Capture multiple pages, then merge into a single PDF right from the preview screen.
                </Text>
              </View>
            </View>
          </View>

          <GradientButton
            label="Start Scanning"
            onPress={openCamera}
            style={{ marginTop: 20 }}
            testID="scan-start-button"
            icon={<Ionicons name="camera-outline" size={18} color="#fff" />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickCard({
  icon,
  label,
  onPress,
  accent,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  accent?: boolean;
  testID?: string;
}) {
  const { colors, shadow } = useTheme();
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      testID={testID}
      style={({ pressed }) => [
        styles.qc,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        shadow,
      ]}
    >
      <View
        style={[
          styles.qcIcon,
          { backgroundColor: accent ? BRAND.indigo : colors.background },
        ]}
      >
        <Ionicons name={icon} size={20} color={accent ? "#fff" : BRAND.indigo} />
      </View>
      <Text style={[styles.qcLabel, { color: colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 24,
    padding: 24,
    overflow: "hidden",
  },
  heroGrid: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  heroCell: { flex: 1 },
  heroDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  heroNum: {
    color: "#fff",
    fontFamily: fonts.heading,
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -1,
  },
  heroLabel: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: fonts.regular,
    fontSize: 11,
    letterSpacing: 1.2,
    marginTop: 2,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  heroCta: {
    backgroundColor: "#fff",
    borderRadius: 14,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  heroCtaText: {
    color: "#0D082A",
    fontFamily: fonts.regular,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  section: {
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  qc: {
    width: "48%",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    minHeight: 110,
    justifyContent: "space-between",
  },
  qcIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  qcLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    fontWeight: "700",
  },
  tipCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  tipRow: { flexDirection: "row", gap: 12 },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(15, 209, 199, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  tipTitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  tipText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
  },
});
