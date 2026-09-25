import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { lerImagemRedimensionada, redimensionarDataUrl } from '../lib/imagem.js';
import { mensagemErro } from '../lib/erro.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CAMPOS_POR_CATEGORIA } from '../lib/camposProduto.js';

const vazio = {
  categoria: 'motor', nome: '', marca: '', modelo: '', ano: '',
  preco_custo: '', preco_venda: '', quantidade: '', estoque_minimo: '', descricao: '', atributos: {}, imagem: null
};

export default function ProdutoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const editando = Boolean(id);
  const [dados, setDados] = useState(vazio);
  const [salvando, setSalvando] = useState(false);
  const [processandoImagem, setProcessandoImagem] = useState(false);
  const [buscandoFotos, setBuscandoFotos] = useState(false);
  const [resultadosFotos, setResultadosFotos] = useState(null);
  const [erroFotos, setErroFotos] = useState('');

  useEffect(() => {
    if (editando) window.api.produtos.obter(Number(id)).then((p) => p && setDados({ ...vazio, ...p, atributos: p.atributos || {} }));
  }, [id]);

  const atualizarCampo = (campo, valor) => setDados((d) => ({ ...d, [campo]: valor }));
  const atualizarAtributo = (chave, valor) => setDados((d) => ({ ...d, atributos: { ...d.atributos, [chave]: valor } }));

  const selecionarImagem = async (e) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setProcessandoImagem(true);
    try {
      const dataUrl = await lerImagemRedimensionada(arquivo);
      atualizarCampo('imagem', dataUrl);
    } catch (err) {
      alert(mensagemErro(err));
    } finally {
      setProcessandoImagem(false);
      e.target.value = '';
    }
  };

  const buscarFotosAutomaticamente = async () => {
    setErroFotos('');
    setResultadosFotos(null);
    setBuscandoFotos(true);
    try {
      const resultados = await window.api.buscaImagem.buscar({ categoria: dados.categoria, marca: dados.marca, modelo: dados.modelo });
      setResultadosFotos(resultados);
      if (resultados.length === 0) setErroFotos('Nenhuma foto encontrada para essa busca.');
    } catch (err) {
      setErroFotos(mensagemErro(err));
    } finally {
      setBuscandoFotos(false);
    }
  };

  const escolherFotoEncontrada = async (foto) => {
    setErroFotos('');
    setProcessandoImagem(true);
    try {
      const dataUrlOriginal = await window.api.buscaImagem.baixar(foto.url);
      const dataUrlRedimensionada = await redimensionarDataUrl(dataUrlOriginal);
      atualizarCampo('imagem', dataUrlRedimensionada);
      setResultadosFotos(null);
    } catch (err) {
      setErroFotos(mensagemErro(err));
    } finally {
      setProcessandoImagem(false);
    }
  };

  const salvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    const payload = {
      ...dados,
      ano: dados.ano ? Number(dados.ano) : null,
      preco_custo: Number(dados.preco_custo) || 0,
      preco_venda: Number(dados.preco_venda) || 0,
      quantidade: Number(dados.quantidade) || 0,
      estoque_minimo: Number(dados.estoque_minimo) || 0
    };
    if (editando) await window.api.produtos.atualizar(Number(id), payload);
    else await window.api.produtos.criar(payload);
    navigate('/produtos');
  };

  const remover = async () => {
    if (!confirm('Remover este produto? Essa ação não pode ser desfeita.')) return;
    await window.api.produtos.remover(Number(id));
    navigate('/produtos');
  };

  const camposExtras = CAMPOS_POR_CATEGORIA[dados.categoria] || [];

  return (
    <div>
      <button className="voltar" onClick={() => navigate('/produtos')}>&larr; Voltar para produtos</button>
      <h1>{editando ? 'Editar produto' : 'Novo produto'}</h1>
      <p className="subtitulo">Cadastro de motor, barco ou carreta</p>

      <form className="formulario" onSubmit={salvar}>
        <div className="grade-form">
          <div className="campo">
            <label>Categoria</label>
            <select value={dados.categoria} onChange={(e) => setDados((d) => ({ ...d, categoria: e.target.value, atributos: {} }))}>
              <option value="motor">Motor de popa</option>
              <option value="barco">Barco</option>
              <option value="carreta">Carreta</option>
            </select>
          </div>
          <div className="campo">
            <label>Nome *</label>
            <input required value={dados.nome} onChange={(e) => atualizarCampo('nome', e.target.value)} />
          </div>
          <div className="campo">
            <label>Marca</label>
            <input value={dados.marca || ''} onChange={(e) => atualizarCampo('marca', e.target.value)} />
          </div>
          <div className="campo">
            <label>Modelo</label>
            <input value={dados.modelo || ''} onChange={(e) => atualizarCampo('modelo', e.target.value)} />
          </div>
          <div className="campo">
            <label>Ano</label>
            <input type="number" value={dados.ano || ''} onChange={(e) => atualizarCampo('ano', e.target.value)} />
          </div>

          {camposExtras.map((campo) => (
            <div className="campo" key={campo.chave}>
              <label>{campo.rotulo}</label>
              {campo.tipo === 'select' ? (
                <select value={dados.atributos[campo.chave] || ''} onChange={(e) => atualizarAtributo(campo.chave, e.target.value)}>
                  <option value="">Selecione</option>
                  {campo.opcoes.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type={campo.tipo} value={dados.atributos[campo.chave] || ''} onChange={(e) => atualizarAtributo(campo.chave, e.target.value)} />
              )}
            </div>
          ))}

          {isAdmin && (
            <div className="campo">
              <label>Preço de custo (R$)</label>
              <input type="number" step="0.01" value={dados.preco_custo} onChange={(e) => atualizarCampo('preco_custo', e.target.value)} />
            </div>
          )}
          <div className="campo">
            <label>Preço de venda (R$)</label>
            <input type="number" step="0.01" value={dados.preco_venda} onChange={(e) => atualizarCampo('preco_venda', e.target.value)} />
          </div>
          <div className="campo">
            <label>Quantidade em estoque</label>
            <input type="number" value={dados.quantidade} onChange={(e) => atualizarCampo('quantidade', e.target.value)} disabled={editando} />
          </div>
          <div className="campo">
            <label>Estoque mínimo (alerta)</label>
            <input type="number" value={dados.estoque_minimo} onChange={(e) => atualizarCampo('estoque_minimo', e.target.value)} />
          </div>

          <div className="campo largo">
            <label>Foto do produto</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {dados.imagem && (
                <img src={dados.imagem} alt="Pré-visualização" style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid #cdd8e3' }} />
              )}
              <div>
                <input type="file" accept="image/*" onChange={selecionarImagem} disabled={processandoImagem} />
                {processandoImagem && <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Processando imagem...</p>}
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <button type="button" className="botao secundario" style={{ padding: '5px 10px', fontSize: 12 }} onClick={buscarFotosAutomaticamente} disabled={buscandoFotos || processandoImagem}>
                    {buscandoFotos ? 'Buscando...' : 'Buscar foto automaticamente'}
                  </button>
                  {dados.imagem && (
                    <button type="button" className="botao secundario" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => atualizarCampo('imagem', null)}>
                      Remover foto
                    </button>
                  )}
                </div>
              </div>
            </div>

            {erroFotos && <p style={{ fontSize: 12, color: '#b91c1c', marginTop: 8 }}>{erroFotos}</p>}

            {resultadosFotos && resultadosFotos.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 6px' }}>Clique na foto que representa melhor o produto:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {resultadosFotos.map((foto, i) => (
                    <button
                      type="button"
                      key={i}
                      title={foto.fonte}
                      onClick={() => escolherFotoEncontrada(foto)}
                      disabled={processandoImagem}
                      style={{ padding: 0, border: '2px solid #cdd8e3', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: 'none', width: 84, height: 84 }}
                    >
                      <img src={foto.miniatura} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="campo largo">
            <label>Descrição</label>
            <textarea value={dados.descricao || ''} onChange={(e) => atualizarCampo('descricao', e.target.value)} />
          </div>
        </div>

        {editando && <p style={{ fontSize: 12, color: '#64748b' }}>A quantidade em estoque só pode ser alterada pela tela de Estoque (entradas/saídas), para manter o histórico correto.</p>}

        <div className="acoes-form">
          <button className="botao" type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
          <button className="botao secundario" type="button" onClick={() => navigate('/produtos')}>Cancelar</button>
          {editando && isAdmin && <button className="botao perigo" type="button" onClick={remover} style={{ marginLeft: 'auto' }}>Excluir</button>}
        </div>
      </form>
    </div>
  );
}
