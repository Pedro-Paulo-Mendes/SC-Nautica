const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let sessaoAtual = null;
let pastaBackupPadrao;

function pastasDestinoBackup(config) {
  const dados = config.obter();
  const pastas = [pastaBackupPadrao];
  if (dados.pastaBackupExtra) pastas.push(dados.pastaBackupExtra);
  return pastas;
}

function exigirAdmin() {
  if (!sessaoAtual || sessaoAtual.papel !== 'admin') throw new Error('Ação restrita ao administrador.');
}

function ocultarCusto(produto) {
  if (!produto) return produto;
  const { preco_custo, ...resto } = produto;
  return resto;
}

function ocultarCustoPedido(pedido) {
  if (!pedido) return pedido;
  return { ...pedido, itens: pedido.itens.map(({ custo_unitario, ...resto }) => resto) };
}

async function registrarHandlers() {
  const db = require('./db');
  const config = require('./config');
  const backup = require('./backup');
  const buscaImagem = require('./buscaImagem');
  const { montarHtmlPedido } = require('./pdf');
  const { produtos, movimentacoes, clientes, pedidos, dashboard, usuarios, fornecedores, cotacoes } = db;

  await db.iniciar(app.getPath('userData'));
  config.iniciar(app.getPath('userData'));
  pastaBackupPadrao = path.join(app.getPath('userData'), 'backups');

  const podeVerCusto = () => sessaoAtual?.papel === 'admin';

  ipcMain.handle('produtos:listar', (_e, filtro) => {
    const lista = produtos.listar(filtro);
    return podeVerCusto() ? lista : lista.map(ocultarCusto);
  });
  ipcMain.handle('produtos:obter', (_e, id) => {
    const p = produtos.obter(id);
    return podeVerCusto() ? p : ocultarCusto(p);
  });
  ipcMain.handle('produtos:criar', (_e, dados) => {
    if (!podeVerCusto()) dados = { ...dados, preco_custo: 0 };
    return produtos.criar(dados);
  });
  ipcMain.handle('produtos:atualizar', (_e, id, dados) => {
    if (!podeVerCusto()) {
      const atual = produtos.obter(id);
      dados = { ...dados, preco_custo: atual ? atual.preco_custo : 0 };
    }
    return produtos.atualizar(id, dados);
  });
  ipcMain.handle('produtos:remover', (_e, id) => { exigirAdmin(); return produtos.remover(id); });
  ipcMain.handle('produtos:baixoEstoque', () => {
    const lista = produtos.baixoEstoque();
    return podeVerCusto() ? lista : lista.map(ocultarCusto);
  });

  ipcMain.handle('movimentacoes:listarPorProduto', (_e, produtoId) => movimentacoes.listarPorProduto(produtoId));
  ipcMain.handle('movimentacoes:listarTodas', (_e, limite) => movimentacoes.listarTodas(limite));
  ipcMain.handle('movimentacoes:registrar', (_e, dados) => movimentacoes.registrar(dados));

  ipcMain.handle('clientes:listar', (_e, busca) => clientes.listar(busca));
  ipcMain.handle('clientes:obter', (_e, id) => clientes.obter(id));
  ipcMain.handle('clientes:criar', (_e, dados) => clientes.criar(dados));
  ipcMain.handle('clientes:atualizar', (_e, id, dados) => clientes.atualizar(id, dados));
  ipcMain.handle('clientes:remover', (_e, id) => { exigirAdmin(); return clientes.remover(id); });

  ipcMain.handle('pedidos:listar', (_e, filtro) => pedidos.listar(filtro));
  ipcMain.handle('pedidos:obter', (_e, id) => {
    const pedido = pedidos.obter(id);
    return podeVerCusto() ? pedido : ocultarCustoPedido(pedido);
  });
  ipcMain.handle('pedidos:criar', (_e, dados) => pedidos.criar(dados));
  ipcMain.handle('pedidos:atualizarStatus', (_e, id, status) => pedidos.atualizarStatus(id, status));
  ipcMain.handle('pedidos:remover', (_e, id) => { exigirAdmin(); return pedidos.remover(id); });
  ipcMain.handle('pedidos:gerarPdf', async (_e, id) => {
    const pedido = pedidos.obter(id);
    if (!pedido) throw new Error('Pedido não encontrado.');
    const html = montarHtmlPedido(pedido);

    const janelaPdf = new BrowserWindow({ show: false });
    try {
      await janelaPdf.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
      const bufferPdf = await janelaPdf.webContents.printToPDF({ printBackground: true, pageSize: 'A4' });

      const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Salvar PDF do pedido',
        defaultPath: path.join(app.getPath('documents'), `pedido-${id}.pdf`),
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      });
      if (canceled || !filePath) return null;

      fs.writeFileSync(filePath, bufferPdf);
      shell.showItemInFolder(filePath);
      return filePath;
    } finally {
      janelaPdf.destroy();
    }
  });

  ipcMain.handle('dashboard:resumo', () => {
    const resumo = dashboard.resumo();
    if (!podeVerCusto()) { delete resumo.valorEstoque; delete resumo.lucroMes; }
    return resumo;
  });
  ipcMain.handle('dashboard:porCanal', () => dashboard.porCanal());
  ipcMain.handle('dashboard:clientesPorCanal', () => dashboard.clientesPorCanal());

  ipcMain.handle('fornecedores:listar', () => { exigirAdmin(); return fornecedores.listar(); });
  ipcMain.handle('fornecedores:criar', (_e, dados) => { exigirAdmin(); return fornecedores.criar(dados); });
  ipcMain.handle('fornecedores:atualizar', (_e, id, dados) => { exigirAdmin(); return fornecedores.atualizar(id, dados); });
  ipcMain.handle('fornecedores:remover', (_e, id) => { exigirAdmin(); return fornecedores.remover(id); });

  ipcMain.handle('cotacoes:listar', () => { exigirAdmin(); return cotacoes.listar(); });
  ipcMain.handle('cotacoes:criar', (_e, dados) => { exigirAdmin(); return cotacoes.criar(dados); });
  ipcMain.handle('cotacoes:remover', (_e, id) => { exigirAdmin(); return cotacoes.remover(id); });

  ipcMain.handle('buscaImagem:obterConfig', () => {
    exigirAdmin();
    const { googleApiKey, googleCxId } = config.obter();
    return { googleApiKey: googleApiKey || '', googleCxId: googleCxId || '' };
  });
  ipcMain.handle('buscaImagem:definirConfig', (_e, dados) => {
    exigirAdmin();
    config.definir({ googleApiKey: dados.googleApiKey || '', googleCxId: dados.googleCxId || '' });
    return true;
  });
  ipcMain.handle('buscaImagem:buscar', (_e, query) => buscaImagem.buscarFotos(query, config.obter()));
  ipcMain.handle('buscaImagem:baixar', (_e, url) => buscaImagem.baixarImagem(url));

  ipcMain.handle('usuarios:existeAlgum', () => usuarios.existeAlgum());
  ipcMain.handle('usuarios:sessaoAtual', () => sessaoAtual);
  ipcMain.handle('usuarios:criarPrimeiro', (_e, dados) => {
    if (usuarios.existeAlgum()) throw new Error('Já existe um administrador cadastrado.');
    const usuario = usuarios.criar({ ...dados, papel: 'admin' });
    sessaoAtual = usuario;
    return usuario;
  });
  ipcMain.handle('usuarios:login', (_e, { usuario, senha }) => {
    const encontrado = usuarios.autenticar(usuario, senha);
    if (!encontrado) throw new Error('Usuário ou senha inválidos.');
    sessaoAtual = encontrado;
    return encontrado;
  });
  ipcMain.handle('usuarios:logout', () => { sessaoAtual = null; return true; });
  ipcMain.handle('usuarios:listar', () => { exigirAdmin(); return usuarios.listar(); });
  ipcMain.handle('usuarios:criar', (_e, dados) => { exigirAdmin(); return usuarios.criar(dados); });
  ipcMain.handle('usuarios:definirAtivo', (_e, id, ativo) => { exigirAdmin(); return usuarios.definirAtivo(id, ativo); });
  ipcMain.handle('usuarios:redefinirSenha', (_e, id, novaSenha) => { exigirAdmin(); return usuarios.redefinirSenha(id, novaSenha); });

  ipcMain.handle('backup:agora', () => backup.fazerBackup(db.caminhoArquivo(), pastasDestinoBackup(config)));
  ipcMain.handle('backup:listar', () => backup.listarBackups(pastaBackupPadrao));
  ipcMain.handle('backup:obterConfig', () => ({ ...config.obter(), pastaPadrao: pastaBackupPadrao }));
  ipcMain.handle('backup:abrirPasta', () => shell.openPath(pastaBackupPadrao));
  ipcMain.handle('backup:escolherPasta', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
    if (canceled || filePaths.length === 0) return config.obter().pastaBackupExtra || null;
    config.definir({ pastaBackupExtra: filePaths[0] });
    return filePaths[0];
  });
  ipcMain.handle('backup:removerPastaExtra', () => { config.definir({ pastaBackupExtra: null }); return null; });

  const backupPeriodico = () => backup.fazerBackup(db.caminhoArquivo(), pastasDestinoBackup(config));
  backupPeriodico();
  setInterval(backupPeriodico, 15 * 60 * 1000);
  app.on('before-quit', backupPeriodico);
}

function criarJanela() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(async () => {
  await registrarHandlers();
  criarJanela();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) criarJanela();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
