import { ArrowDown, ArrowRight, ArrowUpRight, Check, Fingerprint, Mail, Sparkles } from "lucide-react";
import { PixCheckout } from "./PixCheckout";
import { CATALOG, brl } from "@/lib/catalog";

const benefits = [
  { index: "01", name: "Seu caminho", title: "O que faz sentido para você?", text: "Seu Caminho de Vida traduz a data em que você nasceu em temas de propósito e aprendizado. Um ponto de partida para olhar suas escolhas com mais intenção.", numbers: "Caminho de Vida + Maturidade", symbol: "↗" },
  { index: "02", name: "Seus talentos", title: "O que você faz tão bem que nem percebe?", text: "As letras do seu nome e o dia do seu nascimento revelam, na numerologia, potenciais que você pode reconhecer e desenvolver no dia a dia.", numbers: "Expressão + Dia de Nascimento", symbol: "✳" },
  { index: "03", name: "Seu mundo interior", title: "O que você sente combina com o que mostra?", text: "Compare as motivações associadas às vogais do seu nome com a presença representada pelas consoantes. Uma nova lente para suas relações e necessidades.", numbers: "Desejo da Alma + Personalidade", symbol: "◎" },
  { index: "04", name: "Seu momento", title: "Qual é o tema da fase que você está vivendo?", text: "Ano, Mês e Dia Pessoal ajudam a observar o presente. Leia o significado de cada ciclo e leve uma pergunta prática para a sua rotina.", numbers: "Ano + Mês + Dia Pessoal", symbol: "◷" },
];
const faqs = [
  ["Preciso entender de numerologia?", "Não. Cada número vem acompanhado de uma interpretação em português, da explicação do cálculo e de uma pergunta para reflexão. Você pode começar pelo tema que mais chama sua atenção."],
  ["O que está incluído nos R$ 19,90?", "Seu mapa online com nove números: Caminho de Vida, Expressão, Desejo da Alma, Personalidade, Dia de Nascimento, Maturidade, Ano Pessoal, Mês Pessoal e Dia Pessoal. Os três adicionais do formulário são opcionais e só entram no total se você selecionar."],
  ["Como recebo e acesso minha leitura?", "Após a confirmação do Pix, enviamos um link de acesso para o e-mail informado. Seu mapa abre no navegador do celular ou computador. Para voltar depois, use a opção ‘Já tenho meu mapa’ no topo da página e solicite um novo link."],
  ["Qual nome devo informar?", "Use seu nome completo de nascimento, como aparece na certidão, incluindo os sobrenomes. Confira também a data e o e-mail antes de gerar o Pix. Os cálculos usam exatamente os dados informados."],
  ["Isso prevê o meu futuro?", "A numerologia é uma prática simbólica de autoconhecimento. A leitura apresenta temas e possibilidades de reflexão; não prevê acontecimentos nem determina suas escolhas. Seu contexto e suas experiências continuam sendo essenciais."],
  ["É uma assinatura?", "Não. O mapa custa R$ 19,90 em pagamento único. Se você escolher algum adicional, o valor aparece discriminado antes de gerar o Pix. Não há cobrança mensal."],
];

