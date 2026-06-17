import { StyleSheet } from "react-native";
import { Platform } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    ...(Platform.OS !== "web" && {
      padding: 16,
    }),
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 54 : 24,
    paddingBottom: 10,
    backgroundColor: "#f5f5f5",
  },

  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#e9eef3",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
  },

  backButtonText: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "bold",
  },

  headerTitle: {
    color: "#1f2937",
    fontSize: 24,
    fontWeight: "bold",
  },

  list: {
    padding: 16,
    paddingBottom: 80,
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },

  text: {
    fontSize: 16,
    marginBottom: 12,
    color: "#333",
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },

  viewBtn: {
    backgroundColor: "#2e7d32",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    flexGrow: 1,
  },

  deleteBtn: {
    backgroundColor: "#c62828",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    flexGrow: 1,
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#666",
  },

  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#2e7d32",
    padding: 16,
    alignItems: "center",
    ...(Platform.OS !== "web" && {
      marginBottom: 16,
    }),
  },

  footerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});