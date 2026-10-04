# Mapa web

O checkout brasileiro entrega uma leitura web com nove números: Caminho de Vida, Expressão, Desejo da Alma, Personalidade, Dia de Nascimento, Maturidade, Ano Pessoal, Mês Pessoal e Dia Pessoal. As interpretações usam o acervo do projeto e cálculos pitagóricos locais. Os ciclos são recalculados na leitura, pelo calendário de America/Sao_Paulo.

## Compra e acesso

### Oferta e produtos

- `map`: Mapa Numerológico, R$ 19,90. Formulário e Pix integrados à landing em português.
- `calendar`: Calendário Pessoal de 12 Meses, adicional opcional de R$ 9,90.
- `name`: Forças do Nome, adicional opcional de R$ 7,90.
- `challenges`: Seus Quatro Desafios, adicional opcional de R$ 9,90.
- `atlas`: Atlas dos Ciclos de Vida, produto separado de R$ 29,90, oferecido dentro de um mapa autenticado.

Preços em centavos e seleção permitida ficam em `src/lib/catalog.ts`. Nenhum adicional vem selecionado. Mapa + todos os adicionais = R$ 47,60. O servidor recalcula o valor, rejeita adicionais desconhecidos/duplicados e não usa valores enviados pelo cliente. Não há desconto de desenvolvimento nem aprovação automática por e-mail.

O pedido é salvo antes de chamar GGPIX. O webhook pode localizá-lo por `external_id` mesmo se chegar antes do retorno do checkout. A liberação usa os produtos e dados salvos no pagamento confirmado; o webhook confere o valor sem sobrescrever o valor esperado. Cobranças antigas continuam sendo entregues com os nove números originais.

Os produtos usam as tabelas e campos JSON existentes, sem migração. `payments.metadata` guarda `product`, `bumps`, `referenceDate` e, no Atlas, `sourceMapId`. A entrega salva essa seleção em `numerology_maps.full_interpretation.purchase`. Ao abrir, o servidor recalcula apenas os módulos dessa seleção. O calendário permanece ancorado no mês da compra, enquanto o destaque de mês/etapa atual acompanha a data de consulta.

O Atlas exige login e um mapa completo do mesmo proprietário. Dados pessoais são lidos do mapa original. Uma compra já paga para esse mapa impede nova compra do mesmo Atlas. A entrega cria uma leitura separada; o mapa original passa a exibir seu link. `/api/maps` e `/acesso` apresentam a biblioteca de leituras do usuário autenticado, incluindo mapa e Atlas.

### Convenções dos cálculos adicionais

- Calendário: Ano Pessoal recalculado para o ano de cada mês, somado ao mês e reduzido a 1–9. São 12 meses consecutivos, incluindo o mês da compra.
- Forças do Nome: frequências de 1–9 na tabela pitagórica, após normalização de acentos. Todos os máximos empatados são exibidos; valores ausentes geram temas para desenvolver. Nomes sem ausências recebem uma explicação específica.
- Desafios: dia, mês e ano reduzidos a um dígito; diferenças absolutas `|dia−mês|`, `|dia−ano|`, `|desafio1−desafio2|`, `|mês−ano|`. Zero é válido. O terceiro é o desafio principal; não atribuímos faixas de idade aos desafios.
- Atlas: pináculos por `mês+dia`, `dia+ano`, `pináculo1+pináculo2`, `mês+ano`, preservando 11, 22 e 33 nas reduções. O primeiro termina na idade `36−Caminho de Vida reduzido a um dígito`; os dois seguintes duram nove anos e o quarto permanece aberto. Transições acontecem no aniversário que inicia a faixa seguinte.

Referências de convenção: [curso de numerologia, parte 3](https://www.worldnumerology.com/numerology-course-classes/classes/numerology-workshop-part-3.pdf), [paixão oculta e repetição dos números](https://www.worldnumerology.com/numerology-hidden-passion/). As interpretações dos novos módulos de nome, desafios e Atlas são editoriais; o calendário reutiliza o acervo de Mês Pessoal. Essas convenções são simbólicas, não científicas ou preditivas.

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
- `npm run test:products`: oito combinações de carrinho, validação de dados, adicionais, pináculos e limites de idade; testes das rotas com gateway/banco/e-mail simulados, incluindo preço adulterado, falhas e idempotência da entrega. Nenhuma chamada externa.
- `npm run build`: compilação de produção e TypeScript.
- `node --env-file=.env.local scripts/verify-map-access.mjs`: teste integrado usando o servidor local em `http://localhost:3001` (sobrescrevível com `MAP_QA_ORIGIN`). Cria dois usuários e mapas temporários no Supabase e os remove em `finally`. Testa RLS, login, cookies, isolamento, replay, origem, rejeição de entrega sem pagamento e logout. Não envia e-mail e não cria pagamento.
- `/mapa/demo`: prévia local com perfil fictício; retorna 404 em produção.
- `/mapa/demo?product=atlas`: prévia local do Atlas. A demonstração do mapa base inclui os três adicionais para QA.

O teste integrado de acesso também verifica a biblioteca privada, o calendário comprado, o Atlas e a rejeição de upsell sem login ou para mapa de outro cliente. Usa somente usuários/mapas temporários e os remove ao concluir. Não cria cobranças nem envia e-mails.

O envio real pelo Resend não faz parte do teste automatizado para evitar disparos a clientes. A configuração de domínio remetente e a chegada à caixa de entrada devem ser conferidas no teste de lançamento.
