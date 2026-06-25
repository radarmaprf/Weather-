import sys
import time
import os
from app import update_cache

if __name__ == '__main__':
    print("Начинаю обновление кеша...")
    try:
        start = time.time()
        update_cache()
        elapsed = time.time() - start
        print(f"✅ Кеш обновлён за {elapsed:.2f} сек.")
        
        # Проверяем, что файл создан
        if not os.path.exists('cache.json'):
            print("❌ Файл cache.json не создан!")
            sys.exit(1)
        else:
            print("✅ Файл cache.json существует.")
    except Exception as e:
        print(f"❌ Критическая ошибка: {e}")
        sys.exit(1)
