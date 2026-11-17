// Tela de login

const formLogin = document.getElementById('formLogin');
const mensagem = document.getElementById('mensagem');

// se veio pra cá porque a sessão expirou ou porque tentou abrir uma página sem entrar, avisa
if (location.search.includes('expirou')) {
  mensagem.textContent = 'Sua sessão expirou. Entre de novo.';
  mensagem.className = 'mensagem erro';
} else if (location.search.includes('entrar')) {
  mensagem.textContent = 'Entre no sistema para continuar.';
  mensagem.className = 'mensagem erro';
}

// se já está logado, vai direto pro início
fetch(API + '/api/eu', { credentials: 'include' })
  .then((resposta) => { if (resposta.ok) location.href = 'inicio.html'; })
  .catch(() => {}); // servidor desligado: o erro aparece quando tentar entrar

// REGRA (login): e-mail ou senha errados mostram a mensagem de erro do servidor
formLogin.addEventListener('submit', async (evento) => {
  evento.preventDefault(); // não deixa a página recarregar

  mensagem.textContent = '';

  try {
    const resposta = await fetch(API + '/api/login', {
      method: 'POST',
      credentials: 'include', // pra o navegador guardar o cookie do login
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('email').value,
        senha: document.getElementById('senha').value
      })
    });

    if (resposta.ok) {
      location.href = 'inicio.html';
    } else {
      const dados = await resposta.json();
      mensagem.textContent = dados.erro;
      mensagem.className = 'mensagem erro';
    }
  } catch (erro) {
    mensagem.textContent = SEM_SERVIDOR;
    mensagem.className = 'mensagem erro';
  }
});
