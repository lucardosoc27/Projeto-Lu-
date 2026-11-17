-- Banco de dados da Clínica Veterinária (SQLite)


-- faz o SQLite respeitar as chaves estrangeiras
PRAGMA foreign_keys = ON;

-- apaga as tabelas antigas (na ordem certa: primeiro quem depende das outras)
DROP TABLE IF EXISTS agendamento;
DROP TABLE IF EXISTS pet;
DROP TABLE IF EXISTS tutor;
DROP TABLE IF EXISTS usuario;

-- Tabela usuario: quem pode entrar no sistema (funcionários da clínica)
-- A senha fica guardada com hash (bcrypt), nunca a senha pura

CREATE TABLE usuario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL
);

-- Tabela tutor: o dono do pet
-- O CPF fica criptografado (cpf) e tem um hash (cpf_hash) só pra não deixar cadastrar o mesmo CPF duas vezes

CREATE TABLE tutor (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome VARCHAR(100) NOT NULL,
  cpf VARCHAR(255) NOT NULL,
  cpf_hash CHAR(64) NOT NULL UNIQUE,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(100)
);

-- Tabela pet: todo pet PRECISA ter um tutor (tutor_id NOT NULL)
-- Não deixa apagar um tutor que ainda tem pet (ON DELETE RESTRICT)

CREATE TABLE pet (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome VARCHAR(100) NOT NULL,
  especie VARCHAR(50) NOT NULL,
  raca VARCHAR(50),
  idade INTEGER,
  tutor_id INTEGER NOT NULL,
  FOREIGN KEY (tutor_id) REFERENCES tutor (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Tabela agendamento: consulta, vacina, banho etc
-- status: Agendado, Concluído ou Cancelado 
-- A clínica atende um agendamento por horário. Quem confere isso é o servidor:
-- não pode ter dois agendamentos no mesmo horário, a não ser que o outro esteja cancelado
-- data_hora fica no formato 'AAAA-MM-DD HH:MM:SS'

CREATE TABLE agendamento (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pet_id INTEGER NOT NULL,
  data_hora DATETIME NOT NULL,
  servico VARCHAR(50) NOT NULL,
  observacao VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'Agendado'
    CHECK (status IN ('Agendado', 'Concluído', 'Cancelado')),
  FOREIGN KEY (pet_id) REFERENCES pet (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- deixa a busca por data mais rápida
CREATE INDEX idx_agendamento_data_hora ON agendamento (data_hora);

-- Dados iniciais (pelo menos 3 registros em cada tabela)

-- Usuários: a senha dos três é senha123 (aqui está só o hash dela)
INSERT INTO usuario (nome, email, senha) VALUES
('Administrador', 'admin@clinica.com', '$2a$10$jumpGdQtTXD.u3qj5/z5m.1a7bYWAxo57mQ0kOFiuSmudytNG.BGy'),
('Recepção', 'recepcao@clinica.com', '$2a$10$a3kNEbp7XvCHtYNT1CuY..D79aUgNCyy4x8GJXN9TtG5qJ7PZAguy'),
('Dra. Marina Souza', 'marina@clinica.com', '$2a$10$E0AoaHzf4/tn2GA2z.0.I.lzgFp32ZRsGgToNSuvk0kwndqWq5kzW');

-- Tutores: os CPFs (529.982.247-25, 168.995.350-09 e 935.411.347-80) já estão criptografados
-- Eles foram criptografados com a chave que está no sistema/backend/config.js
INSERT INTO tutor (nome, cpf, cpf_hash, telefone, email) VALUES
('Carlos Henrique Santos', 'fac9a54d81056df512a09b0a20d3fa73:195b17530da4301b8d8e80db2089ba71', '1d9755009c2237b99c84af9bc54b49848f5f47fbbdb7d32797bea72af4cf4b0c', '(71) 99876-5432', 'carlos.santos@email.com'),
('Fernanda Oliveira Lima', '1332e3aedf18f30dcfa634afebaaa044:121cb4cc23c3d17bb43ba19822a94370', 'a67798f2ae9f11eb252f712df151e537a0fcf526be7529d4487ede0c095906b1', '(71) 98765-1234', 'fernanda.lima@email.com'),
('João Pedro Almeida', '3173c13c1f4e28c7b2dd91c321f72168:6aa3cd38025e99aa00e0c43be669c007', '9ae78f8cd20431d48b35a49d303b57ccb325abfabcf737598da03841e084a541', '(71) 99123-4567', NULL);

-- Pets: cada um ligado a um tutor
INSERT INTO pet (nome, especie, raca, idade, tutor_id) VALUES
('Thor', 'Cachorro', 'Labrador', 4, 1),
('Mel', 'Gato', 'Siamês', 2, 2),
('Bob', 'Cachorro', 'Vira-lata', 7, 3);

-- Agendamentos
INSERT INTO agendamento (pet_id, data_hora, servico, observacao, status) VALUES
(1, '2026-12-15 09:00:00', 'Consulta', 'Está mancando da pata traseira', 'Agendado'),
(2, '2026-12-15 10:30:00', 'Vacina', 'Vacina antirrábica', 'Agendado'),
(3, '2026-12-16 14:00:00', 'Banho e tosa', NULL, 'Agendado'),
-- um de cada status, pra dar pra testar o filtro logo de cara
(1, '2026-11-10 08:30:00', 'Retorno', 'Voltou bem da consulta', 'Concluído'),
(2, '2026-12-17 16:00:00', 'Consulta', 'O tutor desmarcou', 'Cancelado');
