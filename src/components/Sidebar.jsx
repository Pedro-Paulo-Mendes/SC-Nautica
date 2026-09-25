import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  { to: '/', label: 'Painel', fim: true },
  { to: '/produtos', label: 'Produtos' },
  { to: '/estoque', label: 'Estoque' },
  { to: '/pedidos', label: 'Pedidos' },
  { to: '/clientes', label: 'Clientes' }
];

const linksAdmin = [
  { to: '/fornecedores', label: 'Fornecedores' },
  { to: '/usuarios', label: 'Usuários' },
  { to: '/configuracoes', label: 'Configurações' }
];

export default function Sidebar() {
  const { usuario, isAdmin, logout } = useAuth();

  return (
    <nav className="sidebar">
      <div className="marca">
        <span className="marca-nome">SC Náutica</span>
        <span className="marca-sub">Sistema</span>
      </div>
      <ul>
        {links.map((l) => (
          <li key={l.to}>
            <NavLink to={l.to} end={l.fim} className={({ isActive }) => (isActive ? 'ativo' : '')}>
              {l.label}
            </NavLink>
          </li>
        ))}
        {isAdmin && linksAdmin.map((l) => (
          <li key={l.to}>
            <NavLink to={l.to} className={({ isActive }) => (isActive ? 'ativo' : '')}>
              {l.label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="sidebar-rodape">
        <div className="sidebar-usuario">
          <div className="sidebar-usuario-nome">{usuario.nome}</div>
          <div className="sidebar-usuario-papel">{usuario.papel === 'admin' ? 'Administrador' : 'Funcionário'}</div>
        </div>
        <button className="sidebar-sair" onClick={logout}>Sair</button>
      </div>
    </nav>
  );
}
