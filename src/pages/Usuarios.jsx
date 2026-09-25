import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { mensagemErro } from '../lib/erro.js';

const vazio = { nome: '', usuario: '', senha: '', papel: 'funcionario' };

export default function Usuarios() {
  const { isAdmin, usuario: usuarioLogado } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(vazio);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = () => window.api.usuarios.listar().then(setUsuarios);

  useEffect(() => { if (isAdmin) carregar(); }, [isAdmin]);

  if (!isAdmin) return <div className="vazio">Acesso restrito ao administrador.</div>;

  const criar = async (e) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await window.api.usuarios.criar(form);
      setForm(vazio);
      setMostrarForm(false);
      carregar();
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível criar o usuário.'));
    } finally {
      setSalvando(false);
    }
  };

  const alternarAtivo = async (u) => {
    if (u.id === usuarioLogado.id) { alert('Você não pode desativar seu próprio usuário.'); return; }
    await window.api.usuarios.definirAtivo(u.id, u.ativo ? 0 : 1);
    carregar();
  };

  const redefinirSenha = async (u) => {
    const novaSenha = prompt(`Nova senha para ${u.nome}:`);
    if (!novaSenha) return;
    if (novaSenha.length < 4) { alert('A senha deve ter pelo menos 4 caracteres.'); return; }
    await window.api.usuarios.redefinirSenha(u.id, novaSenha);
    alert('Senha redefinida com sucesso.');
  };

  return (
    <div>
      <div className="topo-pagina">
        <div>
          <h1>Usuários</h1>
          <p className="subtitulo">Controle de acesso ao sistema</p>
        </div>
        <button className="botao" onClick={() => { setForm(vazio); setErro(''); setMostrarForm((v) => !v); }}>
          {mostrarForm ? 'Fechar' : '+ Novo usuário'}
        </button>
      </div>

      {mostrarForm && (
        <form className="formulario" onSubmit={criar} style={{ marginBottom: 24 }}>
          <div className="grade-form">
            <div className="campo">
              <label>Nome *</label>
              <input required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
            </div>
            <div className="campo">
              <label>Usuário (login) *</label>
              <input required value={form.usuario} onChange={(e) => setForm((f) => ({ ...f, usuario: e.target.value }))} />
            </div>
            <div className="campo">
              <label>Senha *</label>
              <input required type="password" value={form.senha} onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))} />
            </div>
            <div className="campo">
              <label>Papel</label>
              <select value={form.papel} onChange={(e) => setForm((f) => ({ ...f, papel: e.target.value }))}>
                <option value="funcionario">Funcionário (não vê preço de custo, não exclui registros)</option>
                <option value="admin">Administrador (acesso total)</option>
              </select>
            </div>
          </div>
          {erro && <p style={{ color: '#b3261e', fontSize: 13 }}>{erro}</p>}
          <div className="acoes-form">
            <button className="botao" type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Criar usuário'}</button>
          </div>
        </form>
      )}

      <table>
        <thead>
          <tr><th>Nome</th><th>Login</th><th>Papel</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.nome}</td>
              <td>{u.usuario}</td>
              <td style={{ textTransform: 'capitalize' }}>{u.papel}</td>
              <td>{u.ativo ? 'Ativo' : 'Inativo'}</td>
              <td style={{ display: 'flex', gap: 8 }}>
                <button className="botao secundario" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => redefinirSenha(u)}>Redefinir senha</button>
                <button className="botao secundario" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => alternarAtivo(u)}>
                  {u.ativo ? 'Desativar' : 'Ativar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
