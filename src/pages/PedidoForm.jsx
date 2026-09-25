import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CANAIS_SUGERIDOS } from '../lib/canais.js';
import ItemTrocaCard from '../components/ItemTrocaCard.jsx';

const formatoMoeda = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function PedidoForm() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [canalOrigem, setCanalOrigem] = useState('');
  const [observacao, setObservacao] = useState('');
  const [itens, setItens] = useState([{ produto_id: '', quantidade: 1, preco_unitario: 0 }]);
  const [trocas, setTrocas] = useState([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    window.api.clientes.listar().then(setClientes);
    window.api.produtos.listar({}).then(setProdutos);
  }, []);

  const atualizarItem = (index, campo, valor) => {
    setItens((atual) => atual.map((item, i) => {
      if (i !== index) return item;
      const novo = { ...item, [campo]: valor };
      if (campo === 'produto_id') {
        const produto = produtos.find((p) => p.id === Number(valor));
        if (produto) novo.preco_unitario = produto.preco_venda;
      }
      return novo;
    }));
  };

  const adicionarItem = () => setItens((atual) => [...atual, { produto_id: '', quantidade: 1, preco_unitario: 0 }]);
  const removerItem = (index) => setItens((atual) => atual.filter((_, i) => i !== index));

  const atualizarTroca = (index, campo, valor) => {
    setTrocas((atual) => atual.map((t, i) => (i === index ? { ...t, [campo]: valor } : t)));
  };
  const atualizarAtributoTroca = (index, chave, valor) => {
    setTrocas((atual) => atual.map((t, i) => (i === index ? { ...t, atributos: { ...t.atributos, [chave]: valor } } : t)));
  };
  const adicionarTroca = () => setTrocas((atual) => [...atual, {
    categoria: 'motor', nome: '', marca: '', modelo: '', ano: '', atributos: {}, imagem: null, descricao: '', valor_credito: ''
  }]);
  const removerTroca = (index) => setTrocas((atual) => atual.filter((_, i) => i !== index));

  const valorItens = itens.reduce((soma, it) => soma + (Number(it.quantidade) || 0) * (Number(it.preco_unitario) || 0), 0);
  const valorTrocas = trocas.reduce((soma, t) => soma + (Number(t.valor_credito) || 0), 0);
  const totalLiquido = valorItens - valorTrocas;

  const salvar = async (e) => {
    e.preventDefault();
    const itensValidos = itens.filter((it) => it.produto_id && it.quantidade > 0)
      .map((it) => ({ produto_id: Number(it.produto_id), quantidade: Number(it.quantidade), preco_unitario: Number(it.preco_unitario) }));
    if (itensValidos.length === 0) { alert('Adicione ao menos um item ao pedido.'); return; }
    const trocasValidas = trocas.filter((t) => t.nome && t.valor_credito !== '')
      .map((t) => ({
        categoria: t.categoria, nome: t.nome, marca: t.marca || null, modelo: t.modelo || null,
        ano: t.ano ? Number(t.ano) : null, atributos: t.atributos || {}, imagem: t.imagem || null,
        descricao: t.descricao || null, valor_credito: Number(t.valor_credito) || 0
      }));
    setSalvando(true);
    const pedido = await window.api.pedidos.criar({
      cliente_id: clienteId ? Number(clienteId) : null,
      canal_origem: canalOrigem || null,
      observacao,
      itens: itensValidos,
      trocas: trocasValidas
    });
    navigate(`/pedidos/${pedido.id}`);
  };

  return (
    <div>
      <button className="voltar" onClick={() => navigate('/pedidos')}>&larr; Voltar para pedidos</button>
      <h1>Novo pedido</h1>
      <p className="subtitulo">Comece como orçamento; o status pode ser avançado depois</p>

      <form className="formulario" style={{ maxWidth: 860 }} onSubmit={salvar}>
        <div className="grade-form">
          <div className="campo">
            <label>Cliente</label>
            <select value={clienteId} onChange={(e) => {
              const novoId = e.target.value;
              setClienteId(novoId);
              if (!canalOrigem) {
                const cliente = clientes.find((c) => c.id === Number(novoId));
                if (cliente?.canal_origem) setCanalOrigem(cliente.canal_origem);
              }
            }}>
              <option value="">Sem cliente definido</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="campo">
            <label>Canal de origem</label>
            <input list="canais-sugeridos" placeholder="Ex: WhatsApp, Mercado Livre..." value={canalOrigem} onChange={(e) => setCanalOrigem(e.target.value)} />
            <datalist id="canais-sugeridos">
              {CANAIS_SUGERIDOS.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="campo largo">
            <label>Observação</label>
            <input value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          </div>
        </div>

        <h2>Itens</h2>
        {itens.map((item, index) => (
          <div className="linha-itens" key={index}>
            <select value={item.produto_id} onChange={(e) => atualizarItem(index, 'produto_id', e.target.value)}>
              <option value="">Selecione um produto</option>
              {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome} (estoque: {p.quantidade})</option>)}
            </select>
            <input type="number" min="1" placeholder="Qtd" value={item.quantidade} onChange={(e) => atualizarItem(index, 'quantidade', e.target.value)} />
            <input type="number" step="0.01" placeholder="Preço unit." value={item.preco_unitario} onChange={(e) => atualizarItem(index, 'preco_unitario', e.target.value)} />
            <span>{formatoMoeda((item.quantidade || 0) * (item.preco_unitario || 0))}</span>
            <button type="button" className="botao secundario" onClick={() => removerItem(index)} disabled={itens.length === 1}>Remover</button>
          </div>
        ))}
        <button type="button" className="botao secundario" onClick={adicionarItem}>+ Adicionar item</button>

        <h2 style={{ marginTop: 24 }}>Itens recebidos em troca (opcional)</h2>
        <p className="subtitulo" style={{ marginTop: -8 }}>Ex: cliente troca o motor usado dele por um novo, com compensação em dinheiro</p>
        {trocas.map((troca, index) => (
          <ItemTrocaCard
            key={index}
            troca={troca}
            onChange={(campo, valor) => atualizarTroca(index, campo, valor)}
            onChangeAtributo={(chave, valor) => atualizarAtributoTroca(index, chave, valor)}
            onRemover={() => removerTroca(index)}
          />
        ))}
        <button type="button" className="botao secundario" onClick={adicionarTroca}>+ Adicionar item recebido em troca</button>

        {trocas.length > 0 && (
          <div style={{ marginTop: 14, fontSize: 13, color: '#475569', textAlign: 'right' }}>
            <div>Valor dos itens vendidos: {formatoMoeda(valorItens)}</div>
            <div>Valor das trocas: −{formatoMoeda(valorTrocas)}</div>
          </div>
        )}

        <div className="total-pedido" style={{ color: totalLiquido < 0 ? '#b3261e' : undefined }}>
          {totalLiquido < 0 ? 'Valor a devolver ao cliente' : 'Total'}: {formatoMoeda(Math.abs(totalLiquido))}
        </div>

        <div className="acoes-form">
          <button className="botao" type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Criar pedido'}</button>
          <button className="botao secundario" type="button" onClick={() => navigate('/pedidos')}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}
