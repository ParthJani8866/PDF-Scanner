import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as ImageManipulator from "expo-image-manipulator";

import { useTheme } from "@/src/contexts/ThemeContext";
import { BRAND, fonts } from "@/src/theme";
import GradientButton from "@/src/components/GradientButton";
import {
  addDocument,
  autoScanName,
  newId,
} from "@/src/services/documents";
import { generatePdf } from "@/src/services/pdf";
import { FilterType, ScanPage } from "@/src/types";
import { storage } from "@/src/utils/storage";

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "original", label: "Original" },
  { key: "bw", label: "B & W" },
  { key: "enhanced", label: "Enhanced" },
  { key: "grayscale", label: "Grayscale" },
];

const FOLDERS = ["Inbox", "Personal", "Work", "Receipts", "IDs"];

export default function PreviewScreen() {
  const router = useRouter();
  const { uris } = useLocalSearchParams<{ uris: string }>();
  const { colors, shadow } = useTheme();

  const [pages, setPages] = useState<ScanPage[]>([]);
  const [current, setCurrent] = useState(0);
  const [name, setName] = useState(autoScanName());
  const [folder, setFolder] = useState<string>("Inbox");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const defaultFilter =
        (await storage.getItem<FilterType>("docvault.defaultFilter", "original")) ||
        "original";
      const list = (uris?.split(",") || []).filter(Boolean);
      const initial: ScanPage[] = list.map((u) => ({
        uri: u,
        width: 0,
        height: 0,
        filter: defaultFilter as FilterType,
        rotation: 0,
      }));
      setPages(initial);
    })();
  }, [uris]);

  const active = pages[current];

  const setFilter = (f: FilterType) => {
    Haptics.selectionAsync().catch(() => {});
    setPages((ps) => ps.map((p, i) => (i === current ? { ...p, filter: f } : p)));
  };

  const rotate = async () => {
    if (!active) return;
    Haptics.selectionAsync().catch(() => {});
    try {
      const result = await ImageManipulator.manipulateAsync(
        active.uri,
        [{ rotate: 90 }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
      );
      setPages((ps) =>
        ps.map((p, i) =>
          i === current
            ? { ...p, uri: result.uri, rotation: 0 }
            : p,
        ),
      );
    } catch (e) {
      console.log("rotate error", e);
    }
  };

  const remove = (idx: number) => {
    setPages((ps) => {
      const next = ps.filter((_, i) => i !== idx);
      if (current >= next.length) setCurrent(Math.max(0, next.length - 1));
      return next;
    });
  };

  const save = async () => {
    if (pages.length === 0) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const draft = {
        id: newId(),
        name: name.trim() || autoScanName(),
        createdAt: now,
        updatedAt: now,
        pages,
        folder,
      };
      const pdfUri = await generatePdf(draft);
      await addDocument({ ...draft, pdfUri });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace("/(tabs)/documents");
    } catch (e) {
      console.log("save error", e);
      Alert.alert("Save failed", "Could not save this document. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const cssFilterStyle = useMemo(() => {
    if (!active) return {};
    // React Native supports `mixBlendMode` on newer versions but reliably works only on web.
    // For consistent cross-platform UX we show a subtle indicator badge instead.
    return {};
  }, [active]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom"]}
      testID="preview-screen"
    >
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}
          testID="preview-back"
        >
          <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.textPrimary }]}>Review scan</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Preview */}
      <View style={styles.previewWrap}>
        <View style={[styles.stage, { backgroundColor: colors.surface, borderColor: colors.border }, shadow]}>
          {active ? (
            <>
              <Image
                source={{ uri: active.uri }}
                style={[
                  styles.stageImg,
                  { transform: [{ rotate: `${active.rotation}deg` }] },
                  cssFilterStyle as any,
                ]}
                resizeMode="contain"
              />
              {active.filter !== "original" ? (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {FILTERS.find((f) => f.key === active.filter)?.label}
                  </Text>
                </View>
              ) : null}
            </>
          ) : (
            <Text style={{ color: colors.textMuted, fontFamily: fonts.regular }}>
              No pages
            </Text>
          )}

          {pages.length > 0 ? (
            <View style={styles.stageBadge}>
              <Text style={styles.stageBadgeText}>
                {current + 1}/{pages.length}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Page thumbnails */}
        {pages.length > 1 ? (
          <FlatList
            data={pages}
            horizontal
            keyExtractor={(_, i) => `p_${i}`}
            contentContainerStyle={styles.thumbRow}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => setCurrent(index)}
                style={[
                  styles.thumbCell,
                  {
                    borderColor: index === current ? BRAND.teal : colors.border,
                  },
                ]}
                testID={`page-thumb-${index}`}
              >
                <Image source={{ uri: item.uri }} style={styles.thumbImg} />
                <Pressable
                  onPress={() => remove(index)}
                  hitSlop={10}
                  style={styles.thumbClose}
                >
                  <Ionicons name="close" size={12} color="#fff" />
                </Pressable>
              </Pressable>
            )}
          />
        ) : null}
      </View>

      {/* Actions row */}
      <View style={styles.actionRow}>
        <ActionBtn icon="reload" label="Rotate" onPress={rotate} testID="btn-rotate" />
        <ActionBtn
          icon="add-circle"
          label="Add page"
          onPress={() => router.replace({ pathname: "/camera", params: { mode: "scan" } })}
          testID="btn-add-page"
        />
        <ActionBtn
          icon="trash-outline"
          label="Delete"
          destructive
          onPress={() => {
            if (active) remove(current);
          }}
          testID="btn-delete-page"
        />
      </View>

      {/* Filters */}
      <View style={{ paddingHorizontal: 20, marginTop: 6 }}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(f) => f.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}
          renderItem={({ item }) => {
            const on = active?.filter === item.key;
            return (
              <Pressable
                onPress={() => setFilter(item.key)}
                style={[
                  styles.filterPill,
                  {
                    borderColor: on ? BRAND.teal : colors.border,
                    backgroundColor: on
                      ? "rgba(15,209,199,0.14)"
                      : colors.surface,
                  },
                ]}
                testID={`filter-pill-${item.key}`}
              >
                <Text
                  style={{
                    color: on ? BRAND.teal : colors.textSecondary,
                    fontFamily: fonts.regular,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Name + folder */}
      <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
        <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="document-text-outline" size={16} color={colors.textMuted} />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Document name"
            placeholderTextColor={colors.textMuted}
            style={{ flex: 1, color: colors.textPrimary, fontFamily: fonts.regular, fontSize: 14 }}
            testID="doc-name-input"
          />
        </View>

        <FlatList
          horizontal
          data={FOLDERS}
          keyExtractor={(f) => f}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingTop: 10, paddingBottom: 4 }}
          renderItem={({ item }) => {
            const on = folder === item;
            return (
              <Pressable
                onPress={() => setFolder(item)}
                style={[
                  styles.folderPill,
                  {
                    borderColor: on ? BRAND.indigo : colors.border,
                    backgroundColor: on ? BRAND.indigo : colors.surface,
                  },
                ]}
                testID={`folder-pill-${item}`}
              >
                <Ionicons
                  name="folder"
                  size={12}
                  color={on ? "#fff" : colors.textSecondary}
                />
                <Text
                  style={{
                    color: on ? "#fff" : colors.textSecondary,
                    fontFamily: fonts.regular,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {item}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Save button */}
      <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 }}>
        <GradientButton
          label={saving ? "Saving…" : `Save PDF (${pages.length} page${pages.length === 1 ? "" : "s"})`}
          onPress={save}
          loading={saving}
          disabled={pages.length === 0}
          testID="preview-save-button"
          icon={<Ionicons name="save" size={18} color="#fff" />}
        />
      </View>
    </SafeAreaView>
  );
}

function ActionBtn({
  icon,
  label,
  onPress,
  destructive,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  testID?: string;
}) {
  const { colors, shadow } = useTheme();
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        shadow,
      ]}
      testID={testID}
    >
      <Ionicons
        name={icon}
        size={18}
        color={destructive ? colors.danger : BRAND.indigo}
      />
      <Text
        style={{
          color: destructive ? colors.danger : colors.textPrimary,
          fontFamily: fonts.regular,
          fontWeight: "700",
          fontSize: 12,
          marginTop: 4,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  previewWrap: { paddingHorizontal: 20, marginTop: 4 },
  stage: {
    aspectRatio: 0.72,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  stageImg: { width: "100%", height: "100%" },
  stageBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  stageBadgeText: {
    color: "#fff",
    fontFamily: fonts.regular,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  filterBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: BRAND.teal,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    color: "#0D082A",
    fontFamily: fonts.regular,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  thumbRow: { paddingVertical: 10, gap: 8 },
  thumbCell: {
    width: 44,
    height: 58,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    position: "relative",
  },
  thumbImg: { width: "100%", height: "100%" },
  thumbClose: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 6,
  },
  action: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
  },
  filterPill: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  folderPill: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
});
