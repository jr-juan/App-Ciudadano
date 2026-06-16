const fs = require('fs');
const path = require('path');

const root = process.cwd();
const skipDirs = new Set(['.git', 'node_modules', 'www', 'android', 'ios', 'dist', 'coverage']);
const textExts = new Set([
  '.ts', '.js', '.scss', '.css', '.html', '.md', '.json', '.yml', '.yaml', '.xml', '.txt'
]);
const specialNames = new Set(['.gitignore', '.browserslistrc']);

const descriptions = {
  'app-routing.module.ts': 'configura las rutas principales y la redirección inicial de la aplicación.',
  'app.module.ts': 'arranca la aplicación Angular y registra módulos y proveedores globales.',
  'app.component.ts': 'define el componente raíz que inicializa la app y el splash screen.',
  'app.component.html': 'plantilla principal del componente raíz.',
  'app.component.scss': 'estilos del componente raíz.',
  'app.component.spec.ts': 'prueba unitaria del componente raíz.',
  'tabs.module.ts': 'define el módulo de navegación por pestañas.',
  'tabs.page.ts': 'controla la vista base de las pestañas.',
  'tabs.page.html': 'plantilla con la barra de navegación inferior.',
  'tabs.page.scss': 'estilos de la vista de pestañas.',
  'tab1.page.ts': 'gestiona la lista de recorridos activos y la navegación hacia el mapa.',
  'tab1.page.html': 'muestra la información de rutas en tiempo real.',
  'tab1.page.scss': 'estilos visuales de la pantalla de rutas.',
  'mapa.page.ts': 'controla la carga del mapa, seguimiento GPS y navegación del recorrido.',
  'mapa.page.html': 'plantilla con la interfaz del mapa y paneles de estado.',
  'mapa.page.scss': 'estilos del mapa y overlays visuales.',
  'mapa.page.module.ts': 'define el módulo lazy-loading de la pantalla del mapa.',
  'ciudadano.service.ts': 'consume datos desde Firestore para recorridos y posiciones.',
  'firebase.config.ts': 'inicializa la conexión con Firebase Firestore.',
  'photo.service.ts': 'gestiona captura, almacenamiento y carga de fotos.',
  'photo.service.spec.ts': 'prueba unitaria del servicio de fotos.',
  'environment.ts': 'define variables de configuración para desarrollo.',
  'environment.prod.ts': 'define variables de configuración para producción.',
  'main.ts': 'punto de entrada de la aplicación.',
  'polyfills.ts': 'carga los polyfills necesarios para compatibilidad.',
  'test.ts': 'configura el entorno de pruebas del proyecto.',
  'global.scss': 'estilos globales compartidos por toda la app.',
  'index.html': 'archivo HTML raíz donde se carga la aplicación.',
  'package.json': 'define scripts, dependencias y metadatos del proyecto.',
  'angular.json': 'configura el build, la arquitectura y opciones del CLI de Angular.',
  'tsconfig.json': 'establece las opciones del compilador TypeScript.',
  'tsconfig.app.json': 'configuración específica para la app Angular.',
  'tsconfig.spec.json': 'configuración específica para pruebas unitarias.',
  'firebase.json': 'define configuración del hosting y despliegue de Firebase.',
  'firestore.rules': 'reglas de seguridad de Firestore.',
  'firestore.indexes.json': 'índices de Firestore para consultas optimizadas.',
  'capacitor.config.ts': 'configura Capacitor para Android/iOS.',
  'ionic.config.json': 'configuración base del proyecto Ionic.',
  'karma.conf.js': 'configura la ejecución de pruebas con Karma.',
  'README.md': 'documentación general del proyecto.',
  'AUTH-DOCUMENTATION.md': 'documentación técnica y guía de uso.',
  '.gitignore': 'define qué archivos deben ignorarse por Git.',
  '.browserslistrc': 'define la compatibilidad del proyecto con navegadores.'
};

function canProcess(filePath) {
  const ext = path.extname(filePath);
  const name = path.basename(filePath);
  return textExts.has(ext) || specialNames.has(name);
}

function isBinary(buffer) {
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] === 0) return true;
  }
  return false;
}

function getStyle(filePath) {
  const ext = path.extname(filePath);
  const name = path.basename(filePath);
  if (ext === '.html' || ext === '.md') return 'html';
  if (ext === '.scss' || ext === '.css') return 'block';
  if (ext === '.json' || ext === '.yml' || ext === '.yaml') return 'line';
  if (name === '.gitignore' || name === '.browserslistrc') return 'line';
  return 'line';
}

function getKey(filePath) {
  const name = path.basename(filePath);
  if (name in descriptions) return descriptions[name];
  if (filePath.includes('/services/')) return 'es un servicio o helper usado por la aplicación para lógica reutilizable.';
  if (filePath.includes('/app/')) return 'es parte del código fuente principal del proyecto.';
  return 'archivo relevante del proyecto con configuración o lógica de la aplicación.';
}

function buildHeader(filePath) {
  const name = path.basename(filePath);
  const style = getStyle(filePath);
  const desc = getKey(filePath);
  const key = (() => {
    if (/service/i.test(name) || /config/i.test(name)) return 'es importante porque centraliza lógica o configuración reutilizable del proyecto.';
    if (/page/i.test(name) || /component/i.test(name) || /module/i.test(name)) return 'define la vista, el flujo o la organización del módulo que lo contiene.';
    if (name === 'index.html' || name === 'README.md' || name === 'AUTH-DOCUMENTATION.md') return 'sirve como punto de entrada o documentación clave para explicar el proyecto.';
    if (name === '.gitignore' || name === '.browserslistrc') return 'indica reglas de exclusión o compatibilidad necesarias para el entorno de desarrollo.';
    return 'afecta directamente el comportamiento, la configuración o la presentación del proyecto.';
  })();

  const lines = [
    '',
    desc,
    key,
    ''
  ];

  if (style === 'html') {
    return '<!-- ' + lines.join(' ') + ' -->';
  }
  if (style === 'block') {
    return '/*\n' + lines.map(line => ` * ${line}`).join('\n') + '\n */';
  }
  return lines.map(line => `// ${line}`).join('\n');
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) {
      // Skip dot-directories except root dotfiles we do want to process (*.gitignore, etc.)
      if (entry.isDirectory() && entry.name === '.git') continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      walk(full);
    } else if (entry.isFile() && canProcess(full)) {
      const content = fs.readFileSync(full);
      if (isBinary(content)) continue;
      const text = content.toString('utf8');
      if (text.includes('')) continue;
      const header = buildHeader(full);
      fs.writeFileSync(full, header + '\n\n' + text);
      console.log('Updated:', full.replace(root + path.sep, ''));
    }
  }
}

walk(root);
console.log('Done.');
