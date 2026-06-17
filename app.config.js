module.exports = {
  expo: {
    name: "Recicle+",
    slug: "recicleplus",
    owner: "reciclemais",
    version: "1.0.6",
    orientation: "portrait",
    scheme: "recicleplus",
    userInterfaceStyle: "automatic",
    assetBundlePatterns: ["**/*"],
    newArchEnabled: true,

    icon: "./src/assets/icon.png",

    splash: {
      image: "./src/assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#80C865",
    },

    android: {
      package: "com.recicleplus.app",
      versionCode: 76,
      usesCleartextTraffic: false,
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "INTERNET",
      ],
      adaptiveIcon: {
        foregroundImage: "./src/assets/adaptive-icon.png",
        backgroundColor: "#80C865",
      },
    },

    ios: {
      bundleIdentifier: "com.recicleplus.app",
      supportsTablet: false,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "O Recicle+ usa sua localização para mostrar doações de materiais recicláveis próximas, ajudar o doador a cadastrar o local de retirada e calcular rotas para coletores. Por exemplo, quando um coletor aceita uma doação, o app usa a localização para mostrar o caminho até o endereço de retirada.",

        NSPhotoLibraryUsageDescription:
          "O Recicle+ usa acesso à sua galeria para permitir que você escolha uma foto dos materiais recicláveis ao criar uma doação. Por exemplo, o doador pode adicionar uma foto de papelão, plástico, metal ou outros itens recicláveis para ajudar o coletor a identificar o material antes da retirada.",

        NSPhotoLibraryAddUsageDescription:
          "O Recicle+ pode salvar imagens relacionadas às suas doações na sua galeria somente quando você escolher salvar ou baixar essas imagens.",

        ITSAppUsesNonExemptEncryption: false,
      },
    },

    plugins: [
      "expo-router",
      "expo-secure-store",
      "expo-font",

      [
        "expo-image-picker",
        {
          photosPermission:
            "O Recicle+ usa acesso à sua galeria para permitir que você escolha uma foto dos materiais recicláveis ao criar uma doação. Por exemplo, o doador pode adicionar uma foto de papelão, plástico, metal ou outros itens recicláveis para ajudar o coletor a identificar o material antes da retirada.",
        },
      ],

      [
        "@rnmapbox/maps",
        {
          RNMAPBOX_MAPS_DOWNLOAD_TOKEN:
            process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN ||
            process.env.MAPBOX_DOWNLOADS_TOKEN,
        },
      ],

      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "O Recicle+ usa sua localização para mostrar doações de materiais recicláveis próximas, ajudar o doador a cadastrar o local de retirada e calcular rotas para coletores. Por exemplo, quando um coletor aceita uma doação, o app usa a localização para mostrar o caminho até o endereço de retirada.",
        },
      ],
    ],

    extra: {
      eas: {
        projectId: "7bb1d3a9-701f-485a-bdef-c28de5464a7b",
      },
    },
  },
};