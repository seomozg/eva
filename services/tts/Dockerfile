FROM nvidia/cuda:12.1.1-cudnn8-runtime-ubuntu22.04

WORKDIR /app

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    ffmpeg \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Обновляем pip
RUN pip install --upgrade pip

# Устанавливаем Python-библиотеки
RUN pip install --no-cache-dir fastapi uvicorn[standard] soundfile numpy

# Устанавливаем PyTorch с CUDA 12.1
RUN pip install --no-cache-dir torch==2.3.1+cu121 torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Устанавливаем Silero TTS
RUN pip install --no-cache-dir git+https://github.com/snakers4/silero-models

# Копируем код приложения
COPY . .

EXPOSE 8003
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8003"]
