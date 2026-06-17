import { fazerCadastro, fazerLogin } from "@/src/services/auth";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const tipo = "DOADOR";

  async function handleCadastro() {
    if (loading) return;

    setError("");

    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();
    const senhaLimpa = senha.trim();


    if (!nomeLimpo || !emailLimpo || !senhaLimpa) {
      setError("Preencha todos os campos.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(emailLimpo)) {
      setError("Digite um e-mail válido.");
      return;
    }


    if (senhaLimpa.length < 6) {
      setError("Senha mínima de 6 caracteres.");
      return;
    }

    try {
      setLoading(true);

      const respostaCadastro = await fazerCadastro(
        nomeLimpo,
        emailLimpo,
        senhaLimpa,
        tipo
      );


      const respostaLogin = await fazerLogin(emailLimpo, senhaLimpa);


      router.replace("/home");
      
    } catch (err: any) {

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Erro ao fazer cadastro."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
        flex: 1,
        backgroundColor: "#12A67E",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 24,
        minHeight: "100%",
      }}
      >
      <View
        style={{
          width: "100%",
          maxWidth: 500,
          backgroundColor: "#F2F2F2",
          borderRadius: 20,
          paddingHorizontal: 28,
          paddingVertical: 30,
          elevation: 8,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            textAlign: "center",
            color: "#0C6B5A",
            marginBottom: 30,
          }}
        >
          Cadastro
        </Text>

        <Text
          style={{
            color: "#7A7A7A",
            fontSize: 14,
            marginBottom: 6,
          }}
        >
          Nome completo
        </Text>
        <TextInput
          value={nome}
          onChangeText={setNome}
          placeholder=""
          style={{
            borderBottomWidth: 1,
            borderBottomColor: "#B8C9C4",
            marginBottom: 24,
            paddingVertical: 8,
            fontSize: 16,
            color: "#111827",
          }}
        />

        <Text
          style={{
            color: "#7A7A7A",
            fontSize: 14,
            marginBottom: 6,
          }}
        >
          E-mail
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder=""
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            borderBottomWidth: 1,
            borderBottomColor: "#B8C9C4",
            marginBottom: 24,
            paddingVertical: 8,
            fontSize: 16,
            color: "#111827",
          }}
        />


        <Text
          style={{
            color: "#7A7A7A",
            fontSize: 14,
            marginBottom: 6,
          }}
        >
          Senha
        </Text>
        <TextInput
          value={senha}
          onChangeText={setSenha}
          placeholder=""
          secureTextEntry
          placeholderTextColor="#667085"
          selectionColor="#111827"
          style={{
            borderBottomWidth: 1,
            borderBottomColor: "#B8C9C4",
            marginBottom: 24,
            paddingVertical: 8,
            fontSize: 16,
            color: "#111827",
          }}
        />

        {error ? (
          <Text
            style={{
              color: "red",
              marginBottom: 14,
              fontSize: 14,
            }}
          >
            {error}
          </Text>
        ) : null}

        <TouchableOpacity
          onPress={handleCadastro}
          disabled={loading}
          style={{
            backgroundColor: "#0C6B5A",
            paddingVertical: 15,
            borderRadius: 8,
            alignItems: "center",
            marginTop: 8,
            marginBottom: 18,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text
              style={{
                color: "#FFF",
                fontWeight: "700",
                fontSize: 16,
              }}
            >
              Cadastrar
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/login")}>
          <Text
            style={{
              textAlign: "center",
              color: "#22A884",
              fontSize: 15,
            }}
          >
            Já tem conta? Faça login
          </Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}