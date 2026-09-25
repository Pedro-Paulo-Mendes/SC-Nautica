import { useState } from 'react';

const COR_BARRA = '#2a78d6';

function formatarValor(v, tipo) {
  if (tipo === 'moeda') return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return v.toLocaleString('pt-BR');
}

export default function GraficoBarrasHorizontal({ dados, tipoValor = 'numero' }) {
  const [indiceHover, setIndiceHover] = useState(null);

  if (!dados || dados.length === 0) return <div className="vazio">Sem dados suficientes ainda.</div>;

  const maximo = Math.max(...dados.map((d) => d.valor), 1);

  return (
    <div className="grafico-barras">
      {dados.map((d, i) => {
        const largura = Math.max((d.valor / maximo) * 100, 2);
        return (
          <div
            key={d.rotulo}
            className="grafico-linha"
            onMouseEnter={() => setIndiceHover(i)}
            onMouseLeave={() => setIndiceHover(null)}
          >
            <div className="grafico-rotulo" title={d.rotulo}>{d.rotulo}</div>
            <div className="grafico-trilha">
              <div className="grafico-barra" style={{ width: `${largura}%`, background: COR_BARRA }} />
            </div>
            <div className="grafico-valor">
              {formatarValor(d.valor, tipoValor)}
              {d.detalhe && <span className="grafico-detalhe"> · {d.detalhe}</span>}
            </div>
            {indiceHover === i && (
              <div className="grafico-tooltip">
                <strong>{d.rotulo}</strong><br />
                {formatarValor(d.valor, tipoValor)}{d.detalhe ? ` · ${d.detalhe}` : ''}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
