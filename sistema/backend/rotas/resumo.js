// Resumo da clínica (tela de início)

const express = require('express');
const banco = require('../banco');
const { rota } = require('../ajuda');

const router = express.Router();

// (início): os totais e os próximos agendamentos.
// Só entram os agendamentos com status Agendado que ainda vão acontecer.
router.get('/resumo', rota(async (req, res) => {
  // datetime('now', 'localtime') é a data e a hora de agora, no fuso do computador
  const { tutores } = banco.um('SELECT COUNT(*) AS tutores FROM tutor');
  const { pets } = banco.um('SELECT COUNT(*) AS pets FROM pet');
  const { agendamentos } = banco.um(
    "SELECT COUNT(*) AS agendamentos FROM agendamento WHERE data_hora >= datetime('now', 'localtime') AND status = 'Agendado'");

  const proximos = banco.todos(`
    SELECT a.id, a.data_hora, a.servico, p.nome AS pet, t.nome AS tutor
    FROM agendamento a
    JOIN pet p ON p.id = a.pet_id
    JOIN tutor t ON t.id = p.tutor_id
    WHERE a.data_hora >= datetime('now', 'localtime') AND a.status = 'Agendado'
    ORDER BY a.data_hora
    LIMIT 5`);

  res.json({ tutores, pets, agendamentos, proximos });
}));

module.exports = router;
