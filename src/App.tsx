import { useState, useEffect } from "react";
import { Sparkles, Shield, ArrowRight, CheckCircle2, Lock } from "lucide-react";

export function App() {
  const [redditUser, setRedditUser] = useState<string>("");
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const user = params.get("user") || params.get("reddit_user") || "";
    if (user) {
      setRedditUser(user.replace(/^u\//i, "").trim());
    }
  }, []);

  const handleCheckout = (priceId: string) => {
    setIsRedirecting(true);
    const stripePaymentUrl = `https://buy.stripe.com/test_destinyvox?client_reference_id=${encodeURIComponent(redditUser || "guest")}&price=${priceId}`;
    window.location.href = stripePaymentUrl;
  };

  return (
    <div className="min-h-screen bg-[#040404] text-[#f5f5f5] selection:bg-white selection:text-black">
      {/* Top Banner Reddit Recognition */}
      {redditUser && (
        <div className="bg-[#111111] border-b border-neutral-800 py-2.5 px-4 text-center">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 font-mono text-[11px] tracking-wider text-neutral-300">
            <span className="text-amber-400">✦</span>
            <span>EFEMÉRIDES & ORÁCULO SINCRONIZADOS PARA:</span>
            <span className="text-white font-bold bg-neutral-900 border border-neutral-700 px-2 py-0.5">
              u/{redditUser}
            </span>
            <span className="hidden sm:inline text-neutral-500">• O Oráculo no Reddit será desbloqueado automaticamente após a ativação</span>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <header className="border-b border-neutral-900 px-6 sm:px-12 py-5 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-white text-base">✦</span>
          <span className="font-mono text-sm tracking-[0.3em] font-semibold text-white uppercase">
            DESTINYVOX
          </span>
          <span className="font-mono text-[9px] tracking-widest text-neutral-500 uppercase border border-neutral-800 px-2 py-0.5 hidden sm:inline-block">
            ORÁCULO IA
          </span>
        </div>

        <div className="flex items-center gap-4 font-mono text-xs">
          <a
            href="#pricing"
            className="bg-white text-black hover:bg-neutral-200 px-4 py-2 font-semibold tracking-widest uppercase transition-colors"
          >
            CONSULTAR ORÁCULO ⟶
          </a>
        </div>
      </header>

      {/* Hero Section Editorial */}
      <section className="px-6 sm:px-12 pt-20 pb-16 max-w-5xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 border border-neutral-800 bg-neutral-950/80 px-3 py-1 font-mono text-[10px] tracking-[0.25em] text-neutral-400 uppercase">
          <Sparkles className="w-3 h-3 text-amber-400" />
          ORÁCULO DESTINYVOX • INTELIGÊNCIA ARTIFICIAL HERMÉTICA
        </div>

        <h1 className="font-editorial text-4xl sm:text-6xl md:text-7xl font-normal leading-[1.08] tracking-tight text-white">
          Pergunte qualquer coisa <br />
          <span className="italic text-neutral-400">ao seu próprio cosmos.</span>
        </h1>

        <p className="font-editorial text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto font-light leading-relaxed">
          Você já calculou os números da sua alma. Agora, dialogue diretamente com o Oráculo DestinyVox: respostas ultra-personalizadas sobre decisões de vida, amor, carreira, desafios ocultos e o tempo exato de cada movimento.
        </p>

        {/* Dynamic CTA */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#pricing"
            className="w-full sm:w-auto h-14 px-8 bg-white text-black hover:bg-neutral-200 font-mono text-xs font-bold tracking-[0.25em] uppercase transition-all flex items-center justify-center gap-3 shadow-2xl"
          >
            <span>DESBLOQUEAR O ORÁCULO IA</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <span className="font-mono text-[11px] text-neutral-500">
            Ativação imediata no app do Reddit
          </span>
        </div>
      </section>

      {/* Preview do Recurso Secreto no Reddit */}
      <section className="px-6 sm:px-12 py-12 max-w-5xl mx-auto">
        <div className="border border-neutral-800 bg-[#080808] p-6 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-amber-500/10 border-b border-l border-amber-500/30 px-4 py-1.5 font-mono text-[10px] text-amber-300 tracking-widest uppercase flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-amber-400" />
            RESPOSTAS PROFUNDAS EM TEMPO REAL
          </div>

          <div className="space-y-6 max-w-2xl">
            <span className="font-mono text-xs tracking-[0.2em] text-neutral-500 uppercase block">
              COMO O ORÁCULO FUNCIONA COM SEU MAPA
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl text-white font-normal">
              Uma mente alimentada pelas suas coordenadas pitagóricas
            </h2>
            <p className="font-editorial text-sm sm:text-base text-neutral-400 leading-relaxed">
              Diferente de IAs genéricas, o Oráculo DestinyVox cruza seu Caminho de Vida, Desejo da Alma e Ano Pessoal a cada pergunta. Ele entende seus bloqueios inconscientes e entrega direcionamentos cirúrgicos no app do Reddit para {redditUser ? `u/${redditUser}` : "você"}:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs pt-2">
              <div className="border border-neutral-800 p-4 bg-neutral-950 space-y-1.5">
                <span className="text-white font-semibold block">✦ DECISÕES & TIMING CÓSMICO</span>
                <p className="text-neutral-400 text-[11px] font-light">
                  Saiba exatamente se o momento atual favorece mudanças de carreira, novos negócios ou paciência estratégica.
                </p>
              </div>
              <div className="border border-neutral-800 p-4 bg-neutral-950 space-y-1.5">
                <span className="text-white font-semibold block">✦ DIÁLOGOS ILIMITADOS</span>
                <p className="text-neutral-400 text-[11px] font-light">
                  Faça perguntas profundas, tire dúvidas sobre relacionamentos e explore dilemas sem limite de interação.
                </p>
              </div>
              <div className="border border-neutral-800 p-4 bg-neutral-950 space-y-1.5">
                <span className="text-white font-semibold block">✦ RADAR DE AFINIDADE NO REDDIT</span>
                <p className="text-neutral-400 text-[11px] font-light">
                  Pergunte ao Oráculo sobre dinâmicas e atritos com qualquer usuário do Reddit através da Sinastria.
                </p>
              </div>
              <div className="border border-neutral-800 p-4 bg-neutral-950 space-y-1.5">
                <span className="text-white font-semibold block">✦ RESPOSTAS PRIORITÁRIAS</span>
                <p className="text-neutral-400 text-[11px] font-light">
                  Processamento com máxima profundidade e raciocínio hermético avançado em cada consulta.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-6 sm:px-12 py-20 max-w-5xl mx-auto space-y-12 text-center">
        <div className="space-y-3">
          <span className="font-mono text-xs tracking-[0.25em] text-neutral-500 uppercase">
            PLANOS DE CONSULTA
          </span>
          <h2 className="font-editorial text-3xl sm:text-5xl text-white font-normal">
            Ative o Oráculo da sua jornada
          </h2>
          <p className="font-editorial text-base text-neutral-400 max-w-md mx-auto">
            Acesso imediato para conversar com a inteligência artificial do seu mapa dentro do Reddit.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
          {/* Plano 1: Oráculo Essencial */}
          <div className="border border-neutral-800 bg-[#080808] p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs tracking-widest text-neutral-400 uppercase">ORÁCULO ESSENCIAL</span>
                <span className="font-mono text-[9px] tracking-widest border border-neutral-800 px-2 py-0.5 text-neutral-400">PAGAMENTO ÚNICO</span>
              </div>
              <div>
                <div className="font-editorial text-4xl text-white font-normal">R$ 29,90 <span className="text-sm font-mono text-neutral-500">/ ou $5.99</span></div>
                <span className="font-mono text-[10px] text-neutral-500 tracking-wider">Acesso para u/{redditUser || "você"}</span>
              </div>

              <div className="border-t border-neutral-800 pt-4 space-y-3 font-mono text-xs text-neutral-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>50 Consultas personalizadas com o Oráculo</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Análise de perguntas sobre amor, dinheiro e carreira</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Previsão dos 12 meses do seu Ano Pessoal</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Dossiê Arquetípico 360° completo</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleCheckout("price_individual")}
              disabled={isRedirecting}
              className="w-full h-12 bg-white text-black hover:bg-neutral-200 font-mono text-xs font-bold tracking-widest uppercase transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isRedirecting ? "CONECTANDO AO STRIPE..." : "ATIVAR ORÁCULO ESSENCIAL ⟶"}</span>
            </button>
          </div>

          {/* Plano 2: Oráculo Ilimitado VIP (Mais Procurado) */}
          <div className="border-2 border-white bg-[#0a0a0a] p-8 space-y-6 flex flex-col justify-between relative">
            <div className="absolute -top-3 right-6 bg-white text-black font-mono text-[9px] font-bold tracking-[0.2em] uppercase px-3 py-0.5">
              MAIS PROCURADO • CONSULTAS LIVRES
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs tracking-widest text-amber-300 uppercase font-semibold">ORÁCULO ILIMITADO VIP</span>
                <span className="font-mono text-[9px] tracking-widest border border-white px-2 py-0.5 text-white">VITALÍCIO</span>
              </div>
              <div>
                <div className="font-editorial text-4xl text-white font-normal">R$ 49,90 <span className="text-sm font-mono text-neutral-500">/ ou $9.99</span></div>
                <span className="font-mono text-[10px] text-neutral-400 tracking-wider">Perguntas sem limites para sempre</span>
              </div>

              <div className="border-t border-neutral-800 pt-4 space-y-3 font-mono text-xs text-neutral-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-white">Consultas 100% Ilimitadas com o Oráculo IA</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Respostas longas e detalhadas com raciocínio expandido</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Cruzamento e conselho de Sinastria com qualquer pessoa</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Geração de novos mapas e perguntas para terceiros</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Selo Dourado de Iniciado VIP no r/DestinyVox</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleCheckout("price_vip_unlimited")}
              disabled={isRedirecting}
              className="w-full h-12 bg-white text-black hover:bg-neutral-200 active:bg-neutral-300 font-mono text-xs font-bold tracking-widest uppercase transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isRedirecting ? "CONECTANDO AO STRIPE..." : "OBTER ORÁCULO ILIMITADO ⟶"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Security & Guarantee */}
      <footer className="border-t border-neutral-900 py-12 px-6 sm:px-12 text-center space-y-4 font-mono text-xs text-neutral-500">
        <div className="flex items-center justify-center gap-6">
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Pagamento Criptografado Stripe</span>
          <span>•</span>
          <span>Garantia Incondicional de 7 Dias</span>
          <span>•</span>
          <span>Sincronização Instantânea com o Reddit</span>
        </div>
        <div className="text-[10px] text-neutral-600">
          DESTINYVOX ORACLE © {new Date().getFullYear()} — INTELIGÊNCIA CÓSMICA HERMÉTICA.
        </div>
      </footer>
    </div>
  );
}

export default App;

