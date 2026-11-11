# Joanthony_Takashi

Painel escolar com cadastro, login, perfil e consultas privadas à tabela `registro_escolar`.

## Executar

1. Instale as dependências com `npm install`.
2. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no arquivo `.env` (use `.env.example` como referência).
3. Execute `npm run dev`.

No Supabase, habilite o provedor de autenticação por e-mail. Se a confirmação de e-mail estiver habilitada, o cadastro orienta a pessoa a confirmar o endereço antes do login.

## Acesso aos dados

Execute [supabase_rls.sql](supabase_rls.sql) no SQL Editor do Supabase. A política habilita leitura de `registro_escolar` somente para o papel `authenticated`; portanto, qualquer conta autenticada poderá consultar os registros. A proteção das rotas no cliente complementa, mas não substitui, essa política do banco.

A tabela não possui coluna `id`; os detalhes em `/registros/:id` usam `matricula` como identificador e exibem os registros associados à matrícula.

Rotas públicas: `/`, `/login` e `/registro`. Rotas autenticadas: `/dashboard`, `/alunos`, `/materias`, `/registros`, `/registros/:id` e `/perfil`.