// Recorta as figuras (código, tabelas, diagramas) das questões oficiais direto dos PDFs da FGV.
// Uso: electron tools/figuras/main.cjs [pasta-das-provas]
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const provasDir = path.resolve(process.argv.find((a, i) => i > 1 && !a.startsWith('-') && !a.endsWith('.cjs')) || path.join(__dirname, '..', '..', '..', 'provas'));

app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: true, contextIsolation: false, sandbox: false }, // ferramenta local
  });
  ipcMain.on('log', (_e, msg) => console.log(msg));
  ipcMain.on('done', (_e, code) => app.exit(code));
  await win.loadFile(path.join(__dirname, 'renderer.html'), { query: { provas: provasDir } });
});
