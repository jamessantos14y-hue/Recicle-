import { Platform, StatusBar, StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#2e7d32",
  },

  container: {
    width: "100%",
    minHeight: 76,
    backgroundColor: "#2e7d32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 8 : 4,
    paddingBottom: 12,
    paddingHorizontal: 18,
  },

  sideButton: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
  },

  icon: {
    fontSize: 34,
    lineHeight: 40,
    color: "#fff",
    fontWeight: "800",
  },

  logo: {
    flex: 1,
    height: 58,
    maxWidth: 215,
    marginHorizontal: 10,
  },

  logoPlaceholder: {
    flex: 1,
    height: 58,
    maxWidth: 215,
    marginHorizontal: 10,
  },

  notificationWrapper: {
    position: "relative",
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
});