import { useEffect, useState } from 'react';
import { mensagemErro } from '../lib/erro.js';

export default function Login({ onAutenticado }) {
  const [carregando, setCarregando] = useState(true);
  const [precisaCriarAdmin, setPrecisaCriarAdmin] = useState(false);
  const [nome, setNome] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    window.api.usuarios.existeAlgum().then((existe) => {
      setPrecisaCriarAdmin(!existe);
      setCarregando(false);
    });
  }, []);

  const entrar = async (e) => {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const usuarioLogado = await window.api.usuarios.login({ usuario, senha });
      onAutenticado(usuarioLogado);
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível entrar.'));
    } finally {
      setEnviando(false);
    }
  };

  const criarAdmin = async (e) => {
    e.preventDefault();
    setErro('');
    if (senha !== confirmarSenha) { setErro('As senhas não coincidem.'); return; }
    if (senha.length < 4) { setErro('A senha deve ter pelo menos 4 caracteres.'); return; }
    setEnviando(true);
    try {
      const usuarioLogado = await window.api.usuarios.criarPrimeiro({ nome, usuario, senha });
      onAutenticado(usuarioLogado);
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível criar o administrador.'));
    } finally {
      setEnviando(false);
    }
  };

  if (carregando) return null;

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f3057' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 36, width: 380, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
        <h1 style={{ marginTop: 0, color: '#0f3057' }}>SC Náutica</h1>
        <p className="subtitulo" style={{ marginBottom: 22 }}>
          {precisaCriarAdmin ? 'Primeiro acesso — crie o usuário administrador' : 'Entre com seu usuário e senha'}
        </p>

        {precisaCriarAdmin ? (
          <form onSubmit={criarAdmin}>
            <div className="campo">
              <label>Seu nome</label>
              <input required value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="campo">
              <label>Usuário (login)</label>
              <input required value={usuario} onChange={(e) => setUsuario(e.target.value)} />
            </div>
            <div className="campo">
              <label>Senha</label>
              <input required type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
            </div>
            <div className="campo">
              <label>Confirmar senha</label>
              <input required type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} />
            </div>
            {erro && <p style={{ color: '#b3261e', fontSize: 13 }}>{erro}</p>}
            <button className="botao" type="submit" disabled={enviando} style={{ width: '100%' }}>
              {enviando ? 'Criando...' : 'Criar administrador e entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={entrar}>
            <div className="campo">
              <label>Usuário</label>
              <input required value={usuario} onChange={(e) => setUsuario(e.target.value)} autoFocus />
            </div>
            <div className="campo">
              <label>Senha</label>
              <input required type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
            </div>
            {erro && <p style={{ color: '#b3261e', fontSize: 13 }}>{erro}</p>}
            <button className="botao" type="submit" disabled={enviando} style={{ width: '100%' }}>
              {enviando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
