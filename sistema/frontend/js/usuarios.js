// Tela de usuários: cadastrar funcionário novo e ver a lista

const form = document.getElementById('formUsuario');
const mensagem = document.getElementById('mensagem');

async function carregarUsuarios() {
  try {
    const usuarios = await api('/api/usuarios');
    document.getElementById('tabela').innerHTML = usuarios.map((u) => `
      <tr>
        <td>${esc(u.nome)}</td>
        <td>${esc(u.email)}</td>
      </tr>`).join('');
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
  }
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  try {
    await api('/api/usuarios', 'POST', {
      nome: document.getElementById('nome').value,
      email: document.getElementById('email').value,
      senha: document.getElementById('senha').value
    });
    mostrarMensagem(mensagem, 'Usuário cadastrado! Ele já pode entrar no sistema.', 'ok');
    form.reset();
    carregarUsuarios();
  } catch (erro) {
    mostrarMensagem(mensagem, erro.message, 'erro');
  }
});

carregarUsuarios();
