import { View, Text, Image, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { styles } from "@/src/styles/perfilStyles";
import { api } from "@/src/services/api";
import { salvarUsuario } from "@/src/services/auth";

export default function Perfil() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [tipo, setTipo] = useState("DOADOR");
  const [foto, setFoto] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarPerfil();
  }, []);

  async function carregarPerfil() {
    try {
      const local = await AsyncStorage.getItem("@usuario");
      if (local) {
        const user = JSON.parse(local);
        setNome(user.nome || "");
        setEmail(user.email || "");
        setTipo(user.tipo || "DOADOR");
        setFoto(user.fotoPerfil || user.foto || null);
      }

      const response = await api.get("/me");
      const user = response.data?.data || response.data;
      if (user) {
        setNome(user.nome || "");
        setEmail(user.email || "");
        setTipo(user.tipo || "DOADOR");
        setFoto(user.fotoPerfil || user.foto || null);
        await salvarUsuario({
          id: user.id,
          nome: user.nome || "",
          email: user.email || "",
          tipo: user.tipo || "DOADOR",
          fotoPerfil: user.fotoPerfil || null,
          foto: user.fotoPerfil || null,
          pontos: user.pontos,
        });
      }
    } catch (e) {
      // Mantém dados locais se estiver offline.
    } finally {
      setCarregando(false);
    }
  }

  async function escolherFoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permissão necessária", "Permita acesso à galeria.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.55,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset.base64) {
        const mime = asset.mimeType || "image/jpeg";
        setFoto(`data:${mime};base64,${asset.base64}`);
      } else if (asset.uri) {
        setFoto(asset.uri);
      }
    }
  }

  async function salvarPerfil() {
    if (!nome.trim()) {
      Alert.alert("Atenção", "Digite seu nome.");
      return;
    }

    try {
      setSalvando(true);
      const response = await api.patch("/me", {
        nome: nome.trim(),
        fotoPerfil: foto,
      });

      const user = response.data?.data || response.data;
      const usuarioAtualizado = {
        id: user?.id,
        nome: user?.nome || nome.trim(),
        email: user?.email || email,
        tipo: user?.tipo || tipo,
        fotoPerfil: user?.fotoPerfil || foto,
        foto: user?.fotoPerfil || foto,
        pontos: user?.pontos,
      };

      await salvarUsuario(usuarioAtualizado);
      Alert.alert("Sucesso", "Perfil salvo com sucesso!");
      router.back();
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.response?.data?.message || "Não foi possível salvar seu perfil."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Editar Perfil</Text>

          <Image
            source={foto ? { uri: foto } : { uri: "https://via.placeholder.com/140" }}
            style={styles.avatar}
          />

          <Pressable style={styles.photoButton} onPress={escolherFoto} disabled={salvando}>
            <Text style={styles.photoButtonText}>Escolher Foto</Text>
          </Pressable>

          <TextInput
            placeholder="Digite seu nome"
            placeholderTextColor="#667085"
            selectionColor="#111827"
            value={nome}
            onChangeText={setNome}
            style={styles.input}
          />

          <Pressable style={styles.saveButton} onPress={salvarPerfil} disabled={salvando}>
            <Text style={styles.saveButtonText}>{salvando ? "Salvando..." : "Salvar"}</Text>
          </Pressable>

          <Pressable style={styles.backButton} onPress={() => router.back()} disabled={salvando}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
