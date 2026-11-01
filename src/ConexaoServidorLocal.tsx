import { useState } from 'react';
import { criarClienteServidorLocal, type SaudeServidorLocal } from './servidorLocal';

const CHAVE_ENDERECO = 'ameaca-biologica:servidor-local:endereco:v1';

function enderecoInicial(): string {
  try { return localStorage.getItem(CHAVE_ENDERECO) ?? 'http://127.0.0.1:4175'; }
  catch { return 'http://127.0.0.1:4175'; }
}

export default function ConexaoServidorLocal() {
  const [endereco, setEndereco] = useState(enderecoInicial);
  const [saude, setSaude] = useState<SaudeServidorLocal | null>(null);
  const [erro, setErro] = useState('');
  const [consultando, setConsultando] = useState(false);

  async function verificar() {
    setErro('');
    setSaude(null);
    setConsultando(true);
    try {
      const cliente = criarClienteServidorLocal({ baseUrl: endereco.trim() });
      const resultado = await cliente.verificarSaude();
      if (!resultado.ok) throw new Error('O serviço respondeu, mas não confirmou estado saudável.');
      try { localStorage.setItem(CHAVE_ENDERECO, endereco.trim().replace(/\/$/, '')); }
      catch { /* A configuração continua válida durante esta visita. */ }
      setSaude(resultado);
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível verificar o servidor.');
    } finally {
      setConsultando(false);
    }
  }

  return <div className="aplicativo">
    <header className="topo"><div className="topo-interno">
      <span className="marca" aria-hidden="true">AB</span>
      <div className="nome-marca"><strong>AMEAÇA BIOLÓGICA</strong><small>RPG DE HORROR E SOBREVIVÊNCIA</small></div>
      <span className="tag">SERVIDOR LOCAL</span>
    </div></header>
    <main className="central servidor-local-pagina">
      <div className="cabecalho-central">
        <div><span className="sobretitulo"><i/> AMBIENTE EXPERIMENTAL</span>
          <h1>Conexão local</h1>
          <p>Diagnóstico independente do ambiente online e do laboratório de rascunhos.</p>
        </div>
      </div>
      <section className="cartao cartao-padrao servidor-local-cartao">
        <p className="rotulo">ETAPA 01 · CONECTIVIDADE</p>
        <h2>Endereço do servidor</h2>
        <p className="secundario">Informe o endereço HTTP/HTTPS da máquina que está executando o servidor local. Em outro dispositivo da mesma rede, use o endereço IP da máquina servidora e a porta configurada.</p>
        <form className="formulario" onSubmit={evento => { evento.preventDefault(); void verificar(); }}>
          <label>URL do servidor
            <input type="url" required value={endereco} onChange={evento => setEndereco(evento.target.value)} placeholder="http://127.0.0.1:4175" />
          </label>
          {erro && <p className="erro" role="alert">{erro}</p>}
          <button className="acao" type="submit" disabled={consultando || !endereco.trim()}>
            {consultando ? 'Verificando...' : 'Verificar conexão'} <span>→</span>
          </button>
        </form>
        {saude && <div className="servidor-local-resultado" role="status">
          <p className="sucesso"><strong>Servidor respondeu e confirmou disponibilidade.</strong></p>
          <dl>
            <div><dt>Serviço</dt><dd>{saude.service}</dd></div>
            <div><dt>Versão</dt><dd>{saude.version}</dd></div>
            <div><dt>Armazenamento</dt><dd>{saude.storage}</dd></div>
            <div><dt>Tempo real</dt><dd>{saude.realtime}</dd></div>
            <div><dt>Internet necessária</dt><dd>{saude.internetRequired ? 'Sim' : 'Não'}</dd></div>
            <div><dt>Autenticação</dt><dd>{saude.authentication}</dd></div>
          </dl>
          <p className="servidor-local-aviso">{saude.warning}</p>
        </div>}
      </section>
      <section className="nota-etapa servidor-local-limites">
        <strong>O QUE ESTA ETAPA FAZ — E O QUE NÃO FAZ</strong>
        <p>Por enquanto, apenas consulta o endpoint público de saúde. Não cria conta, não inicia sessão e não envia dados de Mesa ou personagens.</p>
        <p>O protótipo atual usa HTTP sem proteção de transporte. Use somente dados fictícios e uma rede privada confiável. Não informe senhas reais nem dados de campanha.</p>
      </section>
      <p className="servidor-local-voltar"><a href={import.meta.env.BASE_URL}>Voltar ao ambiente online</a> · <a href={import.meta.env.BASE_URL + '?laboratorio=local'}>Abrir laboratório fictício</a></p>
      <footer>AMEAÇA BIOLÓGICA RPG · SERVIDOR LOCAL EXPERIMENTAL</footer>
    </main>
  </div>;
}
