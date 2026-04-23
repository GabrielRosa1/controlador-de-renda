# Usa imagem Python leve
FROM python:3.11-slim

# Define diretório de trabalho
WORKDIR /app

# Copia dependências
COPY requirements.txt .

# Instala dependências
RUN pip install --no-cache-dir -r requirements.txt

# Copia o resto do código
COPY . .

# Expõe a porta
EXPOSE 8000

# Comando de start (ajustado pro seu path)
CMD ["sh", "-c", "uvicorn app.api.main:app --host 0.0.0.0 --port $PORT"]