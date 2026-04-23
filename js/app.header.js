window.app = window.app || {};
window.app.ui = window.app.ui || {};

window.app.ui.injectHeader = function() {
    const header = document.getElementById('main-header');
    if (!header) return;

    const isPortal = window.location.pathname.includes('portal.html');
    
    if (!document.getElementById('header-styles')) {
        const style = document.createElement('style');
        style.id = 'header-styles';
        style.innerHTML = `
            #main-header { width: 100%; background: #101010; border-bottom: 1px solid #2a2a2a; }
            .header-container { max-width: 1200px; margin: 0 auto; padding: 10px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
            .header-top { width: 100%; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
            .header-bottom { display: flex; justify-content: center; align-items: center; gap: 12px; flex-wrap: wrap; }
            .login-button-header { 
                font-size: 11px !important; padding: 6px 12px !important; border: 1px solid #FFD700 !important; 
                border-radius: 4px !important; font-weight: 800 !important; text-transform: uppercase !important; 
                text-decoration: none !important; color: #FFD700 !important; background: transparent !important;
                cursor: pointer !important; transition: all 0.2s ease !important;
            }
            .btn-plus { border-color: #00ecff !important; color: #00ecff !important; }
            @media (max-width: 480px) {
                .header-top { justify-content: center; text-align: center; }
                .afiliados-tag { font-size: 7px !important; }
            }
        `;
        document.head.appendChild(style);
    }

    if (isPortal) {
        header.innerHTML = '<div class="header-container"><div class="logo" style="display:flex; align-items:center; gap:10px;"><img src="imagenes/logo.png" alt="Logo" style="height:25px;"><span style="color:#FFD700; font-weight:bold; font-size:14px;">MAKUMOTO® AFILIADOS</span></div></div>';
    } else {
        header.innerHTML = `
            <div class="header-container">
                <div class="header-top">
                    <a href="index.html" class="logo" style="text-decoration:none; display:flex; align-items:center; gap:10px;">
                        <img src="imagenes/logo.png" alt="Logo" style="height:35px;">
                        <div style="display:flex; flex-direction:column; align-items:center; line-height:1;">
                            <span style="color:#FFD700; font-weight:900; font-size:18px;">MAKUMOTO®</span>
                            <span style="font-size:9px; letter-spacing:3px; color:#fff; font-weight:700;">AFILIADOS</span>
                        </div>
                    </a>
                    <a href="index.html#seccion-precios-directa" style="background:#FFD700; color:#101010; padding:10px 20px; border-radius:5px; text-decoration:none; font-weight:900; font-size:13px;">CONTRATAR</a>
                </div>
                <div class="header-bottom">
                    <a href="directorio.html" class="login-button-header">Directorio</a>
                    <button id="btn-show-login" class="login-button-header">Login</button>
                    <a href="gana-dinero.html" class="login-button-header btn-plus">¡Gana Dinero!</a>
                </div>
            </div>`;
    }
};

// MOTOR DE EVENTOS GLOBAL (Solución definitiva para la X y Modales)
document.addEventListener('click', (e) => {
    const modal = document.getElementById('login-modal');
    if (!modal) return;

    if (e.target.id === 'btn-show-login') {
        modal.classList.add('visible');
    } else if (e.target.id === 'close-login-modal' || e.target === modal) {
        modal.classList.remove('visible');
    }
});

document.addEventListener('DOMContentLoaded', window.app.ui.injectHeader);