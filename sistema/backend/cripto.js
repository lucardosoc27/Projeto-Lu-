// Funções pra proteger o CPF (LGPD)
// O CPF é guardado criptografado no banco, então quem abrir o banco não consegue ler.
// Também guardo um "hash" do CPF só pra conseguir saber se o CPF já foi cadastrado.

const crypto = require('crypto');
const config = require('./config');

// transforma a chave do config numa chave de 32 bytes (o AES-256 precisa desse tamanho)
const chave = crypto.createHash('sha256').update(config.chaveSecreta).digest();

// deixa só os números do CPF (tira ponto e traço)
function soNumeros(cpf) {
  return String(cpf || '').replace(/\D/g, '');
}

// confere se o CPF é válido (os 2 dígitos do final)
function cpfValido(cpf) {
  const c = soNumeros(cpf);
  if (c.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(c)) return false; // tipo 111.111.111-11

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(c[i]) * (10 - i);
  let dig1 = (soma * 10) % 11;
  if (dig1 === 10) dig1 = 0;
  if (dig1 !== Number(c[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(c[i]) * (11 - i);
  let dig2 = (soma * 10) % 11;
  if (dig2 === 10) dig2 = 0;
  return dig2 === Number(c[10]);
}

// criptografa o CPF. O resultado fica assim: "iv:textoCriptografado"
function criptografar(cpf) {
  const iv = crypto.randomBytes(16);
  const cifra = crypto.createCipheriv('aes-256-cbc', chave, iv);
  const texto = cifra.update(soNumeros(cpf), 'utf8', 'hex') + cifra.final('hex');
  return iv.toString('hex') + ':' + texto;
}

// volta o CPF ao normal (só o servidor consegue, porque só ele tem a chave)
function descriptografar(valor) {
  const [ivHex, texto] = String(valor).split(':');
  const decifra = crypto.createDecipheriv('aes-256-cbc', chave, Buffer.from(ivHex, 'hex'));
  return decifra.update(texto, 'hex', 'utf8') + decifra.final('utf8');
}

// hash do CPF: sempre dá o mesmo resultado pro mesmo CPF, mas não dá pra voltar
// serve só pra checar duplicidade (o banco tem UNIQUE nessa coluna)
function hashDoCpf(cpf) {
  return crypto.createHmac('sha256', chave).update(soNumeros(cpf)).digest('hex');
}

// mostra o CPF escondido na tela: ***.456.789-**
function mascarar(cpf) {
  const c = soNumeros(cpf);
  return '***.' + c.slice(3, 6) + '.' + c.slice(6, 9) + '-**';
}

// coloca ponto e traço: 123.456.789-09
function formatar(cpf) {
  const c = soNumeros(cpf);
  return c.slice(0, 3) + '.' + c.slice(3, 6) + '.' + c.slice(6, 9) + '-' + c.slice(9);
}

module.exports = { soNumeros, cpfValido, criptografar, descriptografar, hashDoCpf, mascarar, formatar };
