import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Login from './pages/Login.jsx';
import { AuthContext } from './context/AuthContext.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Produtos from './pages/Produtos.jsx';
import ProdutoForm from './pages/ProdutoForm.jsx';
import Estoque from './pages/Estoque.jsx';
import Clientes from './pages/Clientes.jsx';
import Pedidos from './pages/Pedidos.jsx';
import PedidoForm from './pages/PedidoForm.jsx';
import PedidoDetalhe from './pages/PedidoDetalhe.jsx';
import Usuarios from './pages/Usuarios.jsx';
import Configuracoes from './pages/Configuracoes.jsx';
import Fornecedores from './pages/Fornecedores.jsx';

export default function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(undefined);

  useEffect(() => {
    window.api.usuarios.sessaoAtual().then(setUsuarioLogado);
  }, []);

  const logout = async () => {
    await window.api.usuarios.logout();
    setUsuarioLogado(null);
  };

  if (usuarioLogado === undefined) return null;
  if (!usuarioLogado) return <Login onAutenticado={setUsuarioLogado} />;

  return (
    <AuthContext.Provider value={{ usuario: usuarioLogado, isAdmin: usuarioLogado.papel === 'admin', logout }}>
      <div className="layout">
        <Sidebar />
        <main className="conteudo">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/produtos/novo" element={<ProdutoForm />} />
            <Route path="/produtos/:id" element={<ProdutoForm />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/pedidos/novo" element={<PedidoForm />} />
            <Route path="/pedidos/:id" element={<PedidoDetalhe />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/fornecedores" element={<Fornecedores />} />
          </Routes>
        </main>
      </div>
    </AuthContext.Provider>
  );
}
