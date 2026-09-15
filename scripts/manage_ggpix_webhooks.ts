/**
 * Script utilitário para gerenciar Webhooks na GGPIX via CLI:
 * 
 * Uso:
 *   npx tsx scripts/manage_ggpix_webhooks.ts list
 *   npx tsx scripts/manage_ggpix_webhooks.ts register [url]
 *   npx tsx scripts/manage_ggpix_webhooks.ts test <webhook_id>
 *   npx tsx scripts/manage_ggpix_webhooks.ts delete <webhook_id>
 */
import * as fs from "fs";
import * as path from "path";

// Carregar variáveis de .env.local manualmente sem dependência externa
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim().replace(/^["'](.*)["']$/, "$1");
        if (!process.env[k]) {
          process.env[k] = v;
        }
      }
    }
  }
} catch {
  // ignora se não existir
}

const apiKey = (process.env.GGPIX_KEY_FINAL || process.env.GGPIX_API_KEY || "").trim();
const GGPIX_BASE_URL = "https://ggpixapi.com/api/v1";

if (!apiKey) {
  console.error("❌ Erro: GGPIX_KEY_FINAL ou GGPIX_API_KEY não encontrada em .env.local");
  process.exit(1);
}

const command = process.argv[2] || "list";
const arg = process.argv[3];

async function main() {
  console.log(`\n========================================`);
  console.log(`📡 Gerenciador de Webhooks GGPIX`);
  console.log(`Chave: ${apiKey.substring(0, 8)}... (tamanho ${apiKey.length})`);
  console.log(`========================================\n`);

  if (command === "list") {
    console.log("🔍 Consultando webhooks cadastrados...");
    const res = await fetch(`${GGPIX_BASE_URL}/webhooks`, {
      headers: { "X-API-Key": apiKey },
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));

  } else if (command === "register") {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://destinyvox.online").replace(/\/$/, "");
    const targetUrl = arg || `${appUrl}/api/webhooks/ggpix`;

    console.log(`📝 Cadastrando webhook: ${targetUrl}`);
    const res = await fetch(`${GGPIX_BASE_URL}/webhooks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        url: targetUrl,
        label: "DestinyVox Webhook Principal",
        events: ["PIX_IN", "CARD_IN", "CARD_REFUND"],
        secret: process.env.GGPIX_WEBHOOK_SECRET || undefined,
        bearerToken: process.env.GGPIX_WEBHOOK_TOKEN || undefined,
      }),
    });
    const data = await res.json();
    console.log("Resposta:", JSON.stringify(data, null, 2));

  } else if (command === "test") {
    if (!arg) {
      console.error("❌ Uso: npx tsx scripts/manage_ggpix_webhooks.ts test <webhook_id>");
      process.exit(1);
    }
    console.log(`🧪 Disparando teste para webhook ${arg}...`);
    const res = await fetch(`${GGPIX_BASE_URL}/webhooks/${arg}/test`, {
      method: "POST",
      headers: { "X-API-Key": apiKey },
    });
    const data = await res.json();
    console.log("Resultado do teste:", JSON.stringify(data, null, 2));

  } else if (command === "delete") {
    if (!arg) {
      console.error("❌ Uso: npx tsx scripts/manage_ggpix_webhooks.ts delete <webhook_id>");
      process.exit(1);
    }
    console.log(`🗑️ Removendo webhook ${arg}...`);
    const res = await fetch(`${GGPIX_BASE_URL}/webhooks/${arg}`, {
      method: "DELETE",
      headers: { "X-API-Key": apiKey },
    });
    const data = await res.json();
    console.log("Resultado:", JSON.stringify(data, null, 2));

  } else {
    console.log("Comandos disponíveis: list | register [url] | test <id> | delete <id>");
  }
}

main().catch((err) => {
  console.error("💥 Erro:", err);
  process.exit(1);
});
