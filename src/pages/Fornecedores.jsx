import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const formatoMoeda = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fornecedorVazio = { nome: '', contato: '', email: '', observacao: '' };
const cotacaoVazia = { fornecedor_id: '', item: '', valor: '', validade: '', observacao: '' };

export default function Fornecedores() {
  const { isAdmin } = useAuth();
  const [fornecedores, setFornecedores] = useState([]);
  const [cotacoes, setCotacoes] = useState([]);
  const [formFornecedor, setFormFornecedor] = useState(fornecedorVazio);
  const [mostrarFormFornecedor, setMostrarFormFornecedor] = useState(false);
  const [formCotacao, setFormCotacao] = useState(cotacaoVazia);

  const carregar = () => {
    window.api.fornecedores.listar().then(setFornecedores);
    window.api.cotacoes.listar().then(setCotacoes);
  };

  useEffect(() => { if (isAdmin) carregar(); }, [isAdmin]);

  if (!isAdmin) return <div className="vazio">Acesso restrito ao administrador.</div>;

  const salvarFornecedor = async (e) => {
    e.preventDefault();
    await window.api.fornecedores.criar(formFornecedor);
    setFormFornecedor(fornecedorVazio);
    setMostrarFormFornecedor(false);
    carregar();
  };

  const removerFornecedor = async (id) => {
    if (!confirm('Remover este fornecedor? As cotações dele também serão removidas.')) return;
    await window.api.fornecedores.remover(id);
    carregar();
  };

  const salvarCotacao = async (e) => {
    e.preventDefault();
    if (!formCotacao.fornecedor_id) { alert('Selecione um fornecedor.'); return; }
    await window.api.cotacoes.criar(formCotacao);
    setFormCotacao(cotacaoVazia);
    carregar();
  };

  const removerCotacao = async (id) => {
    await window.api.cotacoes.remover(id);
    carregar();
  };

  const cotacoesPorItem = cotacoes.reduce((mapa, c) => {
    (mapa[c.item] = mapa[c.item] || []).push(c);
    return mapa;
  }, {});

  return (
    <div>
      <div className="topo-pagina">
        <div>
          <h1>Fornecedores</h1>
          <p className="subtitulo">Cadastro de fornecedores e comparação de cotações</p>
        </div>
        <button className="botao" onClick={() => setMostrarFormFornecedor((v) => !v)}>
          {mostrarFormFornecedor ? 'Fechar' : '+ Novo fornecedor'}
        </button>
      </div>

      {mostrarFormFornecedor && (
        <form className="formulario" onSubmit={salvarFornecedor} style={{ marginBottom: 24 }}>
          <div className="grade-form">
            <div className="campo">
              <label>Nome *</label>
              <input required value={formFornecedor.nome} onChange={(e) => setFormFornecedor((f) => ({ ...f, nome: e.target.value }))} />
            </div>
            <div className="campo">
              <label>Contato (telefone/WhatsApp)</label>
              <input value={formFornecedor.contato} onChange={(e) => setFormFornecedor((f) => ({ ...f, contato: e.target.value }))} />
            </div>
            <div className="campo">
              <label>E-mail</label>
              <input type="email" value={formFornecedor.email} onChange={(e) => setFormFornecedor((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="campo largo">
              <label>Observação</label>
              <input value={formFornecedor.observacao} onChange={(e) => setFormFornecedor((f) => ({ ...f, observacao: e.target.value }))} />
            </div>
          </div>
          <div className="acoes-form">
            <button className="botao" type="submit">Cadastrar fornecedor</button>
          </div>
        </form>
      )}

      <table style={{ marginBottom: 28 }}>
        <thead><tr><th>Nome</th><th>Contato</th><th>E-mail</th><th></th></tr></thead>
        <tbody>
          {fornecedores.map((f) => (
            <tr key={f.id}>
              <td>{f.nome}</td>
              <td>{f.contato || '-'}</td>
              <td>{f.email || '-'}</td>
              <td>
                <button className="botao perigo" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => removerFornecedor(f.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Registrar cotação</h2>
      <form className="formulario" onSubmit={salvarCotacao} style={{ marginBottom: 28 }}>
        <div className="grade-form">
          <div className="campo">
            <label>Fornecedor *</label>
            <select required value={formCotacao.fornecedor_id} onChange={(e) => setFormCotacao((f) => ({ ...f, fornecedor_id: e.target.value }))}>
              <option value="">Selecione</option>
              {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </div>
          <div className="campo">
            <label>Item cotado *</label>
            <input required placeholder="Ex: Motor Yamaha 15HP 0km" value={formCotacao.item} onChange={(e) => setFormCotacao((f) => ({ ...f, item: e.target.value }))} />
          </div>
          <div className="campo">
            <label>Valor (R$) *</label>
            <input required type="number" step="0.01" value={formCotacao.valor} onChange={(e) => setFormCotacao((f) => ({ ...f, valor: e.target.value }))} />
          </div>
          <div className="campo">
            <label>Validade da cotação</label>
            <input type="date" value={formCotacao.validade} onChange={(e) => setFormCotacao((f) => ({ ...f, validade: e.target.value }))} />
          </div>
          <div className="campo largo">
            <label>Observação</label>
            <input value={formCotacao.observacao} onChange={(e) => setFormCotacao((f) => ({ ...f, observacao: e.target.value }))} />
          </div>
        </div>
        <div className="acoes-form">
          <button className="botao" type="submit">Salvar cotação</button>
        </div>
      </form>

      <h2>Comparação de cotações por item</h2>
      {Object.keys(cotacoesPorItem).length === 0 ? (
        <div className="vazio">Nenhuma cotação registrada ainda.</div>
      ) : (
        Object.entries(cotacoesPorItem).map(([item, lista]) => (
          <div key={item} style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 15 }}>{item}</h2>
            <table>
              <thead><tr><th>Fornecedor</th><th>Valor</th><th>Validade</th><th>Observação</th><th></th></tr></thead>
              <tbody>
                {lista.map((c, i) => (
                  <tr key={c.id} style={i === 0 ? { background: '#e8f5ec' } : undefined}>
                    <td>{c.fornecedor_nome}{i === 0 ? ' 🏆' : ''}</td>
                    <td>{formatoMoeda(c.valor)}</td>
                    <td>{c.validade || '-'}</td>
                    <td>{c.observacao || '-'}</td>
                    <td>
                      <button className="botao secundario" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => removerCotacao(c.id)}>Remover</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
