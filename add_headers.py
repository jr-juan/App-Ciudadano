from pathlib import Path

root = Path('.')
skip_dirs = {'.git', 'node_modules', 'www', 'android', 'ios', 'dist'}
commentable_exts = {'.ts', '.js', '.scss', '.css', '.html', '.md', '.json', '.yml', '.yaml'}

name_map = {
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
    '.browserslistrc': 'define la compatibilidad del proyecto con navegadores.',
}

for path in root.rglob('*'):
    if not path.is_file():
        continue
    if any(part in skip_dirs for part in path.parts):
        continue
    if path.suffix not in commentable_exts and path.name not in {'.gitignore', '.browserslistrc'}:
        continue

    text = path.read_text(encoding='utf-8')
    if 'Paul estuvo aquí' in text:
        continue

    # choose comment style
    if path.suffix in {'.ts', '.js', '.json'}:
        comment_prefix = '//'
        end_comment = ''
    elif path.suffix in {'.scss', '.css'}:
        comment_prefix = '/*'
        end_comment = '*/'
    elif path.suffix in {'.html'}:
        comment_prefix = '<!--'
        end_comment = '-->'
    elif path.suffix in {'.md'}:
        comment_prefix = '<!--'
        end_comment = '-->'
    elif path.suffix in {'.yml', '.yaml'}:
        comment_prefix = '#'
        end_comment = ''
    else:
        comment_prefix = '#'
        end_comment = ''

    base = path.name
    desc = name_map.get(base, 'archivo relevante del proyecto con configuración o lógica de la aplicación.')

    if 'service' in base and path.suffix == '.ts':
        key = 'Es un servicio inyectable que centraliza lógica o acceso a datos para los componentes.'
    elif 'page' in base and path.suffix == '.ts':
        key = 'Representa una pantalla de la app y coordina la vista con los datos de la interfaz.'
    elif base in {'app-routing.module.ts', 'tabs.module.ts', 'mapa.page.module.ts', 'angular.json'}:
        key = 'Define rutas o configuración de arquitectura para controlar la navegación y el build.'
    elif base in {'environment.ts', 'environment.prod.ts', 'firebase.config.ts'}:
        key = 'Almacena configuraciones específicas del entorno y la conexión con servicios externos.'
    elif base in {'main.ts', 'polyfills.ts', 'test.ts', 'karma.conf.js'}:
        key = 'Controla el arranque, compatibilidad y pruebas de la aplicación.'
    elif path.suffix in {'.json', '.yml', '.yaml'}:
        key = 'Define parámetros de configuración para herramientas, compilación o despliegue.'
    elif path.suffix in {'.html'}:
        key = 'Contiene la estructura visual que el usuario ve en la interfaz.'
    elif path.suffix in {'.scss', '.css'}:
        key = 'Define estilos reutilizables y la apariencia de la pantalla.'
    elif base in {'.gitignore', '.browserslistrc'}:
        key = 'Indica reglas de exclusión o compatibilidad del proyecto.'
    else:
        key = 'Es importante porque afecta directamente el comportamiento o la configuración del proyecto.'

    def line(text):
        return f"{comment_prefix} {text}"

    header_lines = [
        line('Paul estuvo aquí'),
        line(desc),
        line(key),
        line('Este archivo es parte esencial de la arquitectura o documentación del proyecto.'),
    ]

    if path.suffix in {'.scss', '.css'}:
        header = '\n'.join(header_lines) + '\n' + end_comment
    elif path.suffix in {'.html', '.md'}:
        header = '\n'.join(header_lines) + '\n' + end_comment
    else:
        header = '\n'.join(header_lines)

    path.write_text(header + '\n\n' + text, encoding='utf-8')

print('Comentarios agregados correctamente.')
