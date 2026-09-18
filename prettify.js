const fs = require('fs');

let appPath = 'D:/projects/landing/src/components/App.tsx';
let appContent = fs.readFileSync(appPath, 'utf8');

// Translations
appContent = appContent.replace('2. Data de Nascimento', '2. Date of Birth');
appContent = appContent.replace('3. Seu Melhor E-mail', '3. Your Best E-mail');
appContent = appContent.replace('seuemail@exemplo.com', 'your@email.com');
appContent = appContent.replace(/EDI[Ç|ǟ]O COMPLETA [•|\?\] 11 P[Á|?]GINAS/g, 'COMPLETE EDITION • 11 PAGES');

// Layout Width
appContent = appContent.replace('id="pricing" className="px-4 sm:px-12 py-12 sm:py-20 max-w-2xl mx-auto', 'id="pricing" className="px-4 sm:px-12 py-12 sm:py-20 max-w-xl mx-auto');

// Add rounded corners to the card
appContent = appContent.replace(
  'className="border-2 border-amber-500/40 bg-[#0a0a0a] p-6 sm:p-10 space-y-7 text-left shadow-[0_0_60px_rgba(245,158,11,0.14)] relative"',
  'className="border border-amber-500/30 rounded-2xl bg-[#0a0a0a] p-6 sm:p-10 space-y-7 text-left shadow-[0_0_80px_rgba(245,158,11,0.1)] relative"'
);

// Add rounded corners to the top badge
appContent = appContent.replace(
  'absolute -top-3.5 right-6 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-mono text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase px-3 py-1 shadow-md',
  'absolute -top-3.5 right-6 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-mono text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full shadow-md'
);

// Add rounded corners to inputs
appContent = appContent.replace(
  /className="w-full bg-neutral-950 border border-neutral-800 p-3\.5 text-white font-mono text-sm focus:outline-none focus:border-amber-400 transition-colors"/g,
  'className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3.5 text-white font-mono text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"'
);

// Adjust the checkout button classes
// First, find the button inside the form.
appContent = appContent.replace(
  /className="w-full bg-amber-500 hover:bg-amber-400 text-black py-4 px-6 font-mono font-bold tracking-widest text-sm transition-all flex items-center justify-center gap-2"/g,
  'className="w-full bg-amber-500 hover:bg-amber-400 text-black py-4 px-6 rounded-xl font-mono font-bold tracking-widest text-sm transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]"'
);

// It might be a different class on the button. Let's make sure it matches some generic bg-amber-500 class.
appContent = appContent.replace(
  /className="w-full bg-amber-500 hover:bg-amber-400 text-black py-4/g,
  'className="w-full bg-amber-500 hover:bg-amber-400 text-black rounded-xl hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] py-4'
);

// Order Bumps slightly prettier
appContent = appContent.replace(
  /className="border border-neutral-800 p-4 relative overflow-hidden cursor-pointer/g,
  'className="border border-neutral-800 rounded-xl p-4 relative overflow-hidden cursor-pointer hover:border-amber-500/50 transition-colors'
);
appContent = appContent.replace(
  /className="border border-amber-500\/40 bg-amber-500\/5 p-4 relative overflow-hidden cursor-pointer/g,
  'className="border border-amber-500/40 rounded-xl bg-amber-500/10 p-4 relative overflow-hidden cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.05)] transition-colors'
);


fs.writeFileSync(appPath, appContent);
