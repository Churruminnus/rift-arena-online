# RIFT Arena Online

Arena 1x1 para navegador e Android. O servidor Node mantém a simulação da partida e o PlayFab valida a sessão de cada jogador antes de criar a sessão local do jogo.

## Variáveis do servidor

Configure somente no ambiente do Render:

- `PLAYFAB_TITLE_ID`: identificador público do título PlayFab.
- `PLAYFAB_SECRET_KEY`: chave administrativa do servidor. Nunca coloque este valor no aplicativo, no Git ou no navegador.
- `RIFT_DATA_FILE`: caminho persistente para os perfis e amizades, quando houver disco anexado.

O cliente usa `playfab-config.js` apenas com o Title ID e autentica pela API de cliente. O servidor valida cada SessionTicket em `POST /api/auth/playfab` com `AuthenticateSessionTicket` antes de emitir sua sessão do jogo.
