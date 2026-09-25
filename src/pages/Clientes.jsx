import { useEffect, useState } from 'react';
import { CANAIS_SUGERIDOS } from '../lib/canais.js';
import { useAuth } from '../context/AuthContext.jsx';

const vazio = { nome: '', telefone: '', email: '', documento: '', endereco: '', canal_origem: '' };

export default function Clientes() {
  const { isAdmin } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState(vazio);
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  const carregar = () => window.api.clientes.listar(busca).then(setClientes);

  useEffect(() => { carregar(); }, [busca]);

  const salvar = async (e) => {
    e.preventDefault();
    if (editandoId) await window.api.clientes.atualizar(editandoId, form);
    else await window.api.clientes.criar(form);
    setForm(vazio);
    setEditandoId(null);
    setMostrarForm(false);
    carregar();
  };

  const editar = (cliente) => {
    setForm({ nome: cliente.nome, telefone: cliente.telefone || '', email: cliente.email || '', documento: cliente.documento || '', endereco: cliente.endereco || '', canal_origem: cliente.canal_origem || '' });
    setEditandoId(cliente.id);
    setMostrarForm(true);
  };

  const remover = async (id) => {
    if (!confirm('Remover este cliente?')) return;
    await window.api.clientes.remover(id);
    carregar();
  };

  return (
    <div>
      <div className="topo-pagina">
        <div>
          <h1>Clientes</h1>
          <p className="subtitulo">Cadastro de clientes</p>
        </div>
        <button className="botao" onClick={() => { setForm(vazio); setEditandoId(null); setMostrarForm((v) => !v); }}>
          {mostrarForm ? 'Fechar' : '+ Novo cliente'}
        </button>
      </div>

      {mostrarForm && (
        <form className="formulario" onSubmit={salvar} style={{ marginBottom: 24 }}>
          <div className="grade-form">
            <div className="campo">
              <label>Nome *</label>
              <input required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
            </div>
            <div className="campo">
              <label>Telefone</label>
              <input value={form.telefone} onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))} />
            </div>
            <div className="campo">
              <label>E-mail</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="campo">
              <label>CPF / CNPJ</label>
              <input value={form.documento} onChange={(e) => setForm((f) => ({ ...f, documento: e.target.value }))} />
            </div>
            <div className="campo">
              <label>Como conheceu / canal de origem</label>
              <input list="canais-sugeridos-cliente" placeholder="Ex: WhatsApp, OLX, Facebook..." value={form.canal_origem} onChange={(e) => setForm((f) => ({ ...f, canal_origem: e.target.value }))} />
              <datalist id="canais-sugeridos-cliente">
                {CANAIS_SUGERIDOS.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="campo largo">
              <label>Endereço</label>
              <input value={form.endereco} onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))} />
            </div>
          </div>
          <div className="acoes-form">
            <button className="botao" type="submit">{editandoId ? 'Salvar alterações' : 'Cadastrar'}</button>
          </div>
        </form>
      )}

      <div className="filtros">
        <input placeholder="Buscar por nome ou documento..." value={busca} onChange={(e) => setBusca(e.target.value)} style={{ minWidth: 280 }} />
      </div>

      {clientes.length === 0 ? (
        <div className="vazio">Nenhum cliente cadastrado.</div>
      ) : (
        <table>
          <thead>
            <tr><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Documento</th><th>Canal de origem</th><th></th></tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id} onClick={() => editar(c)}>
                <td>{c.nome}</td>
                <td>{c.telefone || '-'}</td>
                <td>{c.email || '-'}</td>
                <td>{c.documento || '-'}</td>
                <td>{c.canal_origem || '-'}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  {isAdmin && <button className="botao perigo" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => remover(c.id)}>Excluir</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
