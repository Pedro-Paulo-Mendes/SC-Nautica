const fs = require('fs');
const path = require('path');

const MAX_BACKUPS_POR_PASTA = 20;

function nomeArquivoBackup() {
  const agora = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `sc-nautica-${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}_${pad(agora.getHours())}-${pad(agora.getMinutes())}.sqlite`;
}

function limparAntigos(pasta) {
  const arquivos = fs.readdirSync(pasta)
    .filter((f) => f.endsWith('.sqlite'))
    .map((f) => {
      const caminho = path.join(pasta, f);
      return { caminho, mtime: fs.statSync(caminho).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
  arquivos.slice(MAX_BACKUPS_POR_PASTA).forEach((a) => {
    try { fs.unlinkSync(a.caminho); } catch { /* ignora */ }
  });
}

function fazerBackup(dbPath, pastasDestino) {
  const nomeArquivo = nomeArquivoBackup();
  return pastasDestino.map((pasta) => {
    try {
      if (!fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });
      fs.copyFileSync(dbPath, path.join(pasta, nomeArquivo));
      limparAntigos(pasta);
      return { pasta, ok: true };
    } catch (err) {
      return { pasta, ok: false, erro: err.message };
    }
  });
}

function listarBackups(pasta) {
  if (!fs.existsSync(pasta)) return [];
  return fs.readdirSync(pasta)
    .filter((f) => f.endsWith('.sqlite'))
    .map((f) => {
      const caminho = path.join(pasta, f);
      const stat = fs.statSync(caminho);
      return { nome: f, tamanho: stat.size, data: stat.mtime.toISOString() };
    })
    .sort((a, b) => new Date(b.data) - new Date(a.data));
}

module.exports = { fazerBackup, listarBackups };
