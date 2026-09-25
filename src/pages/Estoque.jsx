import { useEffect, useState } from 'react';

export default function Estoque() {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [form, setForm] = useState({ produto_id: '', tipo: 'entrada', quantidade: '', motivo: '', observacao: '' });
  const [salvando, setSalvando] = useState(false);

  const carregar = () => {
    window.api.movimentacoes.listarTodas(200).then(setMovimentacoes);
    window.api.produtos.listar({}).then(setProdutos);
  };

  useEffect(() => { carregar(); }, []);

  const registrar = async (e) => {
    e.preventDefault();
    if (!form.produto_id || !form.quantidade) return;
    setSalvando(true);
    await window.api.movimentacoes.registrar({
      produto_id: Number(form.produto_id),
      tipo: form.tipo,
      quantidade: Number(form.quantidade),
      motivo: form.motivo,
      observacao: form.observacao
    });
    setForm({ produto_id: '', tipo: 'entrada', quantidade: '', motivo: '', observacao: '' });
    setSalvando(false);
    carregar();
  };

  return (
    <div>
      <h1>Estoque</h1>
      <p className="subtitulo">Registre entradas e saídas de mercadoria</p>

      <form className="formulario" onSubmit={registrar} style={{ marginBottom: 28 }}>
        <h2>Registrar movimentação</h2>
        <div className="grade-form">
          <div className="campo largo">
            <label>Produto *</label>
            <select required value={form.produto_id} onChange={(e) => setForm((f) => ({ ...f, produto_id: e.target.value }))}>
              <option value="">Selecione um produto</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>{p.nome} (estoque atual: {p.quantidade})</option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label>Tipo</label>
            <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
              <option value="ajuste">Ajuste</option>
            </select>
          </div>
          <div className="campo">
            <label>Quantidade *</label>
            <input required type="number" min="1" value={form.quantidade} onChange={(e) => setForm((f) => ({ ...f, quantidade: e.target.value }))} />
          </div>
          <div className="campo">
            <label>Motivo</label>
            <input placeholder="Ex: compra, devolução, avaria..." value={form.motivo} onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))} />
          </div>
          <div className="campo largo">
            <label>Observação</label>
            <input value={form.observacao} onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))} />
          </div>
        </div>
        <div className="acoes-form">
          <button className="botao" type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Registrar'}</button>
        </div>
      </form>

      <h2>Histórico de movimentações</h2>
      {movimentacoes.length === 0 ? (
        <div className="vazio">Nenhuma movimentação registrada ainda.</div>
      ) : (
        <table>
          <thead>
            <tr><th>Data</th><th>Produto</th><th>Tipo</th><th>Quantidade</th><th>Motivo</th><th>Observação</th></tr>
          </thead>
          <tbody>
            {movimentacoes.map((m) => (
              <tr key={m.id}>
                <td>{m.data}</td>
                <td>{m.produto_nome}</td>
                <td style={{ textTransform: 'capitalize' }}>{m.tipo}</td>
                <td>{m.quantidade}</td>
                <td>{m.motivo || '-'}</td>
                <td>{m.observacao || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
