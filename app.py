import os
import json
import requests
from flask import Flask, request, jsonify, render_template
from datetime import datetime
import threading
import time

app = Flask(__name__)

# Путь к файлу кеша
CACHE_FILE = '/app/data/cache.json'

# Список городов (можно расширять)
CITIES = [
    {'name': 'Москва', 'lat': 55.7558, 'lon': 37.6173},
    {'name': 'Санкт-Петербург', 'lat': 59.9343, 'lon': 30.3351},
    {'name': 'Новосибирск', 'lat': 55.0084, 'lon': 82.9357},
    {'name': 'Екатеринбург', 'lat': 56.8389, 'lon': 60.6057},
    {'name': 'Казань', 'lat': 55.7887, 'lon': 49.1221},
    {'name': 'Нижний Новгород', 'lat': 56.2965, 'lon': 43.9361},
    {'name': 'Челябинск', 'lat': 55.1644, 'lon': 61.4368},
    {'name': 'Самара', 'lat': 53.1959, 'lon': 50.1000},
    {'name': 'Омск', 'lat': 54.9885, 'lon': 73.3242},
    {'name': 'Ростов-на-Дону', 'lat': 47.2357, 'lon': 39.7015},
    {'name': 'Уфа', 'lat': 54.7348, 'lon': 55.9579},
    {'name': 'Красноярск', 'lat': 56.0106, 'lon': 92.8526},
    {'name': 'Владивосток', 'lat': 43.1316, 'lon': 131.9238},
    {'name': 'Пермь', 'lat': 58.0104, 'lon': 56.2294},
    {'name': 'Воронеж', 'lat': 51.6608, 'lon': 39.2003},
    {'name': 'Волгоград', 'lat': 48.7071, 'lon': 44.5169},
    {'name': 'Краснодар', 'lat': 45.0355, 'lon': 38.9753},
    {'name': 'Саратов', 'lat': 51.5336, 'lon': 46.0342},
    {'name': 'Тюмень', 'lat': 57.1613, 'lon': 65.5254},
    {'name': 'Тольятти', 'lat': 53.5078, 'lon': 49.4204},
    {'name': 'Ижевск', 'lat': 56.8528, 'lon': 53.2045},
    {'name': 'Барнаул', 'lat': 53.3561, 'lon': 83.7697},
    {'name': 'Ульяновск', 'lat': 54.3142, 'lon': 48.4031},
    {'name': 'Иркутск', 'lat': 52.2864, 'lon': 104.2807},
    {'name': 'Хабаровск', 'lat': 48.4802, 'lon': 135.0719},
    {'name': 'Ярославль', 'lat': 57.6261, 'lon': 39.8845},
    {'name': 'Махачкала', 'lat': 42.9849, 'lon': 47.5046},
    {'name': 'Оренбург', 'lat': 51.7675, 'lon': 55.0989},
    {'name': 'Новокузнецк', 'lat': 53.7596, 'lon': 87.1216},
    {'name': 'Рязань', 'lat': 54.6294, 'lon': 39.7358},
    {'name': 'Томск', 'lat': 56.4884, 'lon': 84.9517},
    {'name': 'Пенза', 'lat': 53.1959, 'lon': 45.0182},
    {'name': 'Липецк', 'lat': 52.6086, 'lon': 39.5994},
    {'name': 'Киров', 'lat': 58.6036, 'lon': 49.6681},
    {'name': 'Чебоксары', 'lat': 56.1398, 'lon': 47.2966},
    {'name': 'Калининград', 'lat': 54.7104, 'lon': 20.4522},
    {'name': 'Тула', 'lat': 54.1931, 'lon': 37.6175},
    {'name': 'Сочи', 'lat': 43.5855, 'lon': 39.7231},
    {'name': 'Севастополь', 'lat': 44.6166, 'lon': 33.5254},
    {'name': 'Симферополь', 'lat': 44.9521, 'lon': 34.1024}
]

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

