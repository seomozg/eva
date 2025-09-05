import io
import torch
import soundfile as sf
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.responses import StreamingResponse

# ==== FastAPI-сервис ====
app = FastAPI(title="Silero TTS API")

# ==== Схема запроса ====
class TTSRequest(BaseModel):
    text: str
    speaker: str | None = None
    sample_rate: int = 48000

# ==== Определяем устройство ====
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print("Using device:", device)

# ==== Загрузка модели Silero TTS ====
# Распаковываем только модель, остальное игнорируем
model, *rest = torch.hub.load(
    repo_or_dir='snakers4/silero-models',
    model='silero_tts',
    language='ru'
)
model.to(device)

if model is None:
    raise RuntimeError("Не удалось загрузить TTS-модель")

# ==== Поддерживаемые голоса ====
speakers = [
    'baya_v2','baya_8khz','baya_16khz','irina_v2','irina_8khz','irina_16khz',
    'kseniya_v2','kseniya_8khz','kseniya_16khz','natasha_v2','natasha_8khz','natasha_16khz',
    'ruslan_v2','ruslan_8khz','ruslan_16khz','v4_ru','v3_1_ru','ru_v3',
    'aidar_v2','aidar_8khz','aidar_16khz','v3_en','v3_en_indic','lj_v2','lj_8khz','lj_16khz',
    'v3_de','thorsten_v2','thorsten_8khz','thorsten_16khz','v3_es','tux_v2','tux_8khz','tux_16khz',
    'v3_fr','gilles_v2','gilles_8khz','gilles_16khz','aigul_v2','v3_xal','erdni_v2','v3_tt',
    'dilyara_v2','v4_uz','v3_uz','dilnavoz_v2','v4_ua','v3_ua','mykyta_v2','v4_indic','v3_indic',
    'v4_cyrillic','multi_v2'
]

# ==== Маршрут озвучки ====
@app.post("/tts")
def tts(req: TTSRequest):
    speaker_name = req.speaker or 'baya_v2'
    if speaker_name not in speakers:
        raise HTTPException(status_code=400, detail=f"Speaker must be one of {speakers}")

    # Генерация аудио на нужном устройстве
    audio_tensor = model.apply_tts(
        text=req.text,
        speaker=speaker_name,
        sample_rate=req.sample_rate,
        device=device
    )

    # Преобразуем в float32 numpy
    audio_np = audio_tensor.cpu().numpy().astype('float32')

    # Сохраняем в буфер WAV
    buffer = io.BytesIO()
    sf.write(buffer, audio_np, req.sample_rate, format="WAV")
    buffer.seek(0)

    return StreamingResponse(buffer, media_type="audio/wav")
