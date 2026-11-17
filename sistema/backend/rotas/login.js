// Rotas de login: entrar, sair e "quem está logado"

const express = require('express');
const bcrypt = require('bcryptjs');
const banco = require('../banco');
const { rota, texto } = require('../ajuda');
const { precisaLogin } = require('../middleware/login');

const router = express.Router();

// (login): e-mail e senha errados mostram mensagem de erro na tela
router.post('/login', rota(async (req, res) => {
  const email = texto(req.body.email).toLowerCase();
  const senha = typeof req.body.senha === 'string' ? req.body.senha : '';

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Preencha o e-mail e a senha.' });
  }

  const usuario = banco.um('SELECT * FROM usuario WHERE email = ?', [email]);

  // a senha do banco é um hash bcrypt: o compare confere sem precisar desfazer o hash
  // mesma mensagem se o e-mail não existe ou se a senha está errada (assim não entrega quem tem conta)
  if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
  }

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
