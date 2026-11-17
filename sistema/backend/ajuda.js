// Funções pequenas que várias rotas usam

// pra não precisar escrever try/catch em toda rota
function rota(funcao) {
  return async (req, res) => {
    try {
      await funcao(req, res);
    } catch (erro) {
      console.error(erro);
      res.status(500).json({ erro: 'Deu um erro no servidor. Tente de novo.' });
    }
  };
}

// confere se o id da URL é um número
function pegarId(req) {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// tira espaços do começo e do fim (e trata campo vazio)
function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

// confere o formato de um e-mail
function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = { rota, pegarId, texto, emailValido };
