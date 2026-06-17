# Ajustes feitos nesta versão

## Segurança da sessão
- Mantido `expo-secure-store` para salvar o token JWT.
- Corrigida a chave do SecureStore: antes havia chave com `@`, que é inválida no SecureStore.
- Nova chave segura: `recicleplus_token`.
- Tokens antigos em AsyncStorage (`@recicleplus_token`, `token`, `recicleplus_token`) são migrados automaticamente para SecureStore.
- Ao limpar dados/sair, o token seguro também é removido.

## Mapa e coletas
- Coletor vê somente:
  - doações `PENDENTE` sem coletor;
  - doações `ACEITA`, `EM_ROTA` ou `AGUARDANDO_CONFIRMACAO` atribuídas a ele.
- Coletas aceitas por outro coletor deixam de aparecer para o coletor logado.
- O limite de 3 coletas agora conta somente as coletas do próprio coletor.
- O mapa evita recentralizar sozinho a cada atualização de GPS; ele centraliza de forma controlada quando muda a doação ativa.
- O envio da localização do coletor continua restrito a doações realmente aceitas/em rota/aguardando confirmação.

## Build
- `app.config.js` aceita `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` e também mantém fallback para `MAPBOX_DOWNLOADS_TOKEN`.
- O ZIP foi gerado sem `node_modules`, ideal para instalar dependências limpas antes do build.
