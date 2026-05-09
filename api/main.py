from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Tuple

from api.level4 import _parse_key_pair
# Import the logic blocks
from level1 import *
from level2 import *
from level3 import *
from level4 import *

app = FastAPI(title="CipherQuest")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins for local testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# LEVEL 1 ENDPOINTS
# ==========================================

# 1. Reverse Cipher
@app.post("/api/reverse/encrypt")
def reverse_encrypt(req: CipherRequest):
    return {"result": do_reverse(req.text)}

@app.post("/api/reverse/decrypt")
def reverse_decrypt(req: CipherRequest):
    return {"result": do_reverse(req.text)}

@app.post("/api/reverse/hint")
def reverse_hint(req: HintRequest):
    expected = do_reverse(req.original_text)
    return generate_hint(expected, req.user_attempt, "reverse")

# 2. Caesar Cipher
@app.post("/api/caesar/encrypt")
def caesar_encrypt(req: CipherRequest):
    if not req.key or not req.key.lstrip('-').isdigit():
        raise HTTPException(status_code=400, detail="Shift key must be an integer.")
    return {"result": do_caesar(req.text, int(req.key))}

@app.post("/api/caesar/decrypt")
def caesar_decrypt(req: CipherRequest):
    if not req.key or not req.key.lstrip('-').isdigit():
        raise HTTPException(status_code=400, detail="Shift key must be an integer.")
    return {"result": do_caesar(req.text, -int(req.key))}

@app.post("/api/caesar/hint")
def caesar_hint(req: HintRequest):
    expected = do_caesar(req.original_text, int(req.key))
    return generate_hint(expected, req.user_attempt, "caesar")

# 3. Atbash Cipher
@app.post("/api/atbash/encrypt")
def atbash_encrypt(req: CipherRequest):
    return {"result": do_atbash(req.text)}

@app.post("/api/atbash/decrypt")
def atbash_decrypt(req: CipherRequest):
    return {"result": do_atbash(req.text)}

@app.post("/api/atbash/hint")
def atbash_hint(req: HintRequest):
    expected = do_atbash(req.original_text)
    return generate_hint(expected, req.user_attempt, "atbash")

