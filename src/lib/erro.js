export function mensagemErro(err, padrao = 'Ocorreu um erro.') {
  if (!err) return padrao;
  const texto = err.message || padrao;
  return texto.replace(/^Error invoking remote method '[^']+':\s*/, '').replace(/^Error:\s*/, '');
}
