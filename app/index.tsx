import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken } from "@/src/services/token";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { carregarSessaoSalva } from "@/src/services/auth";

export default function Index() {
  const [destino, setDestino] = useState<string | null>(null);

  useEffect(() => {
    async function verificarSessao() {
      try {
        await carregarSessaoSalva();

        const token = await getToken();

        const onboardingJaVisto = await AsyncStorage.getItem(
          "@recicleplus_onboarding_visto"
        );

        if (token && token.trim() !== "") {
          setDestino("/home");
          return;
        }

        if (onboardingJaVisto === "true") {
          const saiuManual = await AsyncStorage.getItem("@recicleplus_logout_manual");
          setDestino(saiuManual === "true" ? "/login" : "/cadastro");
        } else {
          setDestino("/onboarding");
        }
      } catch (error) {
        setDestino("/cadastro");
      }
    }

    verificarSessao();
  }, []);

  if (!destino) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#12A67E",
        }}
      >
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    );
  }

  return <Redirect href={destino as any} />;
}