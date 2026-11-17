// Rotas dos tutores: listar, buscar um, cadastrar, editar e excluir

const express = require('express');
const banco = require('../banco');
const cripto = require('../cripto');
const { rota, pegarId, texto, emailValido } = require('../ajuda');

const router = express.Router();

function dadosDoTutor(body) {
  return {
    nome: texto(body.nome),
    cpf: texto(body.cpf),
    telefone: texto(body.telefone),
    email: texto(body.email)
  };
}

// valida os campos do tutor. Devolve a mensagem de erro, ou null se estiver tudo certo.
// cpfObrigatorio = false na edição: CPF em branco quer dizer "manter o que já está salvo"
function validarTutor(dados, cpfObrigatorio) {
  if (!dados.nome) return 'Preencha o nome do tutor.';
  if (dados.nome.length > 100) return 'O nome pode ter até 100 caracteres.';
  // REGRA (CPF válido): confere os dígitos verificadores
  if (dados.cpf || cpfObrigatorio) {
    if (!cripto.cpfValido(dados.cpf)) return 'CPF inválido. Confira os números.';
  }
  if (!dados.telefone) return 'Preencha o telefone.';
  if (dados.telefone.length > 20) return 'Telefone grande demais.';
  if (dados.email && !emailValido(dados.email)) return 'E-mail inválido.';
  if (dados.email.length > 100) return 'O e-mail pode ter até 100 caracteres.';
  return null;
}

// (LGPD): a API nunca devolve o CPF inteiro.
// Na lista ele vai escondido (***.456.789-**).
router.get('/tutores', rota(async (req, res) => {
  const linhas = banco.todos(`
    SELECT t.id, t.nome, t.cpf, t.telefone, t.email, COUNT(p.id) AS qtd_pets
    FROM tutor t
    LEFT JOIN pet p ON p.tutor_id = t.id
    GROUP BY t.id
    ORDER BY t.nome`);

  res.json(linhas.map((t) => ({
    id: t.id,
    nome: t.nome,
    cpf: cripto.mascarar(cripto.descriptografar(t.cpf)),
    telefone: t.telefone,
    email: t.email,
    qtd_pets: t.qtd_pets
  })));
}));

// um tutor só (pra editar): o CPF também vai escondido
router.get('/tutores/:id', rota(async (req, res) => {
  const t = banco.um('SELECT * FROM tutor WHERE id = ?', [pegarId(req)]);
  if (!t) return res.status(404).json({ erro: 'Tutor não encontrado.' });

  res.json({
    id: t.id,
    nome: t.nome,
    cpf: cripto.mascarar(cripto.descriptografar(t.cpf)),
    telefone: t.telefone,
    email: t.email
  });
}));

router.post('/tutores', rota(async (req, res) => {
  const dados = dadosDoTutor(req.body);
  const erro = validarTutor(dados, true);
  if (erro) return res.status(400).json({ erro });

  try {
    // (LGPD): o CPF é criptografado ANTES de ir pro banco.
    // O cpf_hash é um resumo do CPF que não dá pra desfazer: serve só pro banco recusar CPF repetido.
    const resultado = banco.executar(
      'INSERT INTO tutor (nome, cpf, cpf_hash, telefone, email) VALUES (?, ?, ?, ?, ?)',
      [dados.nome, cripto.criptografar(dados.cpf), cripto.hashDoCpf(dados.cpf), dados.telefone, dados.email || null]
    );
    res.status(201).json({ id: resultado.lastInsertRowid });
  } catch (e) {
    // REGRA (CPF repetido): o banco recusa por causa do UNIQUE no cpf_hash
    if (banco.ehRepetido(e)) return res.status(409).json({ erro: 'Já existe um tutor com esse CPF.' });
    throw e;
  }
}));

// (edição): salva no banco o que foi alterado na tela.
// Se o CPF veio em branco, o CPF salvo continua o mesmo.
router.put('/tutores/:id', rota(async (req, res) => {
  const id = pegarId(req);
  const dados = dadosDoTutor(req.body);
  const erro = validarTutor(dados, false);
  if (erro) return res.status(400).json({ erro });

  try {
    let resultado;
    if (dados.cpf) {
      resultado = banco.executar(
        'UPDATE tutor SET nome = ?, cpf = ?, cpf_hash = ?, telefone = ?, email = ? WHERE id = ?',
        [dados.nome, cripto.criptografar(dados.cpf), cripto.hashDoCpf(dados.cpf), dados.telefone, dados.email || null, id]
      );
    } else {
      resultado = banco.executar(
        'UPDATE tutor SET nome = ?, telefone = ?, email = ? WHERE id = ?',
        [dados.nome, dados.telefone, dados.email || null, id]
      );
    }
    if (resultado.changes === 0) return res.status(404).json({ erro: 'Tutor não encontrado.' });
    res.json({ ok: true });
  } catch (e) {
    if (banco.ehRepetido(e)) return res.status(409).json({ erro: 'Já existe outro tutor com esse CPF.' });
    throw e;
  }
}));

router.delete('/tutores/:id', rota(async (req, res) => {
  try {
    const resultado = banco.executar('DELETE FROM tutor WHERE id = ?', [pegarId(req)]);
    if (resultado.changes === 0) return res.status(404).json({ erro: 'Tutor não encontrado.' });
    res.json({ ok: true });
  } catch (e) {
    // REGRA (exclusão): o banco não deixa apagar tutor que ainda tem pet
    if (banco.estaEmUso(e)) {
      return res.status(409).json({ erro: 'Esse tutor ainda tem pets cadastrados. Apague ou troque o tutor dos pets primeiro.' });
    }
    throw e;
  }
}));

module.exports = router;
