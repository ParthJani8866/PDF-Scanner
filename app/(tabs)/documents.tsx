import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";

import { useTheme } from "@/src/contexts/ThemeContext";
import { BRAND, fonts } from "@/src/theme";
import ScreenHeader from "@/src/components/ScreenHeader";
import {
  deleteDocument,
  listDocuments,
  updateDocument,
} from "@/src/services/documents";
import { generatePdf } from "@/src/services/pdf";
import { DocumentItem } from "@/src/types";

type MenuState = { doc: DocumentItem; renameMode?: boolean; newName?: string } | null;

export default function DocumentsTab() {
  const { colors, shadow } = useTheme();
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [folder, setFolder] = useState<string>("All");
  const [menu, setMenu] = useState<MenuState>(null);

  const refresh = useCallback(async () => {
    setDocs(await listDocuments());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const folders = useMemo(() => {
    const set = new Set<string>(["All"]);
    docs.forEach((d) => set.add(d.folder || "Inbox"));
    return Array.from(set);
  }, [docs]);

  const visible = useMemo(
    () => (folder === "All" ? docs : docs.filter((d) => (d.folder || "Inbox") === folder)),
    [docs, folder],
  );

  const onDelete = async (id: string) => {
    setDocs(await deleteDocument(id));
    setMenu(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  };

  const onShare = async (doc: DocumentItem) => {
    setMenu(null);
    try {
      const uri = doc.pdfUri || (await generatePdf(doc));
      if (!doc.pdfUri) await updateDocument(doc.id, { pdfUri: uri });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: doc.name,
          UTI: "com.adobe.pdf",
        });
      }
    } catch (e) {
      console.log("share error", e);
    }
  };

  const onRename = async () => {
    if (!menu?.doc || !menu.newName?.trim()) return;
    setDocs(await updateDocument(menu.doc.id, { name: menu.newName.trim() }));
    setMenu(null);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
      testID="documents-screen"
    >
      <ScreenHeader
        eyebrow="Library"
        title="Documents"
        subtitle={`${docs.length} document${docs.length === 1 ? "" : "s"} • Offline archive`}
      />

      {/* Folder chips */}
      <View style={{ height: 56, marginBottom: 4 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {folders.map((f) => {
            const active = f === folder;
            return (
              <Pressable
                key={f}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setFolder(f);
                }}
                style={[
                  styles.chip,
                  {
                    borderColor: active ? BRAND.teal : colors.border,
                    backgroundColor: active ? "rgba(15,209,199,0.12)" : colors.surface,
                  },
                ]}
                testID={`folder-chip-${f}`}
              >
                <Ionicons
                  name={f === "All" ? "layers" : "folder"}
                  size={13}
                  color={active ? BRAND.teal : colors.textSecondary}
                />
                <Text
                  style={{
                    color: active ? BRAND.teal : colors.textSecondary,
                    fontFamily: fonts.regular,
                    fontWeight: "700",
                    fontSize: 12,
                    letterSpacing: 0.4,
                  }}
                >
                  {f}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {visible.length === 0 ? (
        <EmptyState
          onScan={() => router.push({ pathname: "/camera", params: { mode: "scan" } })}
        />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(d) => d.id}
          contentContainerStyle={{ padding: 24, paddingTop: 8, paddingBottom: 140 }}
          renderItem={({ item }) => (
            <DocRow
              doc={item}
              onOpen={() =>
                router.push({ pathname: "/viewer/[id]", params: { id: item.id } })
              }
              onMenu={() => setMenu({ doc: item })}
            />
          )}
        />
      )}

      {/* Bottom sheet menu */}
      <Modal
        transparent
        visible={!!menu}
        animationType="fade"
        onRequestClose={() => setMenu(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setMenu(null)}>
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              shadow,
            ]}
            onPress={() => {}}
          >
            {menu?.renameMode ? (
              <View style={{ padding: 8 }}>
                <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                  Rename document
                </Text>
                <TextInput
                  value={menu.newName ?? menu.doc.name}
                  onChangeText={(t) => setMenu({ ...menu, newName: t })}
                  autoFocus
                  placeholder="Document name"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background },
                  ]}
                  testID="rename-input"
                />
                <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
                  <Pressable
                    style={[styles.actionSecondary, { borderColor: colors.border }]}
                    onPress={() => setMenu(null)}
                  >
                    <Text style={{ color: colors.textSecondary, fontFamily: fonts.regular, fontWeight: "700" }}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionPrimary, { backgroundColor: BRAND.indigo }]}
                    onPress={onRename}
                    testID="rename-confirm-button"
                  >
                    <Text style={{ color: "#fff", fontFamily: fonts.regular, fontWeight: "700" }}>
                      Save
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View>
                <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                  {menu?.doc.name}
                </Text>
                <MenuRow
                  icon="eye"
                  label="View PDF"
                  onPress={() => {
                    if (menu?.doc) {
                      router.push({ pathname: "/viewer/[id]", params: { id: menu.doc.id } });
                      setMenu(null);
                    }
                  }}
                  testID="menu-view"
                />
                <MenuRow
                  icon="share-social"
                  label="Share"
                  onPress={() => menu && onShare(menu.doc)}
                  testID="menu-share"
                />
                <MenuRow
                  icon="pencil"
                  label="Rename"
                  onPress={() =>
                    menu && setMenu({ ...menu, renameMode: true, newName: menu.doc.name })
                  }
                  testID="menu-rename"
                />
                <MenuRow
                  icon="folder"
                  label={`Move (folder: ${menu?.doc.folder || "Inbox"})`}
                  onPress={async () => {
                    if (!menu) return;
                    const rotate = ["Inbox", "Personal", "Work", "Receipts", "IDs"];
                    const idx = rotate.indexOf(menu.doc.folder || "Inbox");
                    const next = rotate[(idx + 1) % rotate.length];
                    setDocs(await updateDocument(menu.doc.id, { folder: next }));
                    setMenu({ ...menu, doc: { ...menu.doc, folder: next } });
                  }}
                  testID="menu-move"
                />
                <MenuRow
                  icon="trash"
                  label="Delete"
                  destructive
                  onPress={() => menu && onDelete(menu.doc.id)}
                  testID="menu-delete"
                />
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function DocRow({
  doc,
  onOpen,
  onMenu,
}: {
  doc: DocumentItem;
  onOpen: () => void;
  onMenu: () => void;
}) {
  const { colors, shadow } = useTheme();
  const first = doc.pages[0];
  const created = new Date(doc.createdAt);
  const dateStr = created.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <Pressable
      onPress={onOpen}
      testID={`doc-row-${doc.id}`}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
        shadow,
      ]}
    >
      <View style={styles.thumbWrap}>
        {first ? (
          <Image
            source={{ uri: first.uri }}
            style={[styles.thumb, { transform: [{ rotate: `${first.rotation}deg` }] }]}
          />
        ) : (
          <View style={[styles.thumb, { backgroundColor: colors.background }]} />
        )}
        {doc.pages.length > 1 ? (
          <View style={styles.pageBadge}>
            <Text style={styles.pageBadgeText}>{doc.pages.length}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text
          numberOfLines={1}
          style={{
            color: colors.textPrimary,
            fontFamily: fonts.regular,
            fontWeight: "700",
            fontSize: 15,
          }}
        >
          {doc.name}
        </Text>
        <Text
          style={{
            color: colors.textMuted,
            fontFamily: fonts.regular,
            fontSize: 12,
            marginTop: 4,
          }}
        >
          {dateStr} • {doc.pages.length} page{doc.pages.length === 1 ? "" : "s"} • {doc.folder || "Inbox"}
        </Text>
      </View>
      <Pressable
        onPress={onMenu}
        hitSlop={12}
        style={styles.menuBtn}
        testID={`doc-menu-${doc.id}`}
      >
        <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
      </Pressable>
    </Pressable>
  );
}

