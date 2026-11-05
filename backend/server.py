import hashlib
import logging
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException, Response
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict
from typing_extensions import Annotated
from starlette.middleware.cors import CORSMiddleware

import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]


def objectId_to_str(v):
    return str(v)


PyObjectId = Annotated[str, BeforeValidator(objectId_to_str)]


class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    def to_mongo(self) -> dict:
        doc = self.model_dump(by_alias=True, exclude_none=True)
        if 'id' in doc:
            doc['_id'] = doc.pop('id')
        return doc

    @classmethod
    def from_mongo(cls, doc: dict):
        if not doc:
            return None
        doc = dict(doc)
        if '_id' in doc:
            doc['id'] = str(doc['_id'])
            doc.pop('_id', None)
        return cls(**doc)


class ContactMessage(BaseDocument):
    id: Optional[PyObjectId] = Field(default=None, alias='_id')
    name: str
    email: str
    subject: str
    message: str
    source: str = 'preview'
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class ContactIn(BaseModel):
    name: str
    email: str
    subject: str
    message: str


class NarrateIn(BaseModel):
    text: str
    voice: str = 'fable'


app = FastAPI()
api_router = APIRouter(prefix='/api')


@api_router.get('/health')
async def health():
    return {'status': 'ok', 'service': 'the-world-inside'}


@api_router.get('/voice-status')
async def voice_status():
    return {'available': bool(os.environ.get('EMERGENT_LLM_KEY'))}


@api_router.post('/contact')
async def submit_contact(payload: ContactIn):
    name = payload.name.strip()
    email = payload.email.strip()
    subject = payload.subject.strip()
    message = payload.message.strip()
    if not (1 <= len(name) <= 120):
        raise HTTPException(status_code=400, detail='Please share your name.')
    if not re.fullmatch(r'[^@\s]+@[^@\s]+\.[^@\s]+', email):
        raise HTTPException(status_code=400, detail='That email looks incomplete.')
    if not (1 <= len(subject) <= 200):
        raise HTTPException(status_code=400, detail='Please add a short subject.')
    if not (1 <= len(message) <= 5000):
        raise HTTPException(status_code=400, detail='Your message is empty or too long.')
    doc = ContactMessage(
        name=name, email=email, subject=subject, message=message, source='preview'
    )
    result = await db['contact_messages'].insert_one(doc.to_mongo())
    logging.getLogger(__name__).info('contact message stored: %s', result.inserted_id)
    return {'ok': True, 'id': str(result.inserted_id)}


CACHE_DIR = ROOT_DIR / 'narration_cache'
CACHE_DIR.mkdir(exist_ok=True)
_tts = None


def get_tts():
    global _tts
    if _tts is None:
        from emergentintegrations.llm.openai import OpenAITextToSpeech

        _tts = OpenAITextToSpeech(api_key=os.environ['EMERGENT_LLM_KEY'])
    return _tts


@api_router.post('/narrate')
async def narrate(payload: NarrateIn):
    key = os.environ.get('EMERGENT_LLM_KEY')
    if not key:
        raise HTTPException(status_code=503, detail='voice-unavailable')
    text = payload.text.strip()[:1200]
    if not text:
        raise HTTPException(status_code=400, detail='empty-text')
    digest = hashlib.sha1(f'{payload.voice}|{text}'.encode()).hexdigest()
    cache_file = CACHE_DIR / f'{digest}.mp3'
    if cache_file.exists() and cache_file.stat().st_size > 0:
        return Response(
            content=cache_file.read_bytes(),
            media_type='audio/mpeg',
            headers={'Cache-Control': 'public, max-age=31536000'},
        )
    try:
        audio_bytes = await get_tts().generate_speech(
            text=text, model='tts-1', voice=payload.voice, speed=0.95
        )
    except Exception as exc:
        logging.getLogger(__name__).error('tts failed: %s', exc)
        raise HTTPException(status_code=503, detail='voice-unavailable')
    cache_file.write_bytes(audio_bytes)
    return Response(content=audio_bytes, media_type='audio/mpeg')


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.on_event('shutdown')
async def shutdown_event():
    client.close()
