# MyFlow Finance

Aplicação web para controle financeiro pessoal, desenvolvida com **React**, **TypeScript**, **Vite** e **Supabase**.

O MyFlow Finance foi criado como projeto de portfólio com foco em organização financeira, autenticação, persistência de dados, componentização de interface e construção de uma aplicação web com fluxo real de uso.

## Preview

🔗 Produção:  
https://myflow-finance-app.vercel.app/

## Status do projeto

🚧 Projeto em desenvolvimento e evolução contínua.

A aplicação já possui autenticação, estrutura protegida por usuário, dashboard financeiro, cadastro de transações e módulos iniciais de metas e planejamento. Algumas telas ainda estão em processo de revisão visual, melhoria de experiência e validação funcional.

## Sobre o projeto

O MyFlow Finance tem como objetivo centralizar o acompanhamento financeiro pessoal em uma interface moderna, organizada e responsiva.

A aplicação permite registrar movimentações financeiras, acompanhar indicadores, visualizar saldo, receitas, despesas e metas, além de servir como base para futuras funcionalidades de planejamento mensal, importação de dados e análises financeiras mais avançadas.

## Funcionalidades implementadas

### Autenticação

- Cadastro de usuário
- Login de usuário
- Integração com Supabase Auth
- Sessão persistente
- Rotas protegidas para usuários autenticados

### Dashboard financeiro

- Indicadores de saldo, receitas e despesas
- Resumo executivo do período
- Filtros por período e intervalo personalizado
- Visualização de despesas por categoria
- Leitura de saúde financeira com base em saldo, despesas, metas e movimentações
- Integração com transações e metas do usuário

### Transações

- Cadastro de receitas e despesas
- Edição de transações
- Exclusão de transações
- Listagem por usuário autenticado
- Persistência no Supabase Database
- Tratamento de carregamento, erro e atualização de estado

### Metas financeiras

- Cadastro de metas
- Edição de metas
- Exclusão de metas
- Definição de meta principal
- Registro de aportes
- Cálculo de progresso das metas
- Integração com o dashboard

### Interface e experiência

- Layout com navegação lateral
- Topbar com ações principais
- Dark mode com persistência local
- Feedbacks por toast
- Estados de loading
- Componentização da interface
- Estrutura preparada para desktop e melhorias responsivas

## Funcionalidades em revisão

As funcionalidades abaixo existem como módulos ou estrutura inicial no projeto, mas ainda estão em processo de revisão visual, validação funcional ou refinamento de experiência:

- Planejamento mensal
- Relatórios financeiros
- Categorias
- Regras automáticas de categoria
- Importação de transações
- Transações recorrentes
- Responsividade final para mobile
- Padronização visual das telas internas

## Tecnologias utilizadas

### Frontend

- React
- TypeScript
- Vite
- React Router

### Backend e banco de dados

- Supabase
- Supabase Auth
- Supabase Database

### Interface e visualização

- CSS com variáveis e tokens visuais
- Recharts
- Lucide React
- React Hot Toast

### Deploy e versionamento

- Vercel
- GitHub

## Estrutura do projeto

O projeto foi organizado com foco em separação de responsabilidades, reutilização de componentes e manutenção progressiva.

```txt
src/
├── assets/
├── components/
├── contexts/
├── hook/
├── layouts/
├── lib/
├── pages/
├── styles/
├── types/
└── utils/
