import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Mapbox from "@rnmapbox/maps";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { api } from "@/src/services/api";
import { emitirAtualizacaoGlobal, subscribeAtualizacaoGlobal } from "@/src/utils/appEvents";

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

if (mapboxToken) {
  Mapbox.setAccessToken(mapboxToken);
}

type TipoUsuario = "DOADOR" | "COLETOR";

type Coordenada = {
  latitude: number;
  longitude: number;
};

type LocalizacaoGPS = Coordenada & {
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  altitude?: number | null;
  timestamp: number;
};

type DoacaoMapaItem = {
  id: number;
  latitude?: number | string | null;
  longitude?: number | string | null;
  referencia?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  rua?: string | null;
  numero?: string | null;
  materiais?: string | string[] | null;
  status?: string | null;
  doadorNome?: string | null;
  doadorEmail?: string | null;
  doadorId?: number | string | null;
  coletorNome?: string | null;
  coletorEmail?: string | null;
  coletorId?: number | string | null;
  doador?: { id?: number | string | null; email?: string | null; nome?: string | null } | null;
  coletor?: { id?: number | string | null; email?: string | null; nome?: string | null } | null;
  user?: { id?: number | string | null; email?: string | null; nome?: string | null } | null;
  enderecoProtegido?: boolean;
};

type PontoColetaSeletiva = {
  id: number;
  nome: string;
  latitude: number;
  longitude: number;
  tipo: "COLETOR_RECICLAVEL" | "ILHA_ECOLOGICA";
};

