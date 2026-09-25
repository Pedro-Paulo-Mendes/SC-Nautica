import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const formatoMoeda = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const navigate = useNavigate();

  const carregar = () => {
    window.api.produtos.listar({ busca, categoria: categoria || undefined }).then(setProdutos);
  };

  useEffect(() => { carregar(); }, [busca, categoria]);

  return (
    <div>
      <div className="topo-pagina">
        <div>
          <h1>Produtos</h1>
          <p className="subtitulo">Motores, barcos e carretas cadastrados</p>
        </div>
        <button className="botao" onClick={() => navigate('/produtos/novo')}>+ Novo produto</button>
      </div>

      <div className="filtros">
        <input placeholder="Buscar por nome, marca ou modelo..." value={busca} onChange={(e) => setBusca(e.target.value)} style={{ minWidth: 260 }} />
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="">Todas as categorias</option>
          <option value="motor">Motores</option>
          <option value="barco">Barcos</option>
          <option value="carreta">Carretas</option>
        </select>
      </div>

      {produtos.length === 0 ? (
        <div className="vazio">Nenhum produto encontrado.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th></th><th>Nome</th><th>Categoria</th><th>Marca / Modelo</th><th>Estoque</th><th>Preço venda</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((p) => (
              <tr key={p.id} onClick={() => navigate(`/produtos/${p.id}`)}>
                <td style={{ width: 48 }}>
                  {p.imagem ? (
                    <img src={p.imagem} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 6, background: '#eef2f6' }} />
                  )}
                </td>
                <td>{p.nome}</td>
                <td style={{ textTransform: 'capitalize' }}>{p.categoria}</td>
                <td>{[p.marca, p.modelo].filter(Boolean).join(' / ') || '-'}</td>
                <td style={{ color: p.quantidade <= p.estoque_minimo ? '#b3261e' : 'inherit', fontWeight: p.quantidade <= p.estoque_minimo ? 700 : 400 }}>
                  {p.quantidade}
                </td>
                <td>{formatoMoeda(p.preco_venda)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
