const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');
const HTMLMinifier = require('html-minifier-terser');
const CleanCSS = require('clean-css');

const SRC_DIR = path.join(__dirname, 'public_src');
const DIST_DIR = path.join(__dirname, 'public');

// 1. Inicialización limpia de la carpeta de distribución
if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });
console.log('✅ Base de desarrollo establecida estrictamente en public_src/ hacia public/');

// 2. Transporte de imágenes
function copyImages() {
    const srcImgDir = path.join(SRC_DIR, 'imagenes');
    const distImgDir = path.join(DIST_DIR, 'imagenes');
    if (fs.existsSync(srcImgDir)) {
        fs.cpSync(srcImgDir, distImgDir, { recursive: true });
        console.log('✅ Imágenes transportadas exitosamente a /public/imagenes');
    }
}

// 3. Procesamiento de archivos raíz (.json, .xml, .txt)
function processJsonFiles() {
    const rootFiles = ['manifest.json', 'sitemap.xml', 'robots.txt'];
    rootFiles.forEach(file => {
        const filePath = path.join(SRC_DIR, file);
        if (fs.existsSync(filePath)) {
            if (file.endsWith('.json')) {
                const raw = fs.readFileSync(filePath, 'utf8');
                const minified = JSON.stringify(JSON.parse(raw));
                fs.writeFileSync(path.join(DIST_DIR, file), minified, 'utf8');
            } else {
                fs.copyFileSync(filePath, path.join(DIST_DIR, file));
            }
            console.log(`✅ Archivo raíz procesado: ${file}`);
        }
    });
}

// 4. Procesamiento y minificación de CSS externo
function processCssFiles() {
    const srcCssDir = path.join(SRC_DIR, 'css');
    const distCssDir = path.join(DIST_DIR, 'css');
    const cleanCss = new CleanCSS({ level: 1 });

    if (fs.existsSync(srcCssDir)) {
        fs.mkdirSync(distCssDir, { recursive: true });
        const files = fs.readdirSync(srcCssDir);

        files.forEach(file => {
            if (file.endsWith('.css')) {
                const srcPath = path.join(srcCssDir, file);
                const distPath = path.join(distCssDir, file);
                const cssContent = fs.readFileSync(srcPath, 'utf8');

                const minifiedCss = cleanCss.minify(cssContent).styles;
                fs.writeFileSync(distPath, minifiedCss, 'utf8');
                console.log(`🎨 CSS minificado con éxito: css/${file}`);
            }
        });
    }
}

// 5. Ofuscación avanzada de archivos JavaScript
function processJsFiles(dir = 'js') {
    const srcJsDir = path.join(SRC_DIR, dir);
    const distJsDir = path.join(DIST_DIR, dir);
    
    if (fs.existsSync(srcJsDir)) {
        fs.mkdirSync(distJsDir, { recursive: true });
        const files = fs.readdirSync(srcJsDir);

        files.forEach(file => {
            if (file.endsWith('.js')) {
                const srcPath = path.join(srcJsDir, file);
                const distPath = path.join(distJsDir, file);
                const code = fs.readFileSync(srcPath, 'utf8');

                const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, {
                    compact: true,
                    controlFlowFlattening: true,
                    controlFlowFlatteningThreshold: 0.75,
                    deadCodeInjection: false,
                    debugProtection: false,
                    disableConsoleOutput: true,
                    identifierNamesGenerator: 'hexadecimal',
                    log: false,
                    numbersToExpressions: true,
                    renameGlobals: false,
                    selfDefending: true,
                    simplify: true,
                    splitStrings: true,
                    stringArray: true,
                    stringArrayEncoding: ['base64'],
                    stringArrayThreshold: 0.75,
                    unicodeEscapeSequence: false
                }).getObfuscatedCode();

                fs.writeFileSync(distPath, obfuscatedCode, 'utf8');
                console.log(`🔒 JS Ofuscado con éxito: ${dir}/${file}`);
            }
        });
    }

    // Ofuscación del Service Worker raíz si existe
    const swPath = path.join(SRC_DIR, 'sw.js');
    if (fs.existsSync(swPath)) {
        const code = fs.readFileSync(swPath, 'utf8');
        const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, {
            compact: true,
            simplify: true
        }).getObfuscatedCode();
        fs.writeFileSync(path.join(DIST_DIR, 'sw.js'), obfuscatedCode, 'utf8');
        console.log('🔒 Service Worker (sw.js) ofuscado en /public/sw.js');
    }
}

// 6. Sincronización y Copia Limpia de HTML (Cero Modificación Destructiva del DOM)
async function processHtmlFiles() {
    const cleanCss = new CleanCSS({ level: 1 });
    
    if (!fs.existsSync(SRC_DIR)) {
        console.error(`❌ ERROR CRÍTICO: La carpeta fuente '${SRC_DIR}' no existe.`);
        process.exit(1);
    }

    const files = fs.readdirSync(SRC_DIR);
    let htmlCount = 0;

    for (const file of files) {
        if (file.endsWith('.html')) {
            const srcPath = path.join(SRC_DIR, file);
            let content = fs.readFileSync(srcPath, 'utf8');

            // Minificación segura de estilos embebidos
            content = content.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (match, cssContent) => {
                const minifiedCss = cleanCss.minify(cssContent).styles;
                return match.replace(cssContent, minifiedCss);
            });

            // TRASLADO EXACTO: Evitamos que el minificador altere la estructura de los modales y formularios
            // MINIFICACIÓN REAL Y SEGURA DEL HTML
            const finalHtml = await HTMLMinifier.minify(content, {
                collapseWhitespace: true,
                removeComments: true,
                minifyJS: false,
                minifyCSS: true,
                removeRedundantAttributes: false,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true,
                keepClosingSlash: true,
                caseSensitive: true
            });

            fs.writeFileSync(path.join(DIST_DIR, file), finalHtml, 'utf8');
            console.log(`⚡ HTML sincronizado exactamente desde public_src/${file} -> public/${file}`);
            htmlCount++;
        }
    }

    if (htmlCount === 0) {
        console.warn(`⚠️ ADVERTENCIA: No se encontraron archivos .html en '${SRC_DIR}'. La carpeta public quedará sin index.html.`);
    }
}

// Ejecutor principal
async function build() {
    console.log('🚀 Iniciando Pipeline de Compilación Makumoto...');
    copyImages();
    processJsonFiles();
    processCssFiles(); // <-- Añadido correctamente
    processJsFiles();
    await processHtmlFiles();
    console.log('🎉 ¡Proceso de compilación completado! Todos los assets listos en la carpeta de producción /public');
}

build().catch(err => {
    console.error('❌ Error fatal durante la compilación:', err);
    process.exit(1);
});