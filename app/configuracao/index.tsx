import { styles } from "@/src/styles/configuracaoStyles";
import { logout as encerrarSessao } from "@/src/services/auth";
import { api } from "@/src/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";

type Tema = "claro" | "escuro";

export default function Configuracao() {
  const [tema, setTema] = useState<Tema>("claro");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  async function carregarConfiguracoes() {
    try {
      const temaSalvo = await AsyncStorage.getItem("@tema");
      if (temaSalvo === "claro" || temaSalvo === "escuro") {
        setTema(temaSalvo);
      }
    } catch {
      Alert.alert("Erro", "Falha ao carregar configurações.");
    }
  }

  async function adicionarAoHistorico(atividade: string, descricao: string) {
    const historicoSalvo = await AsyncStorage.getItem("@historico");
    const historico = historicoSalvo ? JSON.parse(historicoSalvo) : [];

    historico.push({
      data: new Date().toLocaleString(),
      atividade,
      descricao,
    });

    await AsyncStorage.setItem("@historico", JSON.stringify(historico));
  }

  async function alterarSenhaSeNecessario() {
    const informouAlgumaSenha = Boolean(senhaAtual || novaSenha || confirmarSenha);
    if (!informouAlgumaSenha) return false;

    if (!senhaAtual.trim() || !novaSenha.trim() || !confirmarSenha.trim()) {
      Alert.alert("Erro", "Preencha a senha atual, a nova senha e a confirmação.");
      return null;
    }

    if (novaSenha.trim().length < 6) {
      Alert.alert("Erro", "A nova senha deve ter pelo menos 6 caracteres.");
      return null;
    }

    if (novaSenha.trim() !== confirmarSenha.trim()) {
      Alert.alert("Erro", "A confirmação da nova senha não confere.");
      return null;
    }

    const confirmar = await new Promise<boolean>((resolve) => {
      Alert.alert("Confirmação", "Deseja realmente alterar sua senha?", [
        { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
        { text: "Confirmar", onPress: () => resolve(true) },
      ]);
    });

    if (!confirmar) return null;

    await api.patch("/me/senha", {
      senhaAtual: senhaAtual.trim(),
      novaSenha: novaSenha.trim(),
      confirmarSenha: confirmarSenha.trim(),
    });

    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");
    await adicionarAoHistorico("Alteração de Senha", "Senha alterada com sucesso.");
    return true;
  }

  async function salvarConfiguracoes() {
    if (salvando) return;

    try {
      setSalvando(true);
      const temaSalvo = await AsyncStorage.getItem("@tema");
      const senhaAlterada = await alterarSenhaSeNecessario();

      if (senhaAlterada === null) return;

      let temaAlterado = false;
      if (tema !== temaSalvo) {
        await AsyncStorage.setItem("@tema", tema);
        await adicionarAoHistorico("Alteração de Tema", `Tema alterado para ${tema}.`);
        temaAlterado = true;
      }

      if (senhaAlterada || temaAlterado) {
        Alert.alert("Sucesso", "Configurações salvas com sucesso!");
      } else {
        Alert.alert("Tudo certo", "Nenhuma alteração nova para salvar.");
      }
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Não foi possível salvar as configurações."
      );
    } finally {
      setSalvando(false);
    }
  }

  function limparDados() {
    Alert.alert("Confirmação", "Deseja apagar todos os dados do usuário deste aparelho?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Apagar",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.clear();
          await encerrarSessao();
          Alert.alert("Dados apagados com sucesso");
          router.replace("/login");
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView style={[styles.page, tema === "escuro" && styles.pageDark]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, tema === "escuro" && styles.textDark]}>⚙ Configurações</Text>

        <View style={[styles.card, tema === "escuro" && styles.cardDark]}>
          <Text style={[styles.label, tema === "escuro" && styles.textDark]}>🎨 Tema</Text>

          <View style={[styles.pickerWrapper, tema === "escuro" && styles.pickerWrapperDark]}>
            <Picker selectedValue={tema} onValueChange={(value: string) => setTema(value as Tema)}>
              <Picker.Item label="Claro" value="claro" />
              <Picker.Item label="Escuro" value="escuro" />
            </Picker>
          </View>

          <Text style={[styles.label, tema === "escuro" && styles.textDark]}>🔑 Alterar senha</Text>

          <TextInput
            placeholder="Senha atual"
            placeholderTextColor={tema === "escuro" ? "#aaa" : "#666"}
            secureTextEntry
            selectionColor="#111827"
            value={senhaAtual}
            onChangeText={setSenhaAtual}
            style={[styles.input, tema === "escuro" && styles.inputDark]}
          />

          <TextInput
            placeholder="Nova senha"
            placeholderTextColor={tema === "escuro" ? "#aaa" : "#666"}
            secureTextEntry
            selectionColor="#111827"
            value={novaSenha}
            onChangeText={setNovaSenha}
            style={[styles.input, tema === "escuro" && styles.inputDark]}
          />

          <TextInput
            placeholder="Confirmar nova senha"
            placeholderTextColor={tema === "escuro" ? "#aaa" : "#666"}
            secureTextEntry
            selectionColor="#111827"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            style={[styles.input, tema === "escuro" && styles.inputDark]}
          />

          <Pressable style={[styles.button, salvando && { opacity: 0.65 }]} onPress={salvarConfiguracoes} disabled={salvando}>
            <Text style={styles.buttonText}>{salvando ? "Salvando..." : "💾 Salvar Configurações"}</Text>
          </Pressable>

          <Pressable style={[styles.button, styles.danger]} onPress={limparDados} disabled={salvando}>
            <Text style={styles.buttonText}>🗑 Limpar dados do usuário</Text>
          </Pressable>

          <Pressable style={styles.backButton} onPress={() => router.back()} disabled={salvando}>
            <Text style={styles.buttonText}>⬅ Voltar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
