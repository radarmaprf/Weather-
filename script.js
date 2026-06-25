// -------- Полный список городов --------
const cities = [
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

// -------- Инициализация карты --------
const map = L.map('map').setView([64, 90], 4);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
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

// -------- Тепловая карта --------
let heatLayer = null;

async function updateHeatMap() {
    try {
        const resp = await fetch('cache.json?t=' + Date.now());
        const cache = await resp.json();
        const points = Object.values(cache).map(city => [city.lat, city.lon, city.risk / 100]);
        if (heatLayer) map.removeLayer(heatLayer);
        heatLayer = L.heatLayer(points, {
            radius: 30,
            blur: 15,
            maxZoom: 10,
            gradient: {0.4: 'blue', 0.6: 'yellow', 0.8: 'orange', 1.0: 'red'}
        });
        heatLayer.addTo(map);
    } catch (e) {
        console.warn('Тепловая карта не загружена', e);
    }
}

// -------- Панель --------
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
const weatherIcon = document.getElementById('weather-icon');
const favoriteBtn = document.getElementById('favorite-btn');
const favoritesToggle = document.getElementById('favorites-toggle');

closeBtn.addEventListener('click', () => panel.classList.remove('visible'));

// -------- Избранное --------
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function toggleFavorite(cityName) {
    const idx = favorites.indexOf(cityName);
    if (idx === -1) favorites.push(cityName);
    else favorites.splice(idx, 1);
    saveFavorites();
    updateFavoriteButton(cityName);
}

function updateFavoriteButton(cityName) {
    if (favorites.includes(cityName)) {
        favoriteBtn.classList.add('active');
        favoriteBtn.innerHTML = '<i class="fas fa-star"></i>';
    } else {
        favoriteBtn.classList.remove('active');
        favoriteBtn.innerHTML = '<i class="fas fa-star"></i>';
    }
}

favoriteBtn.addEventListener('click', () => {
    const currentCity = cityName.textContent;
    if (currentCity && currentCity !== 'Город') {
        toggleFavorite(currentCity);
    }
});

favoritesToggle.addEventListener('click', () => {
    const list = favorites.join(', ') || 'Нет избранных';
    alert('Избранные города: ' + list);
});

// -------- Поиск --------
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

// -------- Основная функция --------
async function fetchWeather(lat, lon, name) {
    try {
        const resp = await fetch('cache.json?t=' + Date.now());
        if (!resp.ok) throw new Error('Кеш не найден');
        const cache = await resp.json();

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
            alert('Город не найден в кеше');
            return;
        }

        cityName.textContent = name || best.name;
        const w = best.weather;
        temp.textContent = w.temp !== undefined ? w.temp + '°C' : '--';
        wind.textContent = w.wind_speed !== undefined ? w.wind_speed + ' м/с' : '--';
        gust.textContent = w.gust !== undefined ? w.gust + ' м/с' : '--';
        precip.textContent = w.precipitation !== undefined ? w.precipitation + ' мм' : '--';
        condition.textContent = w.condition || '--';
        weatherIcon.textContent = getWeatherEmoji(w.condition);

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
        updateFavoriteButton(cityName.textContent);

        await loadHourlyForecast(lat, lon);

    } catch (err) {
        alert('Не удалось загрузить данные: ' + err.message);
    }
}

// -------- Эмодзи --------
function getWeatherEmoji(condition) {
    const map = {
        'Ясно': '☀️',
        'Преимущественно ясно': '🌤️',
        'Переменная облачность': '⛅',
        'Пасмурно': '☁️',
        'Туман': '🌫️',
        'Туман с изморозью': '🌫️',
        'Морось слабая': '🌦️',
        'Морось умеренная': '🌧️',
        'Морось сильная': '🌧️',
        'Дождь слабый': '🌧️',
        'Дождь умеренный': '🌧️',
        'Дождь сильный': '🌧️',
        'Ливень слабый': '🌧️',
        'Ливень умеренный': '🌧️',
        'Ливень сильный': '🌧️',
        'Гроза слабая/умеренная': '⛈️',
        'Гроза с градом слабая/умеренная': '⛈️',
        'Гроза с градом сильная': '⛈️'
    };
    return map[condition] || '🌥️';
}

// -------- Почасовой прогноз с ветром (ВСЕ 24 ЧАСА) --------
async function loadHourlyForecast(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode,wind_speed_10m,wind_direction_10m&timezone=auto&forecast_days=1`;
    try {
        const resp = await fetch(url);
        const data = await resp.json();
        const hourly = data.hourly;
        const times = hourly.time; // все 24 часа
        const temps = hourly.temperature_2m;
        const codes = hourly.weathercode;
        const windSpeeds = hourly.wind_speed_10m;
        const windDirs = hourly.wind_direction_10m;

        const container = document.getElementById('hourly-scroll');
        container.innerHTML = '';
        times.forEach((t, i) => {
            const time = t.slice(11, 16);
            const temp = temps[i];
            const emoji = getWeatherEmojiByCode(codes[i]);
            const speed = windSpeeds[i];
            const dir = windDirs[i];
            const arrow = getWindArrow(dir);
            const div = document.createElement('div');
            div.className = 'hourly-item';
            div.innerHTML = `
                <div class="hourly-time">${time}</div>
                <div class="hourly-icon">${emoji}</div>
                <div class="hourly-temp">${temp}°</div>
                <div class="hourly-wind">
                    <span class="wind-arrow" style="transform: rotate(${dir}deg);">↑</span>
                    <span>${speed} м/с</span>
                </div>
            `;
            container.appendChild(div);
        });
        document.getElementById('hourly-forecast').style.display = 'block';
    } catch (e) {
        console.warn('Почасовой прогноз не загружен', e);
    }
}

function getWeatherEmojiByCode(code) {
    const map = {
        0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
        45: '🌫️', 48: '🌫️',
        51: '🌦️', 53: '🌧️', 55: '🌧️',
        61: '🌧️', 63: '🌧️', 65: '🌧️',
        80: '🌧️', 81: '🌧️', 82: '🌧️',
        95: '⛈️', 96: '⛈️', 99: '⛈️'
    };
    return map[code] || '🌥️';
}

function getWindArrow(deg) {
    if (deg === undefined || deg === null) return '?';
    // возвращаем стрелку, повёрнутую на угол deg (0 = север)
    return '↑';
}

// -------- Автообновление --------
let autoUpdateInterval = null;

function startAutoUpdate() {
    if (autoUpdateInterval) clearInterval(autoUpdateInterval);
    autoUpdateInterval = setInterval(() => {
        updateHeatMap();
        const currentCity = cityName.textContent;
        if (currentCity && currentCity !== 'Город' && currentCity !== 'Выберите город на карте') {
            if (window._lastLat && window._lastLon) {
                fetchWeather(window._lastLat, window._lastLon, currentCity);
            }
        }
    }, 300000);
}

// -------- Загрузка --------
window.onload = async () => {
    await updateHeatMap();
    startAutoUpdate();
    const defaultCity = cities.find(c => c.name === 'Москва');
    if (defaultCity) {
        window._lastLat = defaultCity.lat;
        window._lastLon = defaultCity.lon;
        fetchWeather(defaultCity.lat, defaultCity.lon, 'Москва');
    }
};

// Сохраняем координаты для автообновления
const originalFetch = fetchWeather;
fetchWeather = async function(lat, lon, name) {
    window._lastLat = lat;
    window._lastLon = lon;
    await originalFetch(lat, lon, name);
};
