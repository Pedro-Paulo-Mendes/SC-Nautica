// Utilitário de emergência: redefine a senha de um usuário direto no banco de dados.
// Use quando ninguém conseguir logar no sistema (ex: esqueceu a senha do admin).
// IMPORTANTE: feche o sistema (SC Náutica) antes de rodar este script.
//
// Uso:
//   node electron/redefinir-senha.js <usuario_login> <nova_senha>
//   node electron/redefinir-senha.js            (lista os usuários existentes)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const initSqlJs = require('sql.js');

function hashSenha(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(senha, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function caminhoBanco() {
  const appData = process.platform === 'win32' ? process.env.APPDATA : path.join(os.homedir(), '.config');
  return path.join(appData, 'sc-nautica-sistema', 'sc-nautica.sqlite');
}

async function main() {
  const [, , usuarioLogin, novaSenha] = process.argv;
  const dbPath = caminhoBanco();

  if (!fs.existsSync(dbPath)) {
    console.error('Banco de dados não encontrado em:', dbPath);
    process.exit(1);
  }

  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(dbPath));

  if (!usuarioLogin) {
    const stmt = db.prepare('SELECT nome, usuario, papel, ativo FROM usuarios');
    console.log('Usuários cadastrados:');
    while (stmt.step()) {
      const u = stmt.getAsObject();
      console.log(`  - login: ${u.usuario} | nome: ${u.nome} | papel: ${u.papel} | ativo: ${u.ativo ? 'sim' : 'não'}`);
    }
    stmt.free();
    console.log('\nPara redefinir, rode: node electron/redefinir-senha.js <usuario_login> <nova_senha>');
    return;
  }

  if (!novaSenha || novaSenha.length < 4) {
    console.error('Informe uma nova senha com pelo menos 4 caracteres.');
    process.exit(1);
  }

  const verifica = db.prepare('SELECT id FROM usuarios WHERE usuario = ?');
  verifica.bind([usuarioLogin]);
  if (!verifica.step()) {
    console.error(`Nenhum usuário encontrado com o login "${usuarioLogin}".`);
    verifica.free();
    process.exit(1);
  }
  verifica.free();

  const atualizar = db.prepare('UPDATE usuarios SET senha = ? WHERE usuario = ?');
  atualizar.bind([hashSenha(novaSenha), usuarioLogin]);
  atualizar.step();
  atualizar.free();

  fs.writeFileSync(dbPath, Buffer.from(db.export()));
  console.log(`Senha do usuário "${usuarioLogin}" redefinida com sucesso.`);
}

main();