function MenuRow({
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
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.menuRow,
        { backgroundColor: pressed ? colors.background : "transparent" },
      ]}
      testID={testID}
    >
      <Ionicons
        name={icon}
        size={18}
        color={destructive ? colors.danger : colors.textPrimary}
      />
      <Text
        style={{
          color: destructive ? colors.danger : colors.textPrimary,
          fontFamily: fonts.regular,
          fontSize: 15,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function EmptyState({ onScan }: { onScan: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="document-text-outline" size={28} color={BRAND.teal} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        Your library is empty
      </Text>
      <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
        Scan your first page and it will appear here — organized by folder and searchable in a tap.
      </Text>
      <Pressable
        onPress={onScan}
        style={[styles.emptyBtn, { borderColor: BRAND.teal }]}
        testID="empty-scan-button"
      >
        <Ionicons name="scan" size={16} color={BRAND.teal} />
        <Text style={{ color: BRAND.teal, fontFamily: fonts.regular, fontWeight: "700" }}>
          Scan a document
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    paddingHorizontal: 24,
    gap: 10,
    alignItems: "center",
  },
  chip: {
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
  },
  thumbWrap: {
    width: 56,
    height: 72,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#eee",
    position: "relative",
  },
  thumb: { width: "100%", height: "100%" },
  pageBadge: {
    position: "absolute",
    right: 4,
    bottom: 4,
    backgroundColor: BRAND.indigo,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pageBadgeText: {
    color: "#fff",
    fontFamily: fonts.regular,
    fontSize: 10,
    fontWeight: "700",
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 14,
    height: 44,
    paddingHorizontal: 18,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
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
  sheetTitle: {
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  actionSecondary: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionPrimary: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
