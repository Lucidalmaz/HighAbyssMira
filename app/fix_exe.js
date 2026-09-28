// Windows (Smart App Control) blockiert die exe, sobald der Packager das Icon hineinschreibt (Signatur kaputt).
// Darum die original signierte Electron-exe verwenden; das Icon kommt über Fenster und Verknüpfung.
const fs = require('fs');
fs.copyFileSync('node_modules/electron/dist/electron.exe', 'dist/High Abyss Mira-win32-x64/High Abyss Mira.exe');
fs.copyFileSync('icon.ico', 'dist/High Abyss Mira-win32-x64/icon.ico');
console.log('Signierte exe eingesetzt');
