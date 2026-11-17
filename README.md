# Sistema da Clínica Veterinária (SAEP)

Sistema pra clínica veterinária cadastrar **tutores**, **pets** e **agendamentos**, com login que expira e CPF protegido (LGPD).

Feito com HTML, CSS e JavaScript puro no frontend, Node.js (Express) no backend e **SQLite** no banco. O SQLite já vem dentro do Node.js: **não precisa de MySQL, XAMPP nem senha de banco**.

## Como rodar (resumo)

1. Ter o **Node.js 22.5 ou mais novo** (`node -v` mostra a versão).
2. No terminal, dentro de `sistema/backend`: `npm install` (só na primeira vez) e `npm start`. Na primeira vez o banco é criado sozinho.
3. No VS Code, botão direito em `sistema/frontend/index.html` > **Open with Live Server**. Login: `admin@clinica.com` / `senha123`.

O passo a passo completo está mais embaixo.

## O que tem aqui

| Arquivo | O que é |
|---|---|
| `documentacao.pdf` | Documentação do sistema (requisitos, regras, LGPD, como rodar) |
| `der.png` | Diagrama Entidade-Relacionamento do banco |
| `saep_db.sql` | Script que cria as tabelas e coloca pelo menos 3 registros em cada uma (o servidor roda ele sozinho) |
| `sistema/` | Código do sistema |

Dentro de `sistema/`:

```
sistema/
├── backend/                 -> o servidor (Node.js + Express + SQLite)
│   ├── server.js            -> liga tudo: CORS, login com expiração, rotas e páginas
│   ├── config.js            -> nome do arquivo do banco, chave do CPF, tempo do login
│   ├── banco.js             -> conexão com o SQLite (cria o banco sozinho na primeira vez)
│   ├── saep_db.db           -> o arquivo do banco (aparece depois do primeiro npm start)
│   ├── zerar-banco.js       -> volta o banco pros dados de exemplo (npm run zerar)
│   ├── cripto.js            -> criptografa, valida e esconde o CPF
│   ├── ajuda.js             -> funções pequenas que as rotas usam
│   ├── middleware/login.js  -> barra quem não está logado
│   ├── rotas/               -> um arquivo por assunto: login, resumo, tutores, pets, agendamentos, usuários
│   └── package.json         -> lista dos pacotes e os comandos npm start e npm run zerar
└── frontend/                -> as telas (HTML, CSS e JavaScript puro)
    ├── index.html           -> tela de login
    ├── inicio.html          -> tela de início (resumo da clínica)
    ├── tutores.html, pets.html, agendamentos.html, usuarios.html
    ├── estilo.css
    └── js/                  -> um arquivo por tela, mais o endereco.js e o comum.js
```

No código, os comentários que começam com `REGRA` mostram onde cada regra do enunciado foi feita.

## Como rodar (passo a passo)

Precisa ter só o **Node.js 22.5 ou mais novo**. Pra conferir, no terminal: `node -v`.

**1. Backend**

No VS Code, abrir a pasta do projeto (File > Open Folder). No terminal do VS Code (Ctrl+'), dentro da pasta `sistema/backend`:

```
npm install
npm start
```

No Windows o caminho é `cd sistema\backend`. O `npm install` baixa os pacotes da internet, então na primeira vez precisa estar conectado.

Na primeira vez aparece `Banco criado a partir do saep_db.sql`, e depois `Sistema rodando em http://localhost:3000`. Esse terminal fica aberto enquanto o sistema estiver em uso (Ctrl+C desliga).

**2. Frontend: dois jeitos**

- **Com o Live Server do VS Code:** botão direito em `sistema/frontend/index.html` > **Open with Live Server**. Abre em `http://127.0.0.1:5500/...`.
- **Sem o Live Server:** abrir **http://localhost:3000** no navegador. O próprio backend mostra as telas.

Os dois jeitos funcionam igual. Não abra o HTML com dois cliques no arquivo: sem o Live Server ou o backend, as telas não conseguem falar com o servidor.

**Voltar pros dados de exemplo**

Desligar o backend (Ctrl+C) e, dentro de `sistema/backend`, rodar `npm run zerar`. Apagar o arquivo `saep_db.db` também funciona: no próximo `npm start` o banco é criado de novo.

## Usuários pra testar

Todos com a senha **senha123**:

- admin@clinica.com
- recepcao@clinica.com
- marina@clinica.com

## Regras que o sistema segue

- Todo pet precisa ter um tutor (não salva sem).
- Não deixa marcar dois agendamentos no mesmo dia e horário, nem marcar no passado. Agendamento cancelado libera o horário.
- Agendamento começa como Agendado e pode virar Concluído ou Cancelado (depois disso não muda mais).
- A lista de agendamentos vem ordenada pela data, com todos os dados do pet (nome, espécie, raça e idade) e do tutor (nome, CPF escondido, telefone e e-mail).
- Não deixa cadastrar dois tutores com o mesmo CPF, e confere se o CPF é válido.
- O CPF fica criptografado no banco e nunca sai inteiro do servidor: na lista ele aparece escondido, e na edição o campo vem vazio (em branco = manter o CPF salvo).
- Não deixa excluir tutor que tem pet, nem pet que tem agendamento.
- Senha guardada com hash (bcrypt).
- O login cai depois de 30 minutos sem mexer.
- Usuário novo só é cadastrado por quem já está logado (tela Usuários).
- Depois de 5 senhas erradas seguidas, o login daquele e-mail fica bloqueado por 5 minutos.
- O login demora o mesmo tempo com e-mail que existe e com e-mail que não existe (não dá pra descobrir quem tem conta).
- Busca no banco sempre com parâmetros (`?`), sem juntar texto na consulta (protege de SQL injection).
- O que vem do usuário é escapado antes de aparecer nas tabelas (protege de XSS).
- Erro do servidor não mostra detalhes do código, e o sistema não abre dentro de outro site (iframe).

## Outras coisas que dá pra fazer

- Pesquisar tutores pelo nome (digita e clica em Buscar ou aperta Enter) e pets pelo nome do pet ou do tutor.
- Filtrar os agendamentos pelo status (os dados de exemplo já têm um de cada).

## Se der erro

| Mensagem | O que é | Como resolver |
|---|---|---|
| "Este sistema precisa do Node.js 22.5 ou mais novo" | O Node do computador é antigo e não tem o SQLite | Instalar a versão LTS pelo nodejs.org |
| `npm` não é reconhecido | O Node.js não está instalado | Instalar pelo nodejs.org (versão LTS) |
| "a execução de scripts foi desabilitada" | O PowerShell do Windows bloqueou o npm | No terminal do VS Code, trocar para **Command Prompt** e rodar de novo |
| `EADDRINUSE` | Já tem um sistema rodando na porta 3000 | Fechar o outro terminal ou apertar Ctrl+C nele |
| "Não deu pra falar com o servidor" na tela | O backend não está rodando | Rodar `npm start` dentro de `sistema/backend` |
| "Não deu pra falar com o servidor", com o backend rodando | O Live Server abriu numa porta diferente de 5500 | Colocar o endereço da barra do navegador (ex.: `http://127.0.0.1:5501`) em `enderecosDoFrontend`, no `config.js`, e rodar o `npm start` de novo |
