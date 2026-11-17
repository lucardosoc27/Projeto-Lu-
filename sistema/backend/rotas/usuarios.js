// Rotas dos usuários (funcionários que entram no sistema)

const express = require('express');
const bcrypt = require('bcryptjs');
const banco = require('../banco');
const { rota, texto, emailValido } = require('../ajuda');

const router = express.Router();

router.get('/usuarios', rota(async (req, res) => {
  // a senha (hash) nunca sai daqui
  res.json(banco.todos('SELECT id, nome, email FROM usuario ORDER BY nome'));
}));

// (sem cadastro aberto): esta rota fica depois do precisaLogin no server.js,
// então só quem já está logado consegue cadastrar outro usuário
router.post('/usuarios', rota(async (req, res) => {
  const nome = texto(req.body.nome);
  const email = texto(req.body.email).toLowerCase();
  const senha = typeof req.body.senha === 'string' ? req.body.senha : '';

  if (!nome) return res.status(400).json({ erro: 'Preencha o nome.' });
  if (nome.length > 100) return res.status(400).json({ erro: 'O nome pode ter até 100 caracteres.' });
  if (!emailValido(email) || email.length > 100) return res.status(400).json({ erro: 'E-mail inválido.' });
  if (senha.length < 6 || senha.length > 72) {
    return res.status(400).json({ erro: 'A senha precisa ter de 6 a 72 caracteres.' });
  }

  try {
    // REGRA (senha): guarda só o hash bcrypt da senha (o bcrypt já coloca o "salt" sozinho)
    const hash = await bcrypt.hash(senha, 10);
    const resultado = banco.executar(
      'INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?)',
      [nome, email, hash]
    );
    res.status(201).json({ id: resultado.lastInsertRowid });
  } catch (e) {
    if (banco.ehRepetido(e)) return res.status(409).json({ erro: 'Já existe um usuário com esse e-mail.' });
    throw e;
  }
}));

module.exports = router;
