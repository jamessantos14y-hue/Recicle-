import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type TipoQuantidade = "quilo" | "unidade";

export default function DoacaoFixa() {
  const [tipoReciclavel, setTipoReciclavel] = useState<string>("");
  const [tipoQuantidade, setTipoQuantidade] =
    useState<TipoQuantidade>("quilo");
  const [quantidade, setQuantidade] = useState<string>("");
  const [lixeira, setLixeira] = useState<string>("");
  const [qrValido, setQrValido] = useState<boolean>(false);

  const unidadeLabel = useMemo(() => {
    return tipoQuantidade === "quilo" ? "kg" : "unidades";
  }, [tipoQuantidade]);

  function lerQRCode() {
    Alert.alert("QR Code", "QR Code lido com sucesso!");
    setQrValido(true);
  }

  function registrarDoacao() {
    const quantidadeLimpa = quantidade.trim().replace(",", ".");

    if (!tipoReciclavel || !quantidadeLimpa || !lixeira) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }

    if (Number(quantidadeLimpa) <= 0 || Number.isNaN(Number(quantidadeLimpa))) {
      Alert.alert("Erro", "Digite uma quantidade válida.");
      return;
    }

    if (!qrValido) {
      Alert.alert("Atenção", "Você precisa ler o QR Code da lixeira.");
      return;
    }

    Alert.alert(
      "Sucesso",
      `Doação registrada com sucesso!\n\nMaterial: ${tipoReciclavel}\nQuantidade: ${quantidadeLimpa} ${unidadeLabel}`
    );

    setQrValido(false);
    setTipoReciclavel("");
    setTipoQuantidade("quilo");
    setQuantidade("");
    setLixeira("");
  }

  const formularioValido =
    !!tipoReciclavel &&
    !!quantidade.trim() &&
    !!lixeira &&
    qrValido &&
    !Number.isNaN(Number(quantidade.trim().replace(",", "."))) &&
    Number(quantidade.trim().replace(",", ".")) > 0;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.label}>Tipo de reciclável</Text>
          <Picker
            selectedValue={tipoReciclavel}
            onValueChange={(value: string) => setTipoReciclavel(value)}
          >
            <Picker.Item label="Selecione" value="" />
            <Picker.Item label="Plástico" value="PLASTICO" />
            <Picker.Item label="Vidro" value="VIDRO" />
          </Picker>

          <Text style={styles.label}>Forma</Text>
          <Picker
            selectedValue={tipoQuantidade}
            onValueChange={(value: string) =>
              setTipoQuantidade(value as TipoQuantidade)
            }
          >
            <Picker.Item label="Quilo" value="quilo" />
            <Picker.Item label="Unidade" value="unidade" />
          </Picker>

          <TextInput
            placeholder="Quantidade"
            value={quantidade}
            onChangeText={(text: string) => setQuantidade(text)}
          />

          <Picker
            selectedValue={lixeira}
            onValueChange={(value: string) => setLixeira(value)}
          >
            <Picker.Item label="Selecione lixeira" value="" />
            <Picker.Item label="Escola" value="escola" />
          </Picker>

          <Pressable onPress={lerQRCode}>
            <Text>Ler QR</Text>
          </Pressable>

          <Pressable onPress={registrarDoacao} disabled={!formularioValido}>
            <Text>Registrar</Text>
          </Pressable>

          <Pressable onPress={() => router.back()}>
            <Text>Voltar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: 20 },
  card: { backgroundColor: "#fff", padding: 20 },
  label: { fontWeight: "bold" },
});