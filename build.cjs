'use strict';

const { copyFileSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');

const scripts = ['server.cjs', 'app.js', 'ideas.js', 'ideas-data.js'];
const files = [...scripts, 'index.html', 'ideas.html', 'styles.css', 'ideas.css', 'package.json', 'package-lock.json'];
const output = join(__dirname, 'release');

mkdirSync(output, { recursive: true });
for (const file of files) {
  copyFileSync(join(__dirname, file), join(output, file));
}
console.log(`Paquete listo en release/ con ${files.length} archivos de ejecución.`);
