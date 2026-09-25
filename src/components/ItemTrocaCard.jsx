import { useState } from 'react';
import { CAMPOS_POR_CATEGORIA } from '../lib/camposProduto.js';
import { lerImagemRedimensionada } from '../lib/imagem.js';

export default function ItemTrocaCard({ troca, onChange, onChangeAtributo, onRemover }) {
  const [processandoImagem, setProcessandoImagem] = useState(false);
  const camposExtras = CAMPOS_POR_CATEGORIA[troca.categoria] || [];

  const selecionarImagem = async (e) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setProcessandoImagem(true);
    try {
      const dataUrl = await lerImagemRedimensionada(arquivo);
      onChange('imagem', dataUrl);
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessandoImagem(false);
      e.target.value = '';
    }
  };

  return (
    <div style={{ border: '1px solid #e1e0d9', borderRadius: 8, padding: 16, marginBottom: 14 }}>
      <div className="grade-form">
        <div className="campo">
          <label>Categoria</label>
          <select value={troca.categoria} onChange={(e) => onChange('categoria', e.target.value)}>
            <option value="motor">Motor de popa</option>
            <option value="barco">Barco</option>
            <option value="carreta">Carreta</option>
          </select>
        </div>
        <div className="campo">
          <label>Nome *</label>
          <input required placeholder="Ex: Motor Tohatsu 10HP usado" value={troca.nome} onChange={(e) => onChange('nome', e.target.value)} />
        </div>
        <div className="campo">
          <label>Marca</label>
          <input value={troca.marca || ''} onChange={(e) => onChange('marca', e.target.value)} />
        </div>
        <div className="campo">
          <label>Modelo</label>
          <input value={troca.modelo || ''} onChange={(e) => onChange('modelo', e.target.value)} />
        </div>
        <div className="campo">
          <label>Ano</label>
          <input type="number" value={troca.ano || ''} onChange={(e) => onChange('ano', e.target.value)} />
        </div>

        {camposExtras.map((campo) => (
          <div className="campo" key={campo.chave}>
            <label>{campo.rotulo}</label>
            {campo.tipo === 'select' ? (
              <select value={troca.atributos[campo.chave] || ''} onChange={(e) => onChangeAtributo(campo.chave, e.target.value)}>
                <option value="">Selecione</option>
                {campo.opcoes.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input type={campo.tipo} value={troca.atributos[campo.chave] || ''} onChange={(e) => onChangeAtributo(campo.chave, e.target.value)} />
            )}
          </div>
        ))}

        <div className="campo">
          <label>Valor de crédito (R$) *</label>
          <input required type="number" step="0.01" value={troca.valor_credito} onChange={(e) => onChange('valor_credito', e.target.value)} />
        </div>

        <div className="campo largo">
          <label>Foto</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {troca.imagem && (
              <img src={troca.imagem} alt="Pré-visualização" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 8, border: '1px solid #cdd8e3' }} />
            )}
            <div>
              <input type="file" accept="image/*" onChange={selecionarImagem} disabled={processandoImagem} />
              {processandoImagem && <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Processando imagem...</p>}
            </div>
          </div>
        </div>

        <div className="campo largo">
          <label>Observação (condição, número de série se não coberto acima, etc.)</label>
          <input value={troca.descricao || ''} onChange={(e) => onChange('descricao', e.target.value)} />
        </div>
      </div>

      <button type="button" className="botao perigo" style={{ padding: '5px 10px', fontSize: 12 }} onClick={onRemover}>Remover este item</button>
    </div>
  );
}
