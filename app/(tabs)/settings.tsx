import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/contexts/ThemeContext";
import { BRAND, fonts } from "@/src/theme";
import ScreenHeader from "@/src/components/ScreenHeader";
import { storage } from "@/src/utils/storage";
import { listDocuments, saveAllDocuments } from "@/src/services/documents";
import { FilterType } from "@/src/types";

const FILTER_KEY = "docvault.defaultFilter";
const HAPTICS_KEY = "docvault.hapticsEnabled";
const SOUND_KEY = "docvault.soundEnabled";

const filters: { key: FilterType; label: string }[] = [
  { key: "original", label: "Original" },
  { key: "bw", label: "B & W" },
  { key: "enhanced", label: "Enhanced" },
  { key: "grayscale", label: "Grayscale" },
];

export default function SettingsTab() {
  const { colors, mode, toggle, shadow } = useTheme();
  const router = useRouter();

  const [defaultFilter, setDefaultFilter] = useState<FilterType>("original");
  const [hapticsOn, setHapticsOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [docsCount, setDocsCount] = useState(0);
  const [pagesCount, setPagesCount] = useState(0);

  const refresh = useCallback(async () => {
    const f = (await storage.getItem<FilterType>(FILTER_KEY, "original")) as FilterType;
    const h = await storage.getItem<boolean>(HAPTICS_KEY, true);
    const s = await storage.getItem<boolean>(SOUND_KEY, true);
    setDefaultFilter(f || "original");
    setHapticsOn(!!h);
    setSoundOn(!!s);
    const docs = await listDocuments();
    setDocsCount(docs.length);
    setPagesCount(docs.reduce((n, d) => n + d.pages.length, 0));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const setFilter = (f: FilterType) => {
    Haptics.selectionAsync().catch(() => {});
    setDefaultFilter(f);
    storage.setItem(FILTER_KEY, f);
  };

  const clearAll = async () => {
    Alert.alert(
      "Clear all documents?",
      "This will permanently delete all scanned documents and their PDFs. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete all",
          style: "destructive",
          onPress: async () => {
            await saveAllDocuments([]);
            refresh();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          },
        },
      ],
    );
  };

  const openStore = () => {
    Linking.openURL("https://apps.apple.com/").catch(() => {});
  };

  const estimatedMb = useMemo(() => (pagesCount * 0.35).toFixed(2), [pagesCount]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
      testID="settings-screen"
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow="Preferences"
          title="Settings"
          subtitle="Fine-tune DocVault to your workflow."
        />

        <View style={{ paddingHorizontal: 24 }}>
          {/* Appearance */}
          <SectionTitle>Appearance</SectionTitle>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadow]}>
            <SettingsRow
              icon={mode === "dark" ? "moon" : "sunny"}
              label="Dark mode"
              hint={mode === "dark" ? "Enabled" : "Disabled"}
              right={
                <Switch
                  value={mode === "dark"}
                  onValueChange={() => {
                    Haptics.selectionAsync().catch(() => {});
                    toggle();
                  }}
                  trackColor={{ true: BRAND.teal, false: colors.border }}
                  thumbColor="#fff"
                  testID="theme-toggle"
                />
              }
            />
          </View>

          {/* Scan */}
          <SectionTitle>Scanning</SectionTitle>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadow]}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary, marginBottom: 10 }]}>
              Default filter
            </Text>
            <View style={styles.filterRow}>
              {filters.map((f) => {
                const active = f.key === defaultFilter;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setFilter(f.key)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: active ? BRAND.indigo : colors.background,
                        borderColor: active ? BRAND.indigo : colors.border,
                      },
                    ]}
                    testID={`filter-${f.key}`}
                  >
                    <Text
                      style={{
                        color: active ? "#fff" : colors.textSecondary,
                        fontFamily: fonts.regular,
                        fontWeight: "700",
                        fontSize: 12,
                      }}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.sep} />

            <SettingsRow
              icon="phone-portrait"
              label="Haptic feedback"
              hint="Subtle vibrations on capture & actions"
              right={
                <Switch
                  value={hapticsOn}
                  onValueChange={(v) => {
                    setHapticsOn(v);
                    storage.setItem(HAPTICS_KEY, v);
                  }}
                  trackColor={{ true: BRAND.teal, false: colors.border }}
                  thumbColor="#fff"
                  testID="haptics-toggle"
                />
              }
            />
            <View style={styles.sep} />
            <SettingsRow
              icon="volume-medium"
              label="Capture sound"
              hint="Play shutter feedback when scanning"
              right={
                <Switch
                  value={soundOn}
                  onValueChange={(v) => {
                    setSoundOn(v);
                    storage.setItem(SOUND_KEY, v);
                  }}
                  trackColor={{ true: BRAND.teal, false: colors.border }}
                  thumbColor="#fff"
                  testID="sound-toggle"
                />
              }
            />
          </View>

          {/* Storage */}
          <SectionTitle>Storage</SectionTitle>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadow]}>
            <View style={styles.storageRow}>
              <View>
                <Text style={[styles.storageNum, { color: colors.textPrimary }]}>
                  {docsCount}
                </Text>
                <Text style={[styles.storageLabel, { color: colors.textMuted }]}>
                  Documents
                </Text>
              </View>
              <View>
                <Text style={[styles.storageNum, { color: colors.textPrimary }]}>
                  {pagesCount}
                </Text>
                <Text style={[styles.storageLabel, { color: colors.textMuted }]}>
                  Pages
                </Text>
              </View>
              <View>
                <Text style={[styles.storageNum, { color: colors.textPrimary }]}>
                  ~{estimatedMb} MB
                </Text>
                <Text style={[styles.storageLabel, { color: colors.textMuted }]}>
                  Used
                </Text>
              </View>
            </View>
            <View style={styles.sep} />
            <Pressable
              onPress={clearAll}
              style={styles.dangerRow}
              testID="clear-storage-button"
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={{ color: colors.danger, fontFamily: fonts.regular, fontWeight: "700", fontSize: 14 }}>
                Clear all documents
              </Text>
            </Pressable>
          </View>

          {/* About */}
          <SectionTitle>About</SectionTitle>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadow]}>
            <Pressable
              style={styles.linkRow}
              onPress={openStore}
              testID="rate-app-button"
            >
              <Ionicons name="star" size={18} color={BRAND.teal} />
              <Text style={{ color: colors.textPrimary, fontFamily: fonts.regular, fontSize: 15, flex: 1 }}>
                Rate this app
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
            <View style={styles.sep} />
            <Pressable
              style={styles.linkRow}
              onPress={() => router.push("/privacy")}
              testID="privacy-link"
            >
              <Ionicons name="shield-checkmark" size={18} color={BRAND.teal} />
              <Text style={{ color: colors.textPrimary, fontFamily: fonts.regular, fontSize: 15, flex: 1 }}>
                Privacy policy
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
            <View style={styles.sep} />
            <View style={styles.linkRow}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
              <Text style={{ color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 13, flex: 1 }}>
                DocVault v1.0.0 — Offline-first
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <Text
      style={{
        color: colors.textMuted,
        fontFamily: fonts.regular,
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1.4,
        textTransform: "uppercase",
        marginTop: 24,
        marginBottom: 10,
      }}
    >
      {children}
    </Text>
  );
}

function SettingsRow({
  icon,
  label,
  hint,
  right,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  right?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: colors.background }]}>
        <Ionicons name={icon} size={18} color={BRAND.indigo} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{label}</Text>
        {hint ? (
          <Text style={[styles.rowHint, { color: colors.textMuted }]}>{hint}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    fontWeight: "700",
  },
  rowHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 2,
  },
  sep: {
    height: 1,
    backgroundColor: "rgba(127, 127, 160, 0.12)",
    marginVertical: 12,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  storageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  storageNum: {
    fontFamily: fonts.heading,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  storageLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  dangerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
});
