import { useEffect, useState } from 'react';
import GraficoBarrasHorizontal from '../components/GraficoBarrasHorizontal.jsx';

const formatoMoeda = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Dashboard() {
  const [resumo, setResumo] = useState(null);
  const [baixoEstoque, setBaixoEstoque] = useState([]);
  const [porCanal, setPorCanal] = useState([]);
  const [clientesPorCanal, setClientesPorCanal] = useState([]);

  useEffect(() => {
    window.api.dashboard.resumo().then(setResumo);
    window.api.produtos.baixoEstoque().then(setBaixoEstoque);
    window.api.dashboard.porCanal().then(setPorCanal);
    window.api.dashboard.clientesPorCanal().then(setClientesPorCanal);
  }, []);

  if (!resumo) return <p>Carregando...</p>;

  return (
    <div>
      <h1>Painel</h1>
      <p className="subtitulo">Visão geral do seu negócio</p>

      <div className="cartoes">
        <div className="cartao">
          <div className="rotulo">Produtos cadastrados</div>
          <div className="valor">{resumo.totalProdutos}</div>
        </div>
        {resumo.valorEstoque !== undefined && (
          <div className="cartao">
            <div className="rotulo">Valor em estoque (custo)</div>
            <div className="valor">{formatoMoeda(resumo.valorEstoque)}</div>
          </div>
        )}
        <div className={`cartao ${resumo.produtosBaixoEstoque > 0 ? 'alerta' : ''}`}>
          <div className="rotulo">Produtos com estoque baixo</div>
          <div className="valor">{resumo.produtosBaixoEstoque}</div>
        </div>
        <div className="cartao">
          <div className="rotulo">Pedidos em aberto</div>
          <div className="valor">{resumo.pedidosAbertos}</div>
        </div>
        <div className="cartao">
          <div className="rotulo">Vendas faturadas (mês)</div>
          <div className="valor">{formatoMoeda(resumo.vendasMes)}</div>
        </div>
        {resumo.lucroMes !== undefined && (
          <div className="cartao">
            <div className="rotulo">Lucro faturado (mês)</div>
            <div className="valor">{formatoMoeda(resumo.lucroMes)}</div>
          </div>
        )}
      </div>

      <h2>Faturamento por canal de origem</h2>
      <p className="subtitulo">Onde as vendas estão vindo — use como referência pra saber em qual canal vale mais a pena investir</p>
      <GraficoBarrasHorizontal
        tipoValor="moeda"
        dados={porCanal.map((c) => ({ rotulo: c.canal, valor: c.valor_total || 0, detalhe: `${c.quantidade} pedido${c.quantidade === 1 ? '' : 's'}` }))}
      />

      <h2>Clientes captados por canal</h2>
      <p className="subtitulo">De onde vêm os novos clientes cadastrados</p>
      <GraficoBarrasHorizontal
        tipoValor="numero"
        dados={clientesPorCanal.map((c) => ({ rotulo: c.canal, valor: c.quantidade }))}
      />

      <h2>Alerta de estoque baixo</h2>
      {baixoEstoque.length === 0 ? (
        <div className="vazio">Nenhum produto abaixo do estoque mínimo.</div>
      ) : (
        <table>
          <thead>
            <tr><th>Produto</th><th>Categoria</th><th>Quantidade</th><th>Mínimo</th></tr>
          </thead>
          <tbody>
            {baixoEstoque.map((p) => (
              <tr key={p.id} onClick={() => (window.location.hash = `#/produtos/${p.id}`)}>
                <td>{p.nome}</td>
                <td style={{ textTransform: 'capitalize' }}>{p.categoria}</td>
                <td>{p.quantidade}</td>
                <td>{p.estoque_minimo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
