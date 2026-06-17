import { Platform, StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    ...(Platform.OS !== "web" && {
      paddingTop: 16,
    }),
  },

  header: {
    backgroundColor: "#2e7d32",
    paddingTop: 14,
    paddingBottom: 18,
    paddingHorizontal: 16,
    alignItems: "center",
  },

  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 8,
  },

  backButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },

  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  headerSubtitle: {
    color: "#eaffea",
    marginTop: 6,
    fontWeight: "700",
    textAlign: "center",
  },

  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 14,
  },

  filterButton: {
    flex: 1,
    backgroundColor: "#e5e7eb",
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },

  filterButtonActive: {
    backgroundColor: "#16a34a",
  },

  filterText: {
    color: "#374151",
    fontWeight: "900",
  },

  filterTextActive: {
    color: "#fff",
  },

  myCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    elevation: 2,
  },

  myTitle: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  myValue: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 3,
  },

  myDetails: {
    color: "#64748b",
    fontWeight: "700",
    marginTop: 4,
  },

  errorText: {
    color: "#dc2626",
    textAlign: "center",
    marginTop: 12,
    fontWeight: "700",
    paddingHorizontal: 16,
  },

  top3: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    backgroundColor: "#e8f5e9",
    marginTop: 12,
  },

  topItem: {
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    width: 100,
    minHeight: 112,
    elevation: 3,
  },

  top1: {
    marginTop: -15,
    borderWidth: 2,
    borderColor: "#fbc02d",
  },

  medalha: {
    fontSize: 28,
  },

  nome: {
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
    marginTop: 5,
  },

  pontos: {
    color: "#2e7d32",
    fontWeight: "bold",
    marginTop: 4,
  },

  listaTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
  },

  lista: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },

  posicao: {
    fontWeight: "bold",
    fontSize: 16,
    width: 40,
  },

  cardNome: {
    flex: 1,
    fontSize: 15,
  },

  cardPontos: {
    fontWeight: "bold",
    color: "#2e7d32",
  },

  emptyText: {
    textAlign: "center",
    color: "#64748b",
    marginTop: 30,
    fontWeight: "700",
  },
});
