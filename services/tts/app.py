import io, torch, numpy as np, soundfile as sf
from fastapi import FastAPI, Response
from pydantic import BaseModel

app = FastAPI(title="TTS RU Service")

# Load Silero TTS (Russian)
device = "cuda" if torch.cuda.is_available() else "cpu"
model, example_text = torch.hub.load(repo_or_dir='snakers4/silero-models',
                                     model='silero_tts',
                                     language='ru',
                                     speaker='v4_ru')
model = model.to(device)

class TTSRequest(BaseModel):
    text: str
    sample_rate: int = 48000
    speaker: str | None = None

@app.post("/tts")
def tts(req: TTSRequest):
    audio = model.apply_tts(text=req.text, speaker=req.speaker or 'baya', sample_rate=req.sample_rate)
    audio = np.array(audio)
    buf = io.BytesIO()
    sf.write(buf, audio, req.sample_rate, format='WAV')
    return Response(content=buf.getvalue(), media_type="audio/wav")
