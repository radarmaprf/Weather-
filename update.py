from app import update_cache
import time

if __name__ == '__main__':
    start = time.time()
    update_cache()
    print(f"✅ Кеш обновлён за {time.time() - start:.2f} сек.")
