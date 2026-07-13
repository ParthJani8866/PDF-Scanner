import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/contexts/ThemeContext";
import { BRAND, fonts } from "@/src/theme";
import {
  listDocuments,
  updateDocument,
} from "@/src/services/documents";
import { generatePdf } from "@/src/services/pdf";
import { DocumentItem } from "@/src/types";
import GradientButton from "@/src/components/GradientButton";

export default function Viewer() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, shadow } = useTheme();
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const docs = await listDocuments();
    setDoc(docs.find((d) => d.id === id) || null);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const share = async () => {
    if (!doc) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  if (!doc) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}
        edges={["top", "bottom"]}
      >
        <ActivityIndicator color={colors.textPrimary} />
      </SafeAreaView>
    );
  }

  const created = new Date(doc.createdAt).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom"]}
      testID="viewer-screen"
    >
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}
          testID="viewer-back"
        >
          <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text
            numberOfLines={1}
            style={[styles.title, { color: colors.textPrimary, maxWidth: 220 }]}
          >
            {doc.name}
          </Text>
          <Text style={{ color: colors.textMuted, fontFamily: fonts.regular, fontSize: 11 }}>
            {doc.pages.length} page{doc.pages.length === 1 ? "" : "s"} • {created}
          </Text>
        </View>
        <Pressable
          onPress={share}
          style={[styles.back, { backgroundColor: BRAND.teal, borderColor: BRAND.teal }]}
          testID="viewer-share"
        >
          <Ionicons name="share-outline" size={18} color="#0D082A" />
        </Pressable>
      </View>

      <FlatList
        data={doc.pages}
        keyExtractor={(_, i) => `page_${i}`}
        contentContainerStyle={{ padding: 20, paddingBottom: 100, gap: 14 }}
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.page,
              { backgroundColor: colors.surface, borderColor: colors.border },
              shadow,
            ]}
          >
            <Image
              source={{ uri: item.uri }}
              style={[
                styles.pageImg,
                { transform: [{ rotate: `${item.rotation}deg` }] },
              ]}
              resizeMode="contain"
            />
            <View style={styles.pageBadge}>
              <Text style={styles.pageBadgeText}>
                Page {index + 1} • {item.filter}
              </Text>
            </View>
          </View>
        )}
      />

      <View style={{ position: "absolute", left: 20, right: 20, bottom: 20 }}>
        <GradientButton
          label={loading ? "Preparing…" : "Share as PDF"}
          onPress={share}
          loading={loading}
          testID="viewer-share-button"
          icon={<Ionicons name="paper-plane" size={18} color="#fff" />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 10,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: "700",
  },
  page: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 8,
    aspectRatio: 0.72,
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  pageImg: { width: "100%", height: "100%" },
  pageBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pageBadgeText: {
    color: "#fff",
    fontFamily: fonts.regular,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "capitalize",
  },
});
