window.app = window.app || {};
window.app.ui = window.app.ui || {};

window.app.ui.injectHeader = function() {
    const header = document.getElementById('main-header');
    if (!header) return;

    const isPortal = window.location.pathname.includes('portal.html');
    
    // INYECCIÓN DE ESTILOS DE CONTROL ABSOLUTO
    const style = document.createElement('style');
    style.innerHTML = `
        .header-bottom { 
            display: flex !important; 
            justify-content: center !important; 
            align-items: center !important;
            gap: 15px !important; 
            margin-top: 10px !important; 
        }
        .login-button-header { 
            font-size: 11px !important; 
            padding: 6px 12px !important; 
            border: 1px solid var(--color-primary) !important; 
            border-radius: 4px !important; 
            font-weight: 800 !important; 
            text-transform: uppercase !important; 
            white-space: nowrap !important; 
            text-decoration: none !important; 
            color: var(--color-primary) !important; 
            background: transparent !important;
            display: inline-block !important; 
            cursor: pointer !important;
            line-height: 1 !important;
            transition: all 0.2s ease !important;
        }
        .login-button-header:hover {
            background-color: var(--color-primary) !important;
            color: var(--color-dark) !important;
        }
        .btn-plus { 
            border-color: #00ecff !important; 
            color: #00ecff !important; 
        }
        .btn-plus:hover {
            background-color: #00ecff !important;
            color: var(--color-dark) !important;
        }
    `;
    document.head.appendChild(style);

    if (isPortal) {
        header.innerHTML = `
            <div class="container header-container">
                <div class="logo">
                    <img src="imagenes/logo.png" alt="Makumoto Logo">
                    <span id="portal-sector-name" style="animation: vibrant-glow 2s ease-in-out infinite;">MAKUMOTO® AFILIADOS</span>
                </div>
            </div>`;
    } else {
        header.innerHTML = `
            <div class="header-container">
                <div class="header-top">
                    <a href="index.html" class="logo">
                        <img src="imagenes/logo.png" alt="Makumoto Logo">
                        <div class="logo-text-group">
                            <span class="shine-effect" style="color: var(--color-primary); font-weight: bold;">MAKUMOTO®</span>
                            <span class="afiliados-tag">AFILIADOS</span>
                        </div>
                    </a>
                    <a href="index.html#seccion-precios-directa" class="cta-button-header">CONTRATAR</a>
                </div>
                <div class="header-bottom">
                    <a href="directorio.html" class="login-button-header">Directorio</a>
                    <button id="btn-show-login" class="login-button-header">Login</button>
                    <a href="#" class="login-button-header btn-plus">Afiliados Plus</a>
                </div>
            </div>`;
            
        // VINCULACIÓN DE EVENTOS PARA EL MODAL (LOGIN Y CIERRE)
        const btnLogin = document.getElementById('btn-show-login');
        const btnClose = document.getElementById('close-login-modal');
        const modal = document.getElementById('login-modal');

        if (btnLogin && modal) {
            btnLogin.onclick = () => modal.classList.add('visible');
        }
        if (btnClose && modal) {
            btnClose.onclick = () => modal.classList.remove('visible');
        }
        if (modal) {
            modal.onclick = (e) => { 
                if (e.target === modal) modal.classList.remove('visible'); 
            };
        }
    }
};

// Punto de entrada único
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.app.ui.injectHeader);
} else {
    window.app.ui.injectHeader();
}