// Rotas dos pets: listar, buscar um, cadastrar, editar e excluir

const express = require('express');
const banco = require('../banco');
const { rota, pegarId, texto } = require('../ajuda');

const router = express.Router();

function dadosDoPet(body) {
  return {
    nome: texto(body.nome),
    especie: texto(body.especie),
    raca: texto(body.raca),
    idade: body.idade === '' || body.idade === null || body.idade === undefined ? null : Number(body.idade),
    tutor_id: Number(body.tutor_id)
  };
}

async function validarPet(dados) {
  if (!dados.nome) return 'Preencha o nome do pet.';
  if (dados.nome.length > 100) return 'O nome pode ter até 100 caracteres.';
  if (!dados.especie) return 'Preencha a espécie (cachorro, gato...).';
  if (dados.especie.length > 50 || dados.raca.length > 50) return 'Espécie e raça podem ter até 50 caracteres.';
  if (dados.idade !== null && (!Number.isInteger(dados.idade) || dados.idade < 0 || dados.idade > 40)) {
    return 'Idade inválida (de 0 a 40 anos).';
  }
  // REGRA (pet com tutor): todo pet tem que ter um tutor, e o tutor tem que existir
  if (!Number.isInteger(dados.tutor_id) || dados.tutor_id <= 0) return 'Escolha o tutor do pet. É obrigatório.';
  const tutor = banco.um('SELECT id FROM tutor WHERE id = ?', [dados.tutor_id]);
  if (!tutor) return 'O tutor escolhido não existe mais. Atualize a página.';
  return null;
}

router.get('/pets', rota(async (req, res) => {
  res.json(banco.todos(`
    SELECT p.id, p.nome, p.especie, p.raca, p.idade, p.tutor_id, t.nome AS tutor
    FROM pet p
    JOIN tutor t ON t.id = p.tutor_id
    ORDER BY p.nome`));
}));

router.get('/pets/:id', rota(async (req, res) => {
  const pet = banco.um('SELECT * FROM pet WHERE id = ?', [pegarId(req)]);
  if (!pet) return res.status(404).json({ erro: 'Pet não encontrado.' });
  res.json(pet);
}));

router.post('/pets', rota(async (req, res) => {
  const dados = dadosDoPet(req.body);
  const erro = await validarPet(dados);
  if (erro) return res.status(400).json({ erro });

  const resultado = banco.executar(
    'INSERT INTO pet (nome, especie, raca, idade, tutor_id) VALUES (?, ?, ?, ?, ?)',
    [dados.nome, dados.especie, dados.raca || null, dados.idade, dados.tutor_id]
  );
  res.status(201).json({ id: resultado.lastInsertRowid });
}));

// (edição): salva no banco o que foi alterado na tela
router.put('/pets/:id', rota(async (req, res) => {
  const dados = dadosDoPet(req.body);
  const erro = await validarPet(dados);
  if (erro) return res.status(400).json({ erro });

  const resultado = banco.executar(
    'UPDATE pet SET nome = ?, especie = ?, raca = ?, idade = ?, tutor_id = ? WHERE id = ?',
    [dados.nome, dados.especie, dados.raca || null, dados.idade, dados.tutor_id, pegarId(req)]
  );
  if (resultado.changes === 0) return res.status(404).json({ erro: 'Pet não encontrado.' });
  res.json({ ok: true });
}));

router.delete('/pets/:id', rota(async (req, res) => {
  try {
    const resultado = banco.executar('DELETE FROM pet WHERE id = ?', [pegarId(req)]);
    if (resultado.changes === 0) return res.status(404).json({ erro: 'Pet não encontrado.' });
    res.json({ ok: true });
  } catch (e) {
    // (exclusão): o banco não deixa apagar pet que ainda tem agendamento
    if (banco.estaEmUso(e)) {
      return res.status(409).json({ erro: 'Esse pet tem agendamentos. Apague os agendamentos dele primeiro.' });
    }
    throw e;
  }
}));

module.exports = router;
