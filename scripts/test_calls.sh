#!/usr/bin/env bash
set -euo pipefail

echo "==> Text generation"
curl -s http://localhost:8001/generate -H "Content-Type: application/json" -d '{
  "prompt": "Напиши короткое приветствие на русском.",
  "max_new_tokens": 48
}' | jq

echo "==> Translation RU->EN"
curl -s http://localhost:8002/translate -H "Content-Type: application/json" -d '{
  "text": "Привет, мир!",
  "source": "ru",
  "target": "en"
}' | jq

echo "==> TTS RU (WAV saved to out.wav)"
curl -s http://localhost:8003/tts -H "Content-Type: application/json" -d '{
  "text": "Это проверка синтеза речи на русском языке."
}' --output out.wav
file out.wav || true

echo "==> Image gen (PNG saved to out.png)"
curl -s http://localhost:8004/generate -H "Content-Type: application/json" -d '{
  "prompt": "a small red fox in a forest, cinematic lighting",
  "num_inference_steps": 4,
  "guidance_scale": 0.0,
  "width": 512,
  "height": 512
}' --output out.png
file out.png || true

echo "All requests finished."
