# Mapa web

O checkout brasileiro entrega uma leitura web com nove números: Caminho de Vida, Expressão, Desejo da Alma, Personalidade, Dia de Nascimento, Maturidade, Ano Pessoal, Mês Pessoal e Dia Pessoal. As interpretações usam o acervo do projeto e cálculos pitagóricos locais. Os ciclos são recalculados na leitura, pelo calendário de America/Sao_Paulo.

## Compra e acesso

1. O pagamento precisa estar `PAID` no banco. A entrega usa nome, e-mail e nascimento do registro de pagamento; não confia nos dados enviados novamente pelo navegador.
2. A entrega usa uma atualização condicional de `metadata` para evitar processamento simultâneo. O mapa tem um UUID estável por compra e fica associado ao usuário do Supabase Auth.
3. Resend envia o link de acesso, sem anexo PDF. `generateLink` gera o token; o Supabase não envia um segundo e-mail.
4. `/acesso` recebe o token no fragmento, remove-o do histórico e exige um clique de confirmação antes de consumir o link. Isso evita consumo por scanners simples de e-mail. Não há criação de senha.
5. `/api/access/verify` troca o token por uma sessão em cookies HttpOnly, SameSite=Lax e Secure em produção. As rotas privadas usam um cliente Supabase por requisição, verificam o usuário com `getUser`, renovam os cookies e consultam os mapas com RLS e filtro de proprietário.
6. `/api/maps/[id]` entrega somente os dados da leitura, com `Cache-Control: private, no-store`. A chave de serviço não é usada para ler mapas no navegador nem para contornar as políticas de acesso.
7. Links expirados ou usados podem ser renovados em `/acesso`. A resposta não revela se o e-mail comprou. Cada compra permite uma solicitação por minuto, até cinco por hora, com controle persistente no banco.

## Configuração

Reutiliza `profiles`, `payments` e `numerology_maps`, com as políticas existentes de leitura por `user_id`. Não requer nova tabela ou migração.

- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`: entrega e geração de link, somente no servidor.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ou `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`): cliente de autenticação e consultas sob RLS.
- `APP_URL` ou `NEXT_PUBLIC_APP_URL`: origem pública dos links enviados, obrigatoriamente HTTPS em produção.
- `RESEND_API_KEY` e opcionalmente `RESEND_FROM_EMAIL`: envio dos links.

O prazo de validade do link é o configurado no Supabase Auth. O link é de uso único; a leitura pode ser revisitada enquanto houver sessão. A nova entrega não depende de OpenAI nem de renderização de PDF. Os arquivos antigos de PDF permanecem disponíveis no repositório para compatibilidade.

## Verificação

- `npm run test:map`: nove interpretações, valores conhecidos, mestres e transições do calendário brasileiro.
- `npm run build`: compilação de produção e TypeScript.
- `node --env-file=.env.local scripts/verify-map-access.mjs`: teste integrado usando o servidor local em `http://localhost:3001` (sobrescrevível com `MAP_QA_ORIGIN`). Cria dois usuários e mapas temporários no Supabase e os remove em `finally`. Testa RLS, login, cookies, isolamento, replay, origem, rejeição de entrega sem pagamento e logout. Não envia e-mail e não cria pagamento.
- `/mapa/demo`: prévia local com perfil fictício; retorna 404 em produção.

O envio real pelo Resend não faz parte do teste automatizado para evitar disparos a clientes. A configuração de domínio remetente e a chegada à caixa de entrada devem ser conferidas no teste de lançamento.
