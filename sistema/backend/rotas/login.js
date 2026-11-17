// Rotas de login: entrar, sair e "quem está logado"

const express = require('express');
const bcrypt = require('bcryptjs');
const banco = require('../banco');
const { rota, texto } = require('../ajuda');
const { precisaLogin } = require('../middleware/login');

const router = express.Router();

const MAX_ERROS = 5;
const MINUTOS_BLOQUEADO = 5;
const tentativas = new Map();
const HASH_FALSO = bcrypt.hashSync('senha-que-nao-existe', 10);

// (login): e-mail e senha errados mostram mensagem de erro na tela
router.post('/login', rota(async (req, res) => {
  const email = texto(req.body.email).toLowerCase();
  const senha = typeof req.body.senha === 'string' ? req.body.senha : '';

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Preencha o e-mail e a senha.' });
  }

  const chave = req.ip + '|' + email;
  const registro = tentativas.get(chave);
  if (registro && registro.liberaEm > Date.now()) {
    const minutos = Math.ceil((registro.liberaEm - Date.now()) / 60000);
    return res.status(429).json({ erro: `Muitas tentativas erradas. Espere ${minutos} minuto(s) e tente de novo.` });
  }

  const usuario = banco.um('SELECT * FROM usuario WHERE email = ?', [email]);

  // a senha do banco é um hash bcrypt: o compare confere sem precisar desfazer o hash
  // mesma mensagem se o e-mail não existe ou se a senha está errada (assim não entrega quem tem conta)
  const senhaCerta = await bcrypt.compare(senha, usuario ? usuario.senha : HASH_FALSO);
  if (!usuario || !senhaCerta) {
    let atual = registro || { erros: 0, liberaEm: 0 };
    if (atual.liberaEm && atual.liberaEm <= Date.now()) atual = { erros: 0, liberaEm: 0 };
    atual.erros++;
    if (atual.erros >= MAX_ERROS) {
      atual.erros = 0;
      atual.liberaEm = Date.now() + MINUTOS_BLOQUEADO * 60000;
    }
    tentativas.set(chave, atual);
    return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
  }

  tentativas.delete(chave);

  // cria uma sessão nova depois do login (mais seguro)
  req.session.regenerate((erro) => {
    if (erro) return res.status(500).json({ erro: 'Não deu pra entrar agora. Tente de novo.' });
    req.session.usuario = { id: usuario.id, nome: usuario.nome };
    res.json({ nome: usuario.nome });
  });
}));

// REGRA (logout): o botão Sair apaga a sessão no servidor
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// quem está logado agora (as páginas usam pra mostrar o nome e pra saber se pode abrir)
router.get('/eu', precisaLogin, (req, res) => {
  res.json(req.session.usuario);
});

module.exports = router;
