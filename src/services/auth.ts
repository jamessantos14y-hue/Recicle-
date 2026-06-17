import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";
import {
  getToken,
  removeToken,
  removeUserType,
  setToken,
  setUserType,
} from "./token";

const USER_KEY = "@recicleplus_user";

export type TipoUsuario = "DOADOR" | "COLETOR";

export interface Usuario {
  id?: number;
  nome: string;
  email: string;
  tipo: TipoUsuario | string;
  fotoPerfil?: string | null;
  foto?: string | null;
  pontos?: number;
}

export interface CadastroRequest {
  nome: string;
  email: string;
  senha: string;
  tipo: string;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  status?: number;
  code?: string;
  path?: string;
  timestamp?: string;
  traceId?: string;
}

export interface AuthResponseData {
  id?: number;
  nome?: string;
  email?: string;
  tipo?: string;
  token?: string;
  fotoPerfil?: string | null;
  pontos?: number;
}

function normalizarEmail(email: string): string {
  return String(email || "").trim().toLowerCase();
}

function normalizarSenha(senha: string): string {
  return String(senha || "").trim();
}


function normalizarTipo(tipo: string): TipoUsuario {
  const valor = String(tipo || "").trim().toUpperCase();
  if (valor === "COLETOR") return "COLETOR";
  return "DOADOR";
}

function extrairAuthData(body: any): AuthResponseData {
  if (body?.data && typeof body.data === "object") {
    return {
      token: body.data.token,
      id: body.data.id,
      nome: body.data.nome,
      email: body.data.email,
      tipo: body.data.tipo,
      fotoPerfil: body.data.fotoPerfil,
      pontos: body.data.pontos,
    };
  }

  return {
    token: body?.token,
    id: body?.id,
    nome: body?.nome,
    email: body?.email,
    tipo: body?.tipo,
    fotoPerfil: body?.fotoPerfil,
    pontos: body?.pontos,
  };
}

export async function salvarUsuario(usuario: Usuario): Promise<void> {
  const usuarioNormalizado: Usuario = {
    ...usuario,
    nome: String(usuario.nome || "").trim(),
    email: String(usuario.email || "").trim().toLowerCase(),
    tipo: normalizarTipo(String(usuario.tipo || "DOADOR")),
    fotoPerfil: usuario.fotoPerfil || usuario.foto || null,
    foto: usuario.fotoPerfil || usuario.foto || null,
    pontos: usuario.pontos,
  };


  await AsyncStorage.setItem(USER_KEY, JSON.stringify(usuarioNormalizado));
  await AsyncStorage.setItem("@usuario", JSON.stringify(usuarioNormalizado));

  await AsyncStorage.multiSet([
    ["nomeUsuario", usuarioNormalizado.nome],
    ["emailUsuario", usuarioNormalizado.email],
    ["tipoUsuario", String(usuarioNormalizado.tipo)],
    ["tipo", String(usuarioNormalizado.tipo)],
    ["@tipoUsuario", String(usuarioNormalizado.tipo)],
  ]);

  if (usuarioNormalizado.id != null) {
    await AsyncStorage.multiSet([
      ["usuarioId", String(usuarioNormalizado.id)],
      ["idUsuario", String(usuarioNormalizado.id)],
    ]);
  }

}

export async function carregarSessaoSalva(): Promise<void> {
  const token = await getToken();


  if (token && token.trim() !== "") {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export async function logout(): Promise<void> {

  await AsyncStorage.setItem("@recicleplus_logout_manual", "true");
  await removeToken();
  await removeUserType();
  await removerUsuario();

  delete api.defaults.headers.common.Authorization;

}

export async function fazerCadastro(
  nome: string,
  email: string,
  senha: string,
  tipo: string
): Promise<ApiResponse<AuthResponseData>> {
  const payload: CadastroRequest = {
    nome: String(nome || "").trim(),
    email: normalizarEmail(email),
    senha: normalizarSenha(senha),
    tipo: normalizarTipo(tipo),
  };


  try {
    const response = await api.post<ApiResponse<AuthResponseData>>(
      "/auth/register",
      payload
    );


    const body = response.data || {};
    const data = extrairAuthData(body);

    return {
      ...body,
      data,
    };
  } catch (err: any) {
    throw err;
  }
}

export async function fazerLogin(
  email: string,
  senha: string
): Promise<ApiResponse<AuthResponseData>> {
  const payload: LoginRequest = {
    email: normalizarEmail(email),
    senha: normalizarSenha(senha),
  };


  try {
    const response = await api.post<ApiResponse<AuthResponseData>>(
      "/auth/login",
      payload
    );


    const body = response.data || {};
    const data = extrairAuthData(body);

    const token = String(data?.token || "").trim();


    if (!token) {
      throw new Error("Backend não retornou token no login.");
    }

    const usuario: Usuario = {
      id: data.id,
      nome: String(data?.nome || "").trim(),
      email: String(data?.email || payload.email).trim().toLowerCase(),
      tipo: normalizarTipo(String(data?.tipo || "DOADOR")),
    };


    await setToken(token);
    await setUserType(String(usuario.tipo));
    await AsyncStorage.setItem("@recicleplus_logout_manual", "false");
    await salvarUsuario(usuario);

    api.defaults.headers.common.Authorization = `Bearer ${token}`;


    return {
      ...body,
      data: {
        token,
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: String(usuario.tipo),
      },
    };
  } catch (err: any) {
    throw err;
  }
}

async function removerUsuario(): Promise<void> {

  await AsyncStorage.removeItem("@recicleplus_user");
  await AsyncStorage.removeItem("@usuario");

  await AsyncStorage.multiRemove([
    "nomeUsuario",
    "emailUsuario",
    "tipoUsuario",
    "@tipoUsuario",
    "tipo",
    "usuarioId",
    "idUsuario",
  ]);

}