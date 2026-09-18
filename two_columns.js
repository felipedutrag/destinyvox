const fs = require('fs');
let content = fs.readFileSync('D:/projects/landing/src/components/App.tsx', 'utf8');

const originalHeader = `<section id="pricing" className="px-4 sm:px-12 py-12 sm:py-20 max-w-xl mx-auto space-y-8 sm:space-y-12 text-center">
          <div className="space-y-2 sm:space-y-3">
            <span className="font-mono text-xs sm:text-xs md:text-sm tracking-[0.25em] text-neutral-400 uppercase">
              {t.pricingTag}
            </span>
            <h2 className="font-editorial text-3xl sm:text-5xl md:text-6xl text-white font-normal">
              {t.pricingHeading}
            </h2>
            <p className="font-mono font-light text-xs sm:text-sm md:text-base text-neutral-300 max-w-lg mx-auto leading-relaxed">
              {t.pricingDesc}
            </p>
          </div>

          {/* Card Principal de Preço com Formulário Embutido */}
          <div className="border border-amber-500/30 rounded-2xl bg-[#0a0a0a] p-6 sm:p-10 space-y-7 text-left shadow-[0_0_80px_rgba(245,158,11,0.1)] relative">`;

const newHeader = `<section id="pricing" className="px-4 sm:px-12 py-12 sm:py-20 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Left Column: Copywriting */}
            <div className="space-y-6 sm:space-y-8 text-left lg:sticky lg:top-24">
              <div className="space-y-3 sm:space-y-4">
                <span className="font-mono text-xs sm:text-sm tracking-[0.25em] text-amber-500 uppercase font-semibold">
                  {t.pricingTag}
                </span>
                <h2 className="font-editorial text-4xl sm:text-5xl md:text-6xl text-white font-normal leading-tight">
                  {t.pricingHeading}
                </h2>
                <p className="font-mono font-light text-sm sm:text-base text-neutral-300 leading-relaxed max-w-lg">
                  {t.pricingDesc}
                </p>
              </div>

              <div className="pt-6 border-t border-neutral-800">
                <ul className="space-y-4">
                  {t.pricingFeatures.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />
                      <span className="font-mono text-sm text-neutral-200">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column: Checkout Card */}
            <div className="border border-amber-500/30 rounded-2xl bg-[#0a0a0a] p-6 sm:p-10 space-y-7 text-left shadow-[0_0_80px_rgba(245,158,11,0.1)] relative">`;

// Remove potential whitespace differences by using a generic regex
const headerRegex = /<section id="pricing" className="px-4 sm:px-12 py-12 sm:py-20 max-w-xl mx-auto space-y-8 sm:space-y-12 text-center">[\s\S]*?<div className="border border-amber-500\/30 rounded-2xl bg-\[#0a0a0a\] p-6 sm:p-10 space-y-7 text-left shadow-\[0_0_80px_rgba\(245,158,11,0\.1\)\] relative">/;

content = content.replace(headerRegex, newHeader);

// Close the grid div right before closing the section
const closingRegex = /(Check your inbox and spam folder\.[\s\S]*?<\/span>[\s\S]*?<\/div>[\s\S]*?\)}[\s\S]*?<\/div>[\s\S]*?\)}[\s\S]*?<\/div>\s*)(<\/section>)/;
content = content.replace(closingRegex, '$1  </div>\n        $2');

// Fix EDIÇÃO COMPLETA in case it wasn't fixed
content = content.replace(/EDI[Ç|ǟ]O COMPLETA [•|] 11 P[Á|?]GINAS/g, 'COMPLETE EDITION • 11 PAGES');

fs.writeFileSync('D:/projects/landing/src/components/App.tsx', content);
