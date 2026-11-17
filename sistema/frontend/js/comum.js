// Funções que todas as páginas do sistema usam (menos a de login)

// manda pra tela de login uma vez só (se várias chamadas derem 401 ao mesmo tempo)
let indoProLogin = false;
function irProLogin(motivo) {
  if (indoProLogin) return;
  indoProLogin = true;
  location.href = 'index.html?' + motivo + '=1';
}

// faz as chamadas pro servidor, mandando o cookie do login junto (credentials)
// se a sessão tiver expirado (401), manda de volta pro login
async function api(caminho, metodo = 'GET', dados = null) {
  const opcoes = { method: metodo, headers: {}, credentials: 'include' };

  if (dados) {
    opcoes.headers['Content-Type'] = 'application/json';
    opcoes.body = JSON.stringify(dados);
  }

  let resposta;
  try {
    resposta = await fetch(API + caminho, opcoes);
  } catch (erro) {
    throw new Error(SEM_SERVIDOR);
  }

  if (resposta.status === 401) {
    irProLogin('expirou');
    throw new Error('Sua sessão expirou.');
  }

  const corpo = await resposta.json();

  if (!resposta.ok) {
    throw new Error(corpo.erro || 'Algo deu errado.');
  }

  return corpo;
}

// mostra uma mensagem de erro ou de sucesso
function mostrarMensagem(elemento, texto, tipo) {
  elemento.textContent = texto;
  elemento.className = 'mensagem ' + tipo;
}

// escapa o texto antes de colocar no HTML (assim ninguém injeta código pela tabela)
function esc(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// deixa o texto sem acento e minúsculo, pra busca achar "joao" em "João"
function normalizar(texto) {
  return String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// "2026-12-15 09:00:00" vira "15/12/2026 às 09:00"
function formatarDataHora(valor) {
  const [data, hora] = valor.split(' ');
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano} às ${hora.slice(0, 5)}`;
}

// (páginas protegidas): antes de mostrar a página, pergunta pro servidor quem entrou.
// Quem não entrou volta pro login. A página fica escondida (class="carregando") até a resposta chegar.
// Coloca o nome de quem está logado no topo e liga o botão Sair.
async function iniciarMenu() {
  let resposta;
  try {
    resposta = await fetch(API + '/api/eu', { credentials: 'include' });
  } catch (erro) {
    document.body.classList.remove('carregando');
    document.querySelector('main').innerHTML = `<p class="mensagem erro">${SEM_SERVIDOR}</p>`;
    return;
  }

  if (!resposta.ok) {
    irProLogin('entrar');
    return;
  }

  const usuario = await resposta.json();
  document.getElementById('nomeUsuario').textContent = usuario.nome;
  document.body.classList.remove('carregando');

  // (logout): o botão Sair apaga a sessão no servidor
  document.getElementById('botaoSair').addEventListener('click', async () => {
    await fetch(API + '/api/logout', { method: 'POST', credentials: 'include' });
    location.href = 'index.html';
  });
}

iniciarMenu();