# 4. Monoalphabetic Substitution
@app.post("/api/mono/encrypt")
def mono_encrypt(req: CipherRequest):
    try:
        return {"result": do_monoalphabetic(req.text, req.key, decrypt=False)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/mono/decrypt")
def mono_decrypt(req: CipherRequest):
    try:
        return {"result": do_monoalphabetic(req.text, req.key, decrypt=True)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/mono/hint")
def mono_hint(req: HintRequest):
    expected = do_monoalphabetic(req.original_text, req.key, decrypt=False)
    return generate_hint(expected, req.user_attempt, "mono")

# 5. Fixed Number Encoding
@app.post("/api/fixed/encrypt")
def fixed_encrypt(req: CipherRequest):
    return {"result": do_fixed_number_encode(req.text)}

@app.post("/api/fixed/decrypt")
def fixed_decrypt(req: CipherRequest):
    return {"result": do_fixed_number_decode(req.text)}

@app.post("/api/fixed/hint")
def fixed_hint(req: HintRequest):
    expected = do_fixed_number_encode(req.original_text)
    return generate_hint(expected, req.user_attempt, "fixed_number", text_is_list=True)


# ==========================================
# LEVEL 2 ENDPOINTS
# ==========================================

# 1. Reverse + Caesar
@app.post("/api/lvl2/rev_caesar/encrypt")
def rev_caesar_encrypt(req: CipherRequest):
    shift = int(req.key) if req.key else 0
    return {"result": do_rev_caesar(req.text, shift, decrypt=False)}

@app.post("/api/lvl2/rev_caesar/decrypt")
def rev_caesar_decrypt(req: CipherRequest):
    shift = int(req.key) if req.key else 0
    return {"result": do_rev_caesar(req.text, shift, decrypt=True)}

@app.post("/api/lvl2/rev_caesar/hint")
def rev_caesar_hint(req: HintRequest):
    shift = int(req.key) if req.key else 0
    expected = do_rev_caesar(req.original_text, shift, decrypt=False)
    return generate_hint_lvl2(expected, req.user_attempt, "rev_caesar", {"shift": shift})

# 2. Alternating Cipher
def _parse_alternating_key(key_str: str) -> Tuple[int, int]:
    try:
        parts = key_str.split(',')
        return int(parts[0].strip()), int(parts[1].strip())
    except (ValueError, AttributeError, IndexError):
        raise HTTPException(status_code=400, detail="Key must be two comma-separated integers (e.g. '3,-2')")

@app.post("/api/lvl2/alternating/encrypt")
def alternating_encrypt(req: CipherRequest):
    s1, s2 = _parse_alternating_key(req.key)
    return {"result": do_alternating(req.text, s1, s2, decrypt=False)}

@app.post("/api/lvl2/alternating/decrypt")
def alternating_decrypt(req: CipherRequest):
    s1, s2 = _parse_alternating_key(req.key)
    return {"result": do_alternating(req.text, s1, s2, decrypt=True)}

@app.post("/api/lvl2/alternating/hint")
def alternating_hint(req: HintRequest):
    s1, s2 = _parse_alternating_key(req.key)
    expected = do_alternating(req.original_text, s1, s2, decrypt=False)
    return generate_hint_lvl2(expected, req.user_attempt, "alternating", {"shifts": (s1, s2)})

# 3. Positional Cipher
@app.post("/api/lvl2/positional/encrypt")
def positional_encrypt(req: CipherRequest):
    return {"result": do_positional(req.text, decrypt=False)}

@app.post("/api/lvl2/positional/decrypt")
def positional_decrypt(req: CipherRequest):
    return {"result": do_positional(req.text, decrypt=True)}

@app.post("/api/lvl2/positional/hint")
def positional_hint(req: HintRequest):
    expected = do_positional(req.original_text, decrypt=False)
    return generate_hint_lvl2(expected, req.user_attempt, "positional")

# 4. Vowel Scrambler
@app.post("/api/lvl2/vowel/encrypt")
def vowel_encrypt(req: CipherRequest):
    return {"result": do_vowel_scrambler(req.text, decrypt=False)}

@app.post("/api/lvl2/vowel/decrypt")
def vowel_decrypt(req: CipherRequest):
    return {"result": do_vowel_scrambler(req.text, decrypt=True)}

@app.post("/api/lvl2/vowel/hint")
def vowel_hint(req: HintRequest):
    expected = do_vowel_scrambler(req.original_text, decrypt=False)
    return generate_hint_lvl2(expected, req.user_attempt, "vowel_scrambler")

# 5. Keyed Substitution Cipher
@app.post("/api/lvl2/keyed/encrypt")
def keyed_encrypt(req: CipherRequest):
    if not req.key or not req.key.isalpha():
        raise HTTPException(status_code=400, detail="Key must be an alphabetic string.")
    return {"result": do_keyed_sub(req.text, req.key, decrypt=False)}

@app.post("/api/lvl2/keyed/decrypt")
def keyed_decrypt(req: CipherRequest):
    if not req.key or not req.key.isalpha():
        raise HTTPException(status_code=400, detail="Key must be an alphabetic string.")
    return {"result": do_keyed_sub(req.text, req.key, decrypt=True)}

@app.post("/api/lvl2/keyed/hint")
def keyed_hint(req: HintRequest):
    if not req.key or not req.key.isalpha():
        raise HTTPException(status_code=400, detail="Key must be an alphabetic string.")
    expected = do_keyed_sub(req.original_text, req.key, decrypt=False)
    return generate_hint_lvl2(expected, req.user_attempt, "keyed_sub", {"keyword": req.key})

def _parse_affine_key(key_str: str) -> Tuple[int, int]:
    try:
        parts = key_str.split(',')
        return int(parts[0].strip()), int(parts[1].strip())
    except (ValueError, AttributeError, IndexError):
        raise HTTPException(status_code=400, detail="Affine key must be 'A,B' (e.g. '5,8')")

# 1. Modular Shift
@app.post("/api/lvl3/modular/encrypt")
def modular_encrypt(req: CipherRequest):
    return {"result": do_modular_shift(req.text, int(req.key or 0), decrypt=False)}

@app.post("/api/lvl3/modular/decrypt")
def modular_decrypt(req: CipherRequest):
    return {"result": do_modular_shift(req.text, int(req.key or 0), decrypt=True)}

@app.post("/api/lvl3/modular/hint")
def modular_hint(req: HintRequest):
    shift = int(req.key or 0)
    expected = do_modular_shift(req.original_text, shift, decrypt=False)
    return generate_hint_lvl3(expected, req.user_attempt, "modular", {"key": shift})


# 2. Vigenère Cipher
@app.post("/api/lvl3/vigenere/encrypt")
def vigenere_encrypt(req: CipherRequest):
    if not req.key: raise HTTPException(status_code=400, detail="Vigenère requires an alphabetic key.")
    return {"result": do_vigenere(req.text, req.key, decrypt=False)}

@app.post("/api/lvl3/vigenere/decrypt")
def vigenere_decrypt(req: CipherRequest):
    if not req.key: raise HTTPException(status_code=400, detail="Vigenère requires an alphabetic key.")
    return {"result": do_vigenere(req.text, req.key, decrypt=True)}

@app.post("/api/lvl3/vigenere/hint")
def vigenere_hint(req: HintRequest):
    expected = do_vigenere(req.original_text, req.key, decrypt=False)
    return generate_hint_lvl3(expected, req.user_attempt, "vigenere")


# 3. Affine Scrambler
@app.post("/api/lvl3/affine/encrypt")
def affine_encrypt(req: CipherRequest):
    a, b = _parse_affine_key(req.key)
    try:
        return {"result": do_affine(req.text, a, b, decrypt=False)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/lvl3/affine/decrypt")
def affine_decrypt(req: CipherRequest):
    a, b = _parse_affine_key(req.key)
    try:
        return {"result": do_affine(req.text, a, b, decrypt=True)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/lvl3/affine/hint")
def affine_hint(req: HintRequest):
    a, b = _parse_affine_key(req.key)
    expected = do_affine(req.original_text, a, b, decrypt=False)
    return generate_hint_lvl3(expected, req.user_attempt, "affine", {"a": a, "b": b})


# 4. Permutation Cipher
@app.post("/api/lvl3/permutation/encrypt")
def permutation_encrypt(req: CipherRequest):
    try:
        return {"result": do_permutation(req.text, req.key, decrypt=False)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/lvl3/permutation/decrypt")
def permutation_decrypt(req: CipherRequest):
    try:
        return {"result": do_permutation(req.text, req.key, decrypt=True)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/lvl3/permutation/hint")
def permutation_hint(req: HintRequest):
    expected = do_permutation(req.original_text, req.key, decrypt=False)
    return generate_hint_lvl3(expected, req.user_attempt, "permutation")


# 5. Blocked Rotate and Keying
@app.post("/api/lvl3/block_rotate/encrypt")
def block_rotate_encrypt(req: CipherRequest):
    if not req.key: raise HTTPException(status_code=400, detail="Requires an alphabetic key.")
    return {"result": do_block_rotate_key(req.text, req.key, decrypt=False)}

@app.post("/api/lvl3/block_rotate/decrypt")
def block_rotate_decrypt(req: CipherRequest):
    if not req.key: raise HTTPException(status_code=400, detail="Requires an alphabetic key.")
    return {"result": do_block_rotate_key(req.text, req.key, decrypt=True)}

@app.post("/api/lvl3/block_rotate/hint")
def block_rotate_hint(req: HintRequest):
    expected = do_block_rotate_key(req.original_text, req.key, decrypt=False)
    return generate_hint_lvl3(expected, req.user_attempt, "block_rotate")

@app.post("/api/lvl4/pairing/encrypt")
def pairing_encrypt(req: CipherRequest):
    try:
        return {"result": do_pairing(req.text, decrypt=False)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/lvl4/pairing/decrypt")
def pairing_decrypt(req: CipherRequest):
    try:
        return {"result": do_pairing(req.text, decrypt=True)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/lvl4/pairing/hint")
def pairing_hint(req: HintRequest):
    expected = do_pairing(req.original_text, decrypt=False)
    return generate_hint_lvl4(expected, req.user_attempt, "pairing")


# 2. Rotate and Add
@app.post("/api/lvl4/rotate_add/encrypt")
def rotate_add_encrypt(req: CipherRequest):
    try:
        return {"result": do_rotate_add(req.text, decrypt=False)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/lvl4/rotate_add/decrypt")
def rotate_add_decrypt(req: CipherRequest):
    # This is intentionally designed to fail to teach hashing/lossy algorithms
    try:
        return {"result": do_rotate_add(req.text, decrypt=True)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/lvl4/rotate_add/hint")
def rotate_add_hint(req: HintRequest):
    expected = do_rotate_add(req.original_text, decrypt=False)
    return generate_hint_lvl4(expected, req.user_attempt, "rotate_add")


# 3. Additive Block Flip
@app.post("/api/lvl4/additive_flip/encrypt")
def additive_flip_encrypt(req: CipherRequest):
    if not req.key: raise HTTPException(status_code=400, detail="Key required (e.g., '1,3,5,7')")
    try:
        return {"result": do_additive_flip(req.text, req.key, decrypt=False)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/lvl4/additive_flip/decrypt")
def additive_flip_decrypt(req: CipherRequest):
    if not req.key: raise HTTPException(status_code=400, detail="Key required (e.g., '1,3,5,7')")
    try:
        return {"result": do_additive_flip(req.text, req.key, decrypt=True)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/lvl4/additive_flip/hint")
def additive_flip_hint(req: HintRequest):
    expected = do_additive_flip(req.original_text, req.key, decrypt=False)
    return generate_hint_lvl4(expected, req.user_attempt, "additive_flip")


# 4. Mini RSA
@app.post("/api/lvl4/rsa/encrypt")
def rsa_encrypt(req: CipherRequest):
    if not req.key: raise HTTPException(status_code=400, detail="Key required (e.g., '7,33')")
    try:
        return {"result": do_mini_rsa(req.text, req.key)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/lvl4/rsa/decrypt")
def rsa_decrypt(req: CipherRequest):
    # Decryption math is identical to encryption in RSA (just passing the private exponent instead)
    if not req.key: raise HTTPException(status_code=400, detail="Key required (e.g., '3,33')")
    try:
        return {"result": do_mini_rsa(req.text, req.key)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/lvl4/rsa/hint")
def rsa_hint(req: HintRequest):
    exp, n = _parse_key_pair(req.key)
    expected = do_mini_rsa(req.original_text, req.key)
    return generate_hint_lvl4(expected, req.user_attempt, "rsa", {"exp": exp, "n": n})


# 5. Mini Merkle Tree
@app.post("/api/lvl4/merkle/encrypt")
def merkle_encrypt(req: CipherRequest):
    if not req.key: raise HTTPException(status_code=400, detail="Key required (e.g., '3,5')")
    try:
        return {"result": do_merkle_tree(req.text, req.key)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/lvl4/merkle/decrypt")
def merkle_decrypt(req: CipherRequest):
    raise HTTPException(status_code=400, detail="Merkle Trees are one-way hash structures and cannot be decrypted.")

@app.post("/api/lvl4/merkle/hint")
def merkle_hint(req: HintRequest):
    a, b = _parse_key_pair(req.key)
    expected = do_merkle_tree(req.original_text, req.key)
    return generate_hint_lvl4(expected, req.user_attempt, "merkle", {"a": a, "b": b})