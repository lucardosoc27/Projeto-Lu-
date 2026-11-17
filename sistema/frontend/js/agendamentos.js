// Tela de agendamentos: cadastrar, listar, editar e excluir
// Regra: não pode ter dois agendamentos no mesmo dia e horário (o servidor confere)

const form = document.getElementById('formAgendamento');
const mensagem = document.getElementById('mensagem');
const campoId = document.getElementById('id');
const campoPet = document.getElementById('pet');
const campoDataHora = document.getElementById('dataHora');
const botaoCancelar = document.getElementById('botaoCancelar');

// o calendário não deixa escolher data que já passou (o servidor também confere)
function travarDatasPassadas() {
  const agora = new Date();
  agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
  campoDataHora.min = agora.toISOString().slice(0, 16);
}

async function carregarPets() {
  const pets = await api('/api/pets');

  if (pets.length === 0) {
    mostrarMensagem(mensagem, 'Cadastre um pet primeiro para poder agendar.', 'erro');
  }

  campoPet.innerHTML = '<option value="">Escolha o pet</option>' +
    pets.map((p) => `<option value="${p.id}">${esc(p.nome)} (tutor: ${esc(p.tutor)})</option>`).join('');
}

const filtroStatus = document.getElementById('filtroStatus');
let todosAgendamentos = []; // a lista que veio do servidor (o filtro trabalha em cima dela)

// classe da etiqueta colorida de cada status
const corDoStatus = { 'Agendado': 'status-agendado', 'Concluído': 'status-concluido', 'Cancelado': 'status-cancelado' };

async function carregarAgendamentos() {
  try {
    todosAgendamentos = await api('/api/agendamentos');
    mostrarAgendamentos();
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
  }
}

// monta a tabela, só com o status escolhido no filtro
// (a lista já vem ordenada pela data lá do servidor)
function mostrarAgendamentos() {
  const tabela = document.getElementById('tabela');
  const status = filtroStatus.value;
  const agendamentos = todosAgendamentos.filter((a) => !status || a.status === status);

  if (agendamentos.length === 0) {
    tabela.innerHTML = '<tr><td colspan="8">Nenhum agendamento por aqui.</td></tr>';
    return;
  }

  tabela.innerHTML = agendamentos.map((a) => {
    // os botões só aparecem para quem ainda está Agendado
    const acoes = a.status === 'Agendado'
      ? `<button type="button" class="pequeno" onclick="editar(${a.id})">Editar</button>
         <button type="button" class="pequeno concluir" onclick="mudarStatus(${a.id}, 'Concluído')">Concluir</button>
         <button type="button" class="pequeno secundario" onclick="mudarStatus(${a.id}, 'Cancelado')">Cancelar</button>`
      : '';
    return `
      <tr>
        <td>${esc(formatarDataHora(a.data_hora))}</td>
        <td>${esc(a.pet)}<span class="detalhe">${esc(dadosDoPet(a))}</span></td>
        <td>${esc(a.tutor)}<span class="detalhe">CPF ${esc(a.cpf)}</span><span class="detalhe">${esc(a.email || 'sem e-mail')}</span></td>
        <td class="sem-quebra">${esc(a.telefone)}</td>
        <td>${esc(a.servico)}</td>
        <td>${esc(a.observacao)}</td>
        <td><span class="status ${corDoStatus[a.status] || ''}">${esc(a.status)}</span></td>
        <td class="acoes">
          ${acoes}
          <button type="button" class="pequeno perigo" onclick="excluir(${a.id})">Excluir</button>
        </td>
      </tr>`;
  }).join('');
}

filtroStatus.addEventListener('change', mostrarAgendamentos);

function dadosDoPet(a) {
  const partes = [a.especie];
  if (a.raca) partes.push(a.raca);
  if (a.idade !== null && a.idade !== undefined) partes.push(a.idade === 1 ? '1 ano' : a.idade + ' anos');
  return partes.join(', ');
}

// Concluir ou Cancelar
async function mudarStatus(id, novoStatus) {
  const pergunta = novoStatus === 'Cancelado'
    ? 'Cancelar esse agendamento? O horário fica livre para outro pet.'
    : 'Marcar esse agendamento como concluído?';
  if (!confirm(pergunta)) return;

  try {
    await api('/api/agendamentos/' + id + '/status', 'PATCH', { status: novoStatus });
    mostrarMensagem(mensagem, novoStatus === 'Cancelado' ? 'Agendamento cancelado.' : 'Agendamento concluído!', 'ok');
    if (campoId.value == id) limparFormulario();
    carregarAgendamentos();
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
  }
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const dados = {
    pet_id: campoPet.value,
    data_hora: campoDataHora.value,
    servico: document.getElementById('servico').value,
    observacao: document.getElementById('observacao').value
  };

  try {
    if (campoId.value) {
      await api('/api/agendamentos/' + campoId.value, 'PUT', dados);
      mostrarMensagem(mensagem, 'Agendamento atualizado!', 'ok');
    } else {
      await api('/api/agendamentos', 'POST', dados);
      mostrarMensagem(mensagem, 'Agendamento marcado!', 'ok');
    }
    limparFormulario();
    carregarAgendamentos();
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
  }
});

async function editar(id) {
  try {
    const a = await api('/api/agendamentos/' + id);
    campoId.value = a.id;
    campoPet.value = a.pet_id;
    // "2026-12-15 09:00:00" vira "2026-12-15T09:00", que é o formato do campo
    campoDataHora.min = ''; // libera pra editar agendamento antigo
    campoDataHora.value = a.data_hora.replace(' ', 'T').slice(0, 16);
    document.getElementById('servico').value = a.servico;
    document.getElementById('observacao').value = a.observacao || '';

    document.getElementById('tituloForm').textContent = 'Editar agendamento';
    botaoCancelar.hidden = false;
    mensagem.textContent = '';
    campoPet.focus();
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
  }
}

async function excluir(id) {
  if (!confirm('Tem certeza que quer excluir esse agendamento?')) return;

  try {
    await api('/api/agendamentos/' + id, 'DELETE');
    mostrarMensagem(mensagem, 'Agendamento excluído.', 'ok');
    if (campoId.value == id) limparFormulario();
    carregarAgendamentos();
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
  }
}

function limparFormulario() {
  form.reset();
  campoId.value = '';
  document.getElementById('tituloForm').textContent = 'Novo agendamento';
  botaoCancelar.hidden = true;
  travarDatasPassadas();
}

botaoCancelar.addEventListener('click', () => {
  limparFormulario();
  mensagem.textContent = '';
});

travarDatasPassadas();
carregarPets().then(carregarAgendamentos).catch((erro) => mostrarMensagem(mensagem, erro.message, 'erro'));
