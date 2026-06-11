FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if required (e.g. for pypdf or other libraries)
# RUN apt-get update && apt-get install -y --no-install-recommends ...

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:sio_app", "--host", "0.0.0.0", "--port", "8000"]
