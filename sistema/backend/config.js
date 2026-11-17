// Configurações do sistema

module.exports = {
  // arquivo do banco SQLite (fica nesta pasta backend)
  // se apagar esse arquivo, o servidor cria o banco de novo com os dados de exemplo
  arquivoDoBanco: 'saep_db.db',

  // chave usada pra criptografar o CPF dos tutores (LGPD)
  // ATENÇÃO: se trocar essa chave, os CPFs que já estão no banco não abrem mais
  chaveSecreta: 'clinica-vet-saep-2026-chave',

  segredoDaSessao: 'clinica-vet-saep-2026-sessao',

  // tempo que o login dura sem a pessoa mexer no sistema (em minutos)
  minutosDaSessao: 30,

  // porta do servidor (a API fica em http://localhost:3000)
  // se trocar aqui, troque também no frontend/js/endereco.js
  porta: 3000,

  // endereços do Live Server do VS Code que podem chamar a API
  // (se o Live Server abrir em outra porta, coloque ela aqui)
  enderecosDoFrontend: [
    'http://127.0.0.1:5500',
    'http://localhost:5500'
  ]
};
