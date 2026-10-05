# Analytics próprio do DestinyVox

## Ativação

1. Execute **scripts/analytics-schema.sql** e depois **scripts/analytics-visitors.sql** no SQL Editor do mesmo Supabase usado pelo checkout. Se já instalou o primeiro, execute somente o segundo. Os arquivos são idempotentes e não alteram pedidos existentes. Instale o SQL de visitantes antes de publicar o novo coletor/painel.
2. Configure `ANALYTICS_ADMIN_PASSWORD` no ambiente do servidor, com uma senha aleatória de pelo menos 24 caracteres. Nunca use prefixo `NEXT_PUBLIC_`. Use as variáveis Supabase já existentes: `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
3. Publique a aplicação e abra `/admin/analytics`. A senha gera um cookie HttpOnly de oito horas. Trocar a senha invalida os acessos anteriores.
4. Identifique cada anúncio com UTMs, por exemplo: `/?utm_source=reddit&utm_medium=paid_social&utm_campaign=mapa&utm_content=imagem_01`. Use identificadores de campanhas, nunca dados pessoais nesses parâmetros.
5. Ao mudar a copy, altere `NEXT_PUBLIC_ANALYTICS_COPY_VERSION` (padrão `v1`) antes de um novo build. A versão fica associada ao início da sessão; isso permite comparação por período/versão, mas não constitui um teste A/B aleatório.

O SQL não é executado automaticamente no banco remoto. Sem ele, o endpoint de coleta retorna 503 e não interfere no checkout. Não há dados retroativos nem eventos inventados no painel.

## Eventos e interpretação

- `page_view`, `page_exit`: navegação e última seção observada. Saída também é enviada ao ocultar a aba e não prova abandono definitivo.
- `heartbeat`: incrementos de tempo ativo. Aba visível e interação nos últimos 60 segundos; tempo suspenso não é somado. Envio a cada 10 segundos e tentativa final por beacon. Não representa tempo de leitura comprovado.
- `section_view`, `section_time`: seções e cards visíveis (pelo menos metade do elemento ou 35% da altura da tela), amostrados a cada segundo. Tempos de seções aninhadas podem se sobrepor, portanto não devem ser somados para obter duração da sessão.
- `scroll_depth`: marcos de 25, 50, 75, 90 e 100% da rolagem disponível.
- `click`: links e botões. CTAs principais têm identificadores semânticos; os demais usam tag/posição. Nenhum texto de perfil, URL de acesso, parâmetro de link ou texto digitado é coletado.
- `faq_open`, `faq_close`: abertura/fechamento de perguntas e detalhes dos capítulos.
- `form_start`, `form_submit`, `field_focus`, `field_complete`, `field_invalid`: identifica apenas o campo, nunca seu conteúdo. `field_complete` tem valor 1 se a validação HTML está válida e 0 caso contrário.
- `bump_toggle`: marcação (1) ou desmarcação (0). Bumps pré-selecionados não geram marcação até o usuário interagir; a aceitação real usa os pedidos pagos.
- `checkout_submit`, `checkout_error`, `pix_created`, `pix_copy`, `payment_state`, `payment_seen`, `delivery_seen`: jornada Pix e estados observados no navegador. Valores monetários estão em centavos.
- `upsell_open`: abre checkout do Atlas; `section_view` da seção `upsell-atlas` mede exposição.
- `web_vital`: LCP em milissegundos, quando o navegador suporta. `client_error` conta erros sem enviar mensagens, stacks ou dados privados.

Landings: `hero`, `leitura`, `beneficio-01` a `beneficio-04`, `como-funciona`, `seu-mapa`, `faq`, `bump-calendar`, `bump-challenges`. FAQ usa a posição (faq-1 etc.), portanto incremente a versão da copy ao reordenar. Nos outros componentes, novas seções HTML, formulários, links, botões e `<details>` são detectados automaticamente. Prefira `data-analytics-section` / `data-analytics-id` estáveis ao adicionar conteúdo.

## Métricas

Identificador aleatório por sessão/aba; sessão expira após 30 minutos de inatividade. Um segundo UUID em `localStorage` (`dv:analytics:visitor`) identifica o navegador por até 365 dias, compartilhado entre abas da mesma origem. Não há ligação entre dispositivos, domínios ou pessoas. Limpar o armazenamento, usar navegação privada ou expirar o ID cria outro visitante. Armazenamento indisponível mantém a sessão sem visitante persistente. DNT, GPC e opt-out continuam impedindo a coleta e a criação do identificador. Atribuição à origem da sessão (UTMs ou domínio referenciador). URLs de mapas são reduzidas a `/mapa/:id`.

Visitantes únicos são deduplicados entre as sessões filtradas. Novos = primeira visita observada pelo banco dentro do período; recorrentes = primeira visita anterior ao período. As categorias são exclusivas: alguém novo com duas sessões no período continua na categoria novo. Sessões por visitante usa somente sessões com ID, não sessões históricas. A primeira visita vem da tabela `analytics_visitors`, mantida por trigger atômico, inclusive para eventos fora de ordem. Não se deduz a primeira visita do recorte filtrado. Sessões anteriores à atualização não recebem IDs retroativos. Os relatórios exibem a cobertura sem identificação, e exportam o ID junto das sessões. Um visitante com IDs conflitantes na mesma sessão é excluído da contagem dessa sessão.

A tabela de visitantes guarda somente UUID, primeira e última visita; RLS e permissões restringem o acesso ao servidor. Não contém nome ou e-mail. O SQL complementar inclui limpeza opcional após 400 dias sem visitas; não agenda exclusões. Caso essa limpeza seja adotada, a classificação se refere ao histórico ainda disponível. A retenção de eventos não apaga automaticamente o histórico de visitantes.

Receita e compras são calculadas exclusivamente dos registros `payments` com status `PAID`, ligados pelo `metadata.analytics.session_id`. Eventos do navegador nunca confirmam receita. Pedidos sem atribuição são sinalizados e excluídos. O recorte usa eventos e pedidos criados no período móvel; um pagamento confirmado posteriormente pode atualizar o resultado do seu período de criação. Sessões que atravessam a borda do período podem aparecer parcialmente. Datas exibidas em Brasília.

O funil da landing exige etapas em ordem na mesma sessão. Bloqueadores, saltos de etapa, navegação rápida e falhas de transporte podem fazer a contagem do funil ser menor que a de compradores. “Última seção” usa sessões sem eventos por 30 minutos, não um evento garantido de fechamento. Tempo ativo é uma estimativa por amostragem. Tráfego automatizado não é classificado automaticamente.

Ticket médio = receita / pedidos pagos, incluindo pedidos separados de upsell. Não representa LTV nem ticket por cliente. A receita do upsell pode pertencer a outra sessão. Sem custos de mídia importados, o painel não calcula CPA, lucro ou ROAS.

O relatório pagina os resultados até 50.000 eventos e 10.000 pedidos. Ao atingir o teto, exibe aviso de resultado parcial: reduza o período. Exporta as últimas 100 sessões exibidas. Para volumes maiores, migrar agregações para SQL antes de aumentar o teto.

## Privacidade e acesso

Tabelas com RLS e sem acesso para `anon`/`authenticated`. Escrita pública apenas via endpoint limitado, validado e same-origin; leituras exigem login administrativo. Chave de serviço permanece no servidor. Eventos reenviados são deduplicados pelo UUID. A coleta é best-effort, com fila limitada em memória e sem garantia de recuperação após fechar o navegador.

Não coleta nomes, e-mails, datas de nascimento, conteúdos de formulários, códigos Pix, URLs completas ou IDs de mapas. Apenas UTMs selecionadas e domínio referenciador. Respeita DNT, Global Privacy Control e `localStorage.setItem('dv:analytics:off', '1')`; recarregue a página depois de alterar essa preferência. Documente essa medição na política de privacidade do site conforme a configuração de consentimento adotada.

Rate limit distribuído em Postgres: 240 lotes/minuto por IP para eventos, 10 tentativas/15 minutos para login. IP é transformado em HMAC antes da persistência. O adaptador confia em `x-vercel-forwarded-for`, sobrescrito pela Vercel; em outra hospedagem, configure o proxy confiável para sobrescrever `x-real-ip`. Sem cabeçalho confiável, todas as requisições usam o bucket `unknown`. Isso é limitação de abuso, não proteção completa contra bots distribuídos.

SQL inclui comandos opcionais de retenção de 90 dias e limpeza dos buckets após dois dias. Agende-os no mecanismo de jobs do projeto se desejar; não há exclusão automática ativada.

## Verificação

`npm run type-check`, `npm run test:analytics`, `npm run build`. Após o build, `node scripts/test-analytics-routes.mjs` verifica as APIs com Supabase simulado exclusivamente no localhost. Testes executam o SQL em PostgreSQL local em memória (PGlite), incluindo negação de SELECT/INSERT/UPDATE/DELETE/EXECUTE aos papéis públicos, idempotência, rate limit, sanitização, retry, filtros, deduplicação e funil em ordem.

Após instalar em produção: visite a landing com UTMs, percorra seções, abra uma FAQ, marque/desmarque um bump e confira a sessão na dashboard. Só gere/pague Pix caso queira realizar uma compra real. Analytics não cria pagamentos de teste automaticamente.
