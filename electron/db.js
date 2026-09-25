const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const initSqlJs = require('sql.js');

function hashSenha(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(senha, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verificarSenha(senha, armazenado) {
  const [salt, hash] = armazenado.split(':');
  const tentativa = crypto.scryptSync(senha, salt, 64).toString('hex');
  const bufA = Buffer.from(hash, 'hex');
  const bufB = Buffer.from(tentativa, 'hex');
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

let db;
let dbPath;

function persist() {
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
}

function run(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
}

function runInsertGetId(sql, params = []) {
  run(sql, params);
  return get('SELECT last_insert_rowid() as id').id;
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let row = null;
  if (stmt.step()) row = stmt.getAsObject();
  stmt.free();
  return row;
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

async function iniciar(userDataPath) {
  if (!fs.existsSync(userDataPath)) fs.mkdirSync(userDataPath, { recursive: true });
  dbPath = path.join(userDataPath, 'sc-nautica.sqlite');

  const SQL = await initSqlJs();
  db = fs.existsSync(dbPath) ? new SQL.Database(fs.readFileSync(dbPath)) : new SQL.Database();

  db.exec(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categoria TEXT NOT NULL,
      nome TEXT NOT NULL,
      marca TEXT,
      modelo TEXT,
      ano INTEGER,
      preco_custo REAL DEFAULT 0,
      preco_venda REAL DEFAULT 0,
      quantidade INTEGER DEFAULT 0,
      estoque_minimo INTEGER DEFAULT 0,
      descricao TEXT,
      atributos TEXT DEFAULT '{}',
      imagem TEXT,
      criado_em TEXT DEFAULT (datetime('now', 'localtime')),
      atualizado_em TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS movimentacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste')),
      quantidade INTEGER NOT NULL,
      motivo TEXT,
      observacao TEXT,
      data TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      telefone TEXT,
      email TEXT,
      documento TEXT,
      endereco TEXT,
      canal_origem TEXT,
      criado_em TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER REFERENCES clientes(id),
      status TEXT NOT NULL DEFAULT 'orcamento' CHECK (status IN ('orcamento', 'pedido', 'faturado', 'entregue', 'cancelado')),
      canal_origem TEXT,
      observacao TEXT,
      valor_total REAL DEFAULT 0,
      valor_itens REAL DEFAULT 0,
      valor_trocas REAL DEFAULT 0,
      criado_em TEXT DEFAULT (datetime('now', 'localtime')),
      atualizado_em TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS pedido_itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
      produto_id INTEGER NOT NULL REFERENCES produtos(id),
      quantidade INTEGER NOT NULL,
      preco_unitario REAL NOT NULL,
      custo_unitario REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS pedido_trocas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
      categoria TEXT NOT NULL,
      nome TEXT NOT NULL,
      marca TEXT,
      modelo TEXT,
      ano INTEGER,
      atributos TEXT DEFAULT '{}',
      imagem TEXT,
      descricao TEXT,
      valor_credito REAL NOT NULL DEFAULT 0,
      produto_criado_id INTEGER REFERENCES produtos(id),
      criado_em TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      usuario TEXT NOT NULL UNIQUE,
      senha TEXT NOT NULL,
      papel TEXT NOT NULL DEFAULT 'funcionario' CHECK (papel IN ('admin', 'funcionario')),
      ativo INTEGER NOT NULL DEFAULT 1,
      criado_em TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS fornecedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      contato TEXT,
      email TEXT,
      observacao TEXT,
      criado_em TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS cotacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fornecedor_id INTEGER NOT NULL REFERENCES fornecedores(id) ON DELETE CASCADE,
      item TEXT NOT NULL,
      valor REAL NOT NULL,
      data_cotacao TEXT DEFAULT (datetime('now', 'localtime')),
      validade TEXT,
      observacao TEXT,
      criado_em TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  const colunasProdutos = all("PRAGMA table_info(produtos)").map((c) => c.name);
  if (!colunasProdutos.includes('imagem')) db.exec('ALTER TABLE produtos ADD COLUMN imagem TEXT');

  const colunasPedidos = all("PRAGMA table_info(pedidos)").map((c) => c.name);
  if (!colunasPedidos.includes('canal_origem')) db.exec('ALTER TABLE pedidos ADD COLUMN canal_origem TEXT');

  const colunasClientes = all("PRAGMA table_info(clientes)").map((c) => c.name);
  if (!colunasClientes.includes('canal_origem')) db.exec('ALTER TABLE clientes ADD COLUMN canal_origem TEXT');

  const colunasPedidos2 = all("PRAGMA table_info(pedidos)").map((c) => c.name);
  if (!colunasPedidos2.includes('valor_itens')) {
    db.exec('ALTER TABLE pedidos ADD COLUMN valor_itens REAL DEFAULT 0');
    db.exec('UPDATE pedidos SET valor_itens = valor_total');
  }
  if (!colunasPedidos2.includes('valor_trocas')) db.exec('ALTER TABLE pedidos ADD COLUMN valor_trocas REAL DEFAULT 0');

  const colunasItens = all("PRAGMA table_info(pedido_itens)").map((c) => c.name);
  if (!colunasItens.includes('custo_unitario')) {
    db.exec('ALTER TABLE pedido_itens ADD COLUMN custo_unitario REAL DEFAULT 0');
    db.exec(`UPDATE pedido_itens SET custo_unitario = COALESCE(
      (SELECT preco_custo FROM produtos WHERE produtos.id = pedido_itens.produto_id), 0)`);
  }

  const colunasTrocas = all("PRAGMA table_info(pedido_trocas)").map((c) => c.name);
  if (!colunasTrocas.includes('marca')) db.exec('ALTER TABLE pedido_trocas ADD COLUMN marca TEXT');
  if (!colunasTrocas.includes('modelo')) db.exec('ALTER TABLE pedido_trocas ADD COLUMN modelo TEXT');
  if (!colunasTrocas.includes('ano')) db.exec('ALTER TABLE pedido_trocas ADD COLUMN ano INTEGER');
  if (!colunasTrocas.includes('atributos')) db.exec("ALTER TABLE pedido_trocas ADD COLUMN atributos TEXT DEFAULT '{}'");
  if (!colunasTrocas.includes('imagem')) db.exec('ALTER TABLE pedido_trocas ADD COLUMN imagem TEXT');

  persist();
}

function withParsedAtributos(produto) {
  if (!produto) return produto;
  let atributos = {};
  try { atributos = JSON.parse(produto.atributos || '{}'); } catch { atributos = {}; }
  return { ...produto, atributos };
}

const produtos = {
  listar: (filtro = {}) => {
    let sql = 'SELECT * FROM produtos';
    const clauses = [];
    const params = [];
    if (filtro.categoria) { clauses.push('categoria = ?'); params.push(filtro.categoria); }
    if (filtro.busca) { clauses.push('(nome LIKE ? OR marca LIKE ? OR modelo LIKE ?)'); params.push(`%${filtro.busca}%`, `%${filtro.busca}%`, `%${filtro.busca}%`); }
    if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
    sql += ' ORDER BY nome ASC';
    return all(sql, params).map(withParsedAtributos);
  },
  obter: (id) => withParsedAtributos(get('SELECT * FROM produtos WHERE id = ?', [id])),
  criar: (p) => {
    const id = runInsertGetId(
      `INSERT INTO produtos (categoria, nome, marca, modelo, ano, preco_custo, preco_venda, quantidade, estoque_minimo, descricao, atributos, imagem)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.categoria, p.nome, p.marca || null, p.modelo || null, p.ano || null, p.preco_custo || 0,
        p.preco_venda || 0, p.quantidade || 0, p.estoque_minimo || 0, p.descricao || null, JSON.stringify(p.atributos || {}), p.imagem || null]
    );
    persist();
    return produtos.obter(id);
  },
  atualizar: (id, p) => {
    run(
      `UPDATE produtos SET categoria=?, nome=?, marca=?, modelo=?, ano=?, preco_custo=?, preco_venda=?,
       quantidade=?, estoque_minimo=?, descricao=?, atributos=?, imagem=?, atualizado_em=datetime('now','localtime') WHERE id=?`,
      [p.categoria, p.nome, p.marca || null, p.modelo || null, p.ano || null, p.preco_custo || 0,
        p.preco_venda || 0, p.quantidade || 0, p.estoque_minimo || 0, p.descricao || null, JSON.stringify(p.atributos || {}), p.imagem || null, id]
    );
    persist();
    return produtos.obter(id);
  },
  remover: (id) => { run('DELETE FROM produtos WHERE id = ?', [id]); persist(); },
  baixoEstoque: () => all('SELECT * FROM produtos WHERE quantidade <= estoque_minimo ORDER BY quantidade ASC').map(withParsedAtributos)
};

const movimentacoes = {
  listarPorProduto: (produto_id) => all('SELECT * FROM movimentacoes WHERE produto_id = ? ORDER BY data DESC', [produto_id]),
  listarTodas: (limite = 100) => all(`
    SELECT m.*, p.nome as produto_nome FROM movimentacoes m
    JOIN produtos p ON p.id = m.produto_id
    ORDER BY m.data DESC LIMIT ?`, [limite]),
  registrar: ({ produto_id, tipo, quantidade, motivo, observacao }) => {
    db.exec('BEGIN');
    try {
      run('INSERT INTO movimentacoes (produto_id, tipo, quantidade, motivo, observacao) VALUES (?, ?, ?, ?, ?)',
        [produto_id, tipo, quantidade, motivo || null, observacao || null]);
      const delta = tipo === 'saida' ? -Math.abs(quantidade) : Math.abs(quantidade);
      run("UPDATE produtos SET quantidade = quantidade + ?, atualizado_em = datetime('now','localtime') WHERE id = ?",
        [delta, produto_id]);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    persist();
    return produtos.obter(produto_id);
  }
};

const clientes = {
  listar: (busca) => {
    if (busca) return all('SELECT * FROM clientes WHERE nome LIKE ? OR documento LIKE ? ORDER BY nome ASC', [`%${busca}%`, `%${busca}%`]);
    return all('SELECT * FROM clientes ORDER BY nome ASC');
  },
  obter: (id) => get('SELECT * FROM clientes WHERE id = ?', [id]),
  criar: (c) => {
    const id = runInsertGetId('INSERT INTO clientes (nome, telefone, email, documento, endereco, canal_origem) VALUES (?, ?, ?, ?, ?, ?)',
      [c.nome, c.telefone || null, c.email || null, c.documento || null, c.endereco || null, c.canal_origem || null]);
    persist();
    return clientes.obter(id);
  },
  atualizar: (id, c) => {
    run('UPDATE clientes SET nome=?, telefone=?, email=?, documento=?, endereco=?, canal_origem=? WHERE id=?',
      [c.nome, c.telefone || null, c.email || null, c.documento || null, c.endereco || null, c.canal_origem || null, id]);
    persist();
    return clientes.obter(id);
  },
  remover: (id) => { run('DELETE FROM clientes WHERE id = ?', [id]); persist(); }
};

const pedidos = {
  listar: (filtro = {}) => {
    let sql = `SELECT ped.*, c.nome as cliente_nome FROM pedidos ped LEFT JOIN clientes c ON c.id = ped.cliente_id`;
    const clauses = [];
    const params = [];
    if (filtro.status) { clauses.push('ped.status = ?'); params.push(filtro.status); }
    if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
    sql += ' ORDER BY ped.criado_em DESC';
    return all(sql, params);
  },
  obter: (id) => {
    const pedido = get(`SELECT ped.*, c.nome as cliente_nome, c.telefone as cliente_telefone
      FROM pedidos ped LEFT JOIN clientes c ON c.id = ped.cliente_id WHERE ped.id = ?`, [id]);
    if (!pedido) return null;
    const itens = all(`SELECT pi.*, p.nome as produto_nome, p.categoria as produto_categoria
      FROM pedido_itens pi JOIN produtos p ON p.id = pi.produto_id WHERE pi.pedido_id = ?`, [id]);
    const trocas = all('SELECT * FROM pedido_trocas WHERE pedido_id = ? ORDER BY id ASC', [id]).map((t) => {
      let atributos = {};
      try { atributos = JSON.parse(t.atributos || '{}'); } catch { atributos = {}; }
      return { ...t, atributos };
    });
    return { ...pedido, itens, trocas };
  },
  criar: ({ cliente_id, status, canal_origem, observacao, itens, trocas = [] }) => {
    const valor_itens = itens.reduce((soma, it) => soma + it.quantidade * it.preco_unitario, 0);
    const valor_trocas = trocas.reduce((soma, t) => soma + (Number(t.valor_credito) || 0), 0);
    const valor_total = valor_itens - valor_trocas;
    db.exec('BEGIN');
    let pedido_id;
    try {
      pedido_id = runInsertGetId(
        'INSERT INTO pedidos (cliente_id, status, canal_origem, observacao, valor_total, valor_itens, valor_trocas) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [cliente_id || null, status || 'orcamento', canal_origem || null, observacao || null, valor_total, valor_itens, valor_trocas]
      );
      for (const item of itens) {
        const produtoAtual = get('SELECT preco_custo FROM produtos WHERE id = ?', [item.produto_id]);
        run('INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario, custo_unitario) VALUES (?, ?, ?, ?, ?)',
          [pedido_id, item.produto_id, item.quantidade, item.preco_unitario, produtoAtual ? produtoAtual.preco_custo : 0]);
      }
      for (const troca of trocas) {
        run(
          `INSERT INTO pedido_trocas (pedido_id, categoria, nome, marca, modelo, ano, atributos, imagem, descricao, valor_credito)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [pedido_id, troca.categoria, troca.nome, troca.marca || null, troca.modelo || null, troca.ano || null,
            JSON.stringify(troca.atributos || {}), troca.imagem || null, troca.descricao || null, Number(troca.valor_credito) || 0]
        );
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    persist();
    return pedidos.obter(pedido_id);
  },
  atualizarStatus: (id, status) => {
    const pedidoAnterior = get('SELECT status FROM pedidos WHERE id = ?', [id]);
    db.exec('BEGIN');
    try {
      run("UPDATE pedidos SET status = ?, atualizado_em = datetime('now','localtime') WHERE id = ?", [status, id]);
      if (status === 'faturado' && pedidoAnterior && pedidoAnterior.status !== 'faturado') {
        const itens = all('SELECT * FROM pedido_itens WHERE pedido_id = ?', [id]);
        for (const item of itens) {
          run('INSERT INTO movimentacoes (produto_id, tipo, quantidade, motivo, observacao) VALUES (?, ?, ?, ?, ?)',
            [item.produto_id, 'saida', item.quantidade, 'venda', `Pedido #${id}`]);
          run("UPDATE produtos SET quantidade = quantidade - ?, atualizado_em = datetime('now','localtime') WHERE id = ?",
            [item.quantidade, item.produto_id]);
        }

        const trocas = all('SELECT * FROM pedido_trocas WHERE pedido_id = ? AND produto_criado_id IS NULL', [id]);
        for (const troca of trocas) {
          const descricaoCompleta = troca.descricao
            ? `${troca.descricao} (recebido em troca no pedido #${id})`
            : `Recebido em troca no pedido #${id}`;
          const novoProdutoId = runInsertGetId(
            `INSERT INTO produtos (categoria, nome, marca, modelo, ano, preco_custo, preco_venda, quantidade, estoque_minimo, descricao, atributos, imagem)
             VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?)`,
            [troca.categoria, troca.nome, troca.marca || null, troca.modelo || null, troca.ano || null,
              troca.valor_credito, descricaoCompleta, troca.atributos || '{}', troca.imagem || null]
          );
          run('INSERT INTO movimentacoes (produto_id, tipo, quantidade, motivo, observacao) VALUES (?, ?, ?, ?, ?)',
            [novoProdutoId, 'entrada', 1, 'troca', `Recebido em troca no pedido #${id}`]);
          run("UPDATE produtos SET quantidade = quantidade + 1, atualizado_em = datetime('now','localtime') WHERE id = ?", [novoProdutoId]);
          run('UPDATE pedido_trocas SET produto_criado_id = ? WHERE id = ?', [novoProdutoId, troca.id]);
        }
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    persist();
    return pedidos.obter(id);
  },
  remover: (id) => { run('DELETE FROM pedidos WHERE id = ?', [id]); persist(); }
};

const dashboard = {
  resumo: () => {
    const totalProdutos = get('SELECT COUNT(*) as n FROM produtos').n;
    const valorEstoque = get('SELECT SUM(quantidade * preco_custo) as v FROM produtos').v || 0;
    const produtosBaixoEstoque = produtos.baixoEstoque().length;
    const pedidosAbertos = get("SELECT COUNT(*) as n FROM pedidos WHERE status IN ('orcamento','pedido')").n;
    const vendasMes = get(`SELECT SUM(valor_total) as v FROM pedidos
      WHERE status = 'faturado' AND strftime('%Y-%m', criado_em) = strftime('%Y-%m', 'now', 'localtime')`).v || 0;
    const lucroMes = get(`SELECT SUM((pi.preco_unitario - pi.custo_unitario) * pi.quantidade) as v
      FROM pedido_itens pi JOIN pedidos ped ON ped.id = pi.pedido_id
      WHERE ped.status = 'faturado' AND strftime('%Y-%m', ped.criado_em) = strftime('%Y-%m', 'now', 'localtime')`).v || 0;
    return { totalProdutos, valorEstoque, produtosBaixoEstoque, pedidosAbertos, vendasMes, lucroMes };
  },
  porCanal: () => all(`
    SELECT COALESCE(NULLIF(canal_origem, ''), 'Não informado') as canal, COUNT(*) as quantidade, SUM(valor_total) as valor_total
    FROM pedidos WHERE status != 'cancelado'
    GROUP BY canal ORDER BY valor_total DESC`),
  clientesPorCanal: () => all(`
    SELECT COALESCE(NULLIF(canal_origem, ''), 'Não informado') as canal, COUNT(*) as quantidade
    FROM clientes
    GROUP BY canal ORDER BY quantidade DESC`)
};

const usuarios = {
  existeAlgum: () => get('SELECT COUNT(*) as n FROM usuarios').n > 0,
  autenticar: (usuario, senha) => {
    const u = get('SELECT * FROM usuarios WHERE usuario = ? AND ativo = 1', [usuario]);
    if (!u || !verificarSenha(senha, u.senha)) return null;
    const { senha: _s, ...semSenha } = u;
    return semSenha;
  },
  listar: () => all('SELECT id, nome, usuario, papel, ativo, criado_em FROM usuarios ORDER BY nome ASC'),
  criar: ({ nome, usuario, senha, papel }) => {
    const existente = get('SELECT id FROM usuarios WHERE usuario = ?', [usuario]);
    if (existente) throw new Error('Já existe um usuário com esse nome de login.');
    const id = runInsertGetId('INSERT INTO usuarios (nome, usuario, senha, papel) VALUES (?, ?, ?, ?)',
      [nome, usuario, hashSenha(senha), papel || 'funcionario']);
    persist();
    const { senha: _s, ...semSenha } = get('SELECT * FROM usuarios WHERE id = ?', [id]);
    return semSenha;
  },
  definirAtivo: (id, ativo) => {
    run('UPDATE usuarios SET ativo = ? WHERE id = ?', [ativo ? 1 : 0, id]);
    persist();
  },
  redefinirSenha: (id, novaSenha) => {
    run('UPDATE usuarios SET senha = ? WHERE id = ?', [hashSenha(novaSenha), id]);
    persist();
  }
};

const fornecedores = {
  listar: () => all('SELECT * FROM fornecedores ORDER BY nome ASC'),
  obter: (id) => get('SELECT * FROM fornecedores WHERE id = ?', [id]),
  criar: (f) => {
    const id = runInsertGetId('INSERT INTO fornecedores (nome, contato, email, observacao) VALUES (?, ?, ?, ?)',
      [f.nome, f.contato || null, f.email || null, f.observacao || null]);
    persist();
    return fornecedores.obter(id);
  },
  atualizar: (id, f) => {
    run('UPDATE fornecedores SET nome=?, contato=?, email=?, observacao=? WHERE id=?',
      [f.nome, f.contato || null, f.email || null, f.observacao || null, id]);
    persist();
    return fornecedores.obter(id);
  },
  remover: (id) => { run('DELETE FROM fornecedores WHERE id = ?', [id]); persist(); }
};

const cotacoes = {
  listar: () => all(`SELECT c.*, f.nome as fornecedor_nome FROM cotacoes c
    JOIN fornecedores f ON f.id = c.fornecedor_id ORDER BY c.item ASC, c.valor ASC`),
  criar: (c) => {
    const id = runInsertGetId(
      'INSERT INTO cotacoes (fornecedor_id, item, valor, data_cotacao, validade, observacao) VALUES (?, ?, ?, ?, ?, ?)',
      [c.fornecedor_id, c.item, Number(c.valor) || 0, c.data_cotacao || new Date().toISOString(), c.validade || null, c.observacao || null]
    );
    persist();
    return get('SELECT c.*, f.nome as fornecedor_nome FROM cotacoes c JOIN fornecedores f ON f.id = c.fornecedor_id WHERE c.id = ?', [id]);
  },
  remover: (id) => { run('DELETE FROM cotacoes WHERE id = ?', [id]); persist(); }
};

function caminhoArquivo() {
  return dbPath;
}

module.exports = { iniciar, produtos, movimentacoes, clientes, pedidos, dashboard, usuarios, fornecedores, cotacoes, caminhoArquivo };
