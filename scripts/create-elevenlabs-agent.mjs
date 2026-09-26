import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
let envFile = "";
try {
  envFile = await readFile(envPath, "utf8");
} catch {
  // The script can create .env.local when it does not exist yet.
}

function readEnv(name) {
  if (process.env[name]) return process.env[name];
  const match = envFile.match(new RegExp(`^${name}=(.*)$`, "m"));
  return match?.[1]?.trim().replace(/^("|')(.*)\1$/, "$2");
}

function setEnv(name, value) {
  const line = `${name}=${value}`;
  const pattern = new RegExp(`^${name}=.*$`, "m");
  envFile = pattern.test(envFile)
    ? envFile.replace(pattern, line)
    : `${envFile.trimEnd()}${envFile.trim() ? "\n" : ""}${line}\n`;
}

const apiKey = readEnv("ELEVENLABS_API_KEY");
if (!apiKey) {
  console.error("Configure ELEVENLABS_API_KEY no .env.local e execute novamente.");
  process.exit(1);
}

if (readEnv("NEXT_PUBLIC_ELEVENLABS_AGENT_ID")) {
  console.error("Já existe um Agent ID no .env.local. Remova-o se quiser criar outro agente.");
  process.exit(1);
}

const voiceId = readEnv("ELEVENLABS_VOICE_ID") || "21m00Tcm4TlvDq8ikWAM";
const agentConfig = {
  name: "DestinyVox — Assistente de Numerologia",
  tags: ["destinyvox", "português", "site"],
  conversation_config: {
    agent: {
      language: "pt",
      first_message:
        "Olá! Eu sou a assistente virtual da DestinyVox. Posso explicar como funciona o mapa numerológico e mostrar os pilares ou o acesso ao mapa. Como posso ajudar?",
      prompt: {
        prompt: [
          "Você é a assistente de voz da DestinyVox e conversa sempre em português brasileiro, com tom acolhedor, natural e objetivo.",
          "Explique que a DestinyVox oferece um mapa de numerologia pitagórica personalizado, calculado a partir do nome completo e da data de nascimento.",
          "Não invente cálculos ou resultados pessoais. Se pedirem uma leitura pessoal, explique que é necessário gerar o mapa personalizado.",
          "Quando a pessoa quiser conhecer os pilares do mapa, use highlightNumerologyPillar para destacar o pilar pedido. Os números disponíveis são 01 caminho de vida, 02 desejo da alma, 03 expressão, 04 atitude, 05 dívidas kármicas e 06 ano pessoal.",
          "Quando a pessoa quiser ver preço, comprar ou acessar o mapa, use navigateToPricing para levar a página até a oferta.",
          "Peça autorização antes de navegar ou destacar algo se a intenção não estiver clara. Nunca peça dados de cartão ou chave de API.",
        ].join("\n\n"),
        tools: [
          {
            type: "client",
            name: "navigateToPricing",
            description:
              "Rola a página até a oferta e o formulário do mapa. Use quando a pessoa pedir preço, quiser comprar ou quiser acessar o mapa.",
            expects_response: true,
            parameters: { type: "object", properties: {} },
          },
          {
            type: "client",
            name: "highlightNumerologyPillar",
            description:
              "Destaca e mostra um dos pilares numerológicos na página. Use quando a pessoa pedir detalhes de um pilar específico.",
            expects_response: true,
            parameters: {
              type: "object",
              properties: {
                number: {
                  type: "string",
                  enum: ["01", "02", "03", "04", "05", "06"],
                  description: "Número do pilar que a pessoa quer ver.",
                },
              },
              required: ["number"],
            },
          },
        ],
      },
    },
    tts: {
      model_id: "eleven_flash_v2_5",
      voice_id: voiceId,
    },
  },
};

const response = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
  method: "POST",
  headers: {
    "xi-api-key": apiKey,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(agentConfig),
});

if (!response.ok) {
  const detail = await response.text();
  console.error(`ElevenLabs não criou o agente (${response.status}): ${detail}`);
  process.exit(1);
}

const { agent_id: agentId } = await response.json();
if (!agentId) {
  console.error("O ElevenLabs respondeu sem Agent ID.");
  process.exit(1);
}

setEnv("NEXT_PUBLIC_ELEVENLABS_AGENT_ID", agentId);
await writeFile(envPath, envFile, "utf8");
console.log(`Agente DestinyVox criado e configurado. Agent ID salvo em .env.local: ${agentId}`);
console.log("Reinicie o servidor de desenvolvimento para carregar o Agent ID.");
