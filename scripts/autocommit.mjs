import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvApiKey() {
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }

  for (const envFile of ['.env.local', '.env']) {
    const envPath = resolve(process.cwd(), envFile);
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf8');
      for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('GEMINI_API_KEY=')) {
          return trimmed.replace('GEMINI_API_KEY=', '').trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  }

  return '';
}

async function generateCommitMessage(diff, status, apiKey) {
  const prompt = `Você é um engenheiro de software experiente. Analise o status e o diff das alterações abaixo e gere uma mensagem de commit no padrão Conventional Commits (ex: "feat(client): add new cosmic reading card", "fix(server): resolve json parsing error with gemini").

Regras estritas:
1. Responda APENAS com a mensagem de commit em uma única linha.
2. Seja descritivo sobre o que mudou (tipo + escopo + descrição).
3. Nunca termine com apenas o prefixo (ex: "refactor:").
4. Não use crases, aspas ou explicações adicionais.

Git Status:
${status}

Git Diff:
${diff.slice(0, 5000)}

Commit message:`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.2,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini API HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  let text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  text = text.replace(/^["'`]|["'`]$/g, '').split('\n')[0].trim();

  // Garante que não ficou truncado no prefixo
  if (!text || text.endsWith(':')) {
    text = `chore: update project source code and assets`;
  }
  return text;
}

async function main() {
  console.log('🔍 Verificando alterações no repositório...');

  const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
  if (!status) {
    console.log('✨ Nenhuma alteração pendente para commit.');
    return;
  }

  console.log('📦 Adicionando arquivos (git add .)...');
  execSync('git add .', { stdio: 'inherit' });

  const diff = execSync('git diff --cached', { encoding: 'utf8' }).trim();
  if (!diff) {
    console.log('✨ Nada em staging para commit.');
    return;
  }

  const apiKey = loadEnvApiKey();
  let commitMessage = '';

  if (apiKey) {
    try {
      console.log('🤖 Solicitando mensagem semântica ao Gemini...');
      commitMessage = await generateCommitMessage(diff, status, apiKey);
      console.log(`💡 Mensagem gerada pelo Gemini: "${commitMessage}"`);
    } catch (error) {
      console.warn('⚠️ Falha ao consultar Gemini. Usando mensagem de fallback:', error);
    }
  } else {
    console.warn('⚠️ GEMINI_API_KEY não encontrada no .env.local, .env ou variáveis de ambiente.');
  }

  if (!commitMessage) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    commitMessage = `chore: update project assets and logic [${timestamp}]`;
  }

  console.log('🚀 Executando git commit...');
  execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
  console.log('✅ Commit realizado com sucesso!');
}

main().catch((err) => {
  console.error('❌ Erro no autocommit:', err);
  process.exit(1);
});
