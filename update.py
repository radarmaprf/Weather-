def update_cache():
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
            print(f"✅ {city['name']} обновлён")
        except Exception as e:
            print(f"⚠️ Ошибка для {city['name']}: {e}")
            # Пробуем загрузить старый кеш для этого города
            if os.path.exists(CACHE_FILE):
                with open(CACHE_FILE, 'r') as f:
                    old = json.load(f)
                if city['name'] in old:
                    cache[city['name']] = old[city['name']]
                    print(f"   Использую старый кеш для {city['name']}")
    with open(CACHE_FILE, 'w') as f:
        json.dump(cache, f, indent=2, ensure_ascii=False)
    print(f"[{datetime.utcnow().isoformat()}] Кеш обновлён (с возможными пропусками)")
