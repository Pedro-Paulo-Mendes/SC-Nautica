const formatoMoeda = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function escaparHtml(texto) {
  if (texto == null) return '';
  return String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const TITULOS_STATUS = {
  orcamento: 'Orçamento',
  pedido: 'Pedido',
  faturado: 'Pedido faturado',
  entregue: 'Pedido entregue',
  cancelado: 'Pedido cancelado'
};

function montarHtmlPedido(pedido) {
  const titulo = TITULOS_STATUS[pedido.status] || 'Pedido';
  const linhasItens = pedido.itens.map((item) => `
    <tr>
      <td>${escaparHtml(item.produto_nome)}</td>
      <td style="text-transform:capitalize">${escaparHtml(item.produto_categoria)}</td>
      <td style="text-align:center">${item.quantidade}</td>
      <td style="text-align:right">${formatoMoeda(item.preco_unitario)}</td>
      <td style="text-align:right">${formatoMoeda(item.quantidade * item.preco_unitario)}</td>
    </tr>`).join('');

  const trocas = pedido.trocas || [];
  const linhasTrocas = trocas.map((t) => `
    <tr>
      <td>${escaparHtml(t.nome)}</td>
      <td style="text-transform:capitalize">${escaparHtml(t.categoria)}</td>
      <td style="text-align:right">${formatoMoeda(t.valor_credito)}</td>
    </tr>`).join('');

  const totalLiquido = pedido.valor_total;
  const rotuloTotal = totalLiquido < 0 ? 'Valor a devolver ao cliente' : 'Total a receber';

  return `<!doctype html>
  <html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      body { font-family: Arial, sans-serif; color: #1c2733; padding: 32px; font-size: 13px; }
      .cabecalho { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f3057; padding-bottom: 14px; margin-bottom: 20px; }
      .cabecalho h1 { color: #0f3057; margin: 0; font-size: 22px; }
      .cabecalho .subtitulo { color: #64748b; font-size: 12px; margin-top: 2px; }
      .cabecalho .doc-titulo { text-align: right; }
      .cabecalho .doc-titulo strong { font-size: 16px; color: #0f3057; }
      .info { margin-bottom: 18px; }
      .info div { margin-bottom: 3px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
      thead th { text-align: left; background: #eef2f6; padding: 8px 10px; font-size: 11px; text-transform: uppercase; color: #475569; }
      tbody td { padding: 8px 10px; border-bottom: 1px solid #eef1f4; }
      .total { text-align: right; font-size: 16px; font-weight: bold; color: #0f3057; margin-top: 6px; }
      .observacao { margin-top: 18px; font-size: 12px; color: #475569; }
      .rodape { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; }
    </style>
  </head>
  <body>
    <div class="cabecalho">
      <div>
        <h1>SC Náutica</h1>
        <div class="subtitulo">Motores de popa · Barcos · Carretas</div>
      </div>
      <div class="doc-titulo">
        <strong>${titulo} #${pedido.id}</strong><br />
        ${pedido.criado_em}
      </div>
    </div>

    <div class="info">
      <div><strong>Cliente:</strong> ${escaparHtml(pedido.cliente_nome) || 'Não informado'}</div>
      ${pedido.cliente_telefone ? `<div><strong>Telefone:</strong> ${escaparHtml(pedido.cliente_telefone)}</div>` : ''}
      ${pedido.canal_origem ? `<div><strong>Canal de origem:</strong> ${escaparHtml(pedido.canal_origem)}</div>` : ''}
    </div>

    <table>
      <thead>
        <tr><th>Produto</th><th>Categoria</th><th style="text-align:center">Qtd.</th><th style="text-align:right">Preço unit.</th><th style="text-align:right">Subtotal</th></tr>
      </thead>
      <tbody>${linhasItens}</tbody>
    </table>

    ${trocas.length > 0 ? `
    <div style="margin-bottom:6px"><strong>Itens recebidos em troca</strong></div>
    <table>
      <thead>
        <tr><th>Item</th><th>Categoria</th><th style="text-align:right">Valor de crédito</th></tr>
      </thead>
      <tbody>${linhasTrocas}</tbody>
    </table>
    <div style="text-align:right; font-size:12px; color:#475569; margin-bottom:4px">Valor dos itens vendidos: ${formatoMoeda(pedido.valor_itens)}</div>
    <div style="text-align:right; font-size:12px; color:#475569; margin-bottom:10px">Valor das trocas: −${formatoMoeda(pedido.valor_trocas)}</div>
    ` : ''}

    <div class="total">${rotuloTotal}: ${formatoMoeda(Math.abs(totalLiquido))}</div>

    ${pedido.observacao ? `<div class="observacao"><strong>Observação:</strong> ${escaparHtml(pedido.observacao)}</div>` : ''}

    <div class="rodape">Documento gerado pelo sistema SC Náutica em ${new Date().toLocaleString('pt-BR')}</div>
  </body>
  </html>`;
}

module.exports = { montarHtmlPedido };
