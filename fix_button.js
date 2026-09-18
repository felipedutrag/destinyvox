const fs = require('fs');
let c = fs.readFileSync('D:/projects/landing/src/components/App.tsx', 'utf8');

c = c.replace(
  'className="w-full bg-white text-black hover:bg-neutral-200 py-4 font-mono text-xs sm:text-sm font-bold tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl"',
  'className="w-full bg-white text-black hover:bg-neutral-200 py-4 rounded-xl font-mono text-xs sm:text-sm font-bold tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"'
);

c = c.replace(/PAGAMENTO PIX GERADO .*? VALOR:/g, 'CHECKOUT GENERATED • AMOUNT:');

fs.writeFileSync('D:/projects/landing/src/components/App.tsx', c);
