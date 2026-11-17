// Servidor do sistema da Clínica Veterinária
// Para rodar: npm install (só na primeira vez) e depois npm start

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const config = require('./config');
const { precisaLogin, paginaProtegida } = require('./middleware/login');

const app = express();

// ---------- LIVE SERVER (CORS) ----------
// O Live Server abre as páginas em outra porta (5500). O CORS deixa só esses endereços
// chamarem a API, e o "credentials" deixa o navegador mandar o cookie do login junto.
app.use(cors({ origin: config.enderecosDoFrontend, credentials: true }));

app.use(express.json());

// ---------- LOGIN COM TEMPO DE EXPIRAÇÃO ----------
// (login com expiração): a sessão dura X minutos (config.js).
// O "rolling" faz o tempo começar de novo toda vez que a pessoa mexe no sistema.
// Se ficar parada esse tempo, cai e tem que entrar de novo.
app.use(session({
  secret: config.chaveSecreta,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    maxAge: config.minutosDaSessao * 60 * 1000,
    httpOnly: true,   // o JavaScript da página não consegue ler o cookie
    sameSite: 'lax'
  }
}));

// ---------- ROTAS DA API ----------

// login, logout e "quem está logado": não precisam de login antes
app.use('/api', require('./rotas/login'));

// daqui pra baixo, todas as rotas /api precisam de login
app.use('/api', precisaLogin);
app.use('/api', require('./rotas/resumo'));
app.use('/api', require('./rotas/tutores'));
app.use('/api', require('./rotas/pets'));
app.use('/api', require('./rotas/agendamentos'));
app.use('/api', require('./rotas/usuarios'));

// qualquer outra rota /api que não existe
app.use('/api', (req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

// ---------- PÁGINAS (sem o Live Server) ----------
// O servidor também mostra o frontend, pra funcionar só com o npm start
// abrindo http://localhost:3000. Quem não entrou só consegue abrir o login.
const pastaFrontend = path.join(__dirname, '..', 'frontend');

app.get('/', (req, res) => {
  res.redirect(req.session.usuario ? '/inicio.html' : '/index.html');
});
app.use(paginaProtegida, express.static(pastaFrontend));

// ---------- LIGA O SERVIDOR ----------
app.listen(config.porta, () => {
  console.log(`Sistema rodando em http://localhost:${config.porta}`);
  console.log('Com o Live Server: abra frontend/index.html com "Open with Live Server".');
  console.log(`O login expira depois de ${config.minutosDaSessao} minutos sem mexer.`);
});
