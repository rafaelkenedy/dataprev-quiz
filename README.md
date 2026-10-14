# Revisão DATAPREV – Quiz (React + Electron)

Bancos de questões, à escolha no app:

- **Prova 2026 (189 questões):** prova da FGV aplicada em 11/10/2026, com os 7 cadernos de TI completos: Desenvolvimento de Software, Arquitetura, Análise de Negócio, Segurança Cibernética, Gestão de Serviços de TIC, Inteligência da Informação e Analista de Processamento.
  - As gerais e as específicas que se repetem entre cadernos aparecem uma vez só; a referência lista todos os cadernos em que a questão caiu.
  - Usa o **gabarito oficial preliminar** (13/10/2026). Quando sair o definitivo, basta baixar o PDF e reimportar. As anuladas serão excluídas automaticamente.
  - Fonte: [FGV Conhecimento – DATAPREV 2026](https://conhecimento.fgv.br/concursos/dataprev26).
- **Prova 2024 (157 questões):** prova da FGV de 2024, com gabarito definitivo.
  - A prova de *ATI – Desenvolvimento de Software* entra completa.
  - Dos outros perfis de TI entram só as específicas ligadas ao edital do Perfil 3.
  - Fonte: [FGV Conhecimento – DATAPREV 2024](https://conhecimento.fgv.br/concursos/dataprev24).
- **Autorais (102 questões):** questões inéditas no estilo FGV, cada uma com explicação do gabarito.

Questões anuladas ficam de fora. Há um filtro por **caderno (perfil)**, por exemplo, só a prova de Dev Software de 2026.

**Versão web (funciona no celular):** https://rafaelkenedy.github.io/dataprev-quiz/

## Rodar localmente (desktop / Electron)

```
npm start      # compila (vite build) e abre o app Electron
npm run web    # opcional: abre no navegador com hot reload (http://localhost:5173)
```

## Recursos
- Enunciados formatados como na prova: parágrafos, listas (I, II, III… / a), b)… / associação "( )"), blocos de código com indentação, texto-base destacado e figuras no lugar certo
- Filtro por disciplina (atalho "só específicas", que têm peso 2,5) e por caderno
- **Treino**: correção e explicação logo após cada resposta
- **Simulado**: cronômetro de 3 min por questão, correção no final, nota com os pesos da prova
- "Refazer as que errei" e "questões inéditas" (histórico salvo localmente)
- Alternativas embaralhadas a cada sessão
- Teclado: `A`–`E` / `1`–`5` respondem, `Enter` avança, `←` `→` navegam

## Reimportar as provas oficiais
Coloque os PDFs (Tipo 1) e os gabaritos em `../provas` (os de 2026 ficam em `../provas/2026`) e rode:
```
npm run importar
```
Isso faz duas etapas:
1. `tools/import-provas.mjs` lê os PDFs com pdf.js (`tools/pdf-layout.mjs`) usando a posição de cada linha. A partir dela reconstrói parágrafos, listas, código, tabelas e destaques (`tools/formatar.mjs`) e gera `src/provas.json`.
2. `tools/figuras` (Electron) recorta as figuras nas áreas sem texto entre as linhas da questão e salva em `public/figuras/`.

O texto usa uma marcação leve, renderizada por `src/RichText.jsx`.

O mapeamento de cada questão para as disciplinas é feito por palavras-chave, com curadoria manual em `OVERRIDES` no script. As específicas de 2026 que não batem com os temas do Perfil 3 ficam em "Outros temas de TI".

## Adicionar questões autorais
Edite `src/questions.js`: `q('disc', 'enunciado', [5 alternativas], 'letra', 'explicação')`.
