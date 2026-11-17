// Conexão com o banco SQLite
// O SQLite é um banco que fica num arquivo só (saep_db.db), dentro desta pasta
// Ele já vem dentro do Node.js (versão 22.5 ou mais nova): não precisa instalar

const fs = require('fs');
const path = require('path');
const config = require('./config');

let DatabaseSync;
try {
  ({ DatabaseSync } = require('node:sqlite'));
} catch (erro) {
  console.error(`Este sistema precisa do Node.js 22.5 ou mais novo (o SQLite vem junto com ele).`);
  console.error(`A versão deste computador é ${process.version}. Instale a versão LTS pelo site nodejs.org.`);
  process.exit(1);
}

const ARQUIVO = path.join(__dirname, config.arquivoDoBanco);
const SCRIPT = path.join(__dirname, '..', '..', 'saep_db.sql');

const banco = new DatabaseSync(ARQUIVO);

// faz o SQLite respeitar as chaves estrangeiras (sem isso ele deixaria apagar tutor que tem pet)
banco.exec('PRAGMA foreign_keys = ON');

// roda o saep_db.sql: apaga as tabelas, cria de novo e coloca os dados de exemplo
function criarBanco() {
  banco.exec(fs.readFileSync(SCRIPT, 'utf8'));
}

// na primeira vez (arquivo novo, sem tabelas), o servidor cria o banco sozinho
const jaTemTabelas = banco.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'usuario'").get();
if (!jaTemTabelas) {
  criarBanco();
  console.log('Banco criado a partir do saep_db.sql (arquivo backend/' + config.arquivoDoBanco + ').');
}

// ---------- funções que as rotas usam ----------
// o "?" no SQL é trocado pelos parâmetros, na ordem (isso impede SQL Injection)

// várias linhas (uma lista)
function todos(sql, parametros = []) {
  return banco.prepare(sql).all(...parametros);
}

// uma linha só (ou undefined se não achar)
function um(sql, parametros = []) {
  return banco.prepare(sql).get(...parametros);
}

// INSERT, UPDATE e DELETE. Devolve { changes, lastInsertRowid }:
// changes = quantas linhas mudaram, lastInsertRowid = o id do que acabou de ser criado
function executar(sql, parametros = []) {
  return banco.prepare(sql).run(...parametros);
}

// ---------- erros do banco ----------

// tentou gravar um valor repetido numa coluna UNIQUE (CPF ou e-mail repetido)
function ehRepetido(erro) {
  return String(erro.message).includes('UNIQUE constraint failed');
}

// tentou apagar algo que ainda está sendo usado (tutor com pet, pet com agendamento)
function estaEmUso(erro) {
  return String(erro.message).includes('FOREIGN KEY constraint failed');
}

module.exports = { todos, um, executar, ehRepetido, estaEmUso, criarBanco };
