import { api } from "@/src/services/api";
import { emitirAtualizacaoGlobal } from "@/src/utils/appEvents";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Doacao = {
  id: number;
  materiais?: string[] | string | null;
  quantidadeKg?: number | null;
  quantidadeUnidades?: number | null;
  quantidadeDescricao?: string | null;
  tipoQuantidade?: string | null;
};

type TipoQuantidade = "KG" | "UNIDADE";

function materiaisTexto(materiais?: string[] | string | null) {
  if (!materiais) return "";
  if (Array.isArray(materiais)) return materiais.join(", ");
  return String(materiais).split(",").map((m) => m.trim()).filter(Boolean).join(", ");
}

function normalizarTipoQuantidade(valor?: string | null): TipoQuantidade {
  const texto = String(valor || "").trim().toUpperCase();
  return texto === "UNIDADE" || texto === "UNIDADES" ? "UNIDADE" : "KG";
}

export default function ConfirmarColetaColetorScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Number(params.id);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [doacao, setDoacao] = useState<Doacao | null>(null);
  const [materiais, setMateriais] = useState("");
  const [tipoQuantidade, setTipoQuantidade] = useState<TipoQuantidade>("KG");
  const [quantidadeKg, setQuantidadeKg] = useState("");
  const [quantidadeUnidades, setQuantidadeUnidades] = useState("");
  const [quantidadeDescricao, setQuantidadeDescricao] = useState("");

  useEffect(() => {
    carregar();
  }, [id]);

  async function carregar() {
    if (!Number.isFinite(id) || id <= 0) {
      Alert.alert("Erro", "Doação inválida.");
      router.back();
      return;
    }

    try {
      setLoading(true);
      const response = await api.get("/doacoes");
      const lista = Array.isArray(response.data?.data) ? response.data.data : [];
      const encontrada = lista.find((item: Doacao) => Number(item.id) === id);
      if (!encontrada) throw new Error("Doação não encontrada.");

      setDoacao(encontrada);
      setMateriais(materiaisTexto(encontrada.materiais));
      setTipoQuantidade(
        normalizarTipoQuantidade(
          encontrada.tipoQuantidade || (encontrada.quantidadeUnidades ? "UNIDADE" : "KG")
        )
      );
      setQuantidadeKg(encontrada.quantidadeKg ? String(encontrada.quantidadeKg) : "");
      setQuantidadeUnidades(encontrada.quantidadeUnidades ? String(encontrada.quantidadeUnidades) : "");
      setQuantidadeDescricao(encontrada.quantidadeDescricao || "");
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.message || error?.message || "Não foi possível carregar a doação.");
      router.back();
    } finally {
      setLoading(false);
    }
  }

  async function enviar(conforme: boolean) {
    try {
      setSalvando(true);

      const kgTratado = Number(quantidadeKg.replace(",", "."));
      const unidadesTratadas = Number(quantidadeUnidades.replace(/\D/g, ""));

      if (!conforme && !materiais.trim()) {
        Alert.alert("Atenção", "Informe os materiais reais da coleta.");
        return;
      }

      if (!conforme && tipoQuantidade === "KG" && (!Number.isFinite(kgTratado) || kgTratado <= 0)) {
        Alert.alert("Atenção", "Informe uma quantidade em kg válida.");
        return;
      }

      if (!conforme && tipoQuantidade === "UNIDADE" && (!Number.isFinite(unidadesTratadas) || unidadesTratadas <= 0)) {
        Alert.alert("Atenção", "Informe uma quantidade em unidades válida.");
        return;
      }

      const payload = conforme
        ? { conforme: true }
        : {
            conforme: false,
            materiais: materiais.trim(),
            tipoQuantidade,
            quantidadeKg: tipoQuantidade === "KG" ? kgTratado : null,
            quantidadeUnidades: tipoQuantidade === "UNIDADE" ? Math.round(unidadesTratadas) : null,
            quantidadeDescricao: quantidadeDescricao.trim() || null,
          };

      const response = await api.patch(`/doacoes/${id}/coleta-realizada`, payload);
      if (response.data?.success === false) {
        throw new Error(response.data?.message || "Não foi possível confirmar a coleta.");
      }

      emitirAtualizacaoGlobal();
      Alert.alert("Sucesso", "Coleta registrada. Agora aguarda a confirmação do doador.");
      router.replace("/coletas");
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.message || error?.message || "Não foi possível confirmar a coleta.");
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Carregando doação...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Conferir coleta</Text>
        <Text style={styles.subtitle}>
          Antes de finalizar, confirme se o material recebido bate com o que o doador informou.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Materiais informados</Text>
          <Text style={styles.value}>{materiaisTexto(doacao?.materiais) || "Não informado"}</Text>

          <Text style={styles.label}>Quantidade informada</Text>
          <Text style={styles.value}>
            {doacao?.quantidadeDescricao ||
              (doacao?.quantidadeKg ? `${doacao.quantidadeKg} kg` : "") ||
              (doacao?.quantidadeUnidades ? `${doacao.quantidadeUnidades} unidade(s)` : "") ||
              "Não informada"}
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => enviar(true)} disabled={salvando}>
          <Text style={styles.primaryButtonText}>{salvando ? "Salvando..." : "Sim, está correto"}</Text>
        </TouchableOpacity>

        <View style={styles.editCard}>
          <Text style={styles.editTitle}>Se não estiver correto, ajuste abaixo</Text>

          <Text style={styles.inputLabel}>Materiais reais</Text>
          <TextInput style={styles.input} value={materiais} onChangeText={setMateriais} placeholder="Ex: plástico, alumínio" />

          <Text style={styles.inputLabel}>Tipo de quantidade real</Text>
          <View style={styles.quantityTypeRow}>
            <TouchableOpacity
              style={[styles.quantityTypeButton, tipoQuantidade === "KG" && styles.quantityTypeButtonActive]}
              onPress={() => {
                setTipoQuantidade("KG");
                setQuantidadeUnidades("");
              }}
              disabled={salvando}
            >
              <Text style={[styles.quantityTypeText, tipoQuantidade === "KG" && styles.quantityTypeTextActive]}>Kg</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quantityTypeButton, tipoQuantidade === "UNIDADE" && styles.quantityTypeButtonActive]}
              onPress={() => {
                setTipoQuantidade("UNIDADE");
                setQuantidadeKg("");
              }}
              disabled={salvando}
            >
              <Text style={[styles.quantityTypeText, tipoQuantidade === "UNIDADE" && styles.quantityTypeTextActive]}>Unidades</Text>
            </TouchableOpacity>
          </View>

          {tipoQuantidade === "KG" ? (
            <>
              <Text style={styles.inputLabel}>Quantidade em kg</Text>
              <TextInput style={styles.input} value={quantidadeKg} onChangeText={setQuantidadeKg} placeholder="Ex: 2.5" keyboardType="decimal-pad" />
            </>
          ) : (
            <>
              <Text style={styles.inputLabel}>Quantidade em unidades</Text>
              <TextInput style={styles.input} value={quantidadeUnidades} onChangeText={setQuantidadeUnidades} placeholder="Ex: 30" keyboardType="number-pad" />
            </>
          )}

          <Text style={styles.inputLabel}>Descrição</Text>
          <TextInput style={styles.input} value={quantidadeDescricao} onChangeText={setQuantidadeDescricao} placeholder="Ex: 2 sacolas médias" />

          <TouchableOpacity style={styles.secondaryButton} onPress={() => enviar(false)} disabled={salvando}>
            <Text style={styles.secondaryButtonText}>Não, salvar com esses valores</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={salvando}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8fa" },
  content: { padding: 18, paddingBottom: 34 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f7f8fa" },
  loadingText: { marginTop: 10, color: "#475569", fontWeight: "700" },
  title: { fontSize: 26, fontWeight: "900", color: "#111827" },
  subtitle: { marginTop: 8, fontSize: 15, color: "#64748b", lineHeight: 22 },
  card: { marginTop: 18, backgroundColor: "#fff", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  label: { fontSize: 13, fontWeight: "800", color: "#166534", marginTop: 8 },
  value: { fontSize: 16, fontWeight: "700", color: "#111827", marginTop: 3 },
  primaryButton: { marginTop: 16, backgroundColor: "#16a34a", borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "900" },
  editCard: { marginTop: 18, backgroundColor: "#fff", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  editTitle: { fontSize: 17, fontWeight: "900", color: "#111827", marginBottom: 10 },
  inputLabel: { fontSize: 13, fontWeight: "800", color: "#374151", marginTop: 10, marginBottom: 5 },
  input: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#d1d5db", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: "#111827" },
  quantityTypeRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  quantityTypeButton: { flex: 1, backgroundColor: "#e5e7eb", borderRadius: 999, paddingVertical: 10, alignItems: "center" },
  quantityTypeButtonActive: { backgroundColor: "#16a34a" },
  quantityTypeText: { color: "#374151", fontWeight: "900" },
  quantityTypeTextActive: { color: "#fff" },
  secondaryButton: { marginTop: 16, backgroundColor: "#f97316", borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  secondaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  backButton: { marginTop: 14, alignItems: "center", padding: 12 },
  backButtonText: { color: "#15803d", fontWeight: "900" },
});
