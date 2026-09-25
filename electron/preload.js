const { contextBridge, ipcRenderer } = require('electron');

function invoke(canal) {
  return (...args) => ipcRenderer.invoke(canal, ...args);
}

contextBridge.exposeInMainWorld('api', {
  produtos: {
    listar: invoke('produtos:listar'),
    obter: invoke('produtos:obter'),
    criar: invoke('produtos:criar'),
    atualizar: invoke('produtos:atualizar'),
    remover: invoke('produtos:remover'),
    baixoEstoque: invoke('produtos:baixoEstoque')
  },
  movimentacoes: {
    listarPorProduto: invoke('movimentacoes:listarPorProduto'),
    listarTodas: invoke('movimentacoes:listarTodas'),
    registrar: invoke('movimentacoes:registrar')
  },
  clientes: {
    listar: invoke('clientes:listar'),
    obter: invoke('clientes:obter'),
    criar: invoke('clientes:criar'),
    atualizar: invoke('clientes:atualizar'),
    remover: invoke('clientes:remover')
  },
  pedidos: {
    listar: invoke('pedidos:listar'),
    obter: invoke('pedidos:obter'),
    criar: invoke('pedidos:criar'),
    atualizarStatus: invoke('pedidos:atualizarStatus'),
    remover: invoke('pedidos:remover'),
    gerarPdf: invoke('pedidos:gerarPdf')
  },
  dashboard: {
    resumo: invoke('dashboard:resumo'),
    porCanal: invoke('dashboard:porCanal'),
    clientesPorCanal: invoke('dashboard:clientesPorCanal')
  },
  usuarios: {
    existeAlgum: invoke('usuarios:existeAlgum'),
    sessaoAtual: invoke('usuarios:sessaoAtual'),
    criarPrimeiro: invoke('usuarios:criarPrimeiro'),
    login: invoke('usuarios:login'),
    logout: invoke('usuarios:logout'),
    listar: invoke('usuarios:listar'),
    criar: invoke('usuarios:criar'),
    definirAtivo: invoke('usuarios:definirAtivo'),
    redefinirSenha: invoke('usuarios:redefinirSenha')
  },
  backup: {
    agora: invoke('backup:agora'),
    listar: invoke('backup:listar'),
    obterConfig: invoke('backup:obterConfig'),
    abrirPasta: invoke('backup:abrirPasta'),
    escolherPasta: invoke('backup:escolherPasta'),
    removerPastaExtra: invoke('backup:removerPastaExtra')
  },
  fornecedores: {
    listar: invoke('fornecedores:listar'),
    criar: invoke('fornecedores:criar'),
    atualizar: invoke('fornecedores:atualizar'),
    remover: invoke('fornecedores:remover')
  },
  cotacoes: {
    listar: invoke('cotacoes:listar'),
    criar: invoke('cotacoes:criar'),
    remover: invoke('cotacoes:remover')
  },
  buscaImagem: {
    obterConfig: invoke('buscaImagem:obterConfig'),
    definirConfig: invoke('buscaImagem:definirConfig'),
    buscar: invoke('buscaImagem:buscar'),
    baixar: invoke('buscaImagem:baixar')
  }
});
