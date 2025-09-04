import os, torch
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM, TextStreamer

MODEL_ID = os.environ.get("MODEL_ID", "Qwen/Qwen2.5-1.5B-Instruct")
USE_FP16 = os.environ.get("USE_FP16", "1") == "1"

app = FastAPI(title="TextGen Service")

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, use_fast=True, token=os.getenv("HF_TOKEN"))
dtype = torch.float16 if USE_FP16 else torch.float32
device = "cuda" if torch.cuda.is_available() else "cpu"

model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    torch_dtype=dtype,
    device_map="auto" if device == "cuda" else None,
    token=os.getenv("HF_TOKEN")
)

class GenRequest(BaseModel):
    prompt: str
    max_new_tokens: int = 128
    temperature: float = 0.7
    top_p: float = 0.9
    do_sample: bool = True

@app.post("/generate")
def generate(req: GenRequest):
    inputs = tokenizer(req.prompt, return_tensors="pt").to(model.device)
    gen = model.generate(
        **inputs,
        max_new_tokens=req.max_new_tokens,
        do_sample=req.do_sample,
        temperature=req.temperature,
        top_p=req.top_p,
        pad_token_id=tokenizer.eos_token_id
    )
    text = tokenizer.decode(gen[0], skip_special_tokens=True)
    # Return only the continuation if the prompt is included at the start
    if text.startswith(req.prompt):
        text = text[len(req.prompt):].lstrip()
    return {"text": text}
