// Tela de tutores: cadastrar, listar, editar e excluir

const form = document.getElementById('formTutor');
const mensagem = document.getElementById('mensagem');
const campoId = document.getElementById('id');
const campoCpf = document.getElementById('cpf');
const botaoCancelar = document.getElementById('botaoCancelar');
const dicaCpf = document.getElementById('dicaCpf');

// coloca ponto e traço no CPF enquanto digita
campoCpf.addEventListener('input', () => {
  let c = campoCpf.value.replace(/\D/g, '').slice(0, 11);
  if (c.length > 9) c = c.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  else if (c.length > 6) c = c.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  else if (c.length > 3) c = c.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  campoCpf.value = c;
});

const campoBusca = document.getElementById('busca');
let todosTutores = []; // a lista que veio do servidor (a busca filtra em cima dela)

// busca os tutores no servidor
async function carregarTutores() {
  try {
    todosTutores = await api('/api/tutores');
    mostrarTutores();
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
  }
}

// monta a tabela, só com os tutores que batem com a busca
function mostrarTutores() {
  const tabela = document.getElementById('tabela');
  const busca = normalizar(campoBusca.value);
  const tutores = todosTutores.filter((t) => normalizar(t.nome).includes(busca));

  if (todosTutores.length === 0) {
    tabela.innerHTML = '<tr><td colspan="6">Nenhum tutor cadastrado.</td></tr>';
    return;
  }
  if (tutores.length === 0) {
    tabela.innerHTML = '<tr><td colspan="6">Nenhum tutor encontrado com esse nome.</td></tr>';
    return;
  }

  tabela.innerHTML = tutores.map((t) => `
      <tr>
        <td>${esc(t.nome)}</td>
        <td>${esc(t.cpf)}</td>
        <td>${esc(t.telefone)}</td>
        <td>${esc(t.email)}</td>
        <td>${esc(t.qtd_pets)}</td>
        <td class="acoes">
          <button type="button" class="pequeno" onclick="editar(${t.id})">Editar</button>
          <button type="button" class="pequeno perigo" onclick="excluir(${t.id})">Excluir</button>
        </td>
      </tr>`).join('');
}

// filtra enquanto digita
campoBusca.addEventListener('input', mostrarTutores);

document.getElementById('formBusca').addEventListener('submit', (evento) => {
  evento.preventDefault();
  mostrarTutores();
});

// salvar: se tem id é edição (PUT), se não tem é cadastro novo (POST)
form.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const dados = {
    nome: document.getElementById('nome').value,
    cpf: campoCpf.value,
    telefone: document.getElementById('telefone').value,
    email: document.getElementById('email').value
  };

  try {
    if (campoId.value) {
      await api('/api/tutores/' + campoId.value, 'PUT', dados);
      mostrarMensagem(mensagem, 'Tutor atualizado!', 'ok');
    } else {
      await api('/api/tutores', 'POST', dados);
      mostrarMensagem(mensagem, 'Tutor cadastrado!', 'ok');
    }
    limparFormulario();
    carregarTutores();
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
  }
});

// joga os dados do tutor no formulário pra editar
async function editar(id) {
  try {
    const t = await api('/api/tutores/' + id);
    campoId.value = t.id;
    document.getElementById('nome').value = t.nome;
    // REGRA (LGPD): o CPF não volta inteiro do servidor. O campo fica vazio e mostra o CPF escondido.
    // Em branco = manter o CPF salvo
    campoCpf.value = '';
    campoCpf.placeholder = t.cpf;
    campoCpf.required = false;
    dicaCpf.hidden = false;
    document.getElementById('telefone').value = t.telefone;
    document.getElementById('email').value = t.email || '';

    document.getElementById('tituloForm').textContent = 'Editar tutor';
    botaoCancelar.hidden = false;
    mensagem.textContent = '';
    document.getElementById('nome').focus();
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
  }
}

async function excluir(id) {
  if (!confirm('Tem certeza que quer excluir esse tutor?')) return;

  try {
    await api('/api/tutores/' + id, 'DELETE');
    mostrarMensagem(mensagem, 'Tutor excluído.', 'ok');
    if (campoId.value == id) limparFormulario();
    carregarTutores();
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
  }
}

function limparFormulario() {
  form.reset();
  campoId.value = '';
  campoCpf.placeholder = '000.000.000-00';
  campoCpf.required = true;
  dicaCpf.hidden = true;
  document.getElementById('tituloForm').textContent = 'Cadastrar tutor';
  botaoCancelar.hidden = true;
}

botaoCancelar.addEventListener('click', () => {
  limparFormulario();
  mensagem.textContent = '';
});

carregarTutores();
