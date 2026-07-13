import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { storage } from "@/src/utils/storage";
import { useTheme } from "@/src/contexts/ThemeContext";
import { BRAND, fonts } from "@/src/theme";
import GradientButton from "@/src/components/GradientButton";

const { width, height } = Dimensions.get("window");

const slides = [
  {
    key: "capture",
    title: "Scan Anywhere",
    subtitle:
      "Turn any physical paper into a crisp digital document with a single tap.",
    image:
      "https://images.unsplash.com/photo-1558478551-1a378f63328e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDB8MHwxfHNlYXJjaHw0fHxjbGVhbiUyMG9mZmljZSUyMGRlc2slMjBwYXBlciUyMG1vZGVybnxlbnwwfHx8fDE3ODM5MzY4NTB8MA&ixlib=rb-4.1.0&q=85",
  },
  {
    key: "organize",
    title: "Organize Beautifully",
    subtitle: "Group scans into folders, rename, and find anything instantly.",
    image:
      "https://images.unsplash.com/photo-1674305281997-b6538532f388?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHwzfHxsYXllcmVkJTIwcGFwZXIlMjBhYnN0cmFjdCUyMGFydHxlbnwwfHx8fDE3ODM5MzY4NTB8MA&ixlib=rb-4.1.0&q=85",
  },
  {
    key: "share",
    title: "Export & Share",
    subtitle:
      "Merge, split, compress and share polished PDFs — all fully offline.",
    image:
      "https://images.unsplash.com/photo-1549317336-206569e8475c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxNzV8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMG5lb24lMjBzY2FuJTIwbGluZXMlMjB0ZWNobm9sb2d5fGVufDB8fHx8MTc4MzkzNjg1MHww&ixlib=rb-4.1.0&q=85",
  },
];

export default function Onboarding() {
  const router = useRouter();
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const finish = async () => {
    await storage.setItem("docvault.onboarded.v1", true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    router.replace("/(tabs)/scan");
  };

  const next = () => {
    if (index < slides.length - 1) {
      const nextIdx = index + 1;
      setIndex(nextIdx);
      listRef.current?.scrollToOffset({
        offset: nextIdx * width,
        animated: true,
      });
    } else {
      finish();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }} testID="onboarding-root">
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        style={{ flex: 1 }}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.key}
        onScroll={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          if (i !== index) setIndex(i);
        }}
        scrollEventThrottle={32}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(i);
        }}
        renderItem={({ item }) => (
          <View style={{ width, height }}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.95)"]}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFill}
            />
            <SafeAreaView style={styles.content} edges={["bottom"]}>
              <Text style={styles.eyebrow}>DocVault • Step {index + 1}/3</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </SafeAreaView>
          </View>
        )}
      />

      <SafeAreaView style={styles.bottom} edges={["bottom"]}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: i === index ? 24 : 8,
                  backgroundColor:
                    i === index ? BRAND.teal : "rgba(255,255,255,0.35)",
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.row}>
          <Pressable onPress={finish} testID="onboarding-skip-button">
            <Text style={[styles.skip, { color: colors.textMuted }]}>Skip</Text>
          </Pressable>
          <GradientButton
            label={index === slides.length - 1 ? "Get Started" : "Next"}
            onPress={next}
            style={{ minWidth: 160 }}
            testID="onboarding-next-button"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: "100%", height: "100%", position: "absolute" },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 28,
    paddingBottom: 180,
  },
  eyebrow: {
    color: "#0fd1c7",
    fontFamily: fonts.regular,
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: "700",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  title: {
    color: "#fff",
    fontFamily: fonts.heading,
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -0.8,
    marginBottom: 12,
  },
  subtitle: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 320,
  },
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 20,
  },
  dot: { height: 8, borderRadius: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  skip: {
    fontFamily: fonts.regular,
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});
