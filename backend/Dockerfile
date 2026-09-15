FROM python:3.12-slim-trixie

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgdal36 libgeos-c1t64 libproj25 \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.lock .
RUN pip install --no-cache-dir -r requirements.lock
COPY . .
RUN useradd --create-home --uid 10001 gda && mkdir -p /app/media /app/staticfiles \
    && chown -R gda:gda /app
USER gda
EXPOSE 8000
CMD ["sh", "-c", "python manage.py collectstatic --noinput && python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2 --access-logfile -"]
