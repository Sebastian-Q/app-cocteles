// ===========================
// Notificación para la app
// ===========================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ff6b6b' : type === 'warning' ? '#ffd93d' : '#51cf66'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
        max-width: 300px;
        font-size: 15px;
        transition: opacity 0.3s ease;
        opacity: 1;
    `;

    document.body.appendChild(notification);

    // Desaparece suavemente
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// ===========================
// Lógica del buscador
// ===========================
document.getElementById('searchButton').addEventListener('click', fetchCocktail);

function fetchCocktail() {
    const inputElement = document.getElementById('cocktailName');
    const cocktailName = inputElement.value.trim();
    const resultDiv = document.getElementById('result');

    if (!cocktailName) {
        showNotification("¡No olvides escribir el nombre de un cóctel!", "warning");
        return;
    }

    const url = `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${cocktailName}`;
    resultDiv.innerHTML = '<h2>Cargando...</h2>';

    fetch(url)
        .then(async (response) => {
            if (!response.ok) throw new Error('Respuesta del servidor no válida');

            const cacheStatus = response.headers.get('X-Cache-Status');
            const data = await response.json();

            // Mostrar notificaciones según el origen
            if (cacheStatus === 'HIT') {
                showNotification('⚠️ Sin conexión: Mostrando datos guardados en caché.', 'warning');
            } else if (cacheStatus === 'MISS') {
                showNotification('🚫 Sin conexión y sin datos guardados. No se pudo obtener resultados.', 'error');
            } else {
                showNotification('✅ Resultados actualizados desde la red.', 'info');
            }

            const cocktail = data.drinks ? data.drinks[0] : null;
            if (!cocktail) {
                resultDiv.innerHTML = `<p>No se encontró el cóctel: <strong>${cocktailName}</strong></p>`;
                return;
            }

            const isFallback = cocktail.idDrink === "00000";
            resultDiv.innerHTML = `
                ${isFallback ? '<div class="offline-badge">🔌 MODO OFFLINE - Datos en Cache</div>' : ''}
                <div class="cocktail-card">
                    <h2>${cocktail.strDrink}</h2>
                    <img src="${cocktail.strDrinkThumb}" alt="${cocktail.strDrink}" width="200" height="300">
                    <p><strong>Categoría:</strong> ${cocktail.strCategory}</p>
                    <p><strong>Instrucciones:</strong> ${cocktail.strInstructions}</p>
                    <p><strong>Ingrediente 1:</strong> ${cocktail.strIngredient1 || 'N/A'}</p>
                    <p><strong>Ingrediente 2:</strong> ${cocktail.strIngredient2 || 'N/A'}</p>
                </div>
            `;
        })
        .catch(error => {
            console.error('Error al obtener datos:', error);
            showNotification('❌ Error al procesar la respuesta: ' + error.message, 'error');
            resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        });
}
