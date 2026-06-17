// @ts-ignore
import { Picker } from "@react-native-picker/picker";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import { api } from "@/src/services/api";
import { getToken } from "@/src/services/token";
import { emitirAtualizacaoGlobal } from "@/src/utils/appEvents";

function normalizarUF(valor?: string | null) {
  if (!valor) return "CE";
  const v = valor.trim().toUpperCase();
  if (v === "CEARÁ" || v === "CEARA") return "CE";
  return v.length > 2 ? "CE" : v;
}

type TipoQuantidade = "quilo" | "unidade";
type MaterialReciclavel = "PLASTICO" | "VIDRO" | "PAPEL" | "METAL" | "ELETRONICO";
type TipoReciclavel = MaterialReciclavel | "MISTURADO" | "";

const MATERIAIS_OPCOES: { label: string; value: MaterialReciclavel }[] = [
  { label: "Plástico", value: "PLASTICO" },
  { label: "Vidro", value: "VIDRO" },
  { label: "Papel", value: "PAPEL" },
  { label: "Metal", value: "METAL" },
  { label: "Eletrônico", value: "ELETRONICO" },
];

function parametroParaTexto(valor: string | string[] | undefined) {
  if (Array.isArray(valor)) return valor[0] || "";
  return valor || "";
}

function parametroParaNumero(valor: string | string[] | undefined) {
  const numero = Number(parametroParaTexto(valor).replace(",", "."));
  return Number.isFinite(numero) ? numero : null;
}

