const fs = require('fs');

let appPath = 'D:/projects/landing/src/components/App.tsx';
let appContent = fs.readFileSync(appPath, 'utf8');

// Layout: Make pricing section narrower
appContent = appContent.replace('id="pricing" className="px-4 sm:px-12 py-12 sm:py-20 max-w-4xl mx-auto space-y-8 sm:space-y-12 text-center"', 'id="pricing" className="px-4 sm:px-12 py-12 sm:py-20 max-w-2xl mx-auto space-y-8 sm:space-y-12 text-center"');

// Prices & Format
appContent = appContent.replace('const basePrice = 39.90;', 'const basePrice = 19.90;');
appContent = appContent.replace('const karmicPrice = 14.90;', 'const karmicPrice = 9.90;');
appContent = appContent.replace('const personalYearPrice = 14.90;', 'const personalYearPrice = 9.90;');
// `displayTotal` replacement
appContent = appContent.replace(/const displayTotal =.*?;/g, 'const displayTotal = `$${currentTotal.toFixed(2)}`;');

// Hardcoded Portuguese texts
appContent = appContent.replace(/MAPA PITAG[Ó|]RICO DO DESTINO/g, 'PYTHAGOREAN DESTINY DOSSIER');
appContent = appContent.replace(/PDF ALTA RESOLU[Ç|][Ã|]O/g, 'HIGH-RES PDF');
appContent = appContent.replace(/pagamento .*?nico via PIX .*? sem mensalidade/g, 'one-time payment via Stripe • no monthly fees');
appContent = appContent.replace(/11 p[á|ǭ]ginas dedicadas de conte[ú|ǧ]do profundo.*?ativa[ç|][ã|ǜ]o herm[é|Ǹ]tica\./g, '11 dedicated pages of deep content: each vibrational pillar detailed without superficial summaries, with letter-by-letter mathematical decomposition and hermetic activation.');

appContent = appContent.replace('Ex: Joǜo Ferreira da Silva', 'Ex: John Doe');
appContent = appContent.replace('Ex: João Ferreira da Silva', 'Ex: John Doe');
appContent = appContent.replace(/Usado para o c[á|ǭ]lculo rigoroso da sua Gematria, Express[ã|ǜ]o, Alma e Personalidade\./g, 'Used for the rigorous calculation of your Gematria, Expression, Soul, and Personality.');
appContent = appContent.replace('Caminho de Vida e Ano 2026.', 'Life Path and Year 2026.');
appContent = appContent.replace('Onde seu PDF serǭ entregue.', 'Where your PDF will be delivered.');
appContent = appContent.replace('Onde seu PDF será entregue.', 'Where your PDF will be delivered.');
appContent = appContent.replace('UPGRADES RECOMENDADOS PARA SEU MAPA:', 'RECOMMENDED UPGRADES FOR YOUR DOSSIER:');
appContent = appContent.replace('Identifique se vocǦ carrega travas ancestrais de escassez, sabotagem nos relacionamentos ou bloqueios de saǧde decorrentes de vidas passadas e acesse o protocolo de quitaǜo.', 'Identify if you carry ancestral blocks of scarcity, relationship sabotage, or health issues from past lives and access the clearing protocol.');
appContent = appContent.replace('Identifique se você carrega travas ancestrais de escassez, sabotagem nos relacionamentos ou bloqueios de saúde decorrentes de vidas passadas e acesse o protocolo de quitação.', 'Identify if you carry ancestral blocks of scarcity, relationship sabotage, or health issues from past lives and access the clearing protocol.');
appContent = appContent.replace('Mapeamento detalhado dos 12 meses do seu ano de 2026. Saiba exatamente em qual mǦs assinar contratos, investir, poupar, iniciar novos projetos ou proteger sua energia.', 'Detailed mapping of the 12 months of your 2026 year. Know exactly in which month to sign contracts, invest, save, start new projects, or protect your energy.');
appContent = appContent.replace('Mapeamento detalhado dos 12 meses do seu ano de 2026. Saiba exatamente em qual mês assinar contratos, investir, poupar, iniciar novos projetos ou proteger sua energia.', 'Detailed mapping of the 12 months of your 2026 year. Know exactly in which month to sign contracts, invest, save, start new projects, or protect your energy.');

appContent = appContent.replace('Pagamento Confirmado!', 'Payment Confirmed!');
appContent = appContent.replace(/Gerando seu Dossi[ê|Ǧ] Pitag[ó|]rico Completo em PDF de 11 p[á|ǭ]ginas\.\.\./g, 'Generating your Complete Pythagorean Dossier in an 11-page PDF...');
appContent = appContent.replace(/Seu Mapa Pitag[ó|]rico foi gerado com sucesso e enviado para/g, 'Your Pythagorean Dossier was successfully generated and sent to');
appContent = appContent.replace('Verifique sua caixa de entrada e spam.', 'Check your inbox and spam folder.');

// Also replace the button label that might still have PIX:
appContent = appContent.replace(/GERAR MEU MAPA NO PIX \(.*?\)/g, 'PROCEED TO CHECKOUT (${displayTotal})');

fs.writeFileSync(appPath, appContent);
