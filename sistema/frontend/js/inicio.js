// Tela de início: mostra os números da clínica e os próximos agendamentos

async function carregarResumo() {
  try {
    const resumo = await api('/api/resumo');

    document.getElementById('totalTutores').textContent = resumo.tutores;
    document.getElementById('totalPets').textContent = resumo.pets;
    document.getElementById('totalAgendamentos').textContent = resumo.agendamentos;

    const tabela = document.getElementById('tabelaProximos');

    if (resumo.proximos.length === 0) {
      tabela.innerHTML = '<tr><td colspan="4">Nenhum agendamento marcado.</td></tr>';
      return;
    }

    tabela.innerHTML = resumo.proximos.map((a) => `
      <tr>
        <td>${esc(formatarDataHora(a.data_hora))}</td>
        <td>${esc(a.pet)}</td>
        <td>${esc(a.tutor)}</td>
        <td>${esc(a.servico)}</td>
      </tr>`).join('');
  } catch (erro) {
    mostrarMensagem(document.getElementById('mensagem'), erro.message, 'erro');
  }
}

carregarResumo();
