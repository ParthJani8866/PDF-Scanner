import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { storage } from "@/src/utils/storage";
import { useTheme } from "@/src/contexts/ThemeContext";

const ONBOARD_KEY = "docvault.onboarded.v1";

export default function Index() {
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    (async () => {
      const done = await storage.getItem<boolean>(ONBOARD_KEY, false);
      if (done) router.replace("/(tabs)/scan");
      else router.replace("/onboarding");
    })();
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator color={colors.textPrimary} />
    </View>
  );
}
