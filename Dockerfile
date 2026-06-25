FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

# Создаём папку для данных
RUN mkdir -p /app/data

EXPOSE 5000

CMD ["python", "app.py"]
