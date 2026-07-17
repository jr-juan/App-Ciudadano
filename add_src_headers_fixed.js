const fs = require('fs');
const path = require('path');

const root = process.cwd();
const srcRoot = path.join(root, 'src');
const textExts = new Set([
  '.ts', '.js', '.scss', '.css', '.html', '.json', '.xml', '.svg'
]);

const fileDescriptions = {
  'app-routing.module.ts': {
    desc: 'la configuración principal de rutas y el lazy-loading de módulos',
    purpose: 'dirigir la navegación inicial y definir la redirección por defecto',
    note: 'usa RouterModule.forRoot y una estrategia de precarga para optimizar el flujo'
  },
  'app.module.ts': {
    desc: 'el módulo raíz de Angular que registra la aplicación',
    purpose: 'inicializar la app, declarar el componente principal y configurar proveedores globales',
    note: 'integra Ionic y define el RouteReuseStrategy para el comportamiento de rutas'
  },
  'app.component.ts': {
    desc: 'la lógica del componente raíz de la interfaz',
    purpose: 'gestionar el arranque de la app y ocultar el splash screen cuando la vista está lista',
    note: 'depende de Capacitor para controlar el ciclo de vida visual'
  },
  'app.component.html': {
    desc: 'la plantilla visual del componente raíz',
    purpose: 'renderizar el contenedor principal de la interfaz y el router outlet',
    note: 'sirve como base estructural para toda la navegación'
  },
  'app.component.scss': {
    desc: 'los estilos base del componente raíz',
    purpose: 'definir la apariencia general del layout principal',
    note: 'debe mantenerse consistente con el diseño global de Ionic'
  },
  'app.component.spec.ts': {
    desc: 'las pruebas unitarias del componente raíz',
    purpose: 'validar el comportamiento básico del componente y su inicialización',
    note: 'conviene mantener pruebas simples para evitar fragilidad en la UI'
  },
  'main.ts': {
    desc: 'el punto de entrada de la aplicación web',
    purpose: 'arrancar Angular con el módulo principal y configurar el entorno de ejecución',
    note: 'se encarga del bootstrap y del control del modo producción'
  },
  'index.html': {
    desc: 'el documento HTML base del proyecto',
    purpose: 'cargar la aplicación y definir recursos y el nodo raíz',
    note: 'debe conservar la configuración base href y los assets necesarios'
  },
  'polyfills.ts': {
    desc: 'la carga de polyfills para compatibilidad del navegador',
    purpose: 'permitir que la app funcione correctamente en entornos con soporte limitado',
    note: 'revisar cambios aquí al actualizar navegadores o dependencias'
  },
  'test.ts': {
    desc: 'la configuración del entorno de pruebas',
    purpose: 'habilitar la ejecución de tests unitarios con el framework correspondiente',
    note: 'mantener esta configuración alineada con Angular y Karma'
  },
  'zone-flags.ts': {
    desc: 'las banderas específicas de Zone.js para el proyecto',
    purpose: 'ajustar el comportamiento de detección de cambios y compatibilidad',
    note: 'cambiar esto puede afectar el flujo de ejecución'
  },
  'global.scss': {
    desc: 'los estilos globales compartidos por toda la aplicación',
    purpose: 'definir reglas base, temas y utilidades visuales comunes',
    note: 'mantener los estilos globales simples para evitar conflictos entre componentes'
  },
  'variables.scss': {
    desc: 'las variables de tema y personalización visual',
    purpose: 'centralizar colores, espaciados y configuraciones reutilizables',
    note: 'cualquier cambio afecta a toda la interfaz de forma transversal'
  },
  'environment.ts': {
    desc: 'la configuración base para el entorno de desarrollo',
    purpose: 'proveer valores para pruebas locales y desarrollo',
    note: 'evitar secretos y usar esta configuración para ajustes locales'
  },
  'environment.prod.ts': {
    desc: 'la configuración específica para producción',
    purpose: 'definir parámetros con el comportamiento esperado en despliegues reales',
    note: 'asegurar que endpoints y claves sean correctos antes de publicar'
  },
  'mapa.page.ts': {
    desc: 'la lógica de la pantalla del mapa',
    purpose: 'gestionar el seguimiento GPS, la carga del recorrido y la interacción con el mapa',
    note: 'su flujo principal depende de la sincronización de ubicación y eventos del mapa'
  },
  'mapa.page.html': {
    desc: 'la plantilla visual de la pantalla del mapa',
    purpose: 'mostrar paneles, estado del recorrido y la interfaz del mapa',
    note: 'tener en cuenta la relación entre el DOM y los controles interactivos'
  },
  'mapa.page.scss': {
    desc: 'los estilos específicos del mapa',
    purpose: 'ajustar la apariencia del panel y los overlays del recorrido',
    note: 'los estilos pueden influir en la legibilidad y uso del mapa en móviles'
  },
  'mapa.page.module.ts': {
    desc: 'el módulo asociado a la pantalla del mapa',
    purpose: 'organizar la carga diferida del componente y sus dependencias',
    note: 'mantener la separación de módulos para evitar acoplamiento innecesario'
  },
  'tab1.page.ts': {
    desc: 'la lógica de la pantalla tab1',
    purpose: 'gestionar la visualización de recorridos o datos relevantes para esa vista',
    note: 'revisar el flujo de eventos y sus suscripciones al actualizar la pantalla'
  },
  'tab1.page.html': {
    desc: 'la plantilla de la pantalla tab1',
    purpose: 'mostrar la información correspondiente a la sección principal',
    note: 'la estructura HTML debe mantenerse alineada con el estado y la navegación'
  },
  'tab1.page.scss': {
    desc: 'los estilos de la pantalla tab1',
    purpose: 'definir el diseño visual específico de esa vista',
    note: 'evitar estilos demasiado rígidos si la pantalla puede cambiar de contexto'
  },
  'tabs.page.ts': {
    desc: 'la lógica de la navegación por pestañas',
    purpose: 'controlar la vista base y el manejo de las pestañas disponibles',
    note: 'el patrón de tabs es clave para el flujo principal de navegación'
  },
  'tabs.page.html': {
    desc: 'la plantilla de la barra de pestañas',
    purpose: 'exponer la navegación inferior y los enlaces entre secciones',
    note: 'mantener rutas y etiquetas consistentes con la arquitectura del router'
  },
  'tabs.module.ts': {
    desc: 'el módulo de navegación por pestañas',
    purpose: 'registrar el componente y rutas que pertenecen al flujo de tabs',
    note: 'usa lazy-loading y módulos separados para mantener la app organizada'
  },
  'abs.page.ts': {
    desc: 'la lógica de la pantalla abs',
    purpose: 'controlar la vista correspondiente al flujo alternativo de la aplicación',
    note: 'revisar el flujo de eventos y la dependencia de la navegación'
  },
  'abs.page.html': {
    desc: 'la plantilla de la pantalla abs',
    purpose: 'mostrar la interfaz asociada a esa vista',
    note: 'mantener coherencia con el diseño utilizado en otras pantallas'
  },
  'abs.module.ts': {
    desc: 'el módulo que agrupa la pantalla abs',
    purpose: 'registrar la pantalla y sus rutas dentro del esquema general',
    note: 'la estructura modular facilita el mantenimiento y la carga diferida'
  },
  'photo.service.ts': {
    desc: 'el servicio encargado de la captura y carga de fotos',
    purpose: 'gestionar almacenamiento, lectura y subida de imágenes',
    note: 'revisar permisos y manejo de errores al exponer funciones con medios'
  },
  'photo.service.spec.ts': {
    desc: 'las pruebas del servicio de fotos',
    purpose: 'validar el comportamiento esperado del manejo de imágenes',
    note: 'evitar depender de mocks complejos si el flujo real es fácil de verificar'
  },
  'firebase.config.ts': {
    desc: 'la configuración de inicialización de Firebase',
    purpose: 'conectar la app con servicios remotos y sus credenciales de entorno',
    note: 'tener cuidado con los valores expuestos y cambios por ambiente'
  },
  'ciudadano.service.ts': {
    desc: 'el servicio principal para datos del ciudadano y recorridos',
    purpose: 'centralizar peticiones y transformaciones de información para la vista',
    note: 'su flujo es crítico para la sincronización entre UI y backend'
  },
  'shapes.svg': {
    desc: 'el recurso vectorial utilizado como decoración o iconografía',
    purpose: 'proveer una imagen escalable para la interfaz',
    note: 'al exponerlo, revisar que el SVG mantenga buena calidad en distintos tamaños'
  }
};

