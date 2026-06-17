import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { styles } from "@/src/styles/rankingStyles";
import { getMinhaPosicao, getTop10, MinhaPosicao, RankingItem, TipoRanking } from "@/src/services/ranking";

function nomeItem(item: RankingItem) {
  return item.doadorNome || item.nomeDoador || item.nome || "Doador";
}

function idItem(item: RankingItem, index: number) {
  return String(item.doadorId || item.userId || item.id || index);
}

function valorItem(item: Pick<RankingItem, "totalKg" | "totalColetas" | "pontos">, tipo: TipoRanking) {
  if (tipo === "kg") return `${Number(item.totalKg || 0).toFixed(2).replace(".", ",")} kg`;
  if (tipo === "coletas") return `${Number(item.totalColetas || 0)} coleta(s)`;
  return `${Number(item.pontos || 0)} pts`;
}

function tituloTipo(tipo: TipoRanking) {
  if (tipo === "kg") return "Kg";
  if (tipo === "coletas") return "Coletas";
  return "Pontos";
}

export default function RankingScreen() {
  const [tipo, setTipo] = useState<TipoRanking>("pontos");
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [minhaPosicao, setMinhaPosicao] = useState<MinhaPosicao | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      setErro("");

      const [lista, meusDados] = await Promise.all([
        getTop10(tipo),
        getMinhaPosicao(tipo).catch(() => null),
      ]);

      setRanking(lista.slice(0, 10));
      setMinhaPosicao(meusDados);
    } catch (error: any) {
      setErro(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Não foi possível carregar o ranking."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tipo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const top3 = ranking.slice(0, 3);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🏆 Ranking Recicle+</Text>
        </View>
        <ActivityIndicator size="large" color="#22c55e" style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏆 Ranking Recicle+</Text>
        <Text style={styles.headerSubtitle}>Ranking de doadores por impacto ambiental</Text>
      </View>

      <View style={styles.filterRow}>
        {(["pontos", "kg", "coletas"] as TipoRanking[]).map((opcao) => (
          <TouchableOpacity
            key={opcao}
            onPress={() => setTipo(opcao)}
            style={[styles.filterButton, tipo === opcao && styles.filterButtonActive]}
            activeOpacity={0.85}
          >
            <Text style={[styles.filterText, tipo === opcao && styles.filterTextActive]}>
              {tituloTipo(opcao)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!!minhaPosicao && (
        <View style={styles.myCard}>
          <Text style={styles.myTitle}>Meus resultados</Text>
          <Text style={styles.myValue}>{valorItem(minhaPosicao, tipo)}</Text>
          <Text style={styles.myDetails}>
            {Number(minhaPosicao.pontos || 0)} pts • {Number(minhaPosicao.totalKg || 0).toFixed(2).replace(".", ",")} kg • {Number(minhaPosicao.totalColetas || 0)} coleta(s)
          </Text>
        </View>
      )}

      {!!erro && <Text style={styles.errorText}>{erro}</Text>}

      {top3.length > 0 && (
        <View style={styles.top3}>
          {top3.map((item, index) => (
            <View key={idItem(item, index)} style={[styles.topItem, index === 0 && styles.top1]}>
              <Text style={styles.medalha}>{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}</Text>
              <Text style={styles.nome} numberOfLines={2}>{nomeItem(item)}</Text>
              <Text style={styles.pontos}>{valorItem(item, tipo)}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.listaTitulo}>Classificação Geral</Text>

      <FlatList
        data={ranking}
        keyExtractor={idItem}
        contentContainerStyle={styles.lista}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              carregar(true);
            }}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum doador pontuou ainda.</Text>
        }
        renderItem={({ item, index }) => (
          <View style={styles.card}>
            <Text style={styles.posicao}>{index + 1}º</Text>
            <Text style={styles.cardNome} numberOfLines={1}>{nomeItem(item)}</Text>
            <Text style={styles.cardPontos}>{valorItem(item, tipo)}</Text>
          </View>
        )}
      />
    </View>
  );
}