export default function DoacaoCasa() {
  const { width } = useWindowDimensions();
  const isSmall = width < 360;
  const params = useLocalSearchParams<{
    origemMapa?: string;
    latitude?: string;
    longitude?: string;
  }>();
  const [tipoReciclavel, setTipoReciclavel] = useState<TipoReciclavel>("");
  const [materiaisMisturados, setMateriaisMisturados] = useState<MaterialReciclavel[]>([]);
  const [tipoQuantidade, setTipoQuantidade] = useState<TipoQuantidade>("quilo");
  const [quantidade, setQuantidade] = useState("");
  const [numero, setNumero] = useState("");
  const [referencia, setReferencia] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [rua, setRua] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("Itarema");
  const [uf, setUf] = useState("CE");

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [carregandoLocalizacao, setCarregandoLocalizacao] = useState(false);
  const [buscandoEndereco, setBuscandoEndereco] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const latitudeMapa = parametroParaNumero(params.latitude);
  const longitudeMapa = parametroParaNumero(params.longitude);
  const localizacaoSelecionadaNoMapa =
    parametroParaTexto(params.origemMapa) === "1" && latitudeMapa !== null && longitudeMapa !== null;

  const quantidadeNumerica = useMemo(() => {
    const valorTratado = quantidade.replace(",", ".");
    return Number(valorTratado);
  }, [quantidade]);

  const materiaisSelecionados = useMemo(() => {
    if (tipoReciclavel === "MISTURADO") return materiaisMisturados;
    return tipoReciclavel ? [tipoReciclavel] : [];
  }, [materiaisMisturados, tipoReciclavel]);

  function selecionarTipoReciclavel(valor: TipoReciclavel) {
    setTipoReciclavel(valor);
    if (valor !== "MISTURADO") {
      setMateriaisMisturados([]);
    }
  }

  function alternarMaterialMisturado(material: MaterialReciclavel) {
    setMateriaisMisturados((listaAtual) =>
      listaAtual.includes(material)
        ? listaAtual.filter((item) => item !== material)
        : [...listaAtual, material]
    );
  }

  function limparCoordenadasAoEditarEndereco() {
    if (localizacaoSelecionadaNoMapa) return;

    if (latitude !== null || longitude !== null) {
      setLatitude(null);
      setLongitude(null);
    }
  }

  async function preencherEnderecoPorCoordenadas(lat: number, lng: number) {
    try {
      const enderecos = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const endereco = enderecos?.[0];

      if (endereco) {
        setRua(endereco.street || endereco.name || "");
        setBairro(endereco.district || endereco.subregion || "");
        setCidade(endereco.city || endereco.subregion || "Itarema");
        setUf(normalizarUF(endereco.region || "CE"));

        if (!referencia.trim()) {
          setReferencia(
            [endereco.street, endereco.streetNumber, endereco.district].filter(Boolean).join(", ")
          );
        }

        if (!numero.trim() && endereco.streetNumber) {
          setNumero(String(endereco.streetNumber));
        }
      }
    } catch {}
  }

  useEffect(() => {
    if (!localizacaoSelecionadaNoMapa || latitudeMapa === null || longitudeMapa === null) return;

    setLatitude(latitudeMapa);
    setLongitude(longitudeMapa);
    preencherEnderecoPorCoordenadas(latitudeMapa, longitudeMapa);
  }, [localizacaoSelecionadaNoMapa, latitudeMapa, longitudeMapa]);

  async function usarMinhaLocalizacao() {
    try {
      setCarregandoLocalizacao(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permissão negada", "Autorize a localização ou digite o endereço manualmente.");
        return;
      }

      const posicao = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const lat = posicao.coords.latitude;
      const lng = posicao.coords.longitude;

      setLatitude(lat);
      setLongitude(lng);
      await preencherEnderecoPorCoordenadas(lat, lng);

      Alert.alert("Sucesso", "Sua localização foi capturada.");
    } catch {
      Alert.alert("Erro", "Não foi possível obter sua localização. Você pode digitar o endereço manualmente.");
    } finally {
      setCarregandoLocalizacao(false);
    }
  }

  async function geocodificarEnderecoDigitado() {
    const enderecoTexto = [rua.trim(), numero.trim(), bairro.trim(), cidade.trim() || "Itarema", normalizarUF(uf), "Brasil"]
      .filter(Boolean)
      .join(", ");

    if (!rua.trim() || !bairro.trim() || !cidade.trim()) {
      Alert.alert("Endereço incompleto", "Preencha rua, bairro e cidade para buscar no mapa.");
      return null;
    }

    try {
      setBuscandoEndereco(true);
      const resultados = await Location.geocodeAsync(enderecoTexto);
      const primeiro = resultados?.[0];

      if (!primeiro) {
        Alert.alert("Endereço não encontrado", "Confira o endereço digitado ou use sua localização atual.");
        return null;
      }

      const coords = { latitude: primeiro.latitude, longitude: primeiro.longitude };
      setLatitude(coords.latitude);
      setLongitude(coords.longitude);
      Alert.alert("Endereço localizado", "A localização da casa foi encontrada pelo endereço digitado.");
      return coords;
    } catch {
      Alert.alert("Erro", "Não foi possível localizar esse endereço agora.");
      return null;
    } finally {
      setBuscandoEndereco(false);
    }
  }

  async function registrarDoacao() {
    try {
      const token = await getToken();

      if (!token) {
        Alert.alert("Erro", "Sua sessão expirou. Faça login novamente.");
        return;
      }

      if (!tipoReciclavel) {
        Alert.alert("Erro", "Selecione o tipo de reciclável.");
        return;
      }

      if (tipoReciclavel === "MISTURADO" && materiaisSelecionados.length < 2) {
        Alert.alert("Erro", "No modo misturado, selecione pelo menos dois tipos de material.");
        return;
      }

      if (!quantidade.trim()) {
        Alert.alert("Erro", "Preencha a quantidade.");
        return;
      }

      if (Number.isNaN(quantidadeNumerica) || quantidadeNumerica <= 0) {
        Alert.alert("Erro", "Digite uma quantidade válida.");
        return;
      }

      if (!localizacaoSelecionadaNoMapa && (!rua.trim() || !bairro.trim() || !cidade.trim())) {
        Alert.alert("Erro", "Preencha rua, bairro e cidade da casa onde o coletor deve ir.");
        return;
      }

      let latFinal = latitude;
      let lngFinal = longitude;

      if (latFinal === null || lngFinal === null) {
        const coords = await geocodificarEnderecoDigitado();
        if (!coords) return;
        latFinal = coords.latitude;
        lngFinal = coords.longitude;
      }

      const payload = {
        materiais: materiaisSelecionados,
        tipoQuantidade: tipoQuantidade === "quilo" ? "KG" : "UNIDADE",
        quantidadeDescricao:
          tipoQuantidade === "quilo"
            ? `${quantidadeNumerica} kg`
            : `${Math.round(quantidadeNumerica)} unidades`,
        quantidadeKg: tipoQuantidade === "quilo" ? quantidadeNumerica : null,
        quantidadeUnidades: tipoQuantidade === "unidade" ? Math.round(quantidadeNumerica) : null,
        rua: rua.trim() || "Local marcado no mapa",
        numero: numero.trim() || "S/N",
        bairro: bairro.trim() || "Não informado",
        cidade: cidade.trim() || "Itarema",
        uf: normalizarUF(uf),
        referencia: referencia.trim() || null,
        observacoes: observacoes.trim() || null,
        latitude: latFinal,
        longitude: lngFinal,
      };

      setSalvando(true);
      await api.post("/doacoes/casa", payload);

      Alert.alert("Doação registrada", "Aguarde a confirmação do coletor.");

      setTipoReciclavel("");
      setMateriaisMisturados([]);
      setTipoQuantidade("quilo");
      setQuantidade("");
      setNumero("");
      setReferencia("");
      setObservacoes("");
      setRua("");
      setBairro("");
      setCidade("Itarema");
      setUf("CE");
      setLatitude(null);
      setLongitude(null);

      emitirAtualizacaoGlobal();
      router.back();
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.response?.data?.message || error?.response?.data?.error || "Não foi possível registrar a doação."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.container, isSmall && styles.containerSmall]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.headerCard, isSmall && styles.headerCardSmall]}>
          <Text style={[styles.title, isSmall && styles.titleSmall]}>Faça sua doação</Text>
          <Text style={styles.subtitle}>
            {localizacaoSelecionadaNoMapa
              ? "A localização marcada no mapa já foi aplicada. Complete os dados da doação e confirme."
              : "Digite o endereço da sua casa ou use sua localização atual. O coletor irá até o local informado."}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Tipo de reciclável</Text>
          <Text style={styles.helpText}>Escolha uma opção. Use “Misturado” quando a doação tiver mais de um material.</Text>
          <View style={styles.optionGrid}>
            {MATERIAIS_OPCOES.map((opcao) => (
              <Pressable
                key={opcao.value}
                style={[
                  styles.optionChip,
                  tipoReciclavel === opcao.value && styles.optionChipSelected,
                ]}
                onPress={() => selecionarTipoReciclavel(opcao.value)}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    tipoReciclavel === opcao.value && styles.optionChipTextSelected,
                  ]}
                >
                  {opcao.label}
                </Text>
              </Pressable>
            ))}

            <Pressable
              style={[
                styles.optionChip,
                styles.mixedChip,
                tipoReciclavel === "MISTURADO" && styles.optionChipSelected,
              ]}
              onPress={() => selecionarTipoReciclavel("MISTURADO")}
            >
              <Text
                style={[
                  styles.optionChipText,
                  tipoReciclavel === "MISTURADO" && styles.optionChipTextSelected,
                ]}
              >
                Misturado
              </Text>
            </Pressable>
          </View>

          {tipoReciclavel === "MISTURADO" && (
            <View style={styles.mixedBox}>
              <Text style={styles.mixedTitle}>Quais materiais estão misturados?</Text>
              <View style={styles.optionGrid}>
                {MATERIAIS_OPCOES.map((opcao) => {
                  const selecionado = materiaisMisturados.includes(opcao.value);
                  return (
                    <Pressable
                      key={opcao.value}
                      style={[
                        styles.optionChip,
                        styles.smallChip,
                        selecionado && styles.optionChipSelected,
                      ]}
                      onPress={() => alternarMaterialMisturado(opcao.value)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          selecionado && styles.optionChipTextSelected,
                        ]}
                      >
                        {selecionado ? "✓ " : ""}{opcao.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <Text style={styles.label}>Doar por</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={tipoQuantidade}
              onValueChange={(value: string) => setTipoQuantidade(value as TipoQuantidade)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
              dropdownIconColor="#111827"
            >
              <Picker.Item label="Quilo (kg)" value="quilo" color="#111827" />
              <Picker.Item label="Unidade" value="unidade" color="#111827" />
            </Picker>
          </View>

          <Text style={styles.label}>Quantidade</Text>
          <TextInput
            style={styles.textInput}
            keyboardType="numeric"
            placeholder={tipoQuantidade === "quilo" ? "Digite a quantidade em kg" : "Digite a quantidade em unidades"}
            placeholderTextColor="#667085"
            value={quantidade}
            onChangeText={setQuantidade}
            returnKeyType="next"
          />

          <Text style={styles.sectionTitle}>Endereço da coleta</Text>

          {localizacaoSelecionadaNoMapa && (
            <View style={styles.mapLockedBox}>
              <Text style={styles.mapLockedTitle}>📍 Local escolhido no mapa</Text>
              <Text style={styles.mapLockedText}>
                Latitude e longitude já estão preenchidas. Os botões de buscar endereço e localização atual ficam bloqueados para não trocar o ponto escolhido.
              </Text>
            </View>
          )}

          <Text style={styles.label}>Rua</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ex.: Rua José Maria"
            placeholderTextColor="#667085"
            value={rua}
            onChangeText={(text) => { limparCoordenadasAoEditarEndereco(); setRua(text); }}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Número</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ex.: 123 ou S/N"
            placeholderTextColor="#667085"
            value={numero}
            onChangeText={(text) => { limparCoordenadasAoEditarEndereco(); setNumero(text); }}
          />

          <Text style={styles.label}>Bairro</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ex.: Centro"
            placeholderTextColor="#667085"
            value={bairro}
            onChangeText={(text) => { limparCoordenadasAoEditarEndereco(); setBairro(text); }}
            autoCapitalize="words"
          />

          <View style={styles.rowInputs}>
            <View style={styles.cityInput}>
              <Text style={styles.label}>Cidade</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Itarema"
                placeholderTextColor="#667085"
                value={cidade}
                onChangeText={(text) => { limparCoordenadasAoEditarEndereco(); setCidade(text); }}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.ufInput}>
              <Text style={styles.label}>UF</Text>
              <TextInput
                style={styles.textInput}
                placeholder="CE"
                placeholderTextColor="#667085"
                value={uf}
                onChangeText={(text) => { limparCoordenadasAoEditarEndereco(); setUf(text.toUpperCase().slice(0, 2)); }}
                autoCapitalize="characters"
                maxLength={2}
              />
            </View>
          </View>

          <Text style={styles.label}>Referência do endereço</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ex.: portão azul, perto da praça"
            placeholderTextColor="#667085"
            value={referencia}
            onChangeText={setReferencia}
          />

          <Text style={styles.label}>Observações</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Ex.: material separado em sacos"
            placeholderTextColor="#667085"
            value={observacoes}
            onChangeText={setObservacoes}
            multiline
          />

          <Pressable
            style={[
              styles.button,
              styles.addressButton,
              localizacaoSelecionadaNoMapa && styles.lockedLocationButton,
            ]}
            onPress={geocodificarEnderecoDigitado}
            disabled={buscandoEndereco || localizacaoSelecionadaNoMapa}
          >
            {buscandoEndereco ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Buscar endereço digitado no mapa</Text>}
          </Pressable>

          <Pressable
            style={[
              styles.button,
              styles.locationButton,
              localizacaoSelecionadaNoMapa && styles.lockedLocationButton,
            ]}
            onPress={usarMinhaLocalizacao}
            disabled={carregandoLocalizacao || localizacaoSelecionadaNoMapa}
          >
            {carregandoLocalizacao ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Usar minha localização atual</Text>}
          </Pressable>

          {latitude !== null && longitude !== null ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>✅ Localização pronta para envio</Text>
              <Text style={styles.successSubtext}>{rua || "Rua não identificada"}{numero ? `, ${numero}` : ""}</Text>
              <Text style={styles.successSubtext}>{bairro || "Bairro não identificado"} - {cidade || "Itarema"}/{uf || "CE"}</Text>
              <Text style={styles.successSubtext}>Lat: {latitude.toFixed(5)} | Long: {longitude.toFixed(5)}</Text>
            </View>
          ) : (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                {localizacaoSelecionadaNoMapa
                  ? "Local marcado no mapa carregando. Confira os dados e aguarde alguns segundos."
                  : "Digite o endereço e toque em “Buscar endereço digitado no mapa”, ou apenas registre que o app tentará localizar automaticamente antes de enviar."}
              </Text>
            </View>
          )}

          <Pressable style={[styles.button, salvando && styles.buttonDisabled]} onPress={registrarDoacao} disabled={salvando}>
            {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Registrar doação</Text>}
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>⬅ Voltar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#eef5f0" },
  container: { padding: 16, paddingBottom: 36 },
  containerSmall: { padding: 12, paddingBottom: 32 },
  headerCard: { backgroundColor: "#2e7d32", borderRadius: 22, padding: 20, marginBottom: 16 },
  headerCardSmall: { padding: 16, borderRadius: 18 },
  title: { color: "#fff", fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  titleSmall: { fontSize: 23 },
  subtitle: { color: "#e7f7ea", fontSize: 15, lineHeight: 22 },
  card: { backgroundColor: "#fff", borderRadius: 22, padding: 18, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  sectionTitle: { color: "#176b2c", fontSize: 17, fontWeight: "800", marginTop: 18, marginBottom: 2 },
  label: { fontSize: 15, fontWeight: "700", color: "#1f2937", marginBottom: 8, marginTop: 10 },
  helpText: { color: "#475569", fontSize: 13, lineHeight: 18, marginTop: -2, marginBottom: 10 },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 6 },
  optionChip: { minHeight: 46, minWidth: "47%", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 14, backgroundColor: "#f8fbf8", paddingHorizontal: 12, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  optionChipSelected: { backgroundColor: "#176b2c", borderColor: "#176b2c" },
  optionChipText: { color: "#111827", fontSize: 15, fontWeight: "700", textAlign: "center" },
  optionChipTextSelected: { color: "#fff" },
  mixedChip: { minWidth: "96%" },
  mixedBox: { marginTop: 8, backgroundColor: "#ecfdf5", borderColor: "#b7e0bf", borderWidth: 1, borderRadius: 14, padding: 12 },
  mixedTitle: { color: "#176b2c", fontWeight: "800", marginBottom: 10 },
  smallChip: { minWidth: "45%", backgroundColor: "#fff" },
  pickerWrapper: { borderWidth: 1, borderColor: "#d8e0d9", borderRadius: 14, backgroundColor: "#f8fbf8", overflow: "hidden" },
  picker: { color: "#111827", backgroundColor: "#f8fbf8" },
  pickerItem: { color: "#111827", fontSize: 16 },
  textInput: { borderWidth: 1, borderColor: "#d8e0d9", borderRadius: 14, backgroundColor: "#f8fbf8", paddingHorizontal: 14, paddingVertical: Platform.OS === "ios" ? 14 : 10, minHeight: 48, fontSize: 16, color: "#111827" },
  textArea: { minHeight: 96, textAlignVertical: "top" },
  rowInputs: { flexDirection: "row", gap: 10 },
  cityInput: { flex: 1 },
  ufInput: { width: 78 },
  button: { marginTop: 16, backgroundColor: "#33a852", borderRadius: 16, paddingVertical: 15, paddingHorizontal: 12, alignItems: "center", minHeight: 52, justifyContent: "center" },
  addressButton: { backgroundColor: "#2563eb" },
  locationButton: { backgroundColor: "#1f8efa" },
  lockedLocationButton: { backgroundColor: "#cbd5e1", opacity: 0.65 },
  buttonDisabled: { opacity: 0.75 },
  mapLockedBox: { marginTop: 12, backgroundColor: "#ecfdf5", borderColor: "#b7e0bf", borderWidth: 1, borderRadius: 14, padding: 12 },
  mapLockedTitle: { color: "#176b2c", fontWeight: "800", marginBottom: 4 },
  mapLockedText: { color: "#2f5f3a", fontSize: 13, lineHeight: 18 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold", textAlign: "center" },
  secondaryButton: { marginTop: 12, borderRadius: 16, paddingVertical: 15, alignItems: "center", backgroundColor: "#e9eef3", minHeight: 52, justifyContent: "center" },
  secondaryButtonText: { color: "#334155", fontSize: 16, fontWeight: "bold" },
  successBox: { marginTop: 14, backgroundColor: "#eef9f0", borderColor: "#b7e0bf", borderWidth: 1, borderRadius: 14, padding: 12 },
  successText: { color: "#176b2c", fontWeight: "700" },
  successSubtext: { color: "#2f5f3a", marginTop: 4, fontSize: 13 },
  warningBox: { marginTop: 14, backgroundColor: "#fff8e6", borderColor: "#f0d48a", borderWidth: 1, borderRadius: 14, padding: 12 },
  warningText: { color: "#7a5600", fontSize: 13, lineHeight: 18 },
});
