import io, os, torch, numpy as np
from fastapi import FastAPI, Response
from pydantic import BaseModel
from diffusers import AutoPipelineForText2Image
from PIL import Image
from huggingface_hub import login

MODEL_ID = os.environ.get("IMG_MODEL_ID", "stabilityai/sd-turbo")
dtype = torch.float16

device = "cuda" if torch.cuda.is_available() else "cpu"

hf_token = os.getenv("HF_TOKEN")
if hf_token:
    login(token=hf_token)

pipe = AutoPipelineForText2Image.from_pretrained(
    "stabilityai/sd-turbo",
    token=hf_token,
    torch_dtype=dtype if device == "cuda" else torch.float32
)

if device == "cuda":
    pipe = pipe.to("cuda")

app = FastAPI(title="ImageGen Service")

class ImgRequest(BaseModel):
    prompt: str
    num_inference_steps: int = 4
    guidance_scale: float = 0.0
    seed: int | None = None
    width: int = 512
    height: int = 512

@app.post("/generate")
def generate(req: ImgRequest):
    generator = torch.Generator(device=device).manual_seed(req.seed) if req.seed is not None else None
    image = pipe(
        req.prompt,
        num_inference_steps=req.num_inference_steps,
        guidance_scale=req.guidance_scale,
        width=req.width,
        height=req.height,
        generator=generator
    ).images[0]
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")
