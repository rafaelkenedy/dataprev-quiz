# Revisão DATAPREV 2026 – Quiz (React + Electron)

Banco com 102 questões originais no estilo FGV, cobrindo o Anexo I do edital (Perfil 3 – Desenvolvimento de Software) e as gerais.

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

## Adicionar questões
Edite `src/questions.js`: `q('disc', 'enunciado', [5 alternativas], 'letra', 'explicação')`.