export function LandingPage() {
  return <div className="map-theme landing-page min-h-screen">
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 border-b border-black/20 px-5 py-5 sm:px-10 sm:py-6">
      <a href="/" aria-label="DestinyVox início" className="map-eyebrow flex items-center gap-2 sm:gap-3"><span className="text-3xl leading-none">✳</span><span>DestinyVox</span></a>
      <nav aria-label="Navegação principal" className="flex items-center gap-7 text-xs"><a className="hidden hover:underline md:block" href="#leitura">O que vou descobrir</a><a href="/acesso" className="flex items-center gap-2 border-b border-black/30 pb-1">Já tenho meu mapa <ArrowUpRight className="size-3.5" /></a></nav>
    </header>
    <main>
      <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-12 pt-10 sm:px-10 sm:pb-16 sm:pt-16 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-14">
        <div>
          <p className="map-eyebrow mb-6 flex items-center gap-2 text-[#626b51]"><span className="size-1.5 rounded-full bg-[#626b51]" /> Numerologia para olhar para dentro</p>
          <h1 className="max-w-2xl font-editorial text-[43px] leading-[1.08] tracking-[-.045em] sm:text-6xl lg:text-[68px]">Descubra o que<br className="hidden sm:block" /> os números dizem<br className="hidden sm:block" /> sobre o <em className="font-normal text-[#737b62]">seu destino.</em></h1>
          <p className="mt-6 max-w-lg text-[15px] leading-7 text-muted-foreground sm:text-base">Seu nome e sua data de nascimento são o começo. Conheça os talentos, as motivações e os ciclos que a numerologia associa a você — em um mapa feito com os seus números.</p>
          <a href="#seu-mapa" className="mt-8 inline-flex min-h-14 w-full items-center justify-center gap-4 rounded-sm bg-[#343e2a] px-6 py-4 text-sm font-medium text-white transition-colors hover:bg-[#455138] sm:w-auto">Quero descobrir meus números <ArrowRight className="size-4" /></a>
          <p className="mt-3 text-xs leading-6 text-muted-foreground">Seu mapa por <strong className="font-semibold text-foreground">{brl(CATALOG.map.price)}</strong> · Pagamento único · Acesso online</p>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span className="flex items-center gap-2"><Fingerprint className="size-4" /> Calculado com seus dados</span><span className="flex items-center gap-2"><Mail className="size-4" /> Entrega por e-mail</span></div>
        </div>
        <div className="relative lg:pl-3">
          <div className="border border-black/20 bg-[#eeece3] p-5 sm:p-7">
            <div className="flex items-center justify-between border-b border-black/15 pb-4"><span className="map-eyebrow">Uma leitura. Muitas descobertas.</span><Sparkles className="size-4 text-[#737b62]" /></div>
            <div className="relative flex h-60 items-center justify-center sm:h-72" aria-hidden="true">
              <svg viewBox="0 0 360 260" className="absolute h-full w-full fill-none stroke-[#7b806d] stroke-[.7]"><circle cx="180" cy="130" r="99" strokeDasharray="2 5" /><ellipse cx="180" cy="130" rx="145" ry="65" transform="rotate(-30 180 130)" /><ellipse cx="180" cy="130" rx="145" ry="65" transform="rotate(30 180 130)" /><path d="M180 10v22m-11-11h22M315 130h22m-11-11v22M26 172h18m-9-9v18" /><circle cx="180" cy="130" r="57" /></svg>
              <span className="-translate-y-[0.20em] font-editorial text-[110px] leading-none text-[#424c35]">9</span>
              <span className="absolute bottom-7 right-9 font-editorial text-3xl text-[#777e69]">6</span><span className="absolute left-10 top-8 font-editorial text-3xl text-[#777e69]">5</span>
            </div>
            <p className="map-eyebrow text-[#626b51]">Caminho de Vida / 9</p><h2 className="mt-2 font-editorial text-3xl">Um olhar para o que importa.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">O nove convida a refletir sobre propósito, contribuição e o que está pronto para dar lugar a um novo capítulo.</p>
            <div className="mt-5 grid grid-cols-3 border-y border-black/15 py-4 text-center">{[["9", "Caminho"], ["6", "Expressão"], ["9", "Alma"]].map(([number, label]) => <div key={label} className="border-r border-black/15 last:border-0"><span className="block font-editorial text-3xl">{number}</span><span className="map-eyebrow text-[9px] text-muted-foreground">{label}</span></div>)}</div>
            <p className="mt-4 text-[10px] leading-5 text-muted-foreground">Prévia ilustrativa · Marina Costa, 17/05/1994. Os seus números serão calculados com seus dados.</p>
          </div>
          <p className="mt-3 text-right font-editorial text-lg italic text-[#77766e]">Você tem uma história. Seus números também.</p>
        </div>
      </section>

      <div className="border-y border-black/15 bg-[#eae8de]"><div className="mx-auto grid max-w-7xl grid-cols-3 gap-3 px-5 py-5 text-center sm:px-10">{[["09", "números interpretados"], ["Seu", "nome + nascimento"], ["01", "mapa para revisitar"]].map(([number, label]) => <div key={label}><span className="font-editorial text-2xl sm:text-3xl">{number}</span><span className="mt-1 block text-[10px] text-muted-foreground sm:ml-3 sm:inline sm:text-xs">{label}</span></div>)}</div></div>

      <section id="leitura" className="mx-auto max-w-7xl scroll-mt-8 px-5 py-14 sm:px-10 sm:py-20">
        <div className="grid gap-5 lg:grid-cols-2 lg:gap-14"><div><p className="map-eyebrow text-[#626b51]">O que seus números ajudam a explorar</p><h2 className="mt-4 max-w-xl font-editorial text-4xl leading-tight tracking-tight sm:text-5xl">Talvez você já tenha<br />se feito estas perguntas.</h2></div><p className="max-w-lg self-end text-sm leading-7 text-muted-foreground lg:pb-2">Por que certas escolhas parecem tão naturais? O que me move de verdade? Seu mapa reúne nove números em quatro áreas da vida, com interpretações para você conectar à sua própria história.</p></div>
        <div className="mt-10 grid border-l border-t border-black/20 md:grid-cols-2">{benefits.map(item => <article key={item.index} className="border-b border-r border-black/20 p-6 sm:p-8"><div className="flex items-center justify-between"><p className="map-eyebrow text-muted-foreground">{item.index} / {item.name}</p><span aria-hidden="true" className="text-3xl text-[#737b62]">{item.symbol}</span></div><h3 className="mt-6 max-w-sm font-editorial text-[28px] leading-tight">{item.title}</h3><p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground">{item.text}</p><p className="map-eyebrow mt-7 border-t border-black/10 pt-4 text-[9px]">{item.numbers}</p></article>)}</div>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4"><p className="text-xs leading-6 text-muted-foreground">Em cada leitura: seu número + significado + como foi calculado + uma pergunta para refletir.</p><a href="#seu-mapa" className="flex items-center gap-2 border-b border-black/40 pb-1 text-sm">Quero ver o meu <ArrowDown className="size-4" /></a></div>
      </section>

      <section className="bg-[#343e2a] text-[#f4f2eb]"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-10 sm:py-16 lg:grid-cols-[1fr_1.2fr]"><div><p className="map-eyebrow text-[#c4ccb8]">Do seu nome à sua leitura</p><h2 className="mt-4 font-editorial text-4xl leading-tight">Não é preciso saber<br />por onde começar.</h2><p className="mt-5 max-w-sm text-sm leading-7 text-[#d2d7ca]">Seu mapa organiza a leitura. Você escolhe o número, descobre o significado e explora no seu ritmo.</p></div><ol className="space-y-6">{[["Informe seus dados", "Seu nome completo de nascimento e sua data são a base dos cálculos. O e-mail é onde seu acesso vai chegar."], ["Confirme o Pix", "O mapa custa R$ 19,90. Se desejar um adicional, selecione no formulário e confira o total antes de pagar."], ["Abra seu mapa e se descubra", "Após a confirmação, receba o link por e-mail. Leia no celular ou computador e volte quando quiser."]].map(([title, text], index) => <li key={title} className="flex gap-5 border-b border-white/20 pb-6 last:border-0 last:pb-0"><span className="font-editorial text-3xl text-[#c4ccb8]">0{index + 1}</span><div><h3 className="text-base font-medium">{title}</h3><p className="mt-2 text-sm leading-7 text-[#d2d7ca]">{text}</p></div></li>)}</ol></div></section>

      <section id="seu-mapa" className="mx-auto grid max-w-7xl scroll-mt-5 gap-10 px-5 py-14 sm:px-10 sm:py-20 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
        <div><p className="map-eyebrow text-[#626b51]">Seu próximo passo é olhar para você</p><h2 className="mt-4 font-editorial text-4xl leading-tight tracking-tight sm:text-5xl">Os seus números.<br /><em className="font-normal text-[#737b62]">A sua descoberta.</em></h2><p className="mt-6 max-w-sm text-sm leading-7 text-muted-foreground">Você não precisa ter todas as respostas para começar. Seu mapa é um convite para fazer novas perguntas sobre quem você é e o momento que vive.</p>
          <div className="mt-8 border-y border-black/20 py-6"><p className="map-eyebrow">Mapa Numerológico Personalizado</p><p className="mt-3 flex items-baseline gap-3"><span className="font-editorial text-5xl">{brl(CATALOG.map.price)}</span><span className="text-xs text-muted-foreground">pagamento único</span></p><ul className="mt-6 space-y-3 text-sm">{["Nove números com interpretações completas", "Cálculos com seu nome e nascimento", "Ciclos de ano, mês e dia atualizados na leitura", "Perguntas para levar a descoberta à sua rotina", "Seu espaço online no celular ou computador"].map(text => <li key={text} className="flex items-start gap-3"><Check className="mt-0.5 size-4 shrink-0 text-[#626b51]" />{text}</li>)}</ul></div>
          <p className="mt-5 max-w-sm text-xs leading-6 text-muted-foreground">Um mapa completo para começar. Os aprofundamentos ao lado são opcionais e ficam disponíveis junto da sua leitura.</p>
        </div>
        <div className="min-w-0 rounded-sm border border-black/20 bg-[#eeece3] p-5 sm:p-8"><PixCheckout /></div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 border-t border-black/20 px-5 py-12 sm:px-10 sm:py-16 lg:grid-cols-[.8fr_1.2fr]"><div><p className="map-eyebrow text-muted-foreground">Antes da sua descoberta</p><h2 className="mt-4 font-editorial text-4xl">Ficou alguma dúvida?</h2></div><div>{faqs.map(([question, answer]) => <details key={question} className="group border-b border-black/20 py-5 first:pt-0"><summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-medium">{question}<span className="text-lg leading-5 transition-transform group-open:rotate-45" aria-hidden="true">+</span></summary><p className="mt-4 pr-5 text-sm leading-7 text-muted-foreground">{answer}</p></details>)}</div></section>
    </main>
    <footer className="border-t border-black/20 px-5 py-8 sm:px-10"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 sm:flex-row"><p className="map-eyebrow">✳ DestinyVox · Um olhar para dentro.</p><p className="max-w-lg text-xs leading-6 text-muted-foreground">Numerologia é uma prática simbólica de autoconhecimento. As interpretações convidam à reflexão e não garantem acontecimentos ou resultados.</p></div></footer>
  </div>;
}
