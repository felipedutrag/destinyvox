const fs = require('fs');

// Fix 1: route.ts
let routePath = 'D:/projects/landing/src/app/api/stripe/webhook/route.ts';
let routeContent = fs.readFileSync(routePath, 'utf8');
routeContent = routeContent.replace('transaction_id: session.id,', 'transactionId: session.id,');
fs.writeFileSync(routePath, routeContent);

// Fix 2: App.tsx
let appPath = 'D:/projects/landing/src/components/App.tsx';
let appContent = fs.readFileSync(appPath, 'utf8');

// Fix Language type
appContent = appContent.replace('type Language = "en" | "pt" | "es";', 'type Language = "en";');

// Fix item, idx implicit any in App.tsx
appContent = appContent.replace('t.numbersList.map((item, idx) =>', 't.numbersList.map((item: any, idx: number) =>');

fs.writeFileSync(appPath, appContent);
