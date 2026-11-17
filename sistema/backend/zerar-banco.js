// Volta o banco pros dados de exemplo (apaga o que foi cadastrado)
// Para usar: npm run zerar   (com o servidor desligado)

const banco = require('./banco');

banco.criarBanco();
console.log('Pronto! O banco voltou pros dados de exemplo do saep_db.sql.');
