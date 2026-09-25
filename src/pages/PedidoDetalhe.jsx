import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { mensagemErro } from '../lib/erro.js';

const formatoMoeda = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const PROXIMO_STATUS = {
  orcamento: ['pedido', 'cancelado'],
  pedido: ['faturado', 'cancelado'],
  faturado: ['entregue'],
  entregue: [],
  cancelado: []
};

export default function PedidoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [pedido, setPedido] = useState(null);
  const [atualizando, setAtualizando] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const carregar = () => window.api.pedidos.obter(Number(id)).then(setPedido);

  useEffect(() => { carregar(); }, [id]);

  const gerarPdf = async () => {
    setGerandoPdf(true);
    try {
      const caminho = await window.api.pedidos.gerarPdf(Number(id));
      if (!caminho) return;
    } catch (err) {
      alert(mensagemErro(err, 'Não foi possível gerar o PDF.'));
    } finally {
      setGerandoPdf(false);
    }
  };

  const mudarStatus = async (novoStatus) => {
    if (novoStatus === 'faturado' && !confirm('Ao faturar, a saída de estoque dos itens será registrada automaticamente. Confirmar?')) return;
    setAtualizando(true);
    await window.api.pedidos.atualizarStatus(Number(id), novoStatus);
    await carregar();
    setAtualizando(false);
  };

  if (!pedido) return <p>Carregando...</p>;

  return (
    <div>
      <button className="voltar" onClick={() => navigate('/pedidos')}>&larr; Voltar para pedidos</button>
      <div className="topo-pagina">
        <div>
          <h1>Pedido #{pedido.id}</h1>
          <p className="subtitulo">
            Cliente: {pedido.cliente_nome || 'Sem cliente'} {pedido.cliente_telefone ? `· ${pedido.cliente_telefone}` : ''}
            {pedido.canal_origem ? ` · Canal: ${pedido.canal_origem}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className={`badge ${pedido.status}`} style={{ fontSize: 13, padding: '6px 14px' }}>{pedido.status}</span>
          <button className="botao secundario" onClick={gerarPdf} disabled={gerandoPdf}>{gerandoPdf ? 'Gerando...' : 'Gerar PDF'}</button>
        </div>
      </div>

      <table style={{ marginBottom: 20 }}>
        <thead>
          <tr><th>Produto</th><th>Categoria</th><th>Quantidade</th><th>Preço unit.</th><th>Subtotal</th></tr>
        </thead>
        <tbody>
          {pedido.itens.map((item) => (
            <tr key={item.id}>
              <td>{item.produto_nome}</td>
              <td style={{ textTransform: 'capitalize' }}>{item.produto_categoria}</td>
              <td>{item.quantidade}</td>
              <td>{formatoMoeda(item.preco_unitario)}</td>
              <td>{formatoMoeda(item.quantidade * item.preco_unitario)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {isAdmin && pedido.itens.every((item) => item.custo_unitario !== undefined) && (
        <p style={{ fontSize: 13, color: '#475569', textAlign: 'right', marginBottom: 16 }}>
          Lucro deste pedido (itens vendidos): {formatoMoeda(pedido.itens.reduce((soma, item) => soma + (item.preco_unitario - item.custo_unitario) * item.quantidade, 0))}
        </p>
      )}

      {pedido.trocas && pedido.trocas.length > 0 && (
        <>
          <h2>Itens recebidos em troca</h2>
          <table style={{ marginBottom: 12 }}>
            <thead>
              <tr><th></th><th>Item</th><th>Categoria</th><th>Valor de crédito</th><th></th></tr>
            </thead>
            <tbody>
              {pedido.trocas.map((t) => (
                <tr key={t.id}>
                  <td style={{ width: 48 }}>
                    {t.imagem ? (
                      <img src={t.imagem} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: 6, background: '#eef2f6' }} />
                    )}
                  </td>
                  <td>
                    {t.nome}
                    {(t.marca || t.modelo) ? ` (${[t.marca, t.modelo].filter(Boolean).join(' ')})` : ''}
                    {t.descricao ? ` — ${t.descricao}` : ''}
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{t.categoria}</td>
                  <td>{formatoMoeda(t.valor_credito)}</td>
                  <td>
                    {t.produto_criado_id ? (
                      <a href={`#/produtos/${t.produto_criado_id}`} style={{ color: '#2f6db5', fontSize: 12 }}>Ver no estoque</a>
                    ) : (
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>Entra no estoque ao faturar</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 13, color: '#475569', textAlign: 'right', marginBottom: 12 }}>
            <div>Valor dos itens vendidos: {formatoMoeda(pedido.valor_itens)}</div>
            <div>Valor das trocas: −{formatoMoeda(pedido.valor_trocas)}</div>
          </div>
        </>
      )}

      <div className="total-pedido" style={{ marginBottom: 20, color: pedido.valor_total < 0 ? '#b3261e' : undefined }}>
        {pedido.valor_total < 0 ? 'Valor a devolver ao cliente' : 'Total'}: {formatoMoeda(Math.abs(pedido.valor_total))}
      </div>

      {pedido.observacao && (
        <p><strong>Observação:</strong> {pedido.observacao}</p>
      )}

      <div className="acoes-form">
        {PROXIMO_STATUS[pedido.status].map((s) => (
          <button key={s} className={`botao ${s === 'cancelado' ? 'perigo' : ''}`} disabled={atualizando} onClick={() => mudarStatus(s)}>
            {s === 'pedido' && 'Confirmar pedido'}
            {s === 'faturado' && 'Marcar como faturado'}
            {s === 'entregue' && 'Marcar como entregue'}
            {s === 'cancelado' && 'Cancelar pedido'}
          </button>
        ))}
        {PROXIMO_STATUS[pedido.status].length === 0 && <p className="subtitulo">Nenhuma ação disponível para este status.</p>}
      </div>
    </div>
  );
}
