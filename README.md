# Revisão DATAPREV 2026 – Quiz (React + Electron)

Dois bancos de questões, à escolha no app:

- **Oficiais FGV 2024 (153 questões):** questões reais do concurso DATAPREV 2024 (FGV), com gabarito definitivo.
  - A prova de *ATI – Desenvolvimento de Software* entra completa.
  - Dos perfis de Arquitetura, Análise de Negócio, Segurança Cibernética, Gestão de Serviços de TIC, Inteligência da Informação e Analista de Processamento entram só as específicas ligadas ao edital do Perfil 3 de 2026. Ficam de fora temas como redes, nuvem, estatística e contratações.
  - Fonte: [FGV Conhecimento – DATAPREV 2024](https://conhecimento.fgv.br/concursos/dataprev24).
- **Autorais (102 questões):** questões inéditas no estilo FGV, cada uma com explicação do gabarito.

Questões anuladas e questões cujo código ou tabela estava só em imagem no PDF foram excluídas. As que dependem de figura e ainda dão para responder trazem um aviso.

**Versão web (funciona no celular):** https://rafaelkenedy.github.io/dataprev-quiz/

## Rodar localmente (desktop / Electron)

```
npm start      # compila (vite build) e abre o app Electron
npm run web    # opcional: abre no navegador com hot reload (http://localhost:5173)
```

## Recursos
- Filtro por disciplina (atalho "só específicas", que têm peso 2,5)
- **Treino**: correção e explicação logo após cada resposta
- **Simulado**: cronômetro de 3 min por questão, correção no final, nota com os pesos da prova
- "Refazer as que errei" e "questões inéditas" (histórico salvo localmente)
- Alternativas embaralhadas a cada sessão
- Teclado: `A`–`E` / `1`–`5` respondem, `Enter` avança, `←` `→` navegam

## Reimportar as provas oficiais
Com os PDFs (Tipo 1) e o gabarito definitivo baixados em `../provas`:
```
node tools/import-provas.mjs ../provas
```
O mapeamento de cada questão para os temas do edital é feito por palavras-chave, com a curadoria manual em `OVERRIDES` no próprio script.

## Adicionar questões autorais
Edite `src/questions.js`: `q('disc', 'enunciado', [5 alternativas], 'letra', 'explicação')`.

## Figuras das questões oficiais
Código, SQL e diagramas que estavam como imagem nos PDFs são recortados direto dos PDFs oficiais com pdf.js:
```
node_modules/electron/dist/electron tools/figuras/main.cjs ../provas
```
O resultado fica em `public/figuras/` e `src/figuras.json`.
