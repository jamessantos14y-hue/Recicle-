import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// SecureStore só aceita letras, números, '.', '-' e '_'.
// Não use '@' aqui, pois isso causa: Invalid key provided to SecureStore.
const TOKEN_KEY = "recicleplus_token";

// Chaves antigas usadas no AsyncStorage. Mantemos para migração/limpeza.
const LEGACY_TOKEN_KEYS = ["@recicleplus_token", "token", "recicleplus_token"];

const USER_TYPE_KEY = "@recicleplus_user_type";

function limparValor(valor?: string | null): string | null {
  const texto = String(valor || "").trim();
  return texto ? texto : null;
}

// ================= TOKEN =================

export async function setToken(token: string): Promise<void> {
  const valor = limparValor(token);

  if (!valor) {
    throw new Error("Token vazio. Não foi possível salvar a sessão.");
  }

  const disponivel = await SecureStore.isAvailableAsync();

  if (!disponivel) {
    throw new Error("SecureStore indisponível neste dispositivo.");
  }

  await SecureStore.setItemAsync(TOKEN_KEY, valor);

  // Remove cópias antigas/inseguras do AsyncStorage.
  await AsyncStorage.multiRemove(LEGACY_TOKEN_KEYS);
}

export async function getToken(): Promise<string | null> {
  const disponivel = await SecureStore.isAvailableAsync();

  if (disponivel) {
    const secureToken = limparValor(await SecureStore.getItemAsync(TOKEN_KEY));

    if (secureToken) {
      return secureToken;
    }
  }

  // Migração automática: se ainda existir token antigo no AsyncStorage,
  // move para o SecureStore com a chave correta e apaga do AsyncStorage.
  for (const key of LEGACY_TOKEN_KEYS) {
    const legacyToken = limparValor(await AsyncStorage.getItem(key));

    if (legacyToken) {
      if (disponivel) {
        await SecureStore.setItemAsync(TOKEN_KEY, legacyToken);
        await AsyncStorage.multiRemove(LEGACY_TOKEN_KEYS);
      }

      return legacyToken;
    }
  }

  return null;
}

export async function removeToken(): Promise<void> {
  const disponivel = await SecureStore.isAvailableAsync();

  if (disponivel) {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }

  await AsyncStorage.multiRemove(LEGACY_TOKEN_KEYS);
}

// ================= TIPO USUÁRIO =================

export async function setUserType(tipo: string): Promise<void> {
  const valor = String(tipo || "").trim().toUpperCase();

  if (!valor) return;

  // Tipo de usuário não é tão sensível quanto o token,
  // pode continuar no AsyncStorage para manter compatibilidade com o app.
  await AsyncStorage.multiSet([
    [USER_TYPE_KEY, valor],
    ["tipoUsuario", valor],
    ["tipo", valor],
    ["@tipoUsuario", valor],
  ]);
}

export async function getUserType(): Promise<string | null> {
  const tipo =
    (await AsyncStorage.getItem(USER_TYPE_KEY)) ||
    (await AsyncStorage.getItem("tipoUsuario")) ||
    (await AsyncStorage.getItem("tipo")) ||
    (await AsyncStorage.getItem("@tipoUsuario"));

  if (!tipo || tipo.trim() === "") return null;

  return tipo;
}

export async function removeUserType(): Promise<void> {
  await AsyncStorage.multiRemove([
    USER_TYPE_KEY,
    "tipoUsuario",
    "tipo",
    "@tipoUsuario",
  ]);
}

export async function clearAuthStorage(): Promise<void> {
  await removeToken();
  await removeUserType();
}
