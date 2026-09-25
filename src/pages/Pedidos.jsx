import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const formatoMoeda = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    window.api.pedidos.listar({ status: status || undefined }).then(setPedidos);
  }, [status]);

  return (
    <div>
      <div className="topo-pagina">
        <div>
          <h1>Pedidos</h1>
          <p className="subtitulo">Orçamentos, pedidos e vendas faturadas</p>
        </div>
        <button className="botao" onClick={() => navigate('/pedidos/novo')}>+ Novo pedido</button>
      </div>

      <div className="filtros">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="orcamento">Orçamento</option>
          <option value="pedido">Pedido</option>
          <option value="faturado">Faturado</option>
          <option value="entregue">Entregue</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {pedidos.length === 0 ? (
        <div className="vazio">Nenhum pedido encontrado.</div>
      ) : (
        <table>
          <thead>
            <tr><th>#</th><th>Cliente</th><th>Canal</th><th>Status</th><th>Valor total</th><th>Criado em</th></tr>
          </thead>
          <tbody>
            {pedidos.map((p) => (
              <tr key={p.id} onClick={() => navigate(`/pedidos/${p.id}`)}>
                <td>#{p.id}</td>
                <td>{p.cliente_nome || 'Sem cliente'}</td>
                <td>{p.canal_origem || '-'}</td>
                <td><span className={`badge ${p.status}`}>{p.status}</span></td>
                <td>{formatoMoeda(p.valor_total)}</td>
                <td>{p.criado_em}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
