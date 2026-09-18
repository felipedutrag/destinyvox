const fs = require('fs');

// Fix route.ts
let routePath = 'D:/projects/landing/src/app/api/stripe/webhook/route.ts';
let routeContent = fs.readFileSync(routePath, 'utf8');
routeContent = routeContent.replace('external_id: externalId,', 'externalId: externalId,');
fs.writeFileSync(routePath, routeContent);

// Fix App.tsx
let appPath = 'D:/projects/landing/src/components/App.tsx';
let appContent = fs.readFileSync(appPath, 'utf8');
appContent = appContent.replace('pricingTitle: "UNLOCK YOUR ALGORITHMIC BLUEPRINT",', 'pricingTitle: "UNLOCK YOUR ALGORITHMIC BLUEPRINT",\n    pricingTag: "SPECIAL OFFER",\n    pricingHeading: "Secure your Pythagorean Dossier today",');
appContent = appContent.replace(/lang === "pt"/g, 'false');
appContent = appContent.replace(/setLang\((.*?)\)/g, '');
fs.writeFileSync(appPath, appContent);
