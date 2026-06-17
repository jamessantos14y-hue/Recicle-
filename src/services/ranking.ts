import { api } from "./api";

export type TipoRanking = "pontos" | "coletas" | "kg";

export type RankingItem = {
  id?: number;
  userId?: number;
  doadorId?: number;
  nome?: string;
  nomeDoador?: string;
  doadorNome?: string;
  totalKg?: number;
  totalColetas?: number;
  pontos?: number;
};

export type MinhaPosicao = {
  posicao?: number;
  totalColetas?: number;
  totalKg?: number;
  pontos?: number;
};

export async function getTop10(tipo: TipoRanking = "pontos"): Promise<RankingItem[]> {
  const response = await api.get(`/ranking/doadores`, {
    params: { limit: 10, tipo },
  });

  return Array.isArray(response.data?.data)
    ? response.data.data
    : Array.isArray(response.data)
    ? response.data
    : [];
}

export async function getMinhaPosicao(tipo: TipoRanking = "pontos"): Promise<MinhaPosicao | null> {
  const response = await api.get(`/ranking/me`, { params: { tipo } });
  return response.data?.data || response.data || null;
}
