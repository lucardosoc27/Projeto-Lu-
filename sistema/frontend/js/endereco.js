// Endereço da API (o backend)
// - Página aberta pelo próprio servidor (http://localhost:3000): usa o mesmo endereço.
// - Página aberta pelo Live Server do VS Code (porta 5500): chama a API na porta 3000.
//   Usa o mesmo nome que está na barra do navegador (127.0.0.1 ou localhost),
//   senão o navegador não manda o cookie do login junto.

const PORTA_DA_API = 3000; // a mesma do backend/config.js

const API = location.port === String(PORTA_DA_API) ? '' : `http://${location.hostname}:${PORTA_DA_API}`;

// mensagem pra quando o backend não está rodando
const SEM_SERVIDOR = 'Não deu pra falar com o servidor. Confira se o backend está rodando (npm start na pasta backend).';
