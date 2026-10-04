# Sinastria e relacionamentos

## Publicação

1. Execute **todo** o arquivo `scripts/sinastria-schema.sql` no SQL Editor do Supabase do projeto. Ele cria duas tabelas e uma função transacional; não altera os mapas ou pagamentos existentes. Pode ser executado novamente.
2. Publique esta versão da aplicação. A landing fica em `/sinastria`; a home mantém seus três adicionais anteriores.
3. Faça uma compra de teste do mapa com o adicional. Entre pelo e-mail, abra **Relacionamentos e sinastrias**, cadastre uma pessoa e use o crédito. Reabra a comparação e confirme que não há consumo adicional.

O SQL foi executado em PostgreSQL isolado via PGlite, incluindo testes de permissões e isolamento. Ainda precisa ser aplicado e validado no Supabase do ambiente publicado. O checkout bloqueia a venda de sinastria se a tabela de relatórios não existir.

## Oferta

- Mapa: R$ 19,90, nove números e seção individual de relacionamentos.
- Adicional `synastry`: R$ 9,90; libera uma sinastria no mapa comprado. Mapa + adicional = R$ 29,80.
- Produto `synastry_credit`: R$ 14,90 por nova comparação. Requer sessão e mapa próprio; valores sempre calculados no servidor.
- Cadastro gratuito de até 50 pessoas na conta. Dados: nome completo de nascimento e data. Sem conta ou e-mail para a outra pessoa.
- Crédito vinculado ao mapa de origem. Uma comparação por pessoa cadastrada nesse mapa; releitura gratuita. O cadastro é imutável para preservar as comparações; confira a grafia antes de gerar. Se precisar corrigir os dados, cadastre um novo perfil; uma nova comparação consome outro crédito.
- A compra do adicional não exige os dados da segunda pessoa no checkout. Ninguém é pré-selecionado, e nenhum adicional vem marcado.

## Persistência e autorização

`payments.metadata` mantém o produto, adicionais e `sourceMapId`, seguindo o fluxo Pix atual. O status `PAID` é a fonte dos créditos: cada pagamento válido concede uma unidade. Não existe saldo editável pelo navegador nem tabela de saldo para sincronizar com webhooks.

`relationship_people` guarda pessoas privadas do usuário. `synastry_reports` guarda o resultado calculado no servidor, o mapa, a pessoa e o pagamento consumido. `payment_id` único impede usar uma compra duas vezes; `(map_id, person_id)` único impede cobrar uma releitura. O relatório preserva a data de referência e os números originalmente gerados.

`create_synastry` trava o mapa durante a curta transação, verifica os donos, reutiliza relatório existente, seleciona um pagamento elegível e salva o relatório de forma atômica. Se a gravação falhar, nenhum crédito é consumido. A função usa `SECURITY INVOKER` e só pode ser chamada pelo `service_role` no servidor. O cliente autenticado tem apenas leitura com RLS de proprietário. Todos os POSTs de relacionamento exigem mesma origem e sessão validada por `getUser`.

Na compra de crédito, a entrega reaproveita o mapa de origem, envia o acesso e registra a conclusão. Não cria nem sobrescreve o mapa. Webhook e polling continuam usando a entrega idempotente já existente. Se o cliente sair da página, o pagamento confirmado ainda fica disponível na próxima entrada.

## Convenção de cálculo

Sinastria numerológica editorial, sem astrologia, hora/local de nascimento ou porcentagem de compatibilidade. Cinco eixos: Caminho de Vida, Desejo da Alma, Expressão, Personalidade e Ano Pessoal. Os quatro primeiros reutilizam os cálculos pitagóricos do mapa; o ano utiliza a data de referência de Brasília.

Os números individuais preservam os mestres segundo os cálculos existentes. O tema do encontro é a soma dos dois valores reduzida a 1–9 (inclusive mestres). Bases iguais produzem uma leitura de afinidade; bases diferentes colocam as duas necessidades em diálogo. Cada eixo inclui leituras individuais, afinidade, atrito, exercício e fórmula. Valores zero por ausência de letras não recebem tema combinado.

## Verificação

`npm run test:synastry`: cálculos, 16 combinações de carrinho, SQL real isolado, RLS, créditos, releitura, rollback, rotas e regressões comerciais. O PGlite executa PostgreSQL em processo único; não substitui um teste de carga com múltiplas conexões no banco publicado.

`npm run type-check` e `npm run build`: tipos e compilação de produção.

Prévia do produto em desenvolvimento: `/mapa/demo#relacionamentos`, com dois perfis fictícios. Essa rota permanece desativada em produção.
