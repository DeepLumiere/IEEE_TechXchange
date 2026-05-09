from __future__ import annotations

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from api.level1 import (
    CipherError,
    atbash_cipher,
    caesar_cipher,
    fixed_number_decode,
    fixed_number_encode,
    monoalphabetic_decrypt,
    monoalphabetic_encrypt,
    reverse_cipher,
)

app = FastAPI(title="Cipher API", version="1.0")


class TextRequest(BaseModel):
    text: str = Field(..., min_length=1)


class CaesarRequest(TextRequest):
    shift: int


class MonoRequest(TextRequest):
    mapping: str = Field(..., min_length=1)


class FixedDecodeRequest(BaseModel):
    data: str = Field(..., min_length=1)


def _handle_cipher_error(error: CipherError) -> None:
    raise HTTPException(status_code=400, detail=str(error))


@app.post("/cipher/reverse/encrypt")
def reverse_encrypt(payload: TextRequest) -> dict:
    return {
        "algorithm": "reverse",
        "mode": "encrypt",
        "input": payload.text,
        "output": reverse_cipher(payload.text),
    }


@app.post("/cipher/reverse/decrypt")
def reverse_decrypt(payload: TextRequest) -> dict:
    return {
        "algorithm": "reverse",
        "mode": "decrypt",
        "input": payload.text,
        "output": reverse_cipher(payload.text),
    }


@app.get("/cipher/reverse/hint")
def reverse_hint() -> dict:
    return {"hint": "Reverse cipher is symmetric; decrypt is the same as encrypt."}


@app.post("/cipher/caesar/encrypt")
def caesar_encrypt(payload: CaesarRequest) -> dict:
    return {
        "algorithm": "caesar",
        "mode": "encrypt",
        "shift": payload.shift,
        "input": payload.text,
        "output": caesar_cipher(payload.text, payload.shift),
    }


@app.post("/cipher/caesar/decrypt")
def caesar_decrypt(payload: CaesarRequest) -> dict:
    return {
        "algorithm": "caesar",
        "mode": "decrypt",
        "shift": payload.shift,
        "input": payload.text,
        "output": caesar_cipher(payload.text, -payload.shift),
    }


@app.get("/cipher/caesar/hint")
def caesar_hint() -> dict:
    return {
        "hint": "Use modulo 26 shifts and preserve non-letter characters unchanged."
    }


@app.post("/cipher/atbash/encrypt")
def atbash_encrypt(payload: TextRequest) -> dict:
    return {
        "algorithm": "atbash",
        "mode": "encrypt",
        "input": payload.text,
        "output": atbash_cipher(payload.text),
    }


@app.post("/cipher/atbash/decrypt")
def atbash_decrypt(payload: TextRequest) -> dict:
    return {
        "algorithm": "atbash",
        "mode": "decrypt",
        "input": payload.text,
        "output": atbash_cipher(payload.text),
    }


@app.get("/cipher/atbash/hint")
def atbash_hint() -> dict:
    return {"hint": "Map A<->Z and a<->z; the cipher is symmetric."}


@app.post("/cipher/monoalphabetic/encrypt")
def mono_encrypt(payload: MonoRequest) -> dict:
    try:
        output = monoalphabetic_encrypt(payload.text, payload.mapping)
    except CipherError as error:
        _handle_cipher_error(error)
    return {
        "algorithm": "monoalphabetic",
        "mode": "encrypt",
        "mapping": payload.mapping,
        "input": payload.text,
        "output": output,
    }


@app.post("/cipher/monoalphabetic/decrypt")
def mono_decrypt(payload: MonoRequest) -> dict:
    try:
        output = monoalphabetic_decrypt(payload.text, payload.mapping)
    except CipherError as error:
        _handle_cipher_error(error)
    return {
        "algorithm": "monoalphabetic",
        "mode": "decrypt",
        "mapping": payload.mapping,
        "input": payload.text,
        "output": output,
    }


@app.get("/cipher/monoalphabetic/hint")
def mono_hint() -> dict:
    return {
        "hint": "Provide a 26-letter unique mapping for a-z; preserve case in output."
    }


@app.post("/cipher/fixed-number/encrypt")
def fixed_number_encrypt(payload: TextRequest) -> dict:
    try:
        output = fixed_number_encode(payload.text)
    except CipherError as error:
        _handle_cipher_error(error)
    return {
        "algorithm": "fixed-number",
        "mode": "encrypt",
        "input": payload.text,
        "output": output,
    }


@app.post("/cipher/fixed-number/decrypt")
def fixed_number_decrypt(payload: FixedDecodeRequest) -> dict:
    try:
        output = fixed_number_decode(payload.data)
    except CipherError as error:
        _handle_cipher_error(error)
    return {
        "algorithm": "fixed-number",
        "mode": "decrypt",
        "input": payload.data,
        "output": output,
    }


@app.get("/cipher/fixed-number/hint")
def fixed_number_hint() -> dict:
    return {
        "hint": "Split tokens by spaces or commas; map 0-9, a-z (10-35), A-Z (36-51), .?!, (52-55)."
    }

