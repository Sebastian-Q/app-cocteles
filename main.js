if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('✅ Registro SW exitoso: ', reg))
        .catch(err => console.error('❌ Error de registro SW: ', err));
    });
}

// Detectar si la app está en modo standalone (instalada)
window.addEventListener('DOMContentLoaded', () => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('📱 Ejecutándose en modo standalone (instalada)');
        document.body.classList.add('standalone-mode');
    }

    // Detectar iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
        document.body.classList.add('ios-device');
    }
});