type RastreamentoDoacaoResponse = {
  latitudeColetor?: number | string | null;
  longitudeColetor?: number | string | null;
  coletorLatitude?: number | string | null;
  coletorLongitude?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  status?: string | null;
  data?: RastreamentoDoacaoResponse;
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type RouteMetrics = {
  distanciaMetros: number | null;
  duracaoSegundos: number | null;
};

type Props = {
  tipoUsuario?: TipoUsuario;
  onAcaoPrincipal?: () => void;
  menuOpen?: boolean;
};

const ITAREMA_CENTRO: Coordenada = {
  latitude: -2.920012,
  longitude: -39.915818,
};

const PONTOS_COLETA_SELETIVA: PontoColetaSeletiva[] = [
  { id: 1, nome: "E.M.E.F. Francisco Pedro Rodrigues", latitude: -2.917444, longitude: -39.932139, tipo: "COLETOR_RECICLAVEL" },
  { id: 2, nome: "Igreja Sagrado Coração de Jesus", latitude: -2.917088, longitude: -39.92884, tipo: "COLETOR_RECICLAVEL" },
  { id: 3, nome: "Centro Cultural", latitude: -2.921135, longitude: -39.925427, tipo: "COLETOR_RECICLAVEL" },
  { id: 4, nome: "Liceu e EMEF Mundico Ribeiro", latitude: -2.920868, longitude: -39.923817, tipo: "COLETOR_RECICLAVEL" },
  { id: 5, nome: "EEEP Rosângela Albuquerque de Couto e Rodoviária", latitude: -2.926188, longitude: -39.925541, tipo: "COLETOR_RECICLAVEL" },
  { id: 6, nome: "EEM Luzia Araújo Barros", latitude: -2.919642, longitude: -39.921929, tipo: "COLETOR_RECICLAVEL" },
  { id: 7, nome: "Câmara Municipal de Itarema", latitude: -2.920986, longitude: -39.916975, tipo: "COLETOR_RECICLAVEL" },
  { id: 8, nome: "Posto de Saúde Lagoa Seca", latitude: -2.924421, longitude: -39.919383, tipo: "COLETOR_RECICLAVEL" },
  { id: 9, nome: "Complexo Integrado de Atendimento à Saúde – CIAS", latitude: -2.91981, longitude: -39.920012, tipo: "COLETOR_RECICLAVEL" },
  { id: 10, nome: "Praça Pedra Cheirosa", latitude: -2.923234, longitude: -39.913163, tipo: "COLETOR_RECICLAVEL" },
  { id: 11, nome: "Praça João Batista Rios e Mercado Central", latitude: -2.921546, longitude: -39.913384, tipo: "COLETOR_RECICLAVEL" },
  { id: 12, nome: "EMEF Padre Aristides Andrade Sales", latitude: -2.924067, longitude: -39.910794, tipo: "COLETOR_RECICLAVEL" },
  { id: 13, nome: "Posto de Saúde de São Vicente", latitude: -2.930523, longitude: -39.891862, tipo: "COLETOR_RECICLAVEL" },
  { id: 14, nome: "Guarda Municipal de Itarema", latitude: -2.926045, longitude: -39.906796, tipo: "COLETOR_RECICLAVEL" },
  { id: 15, nome: "EMEF José Aniceto Sales", latitude: -2.919825, longitude: -39.917377, tipo: "COLETOR_RECICLAVEL" },
  { id: 16, nome: "EMEF Professora Altair Giffone Tavares", latitude: -2.942439, longitude: -39.909509, tipo: "COLETOR_RECICLAVEL" },
  { id: 17, nome: "Praça José Cosme de Couto (Porto dos Barcos)", latitude: -2.907238, longitude: -39.885439, tipo: "COLETOR_RECICLAVEL" },
  { id: 18, nome: "Posto de Saúde de Porto dos Barcos", latitude: -2.90671, longitude: -39.886576, tipo: "COLETOR_RECICLAVEL" },
  { id: 19, nome: "EMEF Vereador Pedro Penha (Porto dos Barcos)", latitude: -2.907262, longitude: -39.885759, tipo: "COLETOR_RECICLAVEL" },
  { id: 20, nome: "Escola Sítio Alegre", latitude: -2.934674, longitude: -39.850481, tipo: "COLETOR_RECICLAVEL" },
  { id: 21, nome: "Liceu de Almofala / EEM José Maria Monteiro", latitude: -2.936996, longitude: -39.834878, tipo: "COLETOR_RECICLAVEL" },
  { id: 22, nome: "EMEF Francisco Alves Neto", latitude: -2.937972, longitude: -39.832054, tipo: "COLETOR_RECICLAVEL" },
  { id: 23, nome: "Praça da Igreja Matriz de Almofala", latitude: -2.939777, longitude: -39.826704, tipo: "COLETOR_RECICLAVEL" },
  { id: 24, nome: "Praça da Ilha do Guajiru", latitude: -2.880495, longitude: -39.910261, tipo: "COLETOR_RECICLAVEL" },
  { id: 25, nome: "Rua Via Costeira", latitude: -2.881416, longitude: -39.908521, tipo: "COLETOR_RECICLAVEL" },
  { id: 26, nome: "Torrões", latitude: -2.950707, longitude: -39.797917, tipo: "COLETOR_RECICLAVEL" },
  { id: 101, nome: "Prefeitura Municipal de Itarema", latitude: -2.920012, longitude: -39.915818, tipo: "ILHA_ECOLOGICA" },
  { id: 102, nome: "Praça dos Feirantes", latitude: -2.922933, longitude: -39.913803, tipo: "ILHA_ECOLOGICA" },
  { id: 103, nome: "Centro de Atendimento ao Turista – CAT (Ilha do Guajiru)", latitude: -2.880735, longitude: -39.910581, tipo: "ILHA_ECOLOGICA" },
];

// Limites de segurança. A decisão final do GPS é adaptativa nas funções abaixo.
const GPS_MAX_ACCEPTABLE_ACCURACY_METERS = 120;
const GPS_MAX_FIRST_ACCURACY_METERS = 180;
const GPS_HISTORY_SIZE = 8;
const GPS_MIN_RELEVANT_MOVE_METERS = 1.2;
const GPS_RECENT_WINDOW_MS = 30000;
const GPS_NEAR_DESTINATION_METERS = 50;
const GPS_FAR_FROM_DESTINATION_METERS = 300;

const TRACKING_MIN_MOVE_METERS = 5;
const TRACKING_MIN_INTERVAL_MS = 3500;

const ROUTE_RECALC_ORIGIN_METERS = 15;
const ROUTE_RECALC_DESTINATION_METERS = 6;
const ROUTE_MIN_INTERVAL_MS = 5000;

const FOLLOW_COLLECTOR_CAMERA_MIN_MOVE_METERS = 4;
const FOLLOW_COLLECTOR_CAMERA_MIN_INTERVAL_MS = 1500;
const FOLLOW_COLLECTOR_CAMERA_ZOOM = 16;
const MAP_INITIAL_PITCH = 35;
const MAP_CENTER_PITCH = 35;
const MAP_FOLLOW_PITCH = 45;
const LOCATION_ACTIVE_INTERVAL_MS = 1500;
const LOCATION_PASSIVE_INTERVAL_MS = 6000;
const LOCATION_ACTIVE_DISTANCE_METERS = 2;
const LOCATION_PASSIVE_DISTANCE_METERS = 8;
const MAPBOX_DIRECTIONS_PROFILE = "driving-traffic";


function normalizarStatus(status?: string | null) {
  return String(status || "").trim().toUpperCase();
}

function coordenadaValida(latitude?: any, longitude?: any) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

function toCoordenada(item?: DoacaoMapaItem | null): Coordenada | null {
  if (!item || !coordenadaValida(item.latitude, item.longitude)) return null;

  return {
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
  };
}

function calcularDistanciaMetros(origem: Coordenada, destino: Coordenada) {
  const R = 6371000;
  const lat1 = (origem.latitude * Math.PI) / 180;
  const lat2 = (destino.latitude * Math.PI) / 180;
  const deltaLat = ((destino.latitude - origem.latitude) * Math.PI) / 180;
  const deltaLng = ((destino.longitude - origem.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calcularBearingGraus(origem: Coordenada, destino: Coordenada) {
  const lat1 = (origem.latitude * Math.PI) / 180;
  const lat2 = (destino.latitude * Math.PI) / 180;
  const deltaLng = ((destino.longitude - origem.longitude) * Math.PI) / 180;

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  return (Math.atan2(y, x) * 180) / Math.PI;
}

function normalizarBearingGraus(valor?: number | null) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0) return null;
  return ((numero % 360) + 360) % 360;
}

function formatarDuracao(segundos?: number | null) {
  const valor = Number(segundos);
  if (!Number.isFinite(valor) || valor <= 0) return "";
  const minutos = Math.max(1, Math.round(valor / 60));

  if (minutos < 60) return `${minutos} min`;

  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto ? `${horas}h ${resto}min` : `${horas}h`;
}

function formatarDistancia(metros?: number | null) {
  if (!Number.isFinite(Number(metros))) return "";
  const valor = Number(metros);
  if (valor < 1000) return `${Math.round(valor)} m`;
  return `${(valor / 1000).toFixed(1).replace(".", ",")} km`;
}

function materiaisTexto(materiais?: string | string[] | null) {
  if (!materiais) return "Material não informado";
  if (Array.isArray(materiais)) return materiais.join(", ") || "Material não informado";
  return String(materiais)
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean)
    .join(", ") || "Material não informado";
}

function emailDoColetor(item: DoacaoMapaItem) {
  return String(item.coletorEmail || item.coletor?.email || "").trim().toLowerCase();
}

function idDoColetor(item: DoacaoMapaItem) {
  const id = item.coletorId ?? item.coletor?.id;
  const numero = Number(id);
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

function emailDoDoador(item: DoacaoMapaItem) {
  return String(item.doadorEmail || item.doador?.email || item.user?.email || "").trim().toLowerCase();
}

function idDoDoador(item: DoacaoMapaItem) {
  const id = item.doadorId ?? item.doador?.id ?? item.user?.id;
  const numero = Number(id);
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

function doacaoSemColetor(item: DoacaoMapaItem) {
  return !emailDoColetor(item) && !idDoColetor(item);
}

function pertenceAoColetor(item: DoacaoMapaItem, emailUsuario: string, usuarioId: number | null) {
  const email = emailDoColetor(item);
  const id = idDoColetor(item);

  if (emailUsuario && email) return email === emailUsuario;
  if (usuarioId && id) return id === usuarioId;

  return false;
}

function pertenceAoDoador(item: DoacaoMapaItem, emailUsuario: string, usuarioId: number | null) {
  const email = emailDoDoador(item);
  const id = idDoDoador(item);

  if (emailUsuario && email) return email === emailUsuario;
  if (usuarioId && id) return id === usuarioId;

  // Se o backend já retorna somente as doações do usuário e não manda dono,
  // mantemos compatibilidade para não esconder tudo sem necessidade.
  return !email && !id;
}

function doacaoVisivelParaUsuario(
  item: DoacaoMapaItem,
  tipoUsuario: TipoUsuario,
  emailUsuario: string,
  usuarioId: number | null
) {
  const status = normalizarStatus(item.status);

  if (!["PENDENTE", "ACEITA", "EM_ROTA", "AGUARDANDO_CONFIRMACAO"].includes(status)) {
    return false;
  }

  if (tipoUsuario === "COLETOR") {
    // Coletor só vê: doações livres (PENDENTE sem coletor) e as que ele mesmo aceitou.
    if (status === "PENDENTE") return doacaoSemColetor(item);
    return pertenceAoColetor(item, emailUsuario, usuarioId);
  }

  return pertenceAoDoador(item, emailUsuario, usuarioId);
}

function statusLabel(status?: string | null) {
  switch (normalizarStatus(status)) {
    case "PENDENTE":
      return "Pendente";
    case "ACEITA":
      return "Aceita";
    case "EM_ROTA":
      return "Em rota";
    case "AGUARDANDO_CONFIRMACAO":
      return "Aguardando confirmação";
    case "CONCLUIDA":
      return "Concluída";
    default:
      return "Status indefinido";
  }
}

function extrairLista(payload: any): DoacaoMapaItem[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.doacoes)) return payload.doacoes;
  return [];
}

function extrairCoordenadaColetor(payload: any): Coordenada | null {
  const data = payload?.data ?? payload;
  const latitude = data?.latitudeColetor ?? data?.coletorLatitude ?? data?.latitude;
  const longitude = data?.longitudeColetor ?? data?.coletorLongitude ?? data?.longitude;

  if (!coordenadaValida(latitude, longitude)) return null;

  return {
    latitude: Number(latitude),
    longitude: Number(longitude),
  };
}

function posicaoParaLocalizacaoGPS(posicao: Location.LocationObject): LocalizacaoGPS | null {
  const latitude = posicao.coords.latitude;
  const longitude = posicao.coords.longitude;

  if (!coordenadaValida(latitude, longitude)) return null;

  return {
    latitude,
    longitude,
    accuracy: posicao.coords.accuracy,
    speed: posicao.coords.speed,
    heading: posicao.coords.heading,
    altitude: posicao.coords.altitude,
    timestamp: posicao.timestamp || Date.now(),
  };
}

function limitarNumero(valor: number, minimo: number, maximo: number) {
  return Math.min(maximo, Math.max(minimo, valor));
}

function normalizarPrecisao(accuracy?: number | null) {
  const valor = Number(accuracy);
  return Number.isFinite(valor) && valor > 0 ? valor : null;
}

function calcularPesoDinamico(accuracy?: number | null, distancia = 0, segundos = 1) {
  const precisao = normalizarPrecisao(accuracy);
  const velocidade = segundos > 0 ? distancia / segundos : 0;

  let peso = 0.35;

  if (precisao === null) peso = 0.3;
  else if (precisao <= 10) peso = 0.9;
  else if (precisao <= 20) peso = 0.75;
  else if (precisao <= 40) peso = 0.58;
  else if (precisao <= 80) peso = 0.38;
  else if (precisao <= 130) peso = 0.22;
  else peso = 0.12;

  // Em deslocamento real mais rápido, a bolinha precisa acompanhar melhor.
  if (velocidade >= 12 && precisao !== null && precisao <= 60) peso += 0.12;
  if (velocidade >= 22 && precisao !== null && precisao <= 35) peso += 0.1;

  return limitarNumero(peso, 0.12, 0.92);
}

function calcularVelocidadeMaximaDinamica(accuracy?: number | null, historico: LocalizacaoGPS[] = []) {
  const precisao = normalizarPrecisao(accuracy);
  const historicoRecente = historico.filter((p) => Date.now() - p.timestamp <= GPS_RECENT_WINDOW_MS);
  const temHistoricoBom = historicoRecente.some((p) => {
    const pAccuracy = normalizarPrecisao(p.accuracy);
    return pAccuracy !== null && pAccuracy <= 40;
  });

  let velocidadeMaxima = 24; // 86 km/h quando não sabemos a precisão.

  if (precisao === null) velocidadeMaxima = 24;
  else if (precisao <= 15) velocidadeMaxima = 45; // GPS ótimo: aceita carro/moto em avenida.
  else if (precisao <= 35) velocidadeMaxima = 38;
  else if (precisao <= 70) velocidadeMaxima = 30;
  else if (precisao <= 120) velocidadeMaxima = 20;
  else velocidadeMaxima = 12;

  if (temHistoricoBom) velocidadeMaxima += 5;

  return velocidadeMaxima;
}

function calcularLimiteSaltoDinamico(accuracy: number | null, segundos: number, velocidadeMaxima: number) {
  const precisao = accuracy ?? 80;
  const porPrecisao = precisao * 2.4;
  const porTempo = velocidadeMaxima * Math.max(segundos, 1) * 1.15;
  return limitarNumero(Math.max(70, porPrecisao, porTempo), 70, 650);
}

function mediaHistoricoPonderada(historico: LocalizacaoGPS[]): Coordenada | null {
  const recentes = historico
    .filter((p) => Date.now() - p.timestamp <= GPS_RECENT_WINDOW_MS)
    .slice(-GPS_HISTORY_SIZE);

  if (!recentes.length) return null;

  let somaPeso = 0;
  let somaLat = 0;
  let somaLng = 0;

  recentes.forEach((p, index) => {
    const precisao = normalizarPrecisao(p.accuracy) ?? 80;
    const pesoRecencia = index + 1;
    const pesoPrecisao = 1 / Math.max(precisao, 8);
    const peso = pesoRecencia * pesoPrecisao;

    somaPeso += peso;
    somaLat += p.latitude * peso;
    somaLng += p.longitude * peso;
  });

  if (somaPeso <= 0) return null;

  return {
    latitude: somaLat / somaPeso,
    longitude: somaLng / somaPeso,
  };
}

function suavizarCoordenadaDinamica(
  anterior: Coordenada,
  nova: LocalizacaoGPS,
  historico: LocalizacaoGPS[]
): Coordenada {
  const distancia = calcularDistanciaMetros(anterior, nova);
  const ultimo = historico[historico.length - 1];
  const segundos = ultimo ? Math.max((nova.timestamp - ultimo.timestamp) / 1000, 1) : 1;
  const peso = calcularPesoDinamico(nova.accuracy, distancia, segundos);

  const suavizada = {
    latitude: anterior.latitude + (nova.latitude - anterior.latitude) * peso,
    longitude: anterior.longitude + (nova.longitude - anterior.longitude) * peso,
  };

  const media = mediaHistoricoPonderada(historico);
  const precisao = normalizarPrecisao(nova.accuracy);

  // Se o GPS está médio/ruim, puxa um pouco para o histórico recente para evitar zigue-zague.
  if (media && precisao !== null && precisao > 45) {
    const pesoHistorico = precisao > 100 ? 0.35 : 0.22;
    return {
      latitude: suavizada.latitude * (1 - pesoHistorico) + media.latitude * pesoHistorico,
      longitude: suavizada.longitude * (1 - pesoHistorico) + media.longitude * pesoHistorico,
    };
  }

  return suavizada;
}

function deveIgnorarLocalizacao(
  anterior: LocalizacaoGPS | null,
  nova: LocalizacaoGPS,
  destino: Coordenada | null,
  historico: LocalizacaoGPS[]
) {
  const precisao = normalizarPrecisao(nova.accuracy);
  const limiteInicial = GPS_MAX_FIRST_ACCURACY_METERS;
  const limiteNormal = GPS_MAX_ACCEPTABLE_ACCURACY_METERS;

  if (!anterior) {
    return precisao !== null && precisao > limiteInicial;
  }

  if (precisao !== null && precisao > limiteNormal) {
    return true;
  }

  const distancia = calcularDistanciaMetros(anterior, nova);
  if (distancia < GPS_MIN_RELEVANT_MOVE_METERS) return true;

  const segundos = Math.max((nova.timestamp - anterior.timestamp) / 1000, 1);
  const velocidadeCalculada = distancia / segundos;
  const velocidadeInformada = Number(nova.speed);
  const velocidadeMaxima = calcularVelocidadeMaximaDinamica(nova.accuracy, historico);
  const limiteSalto = calcularLimiteSaltoDinamico(precisao, segundos, velocidadeMaxima);

  const media = mediaHistoricoPonderada(historico);
  const distanciaDaMedia = media ? calcularDistanciaMetros(media, nova) : 0;

  // Se o ponto está muito longe do histórico e a precisão não está boa, é quase sempre teleporte.
  if (media && precisao !== null && precisao > 45 && distanciaDaMedia > limiteSalto) {
    return true;
  }

  // Bloqueia velocidade impossível de acordo com a precisão atual e o histórico recente.
  if (velocidadeCalculada > velocidadeMaxima && distancia > limiteSalto) {
    return true;
  }

  // Alguns aparelhos informam speed direto do GPS. Se vier absurdo e a precisão não estiver ótima, ignora.
  if (
    Number.isFinite(velocidadeInformada) &&
    velocidadeInformada > velocidadeMaxima + 8 &&
    (precisao === null || precisao > 20)
  ) {
    return true;
  }

  if (destino) {
    const distanciaAntigaAteDestino = calcularDistanciaMetros(anterior, destino);
    const distanciaNovaAteDestino = calcularDistanciaMetros(nova, destino);
    const pulouMuitoParaPertoDaDoacao =
      distanciaAntigaAteDestino > GPS_FAR_FROM_DESTINATION_METERS &&
      distanciaNovaAteDestino < GPS_NEAR_DESTINATION_METERS &&
      distancia > Math.max(120, limiteSalto * 0.7) &&
      velocidadeCalculada > Math.min(velocidadeMaxima, 22);

    if (pulouMuitoParaPertoDaDoacao) {
      return true;
    }
  }

  return false;
}

function atualizarHistoricoLocalizacao(historico: LocalizacaoGPS[], nova: LocalizacaoGPS) {
  return [...historico, nova]
    .filter((p) => nova.timestamp - p.timestamp <= GPS_RECENT_WINDOW_MS)
    .slice(-GPS_HISTORY_SIZE);
}

function precisaRecalcularRota(
  ultima: { origem: Coordenada; destino: Coordenada; timestamp: number } | null,
  origem: Coordenada,
  destino: Coordenada
) {
  if (!ultima) return true;

  const agora = Date.now();
  const tempoDesdeUltima = agora - ultima.timestamp;
  const origemMudou = calcularDistanciaMetros(ultima.origem, origem);
  const destinoMudou = calcularDistanciaMetros(ultima.destino, destino);

  return (
    tempoDesdeUltima >= ROUTE_MIN_INTERVAL_MS &&
    (origemMudou >= ROUTE_RECALC_ORIGIN_METERS || destinoMudou >= ROUTE_RECALC_DESTINATION_METERS)
  );
}

export default function MapaHome({
  tipoUsuario: tipoUsuarioProp = "DOADOR",
  onAcaoPrincipal,
  menuOpen = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const ultimaLocalizacaoGPSRef = useRef<LocalizacaoGPS | null>(null);
  const historicoLocalizacaoRef = useRef<LocalizacaoGPS[]>([]);
  const ultimaLocalizacaoEnviadaRef = useRef<{ coordenada: Coordenada; timestamp: number } | null>(null);
  const ultimaCameraSeguiuColetorRef = useRef<{ coordenada: Coordenada; timestamp: number } | null>(null);
  const ultimaRotaRef = useRef<{ origem: Coordenada; destino: Coordenada; timestamp: number } | null>(null);
  const rotaAbortRef = useRef<AbortController | null>(null);

  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario>(tipoUsuarioProp);
  const [emailUsuario, setEmailUsuario] = useState("");
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [minhaLocalizacao, setMinhaLocalizacao] = useState<Coordenada | null>(null);
  const [localizacaoColetor, setLocalizacaoColetor] = useState<Coordenada | null>(null);
  const [precisaoGPS, setPrecisaoGPS] = useState<number | null>(null);
  const [doacoes, setDoacoes] = useState<DoacaoMapaItem[]>([]);
  const [doacaoSelecionadaId, setDoacaoSelecionadaId] = useState<number | null>(null);
  const [pontoColetaSelecionadoId, setPontoColetaSelecionadoId] = useState<number | null>(null);
  const [rotaGeoJSON, setRotaGeoJSON] = useState<any>(null);
  const [rotaMetricas, setRotaMetricas] = useState<RouteMetrics>({
    distanciaMetros: null,
    duracaoSegundos: null,
  });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [processandoAcao, setProcessandoAcao] = useState(false);
  const [seguirColetor, setSeguirColetor] = useState(tipoUsuarioProp === "COLETOR");
  const [selecionandoLocalDoacao, setSelecionandoLocalDoacao] = useState(false);
  const [localDoacaoSelecionado, setLocalDoacaoSelecionado] = useState<Coordenada | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      rotaAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    setTipoUsuario(tipoUsuarioProp || "DOADOR");
  }, [tipoUsuarioProp]);

  useEffect(() => {
    async function carregarUsuario() {
      const [tipoSalvo, emailSalvo, idSalvo] = await Promise.all([
        AsyncStorage.getItem("tipoUsuario"),
        AsyncStorage.getItem("emailUsuario"),
        AsyncStorage.getItem("usuarioId"),
      ]);

      const tipo = String(tipoSalvo || tipoUsuarioProp || "DOADOR").trim().toUpperCase();
      const id = Number(idSalvo);
      setTipoUsuario(tipo === "COLETOR" ? "COLETOR" : "DOADOR");
      setEmailUsuario(String(emailSalvo || "").trim().toLowerCase());
      setUsuarioId(Number.isFinite(id) && id > 0 ? id : null);
    }

    carregarUsuario();
  }, [tipoUsuarioProp]);

  const carregarDoacoes = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      setErro("");

      const response = await api.get<ApiResponse<DoacaoMapaItem[]>>("/doacoes");
      const lista = extrairLista(response.data?.data ?? response.data)
        .filter((item) => doacaoVisivelParaUsuario(item, tipoUsuario, emailUsuario, usuarioId))
        .filter((item) => coordenadaValida(item.latitude, item.longitude));

      if (!mountedRef.current) return;
      setDoacoes(lista);
    } catch (error: any) {
      if (!mountedRef.current) return;
      setErro(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          (error?.request ? "Sem conexão com o servidor." : "Não foi possível carregar o mapa.")
      );
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [emailUsuario, tipoUsuario, usuarioId]);

  useEffect(() => {
    carregarDoacoes();
    const interval = setInterval(() => carregarDoacoes(true), 10000);
    const unsubscribe = subscribeAtualizacaoGlobal(() => carregarDoacoes(true));

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [carregarDoacoes]);

  const minhasColetas = useMemo(() => {
    if (tipoUsuario !== "COLETOR") return [];

    return doacoes.filter((item) => {
      const status = normalizarStatus(item.status);
      return (
        ["ACEITA", "EM_ROTA", "AGUARDANDO_CONFIRMACAO"].includes(status) &&
        pertenceAoColetor(item, emailUsuario, usuarioId)
      );
    });
  }, [doacoes, emailUsuario, tipoUsuario, usuarioId]);

  const doacaoAtiva = useMemo(() => {
    const selecionada = doacoes.find((item) => item.id === doacaoSelecionadaId);
    if (selecionada) return selecionada;

    if (tipoUsuario === "COLETOR") {
      return (
        minhasColetas.find((item) => normalizarStatus(item.status) === "EM_ROTA") ||
        minhasColetas.find((item) => normalizarStatus(item.status) === "ACEITA") ||
        minhasColetas[0] ||
        doacoes.find((item) => normalizarStatus(item.status) === "PENDENTE") ||
        null
      );
    }

    return (
      doacoes.find((item) => normalizarStatus(item.status) === "EM_ROTA") ||
      doacoes.find((item) => normalizarStatus(item.status) === "ACEITA") ||
      doacoes.find((item) => normalizarStatus(item.status) === "AGUARDANDO_CONFIRMACAO") ||
      doacoes[0] ||
      null
    );
  }, [doacaoSelecionadaId, doacoes, minhasColetas, tipoUsuario]);

  const statusDoacaoAtiva = normalizarStatus(doacaoAtiva?.status);
  const doadorPodeConfirmarColeta =
    tipoUsuario === "DOADOR" && statusDoacaoAtiva === "AGUARDANDO_CONFIRMACAO";
  const coletorEmColetaAtiva =
    tipoUsuario === "COLETOR" &&
    ["ACEITA", "EM_ROTA", "AGUARDANDO_CONFIRMACAO"].includes(statusDoacaoAtiva);

  useEffect(() => {
    if (tipoUsuario !== "DOADOR") {
      setSelecionandoLocalDoacao(false);
      setLocalDoacaoSelecionado(null);
    }
  }, [tipoUsuario]);

  useEffect(() => {
    if (tipoUsuario !== "COLETOR") {
      setSeguirColetor(false);
      ultimaCameraSeguiuColetorRef.current = null;
      return;
    }

    if (coletorEmColetaAtiva) {
      // CHAVE_SEGUIR_COLETOR_CONTROLE
      // O acompanhamento começa ligado para o coletor, mas ele pode desligar no botão.
      setSeguirColetor((valorAtual) => valorAtual || ultimaCameraSeguiuColetorRef.current === null);
    } else {
      ultimaCameraSeguiuColetorRef.current = null;
    }
  }, [coletorEmColetaAtiva, tipoUsuario]);

  const destino = useMemo(() => toCoordenada(doacaoAtiva), [doacaoAtiva]);
  const origemRota = useMemo(() => {
    if (tipoUsuario === "DOADOR" && localizacaoColetor) return localizacaoColetor;
    return minhaLocalizacao;
  }, [localizacaoColetor, minhaLocalizacao, tipoUsuario]);

  const pontoColetaSelecionado = useMemo(
    () => PONTOS_COLETA_SELETIVA.find((ponto) => ponto.id === pontoColetaSelecionadoId) || null,
    [pontoColetaSelecionadoId]
  );
  const destinoRef = useRef<Coordenada | null>(null);

  useEffect(() => {
    destinoRef.current = destino;
  }, [destino]);

  useEffect(() => {
    if (!doacaoSelecionadaId) return;

    const aindaExiste = doacoes.some((item) => item.id === doacaoSelecionadaId);

    if (!aindaExiste) {
      setDoacaoSelecionadaId(null);
    }
  }, [doacoes, doacaoSelecionadaId]);

  useEffect(() => {
    let cancelado = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    async function buscarLocalizacaoColetor() {
      if (tipoUsuario !== "DOADOR" || !doacaoAtiva?.id) {
        if (!cancelado) setLocalizacaoColetor(null);
        return;
      }

      const status = normalizarStatus(doacaoAtiva.status);
      if (!["ACEITA", "EM_ROTA", "AGUARDANDO_CONFIRMACAO"].includes(status)) {
        if (!cancelado) setLocalizacaoColetor(null);
        return;
      }

      try {
        const response = await api.get<RastreamentoDoacaoResponse>(`/rastreamento/${doacaoAtiva.id}`);
        const coordenada = extrairCoordenadaColetor(response.data);

        if (!cancelado) {
          setLocalizacaoColetor(coordenada);
        }
      } catch {
        // Se ainda não existir rastreamento para essa doação, apenas escondemos o marcador do coletor.
        if (!cancelado) setLocalizacaoColetor(null);
      }
    }

    buscarLocalizacaoColetor();
    interval = setInterval(buscarLocalizacaoColetor, 5000);

    return () => {
      cancelado = true;
      if (interval) clearInterval(interval);
    };
  }, [doacaoAtiva?.id, doacaoAtiva?.status, tipoUsuario]);

  const aplicarLocalizacao = useCallback((nova: LocalizacaoGPS) => {
    const anterior = ultimaLocalizacaoGPSRef.current;
    const destinoAtual = destinoRef.current;
    const historicoAtual = historicoLocalizacaoRef.current;

    if (deveIgnorarLocalizacao(anterior, nova, destinoAtual, historicoAtual)) {
      return;
    }

    const coordenadaFinal: Coordenada = anterior
      ? suavizarCoordenadaDinamica(anterior, nova, historicoAtual)
      : { latitude: nova.latitude, longitude: nova.longitude };

    const aceita: LocalizacaoGPS = {
      ...nova,
      latitude: coordenadaFinal.latitude,
      longitude: coordenadaFinal.longitude,
    };

    ultimaLocalizacaoGPSRef.current = aceita;
    historicoLocalizacaoRef.current = atualizarHistoricoLocalizacao(historicoAtual, aceita);

    if (mountedRef.current) {
      setMinhaLocalizacao(coordenadaFinal);
      setPrecisaoGPS(normalizarPrecisao(nova.accuracy));
    }
  }, []);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let cancelado = false;

    async function iniciarLocalizacao() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setErro("Permita o acesso à localização para o mapa funcionar.");
          setLoading(false);
          return;
        }

        const ultimaConhecida = await Location.getLastKnownPositionAsync({
          maxAge: 10000,
          requiredAccuracy: GPS_MAX_FIRST_ACCURACY_METERS,
        });

        if (!cancelado && ultimaConhecida) {
          const gps = posicaoParaLocalizacaoGPS(ultimaConhecida);
          if (gps) aplicarLocalizacao(gps);
        }

        const atual = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });

        if (!cancelado) {
          const gps = posicaoParaLocalizacaoGPS(atual);
          if (gps) aplicarLocalizacao(gps);
        }

        const rastreamentoAtivo = tipoUsuario === "COLETOR" && coletorEmColetaAtiva;
        const accuracy = rastreamentoAtivo
          ? Location.Accuracy.BestForNavigation
          : Location.Accuracy.Highest;

        subscription = await Location.watchPositionAsync(
          {
            accuracy,
            timeInterval: rastreamentoAtivo
              ? LOCATION_ACTIVE_INTERVAL_MS
              : LOCATION_PASSIVE_INTERVAL_MS,
            distanceInterval: rastreamentoAtivo
              ? LOCATION_ACTIVE_DISTANCE_METERS
              : LOCATION_PASSIVE_DISTANCE_METERS,
            mayShowUserSettingsDialog: true,
          },
          (posicao) => {
            if (!mountedRef.current || cancelado) return;
            const gps = posicaoParaLocalizacaoGPS(posicao);
            if (gps) aplicarLocalizacao(gps);
          }
        );
      } catch {
        if (mountedRef.current) {
          setErro("Não foi possível obter sua localização.");
          setLoading(false);
        }
      }
    }

    iniciarLocalizacao();

    return () => {
      cancelado = true;
      if (subscription) subscription.remove();
    };
  }, [aplicarLocalizacao, coletorEmColetaAtiva, tipoUsuario]);

  const distanciaAteDestino = useMemo(() => {
    if (Number.isFinite(Number(rotaMetricas.distanciaMetros))) {
      return Number(rotaMetricas.distanciaMetros);
    }

    if (!origemRota || !destino) return null;
    return calcularDistanciaMetros(origemRota, destino);
  }, [destino, origemRota, rotaMetricas.distanciaMetros]);

  const tempoEstimadoAteDestino = useMemo(() => {
    if (Number.isFinite(Number(rotaMetricas.duracaoSegundos))) {
      return Number(rotaMetricas.duracaoSegundos);
    }

    return null;
  }, [rotaMetricas.duracaoSegundos]);

  useEffect(() => {
    async function enviarLocalizacaoColetor() {
      if (tipoUsuario !== "COLETOR" || !minhaLocalizacao || !doacaoAtiva) return;

      const status = normalizarStatus(doacaoAtiva.status);
      if (!["ACEITA", "EM_ROTA", "AGUARDANDO_CONFIRMACAO"].includes(status)) return;

      const ultima = ultimaLocalizacaoEnviadaRef.current;
      const agora = Date.now();
      const mudouDistancia = ultima
        ? calcularDistanciaMetros(ultima.coordenada, minhaLocalizacao)
        : Number.POSITIVE_INFINITY;
      const passouTempo = ultima ? agora - ultima.timestamp >= TRACKING_MIN_INTERVAL_MS : true;

      if (ultima && mudouDistancia < TRACKING_MIN_MOVE_METERS && !passouTempo) return;

      try {
        await api.post(`/rastreamento/${doacaoAtiva.id}/coletor`, {
          latitude: minhaLocalizacao.latitude,
          longitude: minhaLocalizacao.longitude,
        });
        ultimaLocalizacaoEnviadaRef.current = { coordenada: minhaLocalizacao, timestamp: agora };
      } catch {
        // O mapa continua funcionando mesmo se o envio de rastreamento falhar.
      }
    }

    enviarLocalizacaoColetor();
  }, [doacaoAtiva, minhaLocalizacao, tipoUsuario]);

  useEffect(() => {
    async function buscarRotaMapbox() {
      if (!mapboxToken || !origemRota || !destino) {
        setRotaGeoJSON(null);
        setRotaMetricas({ distanciaMetros: null, duracaoSegundos: null });
        ultimaRotaRef.current = null;
        rotaAbortRef.current?.abort();
        return;
      }

      if (!precisaRecalcularRota(ultimaRotaRef.current, origemRota, destino)) {
        return;
      }

      rotaAbortRef.current?.abort();
      const controller = new AbortController();
      rotaAbortRef.current = controller;

      try {
        const origem = `${origemRota.longitude},${origemRota.latitude}`;
        const fim = `${destino.longitude},${destino.latitude}`;
        const url = `https://api.mapbox.com/directions/v5/mapbox/${MAPBOX_DIRECTIONS_PROFILE}/${origem};${fim}?geometries=geojson&overview=full&alternatives=false&steps=false&access_token=${mapboxToken}`;

        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          throw new Error("Erro ao buscar rota no Mapbox");
        }

        const data = await response.json();
        const rotaPrincipal = data?.routes?.[0];
        const coordinates = rotaPrincipal?.geometry?.coordinates;

        if (!mountedRef.current || controller.signal.aborted) return;

        if (Array.isArray(coordinates) && coordinates.length >= 2) {
          setRotaGeoJSON({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "LineString",
                  coordinates,
                },
                properties: {},
              },
            ],
          });
          setRotaMetricas({
            distanciaMetros: Number.isFinite(Number(rotaPrincipal?.distance))
              ? Number(rotaPrincipal.distance)
              : null,
            duracaoSegundos: Number.isFinite(Number(rotaPrincipal?.duration))
              ? Number(rotaPrincipal.duration)
              : null,
          });

          ultimaRotaRef.current = {
            origem: origemRota,
            destino,
            timestamp: Date.now(),
          };
        } else {
          // Mantém a última rota válida para evitar piscadas ou troca brusca para linha reta.
        }
      } catch (error: any) {
        if (error?.name !== "AbortError" && mountedRef.current) {
          // Mantém a última rota válida se a API falhar temporariamente.
        }
      }
    }

    buscarRotaMapbox();
  }, [destino, origemRota]);

  const linhaFeature = useMemo(() => {
    if (rotaGeoJSON) return rotaGeoJSON;
    if (!origemRota || !destino) return null;

    // Fallback visual quando a API de rota não responder.
    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          geometry: {
            type: "LineString" as const,
            coordinates: [
              [origemRota.longitude, origemRota.latitude],
              [destino.longitude, destino.latitude],
            ],
          },
          properties: {},
        },
      ],
    };
  }, [destino, origemRota, rotaGeoJSON]);

  const pointsFeature = useMemo(() => {
    const features = doacoes.map((item) => ({
      type: "Feature" as const,
      id: String(item.id),
      geometry: {
        type: "Point" as const,
        coordinates: [Number(item.longitude), Number(item.latitude)],
      },
      properties: {
        id: item.id,
        selecionada: item.id === doacaoAtiva?.id,
        status: normalizarStatus(item.status),
        label: "",
      },
    }));

    if (minhaLocalizacao) {
      features.push({
        type: "Feature" as const,
        id: "minha-localizacao",
        geometry: {
          type: "Point" as const,
          coordinates: [minhaLocalizacao.longitude, minhaLocalizacao.latitude],
        },
        properties: {
          id: -1,
          selecionada: false,
          status: "MINHA_LOCALIZACAO",
          label: "",
        },
      });
    }

    if (tipoUsuario === "DOADOR" && localizacaoColetor) {
      features.push({
        type: "Feature" as const,
        id: "coletor-em-rota",
        geometry: {
          type: "Point" as const,
          coordinates: [localizacaoColetor.longitude, localizacaoColetor.latitude],
        },
        properties: {
          id: -2,
          selecionada: false,
          status: "COLETOR_EM_ROTA",
          label: "🚛",
        },
      });
    }

    return {
      type: "FeatureCollection" as const,
      features,
    };
  }, [doacaoAtiva?.id, doacoes, localizacaoColetor, minhaLocalizacao, tipoUsuario]);

  const centralizarMapa = useCallback(() => {
    if (!cameraRef.current) return;

    if (origemRota && destino) {
      cameraRef.current.fitBounds(
        [origemRota.longitude, origemRota.latitude],
        [destino.longitude, destino.latitude],
        [110, 80, 310, 80],
        700
      );

      setTimeout(() => {
        cameraRef.current?.setCamera({
          pitch: MAP_CENTER_PITCH,
          animationDuration: 250,
        });
      }, 720);

      return;
    }

    const centro = origemRota || minhaLocalizacao || destino || ITAREMA_CENTRO;
    cameraRef.current.setCamera({
      centerCoordinate: [centro.longitude, centro.latitude],
      zoomLevel: 14,
      pitch: MAP_CENTER_PITCH,
      animationDuration: 700,
    });
  }, [destino, minhaLocalizacao, origemRota]);

  useEffect(() => {
    if (!coletorEmColetaAtiva || !seguirColetor || !minhaLocalizacao || !cameraRef.current) return;

    const ultima = ultimaCameraSeguiuColetorRef.current;
    const agora = Date.now();
    const distancia = ultima
      ? calcularDistanciaMetros(ultima.coordenada, minhaLocalizacao)
      : Number.POSITIVE_INFINITY;
    const passouTempo = ultima ? agora - ultima.timestamp >= FOLLOW_COLLECTOR_CAMERA_MIN_INTERVAL_MS : true;

    if (ultima && distancia < FOLLOW_COLLECTOR_CAMERA_MIN_MOVE_METERS && !passouTempo) return;

    ultimaCameraSeguiuColetorRef.current = { coordenada: minhaLocalizacao, timestamp: agora };
    const headingGPS = normalizarBearingGraus(ultimaLocalizacaoGPSRef.current?.heading);
    const headingRota = destino ? normalizarBearingGraus(calcularBearingGraus(minhaLocalizacao, destino)) : null;

    cameraRef.current.setCamera({
      centerCoordinate: [minhaLocalizacao.longitude, minhaLocalizacao.latitude],
      zoomLevel: FOLLOW_COLLECTOR_CAMERA_ZOOM,
      pitch: MAP_FOLLOW_PITCH,
      heading: headingGPS ?? headingRota ?? 0,
      animationDuration: 650,
    });
  }, [coletorEmColetaAtiva, minhaLocalizacao, seguirColetor]);

  async function confirmarColetaDoDoador() {
    if (!doacaoAtiva?.id || processandoAcao) return;

    try {
      setProcessandoAcao(true);
      await api.patch(`/doacoes/${doacaoAtiva.id}/confirmar-coleta`);

      setDoacoes((listaAtual) =>
        listaAtual.filter((item) => item.id !== doacaoAtiva.id)
      );
      setDoacaoSelecionadaId(null);
      emitirAtualizacaoGlobal();
      Alert.alert("Coleta confirmada", "Obrigado por confirmar a coleta.");
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Não foi possível confirmar a coleta."
      );
    } finally {
      setProcessandoAcao(false);
    }
  }

  function handlePressDoacao(event: any) {
    if (selecionandoLocalDoacao && tipoUsuario === "DOADOR") {
      const coordenada = extrairCoordenadaDoToqueNoMapa(event);
      if (coordenada) {
        setLocalDoacaoSelecionado(coordenada);
        setPontoColetaSelecionadoId(null);
        setDoacaoSelecionadaId(null);
      }
      return;
    }

    const feature = event?.features?.[0];
    const id = Number(feature?.properties?.id);
    if (Number.isFinite(id) && id > 0) {
      setPontoColetaSelecionadoId(null);
      setDoacaoSelecionadaId(id);
    }
  }

  function extrairCoordenadaDoToqueNoMapa(event: any): Coordenada | null {
    const coordinates =
      event?.geometry?.coordinates ||
      event?.coordinates ||
      event?.features?.[0]?.geometry?.coordinates;

    const longitude = Number(coordinates?.[0]);
    const latitude = Number(coordinates?.[1]);

    if (!coordenadaValida(latitude, longitude)) return null;

    return { latitude, longitude };
  }

  function handlePressMapa(event: any) {
    if (!selecionandoLocalDoacao || tipoUsuario !== "DOADOR") return;

    const coordenada = extrairCoordenadaDoToqueNoMapa(event);
    if (!coordenada) return;

    setLocalDoacaoSelecionado(coordenada);
    setPontoColetaSelecionadoId(null);
    setDoacaoSelecionadaId(null);
  }

  function iniciarSelecaoLocalDoacao() {
    if (tipoUsuario !== "DOADOR") return;

    setSelecionandoLocalDoacao(true);
    setLocalDoacaoSelecionado(null);
    setPontoColetaSelecionadoId(null);
    setDoacaoSelecionadaId(null);

    const centro = minhaLocalizacao || ITAREMA_CENTRO;
    cameraRef.current?.setCamera({
      centerCoordinate: [centro.longitude, centro.latitude],
      zoomLevel: 16,
      pitch: MAP_CENTER_PITCH,
      animationDuration: 650,
    });
  }

  function cancelarSelecaoLocalDoacao() {
    setSelecionandoLocalDoacao(false);
    setLocalDoacaoSelecionado(null);
  }

  function confirmarLocalDoacaoSelecionado() {
    if (!localDoacaoSelecionado) {
      Alert.alert("Escolha um local", "Toque no ponto do mapa onde o coletor deve buscar a doação.");
      return;
    }

    router.push({
      pathname: "/doacao/casa",
      params: {
        origemMapa: "1",
        latitude: String(localDoacaoSelecionado.latitude),
        longitude: String(localDoacaoSelecionado.longitude),
      },
    });

    setSelecionandoLocalDoacao(false);
    setLocalDoacaoSelecionado(null);
  }

  const tituloBotao = tipoUsuario === "COLETOR"
    ? "Ver coletas"
    : doadorPodeConfirmarColeta
      ? (processandoAcao ? "Confirmando..." : "Confirmar coleta")
      : "Fazer doação";

  function executarAcaoPrincipalMapa() {
    if (doadorPodeConfirmarColeta) {
      confirmarColetaDoDoador();
      return;
    }

    if (onAcaoPrincipal) {
      onAcaoPrincipal();
      return;
    }

    router.push(tipoUsuario === "COLETOR" ? "/coletas" : "/doacao/casa");
  }
  const textoLocalizacao = minhaLocalizacao
    ? tipoUsuario === "DOADOR" && localizacaoColetor
      ? "Coletor em rota aparecendo no mapa"
      : precisaoGPS !== null
        ? `Sua localização está ativa • precisão ±${Math.round(precisaoGPS)} m`
        : "Sua localização está ativa"
    : "Buscando sua localização...";

  if (!mapboxToken) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Mapa sem token</Text>
        <Text style={styles.errorText}>
          Configure EXPO_PUBLIC_MAPBOX_TOKEN no ambiente do app.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={Mapbox.StyleURL.Street}
        logoEnabled={false}
        compassEnabled
        scaleBarEnabled={false}
        scrollEnabled={true}
        zoomEnabled={true}
        rotateEnabled={true}
        pitchEnabled={true}
        onPress={handlePressMapa}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [ITAREMA_CENTRO.longitude, ITAREMA_CENTRO.latitude],
            zoomLevel: 13,
            pitch: MAP_INITIAL_PITCH,
            heading: 0,
          }}
        />

        {linhaFeature && (
          <Mapbox.ShapeSource id="linha-rota" shape={linhaFeature as any}>
            <Mapbox.LineLayer
              id="linha-rota-layer"
              style={{
                lineColor: "#2563eb",
                lineWidth: 5,
                lineOpacity: 0.85,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* CHAVE_RECICLAGEM_PONTOS_FIXOS_APARECE_NO_MAPA */}
        {PONTOS_COLETA_SELETIVA.map((ponto) => (
          <Mapbox.MarkerView
            key={`ponto-fixo-${ponto.id}`}
            id={`ponto-fixo-${ponto.id}`}
            coordinate={[ponto.longitude, ponto.latitude]}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                if (selecionandoLocalDoacao && tipoUsuario === "DOADOR") {
                  setLocalDoacaoSelecionado({ latitude: ponto.latitude, longitude: ponto.longitude });
                  setPontoColetaSelecionadoId(null);
                  setDoacaoSelecionadaId(null);
                  return;
                }

                setPontoColetaSelecionadoId(ponto.id);
                setDoacaoSelecionadaId(null);
              }}
              style={[
                styles.recycleMarker,
                ponto.id === pontoColetaSelecionadoId && styles.recycleMarkerSelected,
              ]}
            >
              <MaterialCommunityIcons
                name="recycle"
                size={ponto.id === pontoColetaSelecionadoId ? 34 : 28}
                color={ponto.tipo === "ILHA_ECOLOGICA" ? "#15803d" : "#16a34a"}
              />
            </TouchableOpacity>
          </Mapbox.MarkerView>
        ))}

        {localDoacaoSelecionado && (
          <Mapbox.MarkerView
            id="local-doacao-selecionado"
            coordinate={[localDoacaoSelecionado.longitude, localDoacaoSelecionado.latitude]}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.selectedDonationMarker}>
              <MaterialCommunityIcons name="map-marker-check" size={34} color="#16a34a" />
            </View>
          </Mapbox.MarkerView>
        )}

        <Mapbox.ShapeSource id="pontos-doacoes" shape={pointsFeature as any} onPress={handlePressDoacao}>
          <Mapbox.CircleLayer
            id="pontos-doacoes-layer"
            style={{
              circleRadius: [
                "case",
                ["==", ["get", "status"], "COLETOR_EM_ROTA"],
                13,
                ["==", ["get", "status"], "MINHA_LOCALIZACAO"],
                8,
                ["==", ["get", "selecionada"], true],
                10,
                7,
              ],
              circleColor: [
                "case",
                ["==", ["get", "status"], "COLETOR_EM_ROTA"],
                "#16a34a",
                ["==", ["get", "status"], "MINHA_LOCALIZACAO"],
                "#2563eb",
                ["==", ["get", "status"], "PENDENTE"],
                "#f59e0b",
                ["==", ["get", "status"], "EM_ROTA"],
                "#0ea5e9",
                "#22c55e",
              ],
              circleStrokeWidth: 3,
              circleStrokeColor: "#ffffff",
            }}
          />
          <Mapbox.SymbolLayer
            id="pontos-doacoes-label"
            style={{
              textField: ["get", "label"],
              textSize: 18,
              textAllowOverlap: true,
              textIgnorePlacement: true,
            }}
          />
        </Mapbox.ShapeSource>
      </Mapbox.MapView>

      {!menuOpen && (
        <View style={styles.topCard}>
          <Text style={styles.topTitle}>{selecionandoLocalDoacao ? "Escolha o local da doação" : "Mapa Recicle+"}</Text>
          <Text style={styles.topText}>
            {selecionandoLocalDoacao
              ? "Arraste o mapa, dê zoom e toque exatamente no ponto onde o coletor deve buscar."
              : textoLocalizacao}
          </Text>
          {!!erro && <Text style={styles.errorInline}>{erro}</Text>}
        </View>
      )}

      {!menuOpen && (
        <View style={[styles.infoCard, { bottom: Math.max(insets.bottom + 14, 18) }]}>
          {selecionandoLocalDoacao ? (
            <>
              <Text style={styles.infoTitle}>Marcar local da coleta</Text>
              <Text style={styles.infoText}>
                Toque no ponto do mapa onde sua doação estará. Depois confirme para abrir a tela de doação com a localização já preenchida.
              </Text>
              {localDoacaoSelecionado ? (
                <View style={styles.selectedLocationBox}>
                  <Text style={styles.selectedLocationText}>Local selecionado</Text>
                  <Text style={styles.selectedLocationSubtext}>
                    Lat: {localDoacaoSelecionado.latitude.toFixed(5)} | Long: {localDoacaoSelecionado.longitude.toFixed(5)}
                  </Text>
                </View>
              ) : (
                <Text style={styles.hintText}>Nenhum local marcado ainda. Toque em qualquer ponto do mapa.</Text>
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={cancelarSelecaoLocalDoacao}
                  activeOpacity={0.85}
                >
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mainButton, !localDoacaoSelecionado && styles.disabledButton]}
                  onPress={confirmarLocalDoacaoSelecionado}
                  disabled={!localDoacaoSelecionado}
                  activeOpacity={0.85}
                >
                  <Text style={styles.mainButtonText}>Usar este local</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#16a34a" />
              <Text style={styles.infoText}>Carregando doações...</Text>
            </View>
          ) : pontoColetaSelecionado ? (
            <>
              <Text style={styles.infoTitle}>♻ {pontoColetaSelecionado.nome}</Text>
              <Text style={styles.infoText}>
                Tipo: {pontoColetaSelecionado.tipo === "ILHA_ECOLOGICA" ? "Ilha ecológica" : "Coletor de recicláveis"}
              </Text>
              <Text style={styles.infoText}>
                Coordenadas: {pontoColetaSelecionado.latitude.toFixed(6)}, {pontoColetaSelecionado.longitude.toFixed(6)}
              </Text>
              <Text style={styles.hintText}>
                Ponto fixo de coleta seletiva. Toque em uma doação para voltar aos detalhes da coleta.
              </Text>
            </>
          ) : doacaoAtiva ? (
            <>
              <Text style={styles.infoTitle}>{materiaisTexto(doacaoAtiva.materiais)}</Text>
              <Text style={styles.infoText}>Status: {statusLabel(doacaoAtiva.status)}</Text>
              <Text style={styles.infoText}>
                Local: {[doacaoAtiva.rua, doacaoAtiva.numero, doacaoAtiva.bairro, doacaoAtiva.cidade]
                  .filter(Boolean)
                  .join(", ") || "Localização marcada no mapa"}
              </Text>
              {distanciaAteDestino !== null && (
                <Text style={styles.infoText}>
                  {tipoUsuario === "DOADOR" && localizacaoColetor
                    ? "Distância pela rota do coletor até sua casa: "
                    : rotaMetricas.distanciaMetros !== null
                      ? "Distância pela rota: "
                      : "Distância aproximada: "}
                  {formatarDistancia(distanciaAteDestino)}
                  {tempoEstimadoAteDestino !== null
                    ? ` • previsão ${formatarDuracao(tempoEstimadoAteDestino)}`
                    : ""}
                </Text>
              )}
              {tipoUsuario === "DOADOR" && ["ACEITA", "EM_ROTA", "AGUARDANDO_CONFIRMACAO"].includes(normalizarStatus(doacaoAtiva.status)) && !localizacaoColetor && (
                <Text style={styles.hintText}>
                  O coletor aparecerá no mapa assim que o app dele enviar a localização.
                </Text>
              )}
              <Text style={styles.hintText}>
                Toque em outro ponto do mapa para selecionar outra doação ou em ♻ para ver um ponto de coleta seletiva.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.infoTitle}>Nenhuma doação ativa no mapa</Text>
              <Text style={styles.infoText}>
                Quando houver doações com localização, elas aparecerão aqui. Os pontos ♻️ são locais fixos de coleta seletiva.
              </Text>
            </>
          )}

          {coletorEmColetaAtiva && (
            <TouchableOpacity
              style={[styles.followButton, seguirColetor ? styles.followButtonActive : styles.followButtonInactive]}
              onPress={() => {
                const novoValor = !seguirColetor;
                setSeguirColetor(novoValor);

                if (novoValor && minhaLocalizacao && cameraRef.current) {
                  ultimaCameraSeguiuColetorRef.current = { coordenada: minhaLocalizacao, timestamp: Date.now() };
                  const headingGPS = normalizarBearingGraus(ultimaLocalizacaoGPSRef.current?.heading);
                  const headingRota = destino ? normalizarBearingGraus(calcularBearingGraus(minhaLocalizacao, destino)) : null;

                  cameraRef.current.setCamera({
                    centerCoordinate: [minhaLocalizacao.longitude, minhaLocalizacao.latitude],
                    zoomLevel: FOLLOW_COLLECTOR_CAMERA_ZOOM,
                    pitch: MAP_FOLLOW_PITCH,
                    heading: headingGPS ?? headingRota ?? 0,
                    animationDuration: 500,
                  });
                }
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.followButtonText, seguirColetor ? styles.followButtonTextActive : styles.followButtonTextInactive]}>
                {seguirColetor ? "Seguindo minha localização" : "Seguir minha localização"}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                centralizarMapa();
                if (coletorEmColetaAtiva) setSeguirColetor(true);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonText}>Centralizar</Text>
            </TouchableOpacity>

            {tipoUsuario === "DOADOR" && (
              <TouchableOpacity
                style={styles.mapDonationButton}
                onPress={iniciarSelecaoLocalDoacao}
                activeOpacity={0.85}
              >
                <Text style={styles.mapDonationButtonText}>Doar no mapa</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.mainButton, doadorPodeConfirmarColeta && processandoAcao && styles.disabledButton]}
              onPress={executarAcaoPrincipalMapa}
              disabled={doadorPodeConfirmarColeta && processandoAcao}
              activeOpacity={0.85}
            >
              <Text style={styles.mainButtonText}>{tituloBotao}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e5e7eb",
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f8fafc",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#991b1b",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
  },
  topCard: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
  },
  topText: {
    marginTop: 2,
    color: "#4b5563",
    fontSize: 13,
  },
  errorInline: {
    marginTop: 6,
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "700",
  },
  infoCard: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 18,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 4,
  },
  infoText: {
    color: "#374151",
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  hintText: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 8,
  },
  recycleMarker: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  recycleMarkerSelected: {
    transform: [{ scale: 1.18 }],
  },
  selectedDonationMarker: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#16a34a",
  },
  selectedLocationBox: {
    marginTop: 12,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 12,
    padding: 10,
  },
  selectedLocationText: {
    color: "#166534",
    fontWeight: "900",
    fontSize: 13,
  },
  selectedLocationSubtext: {
    color: "#166534",
    marginTop: 3,
    fontSize: 12,
  },
  followButton: {
    marginTop: 12,
    minHeight: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  followButtonActive: {
    backgroundColor: "#dcfce7",
    borderColor: "#16a34a",
  },
  followButtonInactive: {
    backgroundColor: "#f3f4f6",
    borderColor: "#d1d5db",
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: "900",
  },
  followButtonTextActive: {
    color: "#15803d",
  },
  followButtonTextInactive: {
    color: "#374151",
  },
  confirmButton: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7c3aed",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.65,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e0f2fe",
  },
  secondaryButtonText: {
    color: "#0369a1",
    fontSize: 14,
    fontWeight: "800",
  },
  mapDonationButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#16a34a",
  },
  mapDonationButtonText: {
    color: "#15803d",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
  },
  mainButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16a34a",
  },
  mainButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
});
