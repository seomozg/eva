# HF Microstack: GPU API for Text, Translation (RU), TTS (RU), and Image Gen

This repo provides **small, fast models from Hugging Face** running behind simple **FastAPI** services, each in its own Docker container with GPU acceleration (CUDA 12.1 / RTX 3090). Works on **Ubuntu 20.04.6**.

## Services (default ports)
- **Text Generation** (`:8001`) — `Qwen2.5-1.5B-Instruct` (multilingual, compact)
- **Translation** (`:8002`) — `Helsinki-NLP/opus-mt-en-ru` and `Helsinki-NLP/opus-mt-ru-en`
- **TTS (RU)** (`:8003`) — `snakers4/silero-models` (`v4_ru`)
- **Image Generation** (`:8004`) — `stabilityai/sd-turbo` (very fast)

> All models are pulled from **huggingface.co** on first start and cached in a shared volume.

## Quick Start

### 0) Install NVIDIA driver, Container Toolkit, Docker, Compose
On the host **Ubuntu 20.04.6** (with RTX 3090), run:
```bash
sudo bash scripts/install_gpu_docker.sh
```

> The script uses `ubuntu-drivers autoinstall` for NVIDIA drivers and sets up Docker + NVIDIA Container Toolkit. A reboot may be required after drivers installation.

### 1) Configure (optional)
Create and edit `.env` if you have a Hugging Face token (for faster rate limits/downloads):
```bash
cp .env.example .env
# then put your token in HF_TOKEN=...
```

### 2) Start
```bash
docker compose up -d --build
```

### 3) Test
```bash
bash scripts/test_calls.sh
```

### 4) Stop
```bash
docker compose down
```

## API

### Text Generation (`:8001`)
`POST /generate`
```json
{
  "prompt": "Привет! Объясни квантовую запутанность просто.",
  "max_new_tokens": 128,
  "temperature": 0.7,
  "top_p": 0.9
}
```
Response:
```json
{ "text": "..." }
```

### Translation (`:8002`)
`POST /translate`
```json
{
  "text": "Привет, мир!",
  "source": "ru",
  "target": "en"
}
```
Allowed `source/target`: `ru`, `en`

### TTS RU (`:8003`)
`POST /tts` — returns WAV bytes
```json
{
  "text": "Здравствуйте, это проверка синтеза речи."
}
```
Optional: `speaker`, `sample_rate`, `speaker_wav` (ignored in silero v4_ru)

### Image Generation (`:8004`)
`POST /generate`
```json
{
  "prompt": "a small red fox in a forest, cinematic lighting",
  "num_inference_steps": 4,
  "guidance_scale": 0.0,
  "seed": 123,
  "width": 512,
  "height": 512
}
```
Returns PNG bytes.

## Notes on Models (small & fast choices)
- **Text**: `Qwen2.5-1.5B-Instruct` is multilingual and compact, suitable for 3090 with low latency.
- **Translation**: MarianMT models are ~300–400MB each and solid for RU↔EN.
- **TTS RU**: Silero `v4_ru` is lightweight and high-quality for Russian on GPU or CPU.
- **Images**: `stabilityai/sd-turbo` supports fast generation in ~1–4 steps.

## Security & Exposure
- These services bind to `0.0.0.0` inside containers. Expose behind a reverse proxy + TLS in production.
- Consider adding auth (API keys) via an ingress if exposing to the public internet.

## License
MIT
