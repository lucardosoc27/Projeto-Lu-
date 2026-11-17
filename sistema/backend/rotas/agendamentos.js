// Rotas dos agendamentos: listar, buscar um, marcar, editar, mudar o status e excluir

const express = require('express');
const banco = require('../banco');
const cripto = require('../cripto');
const { rota, pegarId, texto } = require('../ajuda');

const router = express.Router();

// o campo datetime-local manda "2026-12-15T09:00". No banco fica "2026-12-15 09:00:00"
function converterDataHora(valor) {
  const v = texto(valor);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(v)) return null;
  // confere se a data existe de verdade (31/02 não passa)
  const [ano, mes, dia, hora, minuto] = v.split(/[-T:]/).map(Number);
  const d = new Date(ano, mes - 1, dia, hora, minuto);
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia ||
      d.getHours() !== hora || d.getMinutes() !== minuto) {
    return null;
  }
  return v.replace('T', ' ').slice(0, 16) + ':00';
}

function dadosDoAgendamento(body) {
  return {
    pet_id: Number(body.pet_id),
    data_hora: converterDataHora(body.data_hora),
    servico: texto(body.servico),
    observacao: texto(body.observacao)
  };
}

// valida o agendamento. idAtual é o id quando está editando (pra não dar conflito com ele mesmo)
async function validarAgendamento(dados, idAtual) {
  if (!Number.isInteger(dados.pet_id) || dados.pet_id <= 0) return 'Escolha o pet.';
  const pet = banco.um('SELECT id FROM pet WHERE id = ?', [dados.pet_id]);
  if (!pet) return 'O pet escolhido não existe mais. Atualize a página.';

  if (!dados.data_hora) return 'Escolha uma data e um horário válidos.';
  if (!dados.servico) return 'Escolha o serviço.';
  if (dados.servico.length > 50) return 'Serviço grande demais.';
  if (dados.observacao.length > 255) return 'A observação pode ter até 255 caracteres.';

  let dataAntiga = null;
  if (idAtual) {
    const atual = banco.um('SELECT data_hora, status FROM agendamento WHERE id = ?', [idAtual]);
    if (!atual) return 'Agendamento não encontrado.';
    // REGRA (status): concluído ou cancelado já fechou, não dá mais pra editar
    if (atual.status !== 'Agendado') return 'Só dá pra editar agendamento que ainda está Agendado.';
    dataAntiga = atual.data_hora;
  }

  // REGRA (sem passado): não deixa marcar num horário que já passou
  // (na edição, deixa salvar se a data não mudou, pra poder corrigir a observação)
  const mudouData = dados.data_hora !== dataAntiga;
  if (mudouData && new Date(dados.data_hora.replace(' ', 'T')) < new Date()) {
    return 'Não dá pra marcar num horário que já passou.';
  }

  // (conflito de horário): confere os agendamentos já cadastrados.
  // A clínica atende um por horário. Os cancelados não contam: o horário deles fica livre.
  const conflito = banco.um(
    "SELECT id FROM agendamento WHERE data_hora = ? AND status <> 'Cancelado' AND id <> ?",
    [dados.data_hora, idAtual || 0]
  );
  if (conflito) return 'Já existe um agendamento nesse dia e horário. Escolha outro horário.';

  return null;
}

// (listagem): ordenada pela data, juntando os dados do agendamento, do pet e do tutor
router.get('/agendamentos', rota(async (req, res) => {
  const linhas = banco.todos(`
    SELECT a.id, a.data_hora, a.servico, a.observacao, a.status, a.pet_id,
           p.nome AS pet, p.especie, p.raca, p.idade,
           t.nome AS tutor, t.cpf, t.telefone, t.email
    FROM agendamento a
    JOIN pet p ON p.id = a.pet_id
    JOIN tutor t ON t.id = p.tutor_id
    ORDER BY a.data_hora`);
  res.json(linhas.map((a) => ({ ...a, cpf: cripto.mascarar(cripto.descriptografar(a.cpf)) })));
}));

router.get('/agendamentos/:id', rota(async (req, res) => {
  const agendamento = banco.um('SELECT * FROM agendamento WHERE id = ?', [pegarId(req)]);
  if (!agendamento) return res.status(404).json({ erro: 'Agendamento não encontrado.' });
  res.json(agendamento);
}));

router.post('/agendamentos', rota(async (req, res) => {
  const dados = dadosDoAgendamento(req.body);
  const erro = await validarAgendamento(dados, null);
  if (erro) return res.status(400).json({ erro });

  // (status): todo agendamento novo começa como Agendado
  const resultado = banco.executar(
    "INSERT INTO agendamento (pet_id, data_hora, servico, observacao, status) VALUES (?, ?, ?, ?, 'Agendado')",
    [dados.pet_id, dados.data_hora, dados.servico, dados.observacao || null]
  );
  res.status(201).json({ id: resultado.lastInsertRowid });
}));

// (edição): salva no banco o que foi alterado na tela
router.put('/agendamentos/:id', rota(async (req, res) => {
  const id = pegarId(req);
  const dados = dadosDoAgendamento(req.body);
  const erro = await validarAgendamento(dados, id);
  if (erro) return res.status(400).json({ erro });

  const resultado = banco.executar(
    'UPDATE agendamento SET pet_id = ?, data_hora = ?, servico = ?, observacao = ? WHERE id = ?',
    [dados.pet_id, dados.data_hora, dados.servico, dados.observacao || null, id]
  );
  if (resultado.changes === 0) return res.status(404).json({ erro: 'Agendamento não encontrado.' });
  res.json({ ok: true });
}));

// (status): os botões Concluir e Cancelar só mudam quem ainda está Agendado
router.patch('/agendamentos/:id/status', rota(async (req, res) => {
  const novoStatus = texto(req.body.status);
  if (novoStatus !== 'Concluído' && novoStatus !== 'Cancelado') {
    return res.status(400).json({ erro: 'Status inválido. Use Concluído ou Cancelado.' });
  }

  // o "AND status = 'Agendado'" garante que não dá pra mudar um que já fechou
  const resultado = banco.executar(
    "UPDATE agendamento SET status = ? WHERE id = ? AND status = 'Agendado'",
    [novoStatus, pegarId(req)]
  );
  if (resultado.changes === 0) {
    return res.status(409).json({ erro: 'Esse agendamento não está mais Agendado (ou não existe). Atualize a página.' });
  }
  res.json({ ok: true });
}));

router.delete('/agendamentos/:id', rota(async (req, res) => {
  const resultado = banco.executar('DELETE FROM agendamento WHERE id = ?', [pegarId(req)]);
  if (resultado.changes === 0) return res.status(404).json({ erro: 'Agendamento não encontrado.' });
  res.json({ ok: true });
}));

module.exports = router;
