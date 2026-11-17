// Tela de pets: cadastrar, listar, editar e excluir
// Regra: todo pet precisa estar ligado a um tutor

const form = document.getElementById('formPet');
const mensagem = document.getElementById('mensagem');
const campoId = document.getElementById('id');
const campoTutor = document.getElementById('tutor');
const botaoCancelar = document.getElementById('botaoCancelar');

// preenche a lista de tutores do select
async function carregarTutores() {
  const tutores = await api('/api/tutores');

  if (tutores.length === 0) {
    mostrarMensagem(mensagem, 'Cadastre um tutor primeiro. Não dá pra cadastrar pet sem tutor.', 'erro');
  }

  campoTutor.innerHTML = '<option value="">Escolha o tutor</option>' +
    tutores.map((t) => `<option value="${t.id}">${esc(t.nome)}</option>`).join('');
}

const campoBusca = document.getElementById('busca');
let todosPets = []; // a lista que veio do servidor (a busca filtra em cima dela)

async function carregarPets() {
  try {
    todosPets = await api('/api/pets');
    mostrarPets();
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
  }
}

// monta a tabela, só com os pets que batem com a busca (nome do pet ou do tutor)
function mostrarPets() {
  const tabela = document.getElementById('tabela');
  const busca = normalizar(campoBusca.value);
  const pets = todosPets.filter((p) => normalizar(p.nome).includes(busca) || normalizar(p.tutor).includes(busca));

  if (todosPets.length === 0) {
    tabela.innerHTML = '<tr><td colspan="6">Nenhum pet cadastrado.</td></tr>';
    return;
  }
  if (pets.length === 0) {
    tabela.innerHTML = '<tr><td colspan="6">Nenhum pet encontrado.</td></tr>';
    return;
  }

  tabela.innerHTML = pets.map((p) => `
      <tr>
        <td>${esc(p.nome)}</td>
        <td>${esc(p.especie)}</td>
        <td>${esc(p.raca)}</td>
        <td>${p.idade === null ? '' : esc(p.idade) + ' ano(s)'}</td>
        <td>${esc(p.tutor)}</td>
        <td class="acoes">
          <button type="button" class="pequeno" onclick="editar(${p.id})">Editar</button>
          <button type="button" class="pequeno perigo" onclick="excluir(${p.id})">Excluir</button>
        </td>
      </tr>`).join('');
}

// filtra enquanto digita
campoBusca.addEventListener('input', mostrarPets);

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const dados = {
    nome: document.getElementById('nome').value,
    especie: document.getElementById('especie').value,
    raca: document.getElementById('raca').value,
    idade: document.getElementById('idade').value,
    tutor_id: campoTutor.value
  };

  try {
    if (campoId.value) {
      await api('/api/pets/' + campoId.value, 'PUT', dados);
      mostrarMensagem(mensagem, 'Pet atualizado!', 'ok');
    } else {
      await api('/api/pets', 'POST', dados);
      mostrarMensagem(mensagem, 'Pet cadastrado!', 'ok');
    }
    limparFormulario();
    carregarPets();
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
  }
});

async function editar(id) {
  try {
    const p = await api('/api/pets/' + id);
    campoId.value = p.id;
    document.getElementById('nome').value = p.nome;
    document.getElementById('especie').value = p.especie;
    document.getElementById('raca').value = p.raca || '';
    document.getElementById('idade').value = p.idade === null ? '' : p.idade;
    campoTutor.value = p.tutor_id;

    document.getElementById('tituloForm').textContent = 'Editar pet';
    botaoCancelar.hidden = false;
    mensagem.textContent = '';
    document.getElementById('nome').focus();
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
  }
}

async function excluir(id) {
  if (!confirm('Tem certeza que quer excluir esse pet?')) return;

  try {
    await api('/api/pets/' + id, 'DELETE');
    mostrarMensagem(mensagem, 'Pet excluído.', 'ok');
    if (campoId.value == id) limparFormulario();
    carregarPets();
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
  }
}

function limparFormulario() {
  form.reset();
  campoId.value = '';
  document.getElementById('tituloForm').textContent = 'Cadastrar pet';
  botaoCancelar.hidden = true;
}

botaoCancelar.addEventListener('click', () => {
  limparFormulario();
  mensagem.textContent = '';
});

carregarTutores().then(carregarPets).catch((erro) => mostrarMensagem(mensagem, erro.message, 'erro'));
