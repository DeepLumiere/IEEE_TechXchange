from pydantic import BaseModel
from typing import Optional
import string



# --- DATA MODELS ---
class CipherRequest(BaseModel):
    text: str
    key: Optional[str] = None  # Used for Caesar (int as str) or Monoalphabetic (26-char string)


class HintRequest(BaseModel):
    original_text: str
    user_attempt: str
    key: Optional[str] = None


# --- CIPHER LOGIC ---

def do_reverse(text: str) -> str:
    return text[::-1]


def do_caesar(text: str, shift: int) -> str:
    result = []
    for char in text:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            result.append(chr((ord(char) - base + shift) % 26 + base))
        else:
            result.append(char)
    return "".join(result)


def do_atbash(text: str) -> str:
    result = []
    for char in text:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            result.append(chr(25 - (ord(char) - base) + base))
        else:
            result.append(char)
    return "".join(result)


def do_monoalphabetic(text: str, key: str, decrypt=False) -> str:
    if len(key) != 26:
        raise ValueError("Key must be exactly 26 characters.")

    alphabet = string.ascii_lowercase
    key = key.lower()

    if decrypt:
        # Reverse the mapping
        trans = str.maketrans(key + key.upper(), alphabet + alphabet.upper())
    else:
        trans = str.maketrans(alphabet + alphabet.upper(), key + key.upper())

    return text.translate(trans)


def do_fixed_number_encode(text: str) -> str:
    mapping = {}
    # 0-9
    for i in range(10): mapping[str(i)] = str(i)
    # a-z (10-35)
    for i, c in enumerate(string.ascii_lowercase): mapping[c] = str(i + 10)
    # A-Z (36-51)
    for i, c in enumerate(string.ascii_uppercase): mapping[c] = str(i + 36)
    # Punctuation
    mapping['.'] = '52'
    mapping['?'] = '53'
    mapping['!'] = '54'
    mapping[','] = '55'

    result = [mapping.get(char, char) for char in text]
    return " ".join(result)


def do_fixed_number_decode(text: str) -> str:
    tokens = text.split(" ")
    mapping = {}
    for i in range(10): mapping[str(i)] = str(i)
    for i, c in enumerate(string.ascii_lowercase): mapping[str(i + 10)] = c
    for i, c in enumerate(string.ascii_uppercase): mapping[str(i + 36)] = c
    mapping['52'] = '.'
    mapping['53'] = '?'
    mapping['54'] = '!'
    mapping['55'] = ','

    result = [mapping.get(token, token) for token in tokens]
    return "".join(result)


# --- HINTING ENGINE ---

def generate_hint(expected: str, attempt: str, cipher_type: str, text_is_list=False) -> dict:
    if expected == attempt:
        return {"status": "success", "message": "Perfect! Your translation is entirely correct."}

    # Compare character by character (or token by token for Fixed Number)
    exp_list = expected.split(" ") if text_is_list else list(expected)
    att_list = attempt.split(" ") if text_is_list else list(attempt)

    for i in range(max(len(exp_list), len(att_list))):
        if i >= len(att_list):
            return {"status": "error", "index": i, "message": f"Your text is too short. It ends prematurely."}
        if i >= len(exp_list):
            return {"status": "error", "index": i, "message": f"Your text is too long. Stop after index {i - 1}."}

        e_char = exp_list[i]
        a_char = att_list[i]

        if e_char != a_char:
            hint_msg = f"Mismatch at index {i}. You put '{a_char}', but "

            if cipher_type == "reverse":
                hint_msg += f"remember you are reading from right to left. The correct character is '{e_char}'."
            elif cipher_type == "caesar":
                hint_msg += f"you need to shift the original character by the exact key amount. Correct is '{e_char}'."
            elif cipher_type == "atbash":
                hint_msg += f"A swaps with Z, B with Y, etc. The mirror of the original character is '{e_char}'."
            elif cipher_type == "mono":
                hint_msg += f"check your custom alphabet key. It maps to '{e_char}'."
            elif cipher_type == "fixed_number":
                hint_msg += f"check the reference table. The correct conversion is '{e_char}'."

            return {"status": "error", "index": i, "message": hint_msg, "expected": e_char, "yours": a_char}


# --- API ENDPOINTS ---

# 1. Reverse Cipher
