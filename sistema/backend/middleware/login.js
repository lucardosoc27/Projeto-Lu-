// Quem pode passar: só quem está logado

// REGRA (login com expiração): barra as rotas da API pra quem não entrou
// ou pra quem teve a sessão expirada (30 minutos parado)
function precisaLogin(req, res, next) {
  if (req.session.usuario) return next();
  res.status(401).json({ erro: 'Sua sessão expirou. Entre de novo.' });
}

// mesma coisa, mas para as páginas, quando o servidor também mostra o frontend
// (sem o Live Server): quem não entrou volta pra tela de login
function paginaProtegida(req, res, next) {
  const ehPaginaDoSistema = req.path.endsWith('.html') && req.path !== '/index.html';
  if (ehPaginaDoSistema && !req.session.usuario) return res.redirect('/index.html?entrar=1');
  next();
}

module.exports = { precisaLogin, paginaProtegida };