# ---------- Функции работы с погодой ----------
def get_weather_from_api(lat, lon):
    params = {
        "latitude": lat,
        "longitude": lon,
        "current_weather": "true",
        "hourly": "temperature_2m,relative_humidity_2m,precipitation,weathercode,wind_speed_10m,wind_gusts_10m",
        "timezone": "auto",
        "forecast_days": 1
    }
    resp = requests.get(OPEN_METEO_URL, params=params)
    resp.raise_for_status()
    data = resp.json()
    current = data.get("current_weather", {})
    hourly = data.get("hourly", {})
    precip = hourly.get("precipitation", [0])[0] if hourly.get("precipitation") else 0
    gust = hourly.get("wind_gusts_10m", [0])[0] if hourly.get("wind_gusts_10m") else 0
    humidity = hourly.get("relative_humidity_2m", [0])[0] if hourly.get("relative_humidity_2m") else 0
    weathercode = current.get("weathercode", 0)
    condition_map = {
        0: "Ясно", 1: "Преимущественно ясно", 2: "Переменная облачность", 3: "Пасмурно",
        45: "Туман", 48: "Туман с изморозью",
        51: "Морось слабая", 53: "Морось умеренная", 55: "Морось сильная",
        61: "Дождь слабый", 63: "Дождь умеренный", 65: "Дождь сильный",
        80: "Ливень слабый", 81: "Ливень умеренный", 82: "Ливень сильный",
        95: "Гроза слабая/умеренная", 96: "Гроза с градом слабая/умеренная", 99: "Гроза с градом сильная"
    }
    condition_text = condition_map.get(weathercode, "Неизвестно")
    is_thunderstorm = weathercode in (95, 96, 99)
    return {
        "temp": current.get("temperature"),
        "wind_speed": current.get("windspeed"),
        "gust": gust,
        "precipitation": precip,
        "humidity": humidity,
        "condition": condition_text,
        "is_thunderstorm": is_thunderstorm
    }

def calculate_risk(weather):
    risk = 0
    wind_speed = weather.get("wind_speed", 0)
    gust = weather.get("gust", 0)
    precip = weather.get("precipitation", 0)
    is_thunder = weather.get("is_thunderstorm", False)
    if gust > 15:
        risk += 30
    elif wind_speed > 10:
        risk += 20
    if is_thunder:
        risk += 30
    if precip > 30:
        risk += 20
    if (gust > 15 or wind_speed > 10) and is_thunder:
        risk += 20
    return min(risk, 100)

def update_cache():
    """Обновляет кеш для всех городов"""
    cache = {}
    for city in CITIES:
        try:
            weather = get_weather_from_api(city['lat'], city['lon'])
            risk = calculate_risk(weather)
            cache[city['name']] = {
                'lat': city['lat'],
                'lon': city['lon'],
                'weather': weather,
                'risk': risk,
                'updated_at': datetime.utcnow().isoformat()
            }
        except Exception as e:
            print(f"Ошибка для {city['name']}: {e}")
            if os.path.exists(CACHE_FILE):
                with open(CACHE_FILE, 'r') as f:
                    old = json.load(f)
                if city['name'] in old:
                    cache[city['name']] = old[city['name']]
    os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
    with open(CACHE_FILE, 'w') as f:
        json.dump(cache, f, indent=2, ensure_ascii=False)
    print(f"[{datetime.utcnow().isoformat()}] Кеш обновлён")

# ---------- Маршруты Flask ----------
@app.route('/')
def index():
    """Главная страница"""
    return render_template('index.html')

@app.route('/weather')
def weather():
    """Возвращает погоду для города по координатам"""
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    if not lat or not lon:
        return jsonify({'error': 'Missing lat/lon'}), 400
    if not os.path.exists(CACHE_FILE):
        return jsonify({'error': 'Кеш ещё не готов, попробуйте позже'}), 503
    with open(CACHE_FILE, 'r') as f:
        cache = json.load(f)
    # Ищем ближайший город по координатам (приблизительно)
    lat = float(lat)
    lon = float(lon)
    best = None
    best_dist = float('inf')
    for name, data in cache.items():
        dlat = data['lat'] - lat
        dlon = data['lon'] - lon
        dist = dlat*dlat + dlon*dlon
        if dist < best_dist:
            best_dist = dist
            best = name
    if best and best_dist < 0.5:  # ~50 км
        return jsonify(cache[best])
    else:
        return jsonify({'error': 'Ближайший город не найден'}), 404

@app.route('/update', methods=['POST'])
def update_route():
    """Эндпоинт для обновления кеша (вызывается cron-job.org)"""
    update_cache()
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    # При старте сразу обновляем кеш
    update_cache()
    app.run(debug=False, host='0.0.0.0', port=5000)
