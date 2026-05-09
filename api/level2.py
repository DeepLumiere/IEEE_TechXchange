from pydantic import BaseModel
from typing import Optional, Tuple
import string


# --- DATA MODELS ---
class CipherRequest(BaseModel):
    text: str
    key: Optional[str] = None  # Formats: "3", "3,-2" (Alternating), or "KEYWORD"


class HintRequest(BaseModel):
    original_text: str
    user_attempt: str
    key: Optional[str] = None


# --- HELPER FUNCTIONS ---
def _shift_char(char: str, shift: int) -> str:
    """Helper to shift a single character, wrapping around the alphabet."""
    if char.isalpha():
        base = ord('A') if char.isupper() else ord('a')
        return chr((ord(char) - base + shift) % 26 + base)
    return char


def _generate_keyed_alphabet(keyword: str) -> str:
    """Generates a 26-char uppercase alphabet starting with the unique letters of the keyword."""
    keyword = keyword.upper()
    seen = set()
    key_chars = []

    # 1. Add unique keyword characters
    for char in keyword:
        if char.isalpha() and char not in seen:
            seen.add(char)
            key_chars.append(char)

    # 2. Add remaining alphabet characters
    for char in string.ascii_uppercase:
        if char not in seen:
            key_chars.append(char)

    return "".join(key_chars)


# --- LEVEL 2 CIPHER LOGIC ---

def do_rev_caesar(text: str, shift: int, decrypt=False) -> str:
    if decrypt:
        # Decrypt: Reverse the Caesar shift, then reverse the string
        unshifted = "".join(_shift_char(c, -shift) for c in text)
        return unshifted[::-1]
    else:
        # Encrypt: Reverse the string, then apply Caesar shift
        reversed_text = text[::-1]
        return "".join(_shift_char(c, shift) for c in reversed_text)


def do_alternating(text: str, shift1: int, shift2: int, decrypt=False) -> str:
    if decrypt:
        shift1, shift2 = -shift1, -shift2

    result = []
    for i, char in enumerate(text):
        # Even indices use shift1, odd indices use shift2
        current_shift = shift1 if i % 2 == 0 else shift2
        result.append(_shift_char(char, current_shift))
    return "".join(result)


def do_positional(text: str, decrypt=False) -> str:
    result = []
    for i, char in enumerate(text):
        # Shift increases by 1 for each position (index 0 shifts by 1, index 1 by 2...)
        shift = i + 1
        if decrypt:
            shift = -shift
        result.append(_shift_char(char, shift))
    return "".join(result)


def do_vowel_scrambler(text: str, decrypt=False) -> str:
    vowel_map = {'a': '1', 'e': '2', 'i': '3', 'o': '4', 'u': '5',
                 'A': '1', 'E': '2', 'I': '3', 'O': '4', 'U': '5', ' ': '#'}

    # We map back to lowercase by default for numbers to keep it simple
    rev_vowel_map = {'1': 'a', '2': 'e', '3': 'i', '4': 'o', '5': 'u', '#': ' '}

    if decrypt:
        return "".join(rev_vowel_map.get(c, c) for c in text)
    else:
        return "".join(vowel_map.get(c, c) for c in text)


def do_keyed_sub(text: str, keyword: str, decrypt=False) -> str:
    standard = string.ascii_uppercase + string.ascii_lowercase
    keyed_upper = _generate_keyed_alphabet(keyword)
    keyed_lower = keyed_upper.lower()
    keyed_full = keyed_upper + keyed_lower

    if decrypt:
        trans = str.maketrans(keyed_full, standard)
    else:
        trans = str.maketrans(standard, keyed_full)

    return text.translate(trans)


# --- ADVANCED HINTING ENGINE ---

def generate_hint_lvl2(expected: str, attempt: str, cipher_type: str, extra_data: dict = None) -> dict:
    if expected == attempt:
        return {"status": "success", "message": "Perfect! Your translation is entirely correct."}

    extra_data = extra_data or {}
    exp_list = list(expected)
    att_list = list(attempt)

    for i in range(max(len(exp_list), len(att_list))):
        if i >= len(att_list):
            return {"status": "error", "index": i, "message": f"Your text is too short. It ends prematurely."}
        if i >= len(exp_list):
            return {"status": "error", "index": i, "message": f"Your text is too long. Stop after index {i - 1}."}

        e_char = exp_list[i]
        a_char = att_list[i]

        if e_char != a_char:
            hint_msg = f"Mismatch at index {i}. You put '{a_char}', but "

            if cipher_type == "rev_caesar":
                shift = extra_data.get("shift")
                hint_msg += f"remember the text is reversed FIRST, then shifted by {shift}. Correct is '{e_char}'."
            elif cipher_type == "alternating":
                s1, s2 = extra_data.get("shifts", (0, 0))
                current_shift = s1 if i % 2 == 0 else s2
                hint_msg += f"index {i} is an {'even' if i % 2 == 0 else 'odd'} position, so you must shift by {current_shift}. Correct is '{e_char}'."
            elif cipher_type == "positional":
                hint_msg += f"for position {i}, you shift the character by exactly {i + 1}. Correct is '{e_char}'."
            elif cipher_type == "vowel_scrambler":
                hint_msg += f"vowels become 1-5 and spaces become '#'. Consonants are ignored. Correct is '{e_char}'."
            elif cipher_type == "keyed_sub":
                kw = extra_data.get("keyword")
                hint_msg += f"based on the keyword '{kw}', the standard alphabet maps to the generated sequence. Correct is '{e_char}'."

            return {"status": "error", "index": i, "message": hint_msg, "expected": e_char, "yours": a_char}

