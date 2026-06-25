// -------- Полный список городов России --------
const cities = [
    // Города-миллионники
    { name: 'Москва', lat: 55.7558, lon: 37.6173 },
    { name: 'Санкт-Петербург', lat: 59.9343, lon: 30.3351 },
    { name: 'Новосибирск', lat: 55.0084, lon: 82.9357 },
    { name: 'Екатеринбург', lat: 56.8389, lon: 60.6057 },
    { name: 'Казань', lat: 55.7887, lon: 49.1221 },
    { name: 'Нижний Новгород', lat: 56.2965, lon: 43.9361 },
    { name: 'Челябинск', lat: 55.1644, lon: 61.4368 },
    { name: 'Самара', lat: 53.1959, lon: 50.1000 },
    { name: 'Омск', lat: 54.9885, lon: 73.3242 },
    { name: 'Ростов-на-Дону', lat: 47.2357, lon: 39.7015 },
    { name: 'Уфа', lat: 54.7348, lon: 55.9579 },
    { name: 'Красноярск', lat: 56.0106, lon: 92.8526 },
    { name: 'Владивосток', lat: 43.1316, lon: 131.9238 },
    { name: 'Пермь', lat: 58.0104, lon: 56.2294 },
    { name: 'Воронеж', lat: 51.6608, lon: 39.2003 },
    { name: 'Волгоград', lat: 48.7071, lon: 44.5169 },
    { name: 'Краснодар', lat: 45.0355, lon: 38.9753 },
    { name: 'Саратов', lat: 51.5336, lon: 46.0342 },
    { name: 'Тюмень', lat: 57.1613, lon: 65.5254 },
    { name: 'Тольятти', lat: 53.5078, lon: 49.4204 },
    { name: 'Ижевск', lat: 56.8528, lon: 53.2045 },
    { name: 'Барнаул', lat: 53.3561, lon: 83.7697 },
    { name: 'Ульяновск', lat: 54.3142, lon: 48.4031 },
    { name: 'Иркутск', lat: 52.2864, lon: 104.2807 },
    { name: 'Хабаровск', lat: 48.4802, lon: 135.0719 },
    { name: 'Ярославль', lat: 57.6261, lon: 39.8845 },
    { name: 'Махачкала', lat: 42.9849, lon: 47.5046 },
    { name: 'Оренбург', lat: 51.7675, lon: 55.0989 },
    { name: 'Новокузнецк', lat: 53.7596, lon: 87.1216 },
    { name: 'Рязань', lat: 54.6294, lon: 39.7358 },
    { name: 'Томск', lat: 56.4884, lon: 84.9517 },
    { name: 'Пенза', lat: 53.1959, lon: 45.0182 },
    { name: 'Липецк', lat: 52.6086, lon: 39.5994 },
    { name: 'Киров', lat: 58.6036, lon: 49.6681 },
    { name: 'Чебоксары', lat: 56.1398, lon: 47.2966 },
    { name: 'Калининград', lat: 54.7104, lon: 20.4522 },
    { name: 'Тула', lat: 54.1931, lon: 37.6175 },
    { name: 'Сочи', lat: 43.5855, lon: 39.7231 },
    { name: 'Севастополь', lat: 44.6166, lon: 33.5254 },
    { name: 'Симферополь', lat: 44.9521, lon: 34.1024 }
];

// -------- Остальной код (без изменений) --------
// ... (весь остальной код остаётся таким же, как в вашем рабочем скрипте)

// -------- Инициализация карты --------
const map = L.map('map').setView([64, 90], 4);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; CartoDB',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

// -------- Маркеры --------
let markers = {};
cities.forEach(city => {
    const marker = L.marker([city.lat, city.lon], { title: city.name }).addTo(map);
    marker.on('click', () => fetchWeather(city.lat, city.lon, city.name));
    markers[city.name] = marker;
});

// -------- Клик по карте --------
map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    fetchWeather(lat, lng, `Точка ${lat.toFixed(2)}, ${lng.toFixed(2)}`);
});

