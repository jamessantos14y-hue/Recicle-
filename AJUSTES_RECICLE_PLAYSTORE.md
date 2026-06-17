# Recicle+ - Front alinhado com backend de produção

## Backend esperado

O backend em produção está em:

- `https://reciclemais.app.br`

Rotas reais usadas pelo app:

- `POST /auth/register`
- `POST /auth/login`
- `GET /doacoes`
- `POST /doacoes/casa`
- `PATCH /doacoes/{id}/aceitar`
- `PATCH /doacoes/{id}/em-rota`
- `PATCH /doacoes/{id}/coleta-realizada`
- `PATCH /doacoes/{id}/confirmar-coleta`
- `POST /rastreamento/{id}/coletor`
- `GET /notificacoes/me`
- `GET /notificacoes/nao-lidas/count`

O front foi ajustado para não usar `/api` no começo das rotas. Mesmo se `EXPO_PUBLIC_API_URL` for preenchido por engano como `https://reciclemais.app.br/api`, o app remove esse `/api` automaticamente.

## Fluxo validado no front

### Cadastro do doador

- A tela de cadastro cria apenas usuário `DOADOR`.
- O CPF é obrigatório e enviado como 11 números, como o backend exige.
- Após cadastrar, o app faz login automaticamente e salva token no `SecureStore`.

### Login

- Funciona para `DOADOR` e `COLETOR`.
- O coletor não é cadastrado pelo app; ele deve existir no banco.
- Token fica no `SecureStore` e o tipo do usuário fica no `AsyncStorage` para direcionar o fluxo.

### Mapa

- O mapa busca `/doacoes` a cada 10 segundos.
- O coletor vê doações pendentes e coletas dele.
- O coletor vê a própria localização e uma linha simples até a doação selecionada.
- O app envia a localização do coletor para `/rastreamento/{id}/coletor` quando ele tem coleta ativa.
- O doador consegue confirmar coleta pelo mapa quando a doação está em `AGUARDANDO_CONFIRMACAO`.

### Doação em casa

- Captura localização com Expo Location.
- Envia material, quantidade, endereço e latitude/longitude para `/doacoes/casa`.
- Após criar doação, volta para a tela anterior e atualiza mapa/coletas.

### Tela de coletas

- Apenas `COLETOR` acessa.
- Permite aceitar doação, colocar em rota e marcar coleta realizada.
- Depois de colocar em rota, abre o mapa.
- Depois de aceitar, a lista local recebe os dados completos retornados pelo backend.

## Build AAB

No front:

```bash
npm install
npx expo start -c
npx eas build --platform android --profile production --clear-cache
```

Confirme no EAS env:

```env
EXPO_PUBLIC_API_URL=https://reciclemais.app.br
EXPO_PUBLIC_WS_URL=wss://reciclemais.app.br/ws
EXPO_PUBLIC_MAPBOX_TOKEN=SEU_TOKEN_PUBLICO_MAPBOX
MAPBOX_DOWNLOADS_TOKEN=SEU_TOKEN_SECRETO_MAPBOX_DOWNLOADS
```
