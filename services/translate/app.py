import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import MarianTokenizer, MarianMTModel

app = FastAPI(title="Translate Service")

MODELS = {
    ("en", "ru"): "Helsinki-NLP/opus-mt-en-ru",
    ("ru", "en"): "Helsinki-NLP/opus-mt-ru-en",
}

cache = {}

def get_model_pair(src, tgt):
    key = (src, tgt)
    if key not in MODELS:
        raise HTTPException(status_code=400, detail=f"Unsupported direction: {src}->{tgt}. Use ru<->en.")
    if key not in cache:
        model_name = MODELS[key]
        tok = MarianTokenizer.from_pretrained(model_name)
        mdl = MarianMTModel.from_pretrained(model_name).to("cuda" if torch.cuda.is_available() else "cpu")
        cache[key] = (tok, mdl)
    return cache[key]

class TransRequest(BaseModel):
    text: str
    source: str
    target: str

@app.post("/translate")
def translate(req: TransRequest):
    src = req.source.lower()
    tgt = req.target.lower()
    tok, mdl = get_model_pair(src, tgt)
    batch = tok([req.text], return_tensors="pt", padding=True).to(mdl.device)
    gen = mdl.generate(**batch, max_length=512)
    out = tok.batch_decode(gen, skip_special_tokens=True)[0]
    return {"translation": out}