// -------- Панель информации --------
const panel = document.getElementById('info-panel');
const closeBtn = document.getElementById('close-panel');
const cityName = document.getElementById('city-name');
const temp = document.getElementById('temp');
const wind = document.getElementById('wind');
const gust = document.getElementById('gust');
const precip = document.getElementById('precip');
const condition = document.getElementById('condition');
const riskFill = document.getElementById('risk-fill');
const riskPercent = document.getElementById('risk-percent');
const riskLabel = document.getElementById('risk-label');
const selectedCitySpan = document.getElementById('selected-city');

closeBtn.addEventListener('click', () => panel.classList.remove('visible'));

// -------- Запрос погоды (абсолютный путь) --------
async function fetchWeather(lat, lon, name) {
    try {
        // Абсолютный путь от корня домена
        const url = '/Weather-/cache.json';
        console.log('Загружаю:', window.location.origin + url);

        const resp = await fetch(url, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        });
        if (!resp.ok) {
            throw new Error(`HTTP ${resp.status} – ${resp.statusText}`);
        }
        const cache = await resp.json();

        // Ищем ближайший город
        let best = null;
        let bestDist = Infinity;
        for (const [cityName, data] of Object.entries(cache)) {
            const dlat = data.lat - lat;
            const dlon = data.lon - lon;
            const dist = dlat*dlat + dlon*dlon;
            if (dist < bestDist) {
                bestDist = dist;
                best = { name: cityName, ...data };
            }
        }

        if (!best || bestDist > 0.5) {
            alert('Город не найден в кеше (попробуйте выбрать другой)');
            return;
        }

        // Заполняем панель
        cityName.textContent = name || best.name;
        temp.textContent = best.weather.temp !== undefined ? best.weather.temp + '°C' : '--';
        wind.textContent = best.weather.wind_speed !== undefined ? best.weather.wind_speed + ' м/с' : '--';
        gust.textContent = best.weather.gust !== undefined ? best.weather.gust + ' м/с' : '--';
        precip.textContent = best.weather.precipitation !== undefined ? best.weather.precipitation + ' мм' : '--';
        condition.textContent = best.weather.condition || '--';

        const risk = best.risk || 0;
        riskFill.style.width = risk + '%';
        riskPercent.textContent = risk + '%';

        if (risk >= 70) {
            riskLabel.textContent = '🔴 ВЫСОКИЙ РИСК (торнадо/шторм)';
            riskLabel.style.color = '#ff5252';
        } else if (risk >= 40) {
            riskLabel.textContent = '🟡 СРЕДНИЙ РИСК (гроза, ливень)';
            riskLabel.style.color = '#ffd740';
        } else if (risk >= 20) {
            riskLabel.textContent = '🟢 НИЗКИЙ РИСК (дождь, ветер)';
            riskLabel.style.color = '#69f0ae';
        } else {
            riskLabel.textContent = '✅ БЕЗОПАСНО';
            riskLabel.style.color = '#4caf50';
        }

        selectedCitySpan.textContent = `📍 ${cityName.textContent}`;
        panel.classList.add('visible');
    } catch (err) {
        alert('Не удалось загрузить данные: ' + err.message);
    }
}

// -------- Поиск через Nominatim --------
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

async function searchCity(query) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1&countrycodes=ru`;
    try {
        const resp = await fetch(url);
        const data = await resp.json();
        if (data.length === 0) {
            alert('Город не найден');
            return null;
        }
        const place = data[0];
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);
        const name = place.address?.city || place.address?.town || place.address?.village || place.display_name.split(',')[0];
        return { lat, lon, name };
    } catch (e) {
        alert('Ошибка геокодирования: ' + e.message);
        return null;
    }
}

searchBtn.addEventListener('click', async () => {
    const query = searchInput.value.trim();
    if (!query) return;
    const result = await searchCity(query);
    if (result) {
        map.setView([result.lat, result.lon], 10);
        fetchWeather(result.lat, result.lon, result.name);
    }
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchBtn.click();
});

// -------- По умолчанию Москва --------
window.onload = () => {
    fetchWeather(55.7558, 37.6173, 'Москва');
};
