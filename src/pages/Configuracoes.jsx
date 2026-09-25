import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

function formatarTamanho(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Configuracoes() {
  const { isAdmin } = useAuth();
  const [config, setConfig] = useState(null);
  const [backups, setBackups] = useState([]);
  const [fazendoBackup, setFazendoBackup] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [buscaImagemConfig, setBuscaImagemConfig] = useState(null);
  const [salvandoBusca, setSalvandoBusca] = useState(false);
  const [mensagemBusca, setMensagemBusca] = useState('');

  const carregar = () => {
    window.api.backup.obterConfig().then(setConfig);
    window.api.backup.listar().then(setBackups);
  };

  useEffect(() => {
    if (isAdmin) {
      carregar();
      window.api.buscaImagem.obterConfig().then(setBuscaImagemConfig);
    }
  }, [isAdmin]);

  const salvarBuscaImagem = async (e) => {
    e.preventDefault();
    setSalvandoBusca(true);
    setMensagemBusca('');
    await window.api.buscaImagem.definirConfig(buscaImagemConfig);
    setMensagemBusca('Configuração salva.');
    setSalvandoBusca(false);
  };

  if (!isAdmin) return <div className="vazio">Acesso restrito ao administrador.</div>;
  if (!config) return <p>Carregando...</p>;

  const escolherPasta = async () => {
    await window.api.backup.escolherPasta();
    carregar();
  };

  const removerPastaExtra = async () => {
    await window.api.backup.removerPastaExtra();
    carregar();
  };

  const fazerBackupAgora = async () => {
    setFazendoBackup(true);
    setMensagem('');
    const resultados = await window.api.backup.agora();
    const falhas = resultados.filter((r) => !r.ok);
    setMensagem(falhas.length === 0 ? 'Backup realizado com sucesso.' : `Backup feito, mas com problemas em: ${falhas.map((f) => f.pasta).join(', ')}`);
    setFazendoBackup(false);
    carregar();
  };

  return (
    <div>
      <h1>Configurações</h1>
      <p className="subtitulo">Backup automático dos dados do sistema</p>

      <div className="formulario" style={{ marginBottom: 24 }}>
        <h2>Backup</h2>
        <p style={{ fontSize: 13, color: '#475569' }}>
          O sistema faz backup automático ao abrir, a cada 15 minutos e ao fechar o programa.
          Os backups ficam guardados na pasta padrão do sistema; você também pode indicar uma pasta extra
          (por exemplo, uma pasta sincronizada com Google Drive ou OneDrive) pra ter uma cópia fora do computador.
        </p>

        <div className="campo largo">
          <label>Pasta padrão de backup</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input readOnly value={config.pastaPadrao} style={{ flex: 1 }} />
            <button className="botao secundario" onClick={() => window.api.backup.abrirPasta()}>Abrir pasta</button>
          </div>
        </div>

        <div className="campo largo">
          <label>Pasta extra (opcional, recomendado)</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input readOnly value={config.pastaBackupExtra || 'Nenhuma pasta configurada'} style={{ flex: 1 }} />
            <button className="botao secundario" onClick={escolherPasta}>Escolher pasta</button>
            {config.pastaBackupExtra && <button className="botao secundario" onClick={removerPastaExtra}>Remover</button>}
          </div>
        </div>

        <div className="acoes-form">
          <button className="botao" onClick={fazerBackupAgora} disabled={fazendoBackup}>
            {fazendoBackup ? 'Fazendo backup...' : 'Fazer backup agora'}
          </button>
        </div>
        {mensagem && <p style={{ fontSize: 13, color: '#1c7a45', marginTop: 10 }}>{mensagem}</p>}
      </div>

      <div className="formulario" style={{ marginBottom: 24 }}>
        <h2>Busca automática de fotos (Google)</h2>
        <p style={{ fontSize: 13, color: '#475569' }}>
          Permite buscar fotos de motores, barcos e carretas pela internet direto na tela de cadastro de produto,
          a partir da marca e do modelo. Usa a API de Busca de Imagens do Google (Custom Search), que exige uma
          chave própria — gratuita até 100 buscas por dia; acima disso o Google cobra por uso. Crie a chave em
          console.cloud.google.com (API "Custom Search API") e o mecanismo de busca (marcando "buscar toda a web"
          e "busca de imagens") em programmablesearchengine.google.com.
        </p>
        {buscaImagemConfig && (
          <form onSubmit={salvarBuscaImagem}>
            <div className="campo largo">
              <label>Chave de API do Google</label>
              <input
                type="password"
                value={buscaImagemConfig.googleApiKey}
                onChange={(e) => setBuscaImagemConfig((c) => ({ ...c, googleApiKey: e.target.value }))}
              />
            </div>
            <div className="campo largo">
              <label>ID do mecanismo de busca (cx)</label>
              <input
                value={buscaImagemConfig.googleCxId}
                onChange={(e) => setBuscaImagemConfig((c) => ({ ...c, googleCxId: e.target.value }))}
              />
            </div>
            <div className="acoes-form">
              <button className="botao" type="submit" disabled={salvandoBusca}>{salvandoBusca ? 'Salvando...' : 'Salvar'}</button>
            </div>
            {mensagemBusca && <p style={{ fontSize: 13, color: '#1c7a45', marginTop: 10 }}>{mensagemBusca}</p>}
          </form>
        )}
      </div>

      <h2>Backups recentes (pasta padrão)</h2>
      {backups.length === 0 ? (
        <div className="vazio">Nenhum backup realizado ainda.</div>
      ) : (
        <table>
          <thead><tr><th>Arquivo</th><th>Data</th><th>Tamanho</th></tr></thead>
          <tbody>
            {backups.map((b) => (
              <tr key={b.nome}>
                <td>{b.nome}</td>
                <td>{new Date(b.data).toLocaleString('pt-BR')}</td>
                <td>{formatarTamanho(b.tamanho)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
