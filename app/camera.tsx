import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { BRAND, fonts } from "@/src/theme";
import { storage } from "@/src/utils/storage";

export default function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [pages, setPages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const beamY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(beamY, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(beamY, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [beamY]);

  const capture = async () => {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    try {
      const [hapticsOn, soundOn] = await Promise.all([
        storage.getItem<boolean>("docvault.hapticsEnabled", true),
        storage.getItem<boolean>("docvault.soundEnabled", true),
      ]);
      if (hapticsOn) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      }
      const shot = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
        shutterSound: !!soundOn,
      });
      if (shot?.uri) {
        setPages((p) => [...p, shot.uri]);
        if (hapticsOn) {
          setTimeout(
            () =>
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              ).catch(() => {}),
            80,
          );
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const done = () => {
    if (pages.length === 0) return;
    router.replace({ pathname: "/preview", params: { uris: pages.join(",") } });
  };

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: "#000" }} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permWrap} edges={["top", "bottom"]}>
        <View style={styles.permBox}>
          <View style={styles.permIcon}>
            <Ionicons name="camera" size={26} color={BRAND.teal} />
          </View>
          <Text style={styles.permTitle}>Camera access needed</Text>
          <Text style={styles.permBody}>
            DocVault uses your camera to scan documents. Nothing is uploaded — everything stays on your device.
          </Text>
          <Pressable
            style={styles.permBtn}
            onPress={requestPermission}
            testID="camera-request-permission"
          >
            <LinearGradient
              colors={BRAND.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.permBtnBg}
            >
              <Text style={styles.permBtnText}>Grant access</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            style={{ marginTop: 16, padding: 8 }}
            onPress={() => router.back()}
          >
            <Text style={{ color: "#8F89B5", fontFamily: fonts.regular, fontWeight: "600" }}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }} testID="camera-screen">
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={flash === "on"}
      />

      {/* Scan overlay */}
      <View pointerEvents="none" style={styles.overlay}>
        <View style={styles.frame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />

          <Animated.View
            style={[
              styles.beam,
              {
                transform: [
                  {
                    translateY: beamY.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 220],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={["transparent", BRAND.teal, "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 3, borderRadius: 3, opacity: 0.9 }}
            />
          </Animated.View>
        </View>
      </View>

      {/* Top bar */}
      <SafeAreaView style={styles.topBar} edges={["top"]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconBtn}
          testID="camera-close"
        >
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>
        <View style={styles.pageChip}>
          <Ionicons name="documents" size={13} color="#fff" />
          <Text style={styles.pageChipText}>
            {pages.length} page{pages.length === 1 ? "" : "s"}
          </Text>
        </View>
        <Pressable
          onPress={() => setFlash((f) => (f === "on" ? "off" : "on"))}
          style={styles.iconBtn}
          testID="camera-flash-toggle"
        >
          <Ionicons
            name={flash === "on" ? "flash" : "flash-off"}
            size={20}
            color="#fff"
          />
        </Pressable>
      </SafeAreaView>

      {/* Bottom bar */}
      <SafeAreaView style={styles.bottomBar} edges={["bottom"]}>
        <View style={styles.bottomRow}>
          <View style={styles.preview}>
            {pages.length > 0 ? (
              <Image
                source={{ uri: pages[pages.length - 1] }}
                style={StyleSheet.absoluteFillObject}
              />
            ) : (
              <Ionicons name="images-outline" size={20} color="#fff" />
            )}
          </View>

          <Pressable
            onPress={capture}
            style={styles.shutter}
            disabled={busy}
            testID="camera-shutter"
          >
            <View style={styles.shutterOuter}>
              <LinearGradient
                colors={BRAND.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.shutterInner}
              />
            </View>
          </Pressable>

          <Pressable
            onPress={done}
            disabled={pages.length === 0}
            style={[
              styles.doneBtn,
              { opacity: pages.length === 0 ? 0.4 : 1 },
            ]}
            testID="camera-done"
          >
            <Ionicons name="checkmark" size={22} color="#0D082A" />
          </Pressable>
        </View>
        <Text style={styles.hint}>
          {pages.length === 0
            ? "Align the document within the frame and tap to capture."
            : `Tap ✓ to review and save (${pages.length} page${pages.length === 1 ? "" : "s"})`}
        </Text>
      </SafeAreaView>
    </View>
  );
}

const FRAME_H = 460;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    width: "82%",
    height: FRAME_H,
    borderColor: "rgba(255,255,255,0.35)",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 26,
    height: 26,
    borderColor: BRAND.teal,
  },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
  beam: { position: "absolute", left: 6, right: 6, top: 20 },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "android" ? 12 : 4,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  pageChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 16,
  },
  pageChipText: {
    color: "#fff",
    fontFamily: fonts.regular,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  preview: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  shutter: { padding: 8 },
  shutterOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  doneBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: BRAND.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    color: "rgba(255,255,255,0.75)",
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: "center",
    marginTop: 14,
  },
  permWrap: {
    flex: 1,
    backgroundColor: "#050314",
    padding: 24,
    justifyContent: "center",
  },
  permBox: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(15,209,199,0.2)",
    backgroundColor: "#120A31",
    alignItems: "center",
  },
  permIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "rgba(15,209,199,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  permTitle: {
    color: "#fff",
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  permBody: {
    color: "#BEBAD6",
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 20,
  },
  permBtn: { width: "100%", borderRadius: 14, overflow: "hidden" },
  permBtnBg: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  permBtnText: {
    color: "#fff",
    fontFamily: fonts.regular,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
});
