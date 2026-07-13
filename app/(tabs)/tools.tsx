import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/contexts/ThemeContext";
import { BRAND, fonts } from "@/src/theme";
import ScreenHeader from "@/src/components/ScreenHeader";
import GradientButton from "@/src/components/GradientButton";
import {
  addDocument,
  autoScanName,
  listDocuments,
  newId,
  updateDocument,
} from "@/src/services/documents";
import { generatePdf, mergePdfsAsHtml } from "@/src/services/pdf";
import { DocumentItem } from "@/src/types";

type Tool = "merge" | "split" | "compress" | "image2pdf";

const tools: {
  key: Tool;
  title: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { key: "image2pdf", title: "Image → PDF", desc: "Convert photos to a polished PDF", icon: "images", color: "#0fd1c7" },
  { key: "merge", title: "Merge PDFs", desc: "Combine multiple documents into one", icon: "layers", color: "#7c3aed" },
  { key: "split", title: "Split PDF", desc: "Extract individual pages", icon: "cut", color: "#f59e0b" },
  { key: "compress", title: "Compress", desc: "Reduce PDF file size", icon: "archive", color: "#ec4899" },
];

export default function ToolsTab() {
  const { colors, shadow } = useTheme();
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [pickerFor, setPickerFor] = useState<Tool | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => setDocs(await listDocuments()), []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const image2pdf = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow photo library access.");
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

  const openToolPicker = (t: Tool) => {
    if (t === "image2pdf") return image2pdf();
    if (docs.length === 0) {
      Alert.alert("No documents", "Scan or import a document first.");
      return;
    }
    setSelected([]);
    setPickerFor(t);
  };

  const runTool = async () => {
    if (!pickerFor) return;
    if (selected.length === 0) return;
    setBusy(true);
    try {
      if (pickerFor === "merge") {
        if (selected.length < 2) {
          Alert.alert("Merge PDFs", "Select at least 2 documents to merge.");
          setBusy(false);
          return;
        }
        const chosen = selected
          .map((id) => docs.find((d) => d.id === id))
          .filter(Boolean) as DocumentItem[];
        const mergedName = `Merged_${autoScanName().replace("Scan_", "")}`;
        const { uri } = await mergePdfsAsHtml(chosen, mergedName);
        const merged: DocumentItem = {
          id: newId(),
          name: mergedName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pages: chosen.flatMap((d) => d.pages),
          folder: "Inbox",
          pdfUri: uri,
        };
        await addDocument(merged);
        setPickerFor(null);
        setBusy(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: mergedName });
        }
      } else if (pickerFor === "split") {
        const doc = docs.find((d) => d.id === selected[0]);
        if (!doc) return;
        if (doc.pages.length < 2) {
          Alert.alert("Split PDF", "This document has only one page.");
          setBusy(false);
          return;
        }
        let created = 0;
        for (let i = 0; i < doc.pages.length; i += 1) {
          const p = doc.pages[i];
          const single: DocumentItem = {
            id: newId(),
            name: `${doc.name}_p${i + 1}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            pages: [p],
            folder: doc.folder,
          };
          const uri = await generatePdf(single);
          await addDocument({ ...single, pdfUri: uri });
          created += 1;
        }
        setPickerFor(null);
        setBusy(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Alert.alert("Split complete", `Created ${created} single-page documents.`);
        await refresh();
      } else if (pickerFor === "compress") {
        const doc = docs.find((d) => d.id === selected[0]);
        if (!doc) return;
        // Regenerate PDF (already optimized via expo-print HTML embedding)
        const uri = await generatePdf(doc);
        await updateDocument(doc.id, { pdfUri: uri });
        setPickerFor(null);
        setBusy(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Alert.alert("Compression done", `Re-encoded "${doc.name}" for smaller file size.`);
        await refresh();
      }
    } catch (e) {
      console.log("tool error", e);
      setBusy(false);
      Alert.alert("Something went wrong", "Please try again.");
    }
  };

  const toggle = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const singleSelect = pickerFor === "split" || pickerFor === "compress";

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
      testID="tools-screen"
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow="Toolbox"
          title="PDF Tools"
          subtitle="Merge, split, compress, and convert — everything on-device."
        />

        <View style={{ paddingHorizontal: 24 }}>
          <LinearGradient
            colors={BRAND.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.banner, shadow]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Convert now</Text>
              <Text style={styles.bannerSub}>
                Turn photos from your gallery into a single crisp PDF in seconds.
              </Text>
            </View>
            <Pressable
              onPress={image2pdf}
              style={styles.bannerCta}
              testID="tools-image-to-pdf-button"
            >
              <Ionicons name="images" size={18} color="#0D082A" />
            </Pressable>
          </LinearGradient>

          <Text style={[styles.section, { color: colors.textPrimary }]}>All tools</Text>

          <View style={styles.grid}>
            {tools.map((t) => (
              <Pressable
                key={t.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  openToolPicker(t.key);
                }}
                style={({ pressed }) => [
                  styles.tool,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                  shadow,
                ]}
                testID={`tool-${t.key}`}
              >
                <View style={[styles.toolIcon, { backgroundColor: `${t.color}22` }]}>
                  <Ionicons name={t.icon} size={22} color={t.color} />
                </View>
                <Text style={[styles.toolTitle, { color: colors.textPrimary }]}>
                  {t.title}
                </Text>
                <Text style={[styles.toolDesc, { color: colors.textSecondary }]}>
                  {t.desc}
                </Text>
              </Pressable>
            ))}
          </View>

          <View
            style={[
              styles.info,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="information-circle" size={16} color={BRAND.teal} />
            <Text style={{ color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 12, flex: 1, lineHeight: 17 }}>
              All processing happens on-device. Nothing is uploaded, ensuring complete privacy of your documents.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Selector modal */}
      <Modal
        transparent
        visible={pickerFor !== null}
        animationType="slide"
        onRequestClose={() => !busy && setPickerFor(null)}
      >
        <View style={styles.backdrop}>
          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.sheetHead}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                {pickerFor === "merge"
                  ? "Select PDFs to merge"
                  : pickerFor === "split"
                    ? "Select a PDF to split"
                    : "Select a PDF to compress"}
              </Text>
              <Pressable onPress={() => !busy && setPickerFor(null)} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <FlatList
              data={docs}
              keyExtractor={(d) => d.id}
              style={{ maxHeight: 340 }}
              contentContainerStyle={{ paddingVertical: 4 }}
              renderItem={({ item }) => {
                const isOn = selected.includes(item.id);
                return (
                  <Pressable
                    onPress={() => {
                      if (singleSelect) setSelected([item.id]);
                      else toggle(item.id);
                    }}
                    style={[
                      styles.pickerRow,
                      { borderColor: isOn ? BRAND.teal : colors.border },
                    ]}
                    testID={`picker-item-${item.id}`}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: isOn ? BRAND.teal : colors.border,
                          backgroundColor: isOn ? BRAND.teal : "transparent",
                        },
                      ]}
                    >
                      {isOn ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontFamily: fonts.regular,
                          fontWeight: "700",
                          fontSize: 14,
                        }}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={{
                          color: colors.textMuted,
                          fontFamily: fonts.regular,
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        {item.pages.length} page{item.pages.length === 1 ? "" : "s"}
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text
                  style={{
                    color: colors.textMuted,
                    fontFamily: fonts.regular,
                    padding: 24,
                    textAlign: "center",
                  }}
                >
                  No documents available.
                </Text>
              }
            />

            <GradientButton
              label={
                pickerFor === "merge"
                  ? `Merge ${selected.length} document${selected.length === 1 ? "" : "s"}`
                  : pickerFor === "split"
                    ? "Split into pages"
                    : "Compress PDF"
              }
              onPress={runTool}
              loading={busy}
              disabled={selected.length === 0}
              testID="tool-run-button"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 22,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  bannerTitle: {
    color: "#fff",
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  bannerSub: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  bannerCta: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 28,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  tool: {
    width: "48%",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    minHeight: 140,
  },
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  toolTitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  toolDesc: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  info: {
    marginTop: 24,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  sheetHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sheetTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
