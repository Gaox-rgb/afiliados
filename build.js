const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');
const HTMLMinifier = require('html-minifier-terser');
const CleanCSS = require('clean-css');

const SRC_DIR = path.join(__dirname, 'public_src');
const DIST_DIR = path.join(__dirname, 'public');

// 1. Limpieza y preparación del directorio de producción /public
if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

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

// 4. Ofuscación avanzada de archivos JavaScript
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

    // Ofuscación del Service Worker raíz
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

// 5. Minificación de HTML y CSS embebido/standalone
async function processHtmlFiles() {
    const cleanCss = new CleanCSS({ level: 2 });
    const files = fs.readdirSync(SRC_DIR);

    for (const file of files) {
        if (file.endsWith('.html')) {
            const srcPath = path.join(SRC_DIR, file);
            let content = fs.readFileSync(srcPath, 'utf8');

            // Minificar bloques de estilo <style> dentro de los HTML
            content = content.replace(/<style[\s\S]*?>([\s\S]*?)<\/style>/gi, (match, cssContent) => {
                const minifiedCss = cleanCss.minify(cssContent).styles;
                return `<style>${minifiedCss}</style>`;
            });

            // Minificar la estructura HTML completa y scripts JS en línea
            const minifiedHtml = await HTMLMinifier.minify(content, {
                collapseWhitespace: true,
                removeComments: true,
                minifyJS: true,
                minifyCSS: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true
            });

            fs.writeFileSync(path.join(DIST_DIR, file), minifiedHtml, 'utf8');
            console.log(`⚡ HTML y CSS embebido minificado: ${file}`);
        }
    }
}

// Ejecutor principal
async function build() {
    console.log('🚀 Iniciando Pipeline de Compilación Makumoto®...');
    copyImages();
    processJsonFiles();
    processJsFiles();
    await processHtmlFiles();
    console.log('🎉 ¡Proceso de compilación completado! Todos los assets listos en la carpeta de producción /public');
}

build().catch(err => {
    console.error('❌ Error fatal durante la compilación:', err);
    process.exit(1);
});