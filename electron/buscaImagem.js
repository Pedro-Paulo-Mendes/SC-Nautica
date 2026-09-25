const TIMEOUT_MS = 15000;

async function buscarComTimeout(url, opcoes = {}) {
  const controlador = new AbortController();
  const timeout = setTimeout(() => controlador.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...opcoes, signal: controlador.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function montarTermoBusca({ categoria, marca, modelo }) {
  const sufixos = { motor: 'motor de popa', barco: 'barco', carreta: 'carreta para barco' };
  return [marca, modelo, sufixos[categoria]].filter(Boolean).join(' ').trim();
}

async function buscarFotos({ categoria, marca, modelo }, { googleApiKey, googleCxId } = {}) {
  if (!googleApiKey || !googleCxId) {
    throw new Error('Configure a chave da API do Google e o ID do mecanismo de busca em Configurações antes de usar a busca automática de fotos.');
  }
  const termo = montarTermoBusca({ categoria, marca, modelo });
  if (!termo) throw new Error('Preencha marca e/ou modelo antes de buscar fotos.');

  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.set('key', googleApiKey);
  url.searchParams.set('cx', googleCxId);
  url.searchParams.set('searchType', 'image');
  url.searchParams.set('q', termo);
  url.searchParams.set('num', '6');
  url.searchParams.set('safe', 'active');

  let resposta;
  try {
    resposta = await buscarComTimeout(url.toString());
  } catch {
    throw new Error('Não foi possível conectar à API do Google. Verifique sua internet.');
  }
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new Error(dados?.error?.message || `Erro ${resposta.status} ao buscar fotos.`);
  }

  return (dados.items || []).map((item) => ({
    url: item.link,
    miniatura: item.image?.thumbnailLink || item.link,
    fonte: item.image?.contextLink || ''
  }));
}

async function baixarImagem(url) {
  let resposta;
  try {
    resposta = await buscarComTimeout(url);
  } catch {
    throw new Error('Não foi possível baixar essa imagem (site fora do ar ou bloqueou o acesso).');
  }
  if (!resposta.ok) throw new Error(`Não foi possível baixar a imagem (erro ${resposta.status}).`);
  const tipo = resposta.headers.get('content-type') || 'image/jpeg';
  if (!tipo.startsWith('image/')) throw new Error('O link não retornou uma imagem válida.');
  const arrayBuffer = await resposta.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return `data:${tipo};base64,${base64}`;
}

module.exports = { buscarFotos, baixarImagem };
