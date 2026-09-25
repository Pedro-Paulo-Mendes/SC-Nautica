const fs = require('fs');
const path = require('path');

let configPath;
let config = {};

function iniciar(userDataPath) {
  configPath = path.join(userDataPath, 'config.json');
  if (fs.existsSync(configPath)) {
    try { config = JSON.parse(fs.readFileSync(configPath, 'utf-8')); } catch { config = {}; }
  }
}

function obter() {
  return config;
}

function definir(dados) {
  config = { ...config, ...dados };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return config;
}

module.exports = { iniciar, obter, definir };
