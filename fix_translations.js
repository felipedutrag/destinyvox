const fs = require('fs');
let content = fs.readFileSync('D:/projects/landing/src/components/App.tsx', 'utf8');

content = content.replace(/\[ADICIONAR\] Dossi[ê|Ǧ] de Karmic Debts \(13, 14, 16 e 19\)/g, '[ADD] Karmic Debts Dossier (13, 14, 16, and 19)');
content = content.replace(/\+ R\$ 14,90/g, '+ $9.90');
content = content.replace(/\[ADICIONAR\] 2026 Month-by-Month Guide/g, '[ADD] 2026 Month-by-Month Guide');

fs.writeFileSync('D:/projects/landing/src/components/App.tsx', content);
