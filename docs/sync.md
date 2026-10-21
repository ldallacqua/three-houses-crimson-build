# Sincronizar entre aparelhos: como ligar

O site guarda o save no navegador. Para abrir o mesmo save no PC, no celular ou em outro
navegador, ele também pode guardá-lo num banco **Turso**. Quem lê e escreve o banco é uma
função pequena na **Vercel** (`api/save.js`), o mesmo esquema do Shelf.

- **O token do Turso fica só na Vercel.** O site nunca o vê.
- **O site só guarda a senha mestre**, digitada uma vez em cada aparelho.
- **Usuário:** um só, o dono da senha. Quem visita o site sem ela continua usando só o
  próprio navegador.

São duas partes, uns 10 minutos no total. Nenhum valor secreto vai para o repositório nem para
um chat: você cola cada um direto na Vercel.

## 1. Banco no Turso (5 min)

1. Entre em [turso.tech](https://turso.tech) com o GitHub (a mesma conta do Shelf serve).
2. Crie um banco chamado **`crimson-flower`**, na região **AWS South America (São Paulo)**
   (`aws-sa-east-1`). A função da Vercel roda em São Paulo também (`gru1`, no `vercel.json`),
   ao lado do banco.
3. Na página do banco:
   - Copie a **URL**, que começa com `libsql://`.
   - Crie um **token** com leitura e escrita, sem expiração.

As tabelas são criadas sozinhas no primeiro acesso.

## 2. Função na Vercel (5 min)

1. Em [vercel.com](https://vercel.com): **Add New** → **Project** → importe
   `ldallacqua/three-houses-crimson-build`.
2. **Project name:** `three-houses-crimson-build`. O site procura a função em
   `https://three-houses-crimson-build.vercel.app/api/save`; o nome estava livre em 20/10/2026.
   Se escolher outro, me avise, porque esse endereço está em `js/sync.js` e na CSP do
   `index.html`.
3. **Framework preset:** Other. Deixe build e output em branco.
4. Em **Environment Variables**, marque como **Sensitive** e use o ambiente **Production**:

   | Nome | Valor |
   | --- | --- |
   | `TURSO_DATABASE_URL` | a URL do banco (`libsql://…`) |
   | `TURSO_AUTH_TOKEN` | o token do banco |
   | `SYNC_PASSWORD` | a sua senha mestre (uma frase longa é melhor que uma palavra) |

5. Clique em **Deploy**. Depois disso, cada push no `main` publica a função de novo.

Feito em 20/10/2026 pelo CLI (`vercel project create`, `vercel link`, `vercel git connect`,
`vercel env add … --sensitive`), com o banco `crimson-flower` em São Paulo.

**Para conferir:** abra `https://three-houses-crimson-build.vercel.app/api/save`.

- `{"error":"Senha errada."}`: está tudo certo (o navegador não mandou senha).
- `{"error":"A sincronização não está configurada no servidor."}`: falta alguma variável.
  Depois de adicionar, faça um **Redeploy**.

A Vercel também publica uma cópia do site nesse endereço. Ela funciona igual; o endereço
principal continua sendo o do GitHub Pages.

## 3. Em cada aparelho

Abra o site, vá em **Dados**, depois em **Sincronizar entre aparelhos**, digite a senha mestre
e clique em **Conectar**.

Comece pelo aparelho que já tem o seu save:

- **Nuvem vazia:** o save deste aparelho sobe.
- **Aparelho novo, sem nada marcado:** ele pega o save da nuvem. No primeiro acesso, o link
  "Conecte e traga o seu save" leva direto para lá, sem escolher build antes.
- **Os dois lados com saves diferentes:** o site pergunta qual manter.

Depois disso:

- **Cada mudança sobe sozinha**, cerca de um segundo depois.
- **Abrir o site ou voltar para a aba** traz o que outro aparelho salvou.
- **Sem internet**, as mudanças esperam no aparelho e sobem quando a conexão volta.
- **Quando os dois aparelhos mudaram desde a última sincronização**, o site pergunta qual
  save manter.
  - O save que você não escolheu fica guardado.
  - No aparelho, aparece o link "Voltar para ele" em Dados.
  - Na nuvem, o banco mantém as 50 versões anteriores na tabela `save_history`.

## Trocar a senha

Mude `SYNC_PASSWORD` na Vercel e faça um Redeploy. Cada aparelho conectado avisa que a senha
mudou e pede a nova em Dados.

## Trabalhar localmente

`node tools/serve.mjs` também responde em `/api/save`, com um arquivo SQLite em `notes/`
(ignorado pelo git) e a senha `dev`. Com `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` no
ambiente, ele usa o Turso de verdade.