function isBinary(buffer) {
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] === 0) return true;
  }
  return false;
}

function getStyle(ext) {
  if (ext === '.html' || ext === '.svg' || ext === '.xml') return 'html';
  if (ext === '.scss' || ext === '.css') return 'block';
  return 'line';
}

function isCommentLine(line) {
  return /^\s*(\/\/|#|<!--|\/\*|\*|\*\/|-->)/.test(line);
}

function removeLeadingCommentBlock(text) {
  const lines = text.split(/\r?\n/);
  let i = 0;

  while (i < lines.length && lines[i].trim() === '') i++;
  if (i >= lines.length || !isCommentLine(lines[i])) return text;

  // Skip contiguous top comment block and blank lines immediately after it.
  let j = i;
  while (j < lines.length) {
    const line = lines[j];
    if (line.trim() === '') {
      const next = lines[j + 1];
      if (next !== undefined && (isCommentLine(next) || next.trim() === '')) {
        j++;
        continue;
      }
      break;
    }
    if (!isCommentLine(line)) break;
    j++;
  }

  const block = lines.slice(i, j).join('\n');
  if (!block.includes('Paul estuvo') && !block.includes('Este archivo contiene')) {
    return text;
  }

  const rest = lines.slice(j).join('\n').replace(/^\n+/, '').replace(/\n{3,}/g, '\n\n');
  return rest;
}

function getInfo(filePath) {
  const name = path.basename(filePath);
  const relative = filePath.replace(/\\/g, '/');

  if (name in fileDescriptions) return fileDescriptions[name];
  if (relative.includes('/services/')) {
    return {
      desc: 'un servicio reutilizable para lógica compartida',
      purpose: 'encapsular operaciones comunes usadas por varios componentes',
      note: 'revisar dependencias y efectos secundarios al cambiar la API'
    };
  }
  if (relative.includes('/app/')) {
    return {
      desc: 'una parte del código fuente principal de la aplicación',
      purpose: 'apoyar la estructura, lógica o presentación de la app',
      note: 'mantener la separación entre vista, lógica y estilos para facilitar el mantenimiento'
    };
  }
  return {
    desc: 'un recurso o configuración relevante dentro del proyecto',
    purpose: 'apoyar el funcionamiento o la presentación de la aplicación',
    note: 'revisar el contexto de uso antes de exponer o modificar este archivo'
  };
}

function buildHeader(filePath) {
  const ext = path.extname(filePath);
  const style = getStyle(ext);
  const info = getInfo(filePath);
  const lines = [
    'Paul estuvo aquí',
    `Este archivo contiene ${info.desc}.`,
    `Su propósito es ${info.purpose}.`,
    `Al exponerlo, tener en cuenta: ${info.note}.`
  ];

  if (style === 'html') {
    return '<!--\n' + lines.map((l) => `  ${l}`).join('\n') + '\n-->';
  }
  if (style === 'block') {
    return '/*\n' + lines.map((l) => ` * ${l}`).join('\n') + '\n */';
  }
  return lines.map((l) => `// ${l}`).join('\n');
}

function walk(dir) {
  let changed = 0;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      walk(full);
      continue;
    }

    if (!entry.isFile()) continue;
    const ext = path.extname(full);
    if (!textExts.has(ext)) continue;

    const buffer = fs.readFileSync(full);
    if (isBinary(buffer)) continue;

    let text = buffer.toString('utf8');
    text = removeLeadingCommentBlock(text);
    const header = buildHeader(full);
    const updated = `${header}\n\n${text.replace(/^\uFEFF/, '')}`;

    if (updated !== text) {
      fs.writeFileSync(full, updated, 'utf8');
      changed++;
      console.log('Updated:', full.replace(root + path.sep, ''));
    }
  }

  return changed;
}

const count = walk(srcRoot);
console.log('Done:', count);
