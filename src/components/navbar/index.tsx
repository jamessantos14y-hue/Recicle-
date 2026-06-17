import { Image, TouchableOpacity, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./styles";
import NotificationBadge from "@/src/components/NotificationBadge";

type NavbarProps = {
  onMenuPress: () => void;
  onNotificationPress?: () => void;
  showLogo?: boolean;
};

export function Navbar({
  onMenuPress,
  onNotificationPress,
  showLogo = true,
}: NavbarProps) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Menu */}
        <TouchableOpacity
          onPress={onMenuPress}
          style={styles.sideButton}
          activeOpacity={0.75}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <Text style={styles.icon}>☰</Text>
        </TouchableOpacity>

        {/* Logo central */}
        {showLogo ? (
          <Image
            source={require("../../assets/images/logo-recicle-plus.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.logoPlaceholder} />
        )}

        {/* Notificação com BADGE */}
        {onNotificationPress ? (
          <TouchableOpacity
            onPress={onNotificationPress}
            style={styles.sideButton}
            activeOpacity={0.75}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <View style={styles.notificationWrapper}>
              <Text style={styles.icon}>🔔</Text>
              <NotificationBadge />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.sideButton} />
        )}
      </View>
    </SafeAreaView>
  );
}