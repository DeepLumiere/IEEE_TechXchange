from level1 import CipherRequest, HintRequest
from typing import Tuple
import string
import math


# --- HELPER FUNCTIONS ---
def _shift_char(char: str, shift: int) -> str:
    """Helper to shift a single character, wrapping around the alphabet."""
    if char.isalpha():
        base = ord('A') if char.isupper() else ord('a')
        return chr((ord(char) - base + shift) % 26 + base)
    return char


def _mod_inverse(a: int, m: int) -> int:
    """Finds the modular inverse of a mod m."""
    for i in range(1, m):
        if (a * i) % m == 1:
            return i
    raise ValueError(f"No modular inverse for {a} mod {m}. 'A' must be coprime to 26.")


# --- LEVEL 3 CIPHER LOGIC ---

# 1. Modular Shift Cipher
def do_modular_shift(text: str, key: int, decrypt=False) -> str:
    # Functionally identical to Caesar, but strict mathematical naming
    shift = -key if decrypt else key
    return "".join(_shift_char(c, shift) for c in text)


# 2. Vigenère Cipher
def do_vigenere(text: str, key: str, decrypt=False) -> str:
    key_clean = [ord(k.lower()) - 97 for k in key if k.isalpha()]
    if not key_clean:
        raise ValueError("Key must contain at least one valid letter.")

    result = []
    k_idx = 0
    for char in text:
        if char.isalpha():
            shift = key_clean[k_idx % len(key_clean)]
            if decrypt:
                shift = -shift
            result.append(_shift_char(char, shift))
            k_idx += 1
        else:
            result.append(char)
    return "".join(result)


# 3. Affine Scrambler
def do_affine(text: str, a: int, b: int, decrypt=False) -> str:
    if math.gcd(a, 26) != 1:
        raise ValueError("Key 'A' must be coprime to 26 (e.g., 1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25).")

    result = []
    inv_a = _mod_inverse(a, 26) if decrypt else 0

    for char in text:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            x = ord(char) - base
            if decrypt:
                c = (inv_a * (x - b)) % 26
            else:
                c = (a * x + b) % 26
            result.append(chr(c + base))
        else:
            result.append(char)
    return "".join(result)


# 4. Permutation Cipher
def do_permutation(text: str, key_str: str, decrypt=False) -> str:
    try:
        indices = [int(x.strip()) for x in key_str.split(',')]
    except ValueError:
        raise ValueError("Key must be comma-separated integers (e.g., '2,0,1,3')")

    n = len(indices)
    if set(indices) != set(range(n)):
        raise ValueError(f"Key must be a valid permutation of numbers from 0 to {n - 1}.")

    # Generate inverse key for decryption
    inv_key = [0] * n
    for i, val in enumerate(indices):
        inv_key[val] = i

    use_key = inv_key if decrypt else indices

    result = []
    # Process text in chunks of block size `n`
    for i in range(0, len(text), n):
        block = text[i:i + n]
        if len(block) == n:
            res_block = [block[k] for k in use_key]
            result.append("".join(res_block))
        else:
            # If the last block is shorter than the permutation length, leave it unpermuted
            result.append(block)
    return "".join(result)


# 5. Blocked Rotate and Keying
def do_block_rotate_key(text: str, key: str, decrypt=False) -> str:
    key_clean = "".join([k for k in key if k.isalpha()])
    if not key_clean:
        raise ValueError("Key must contain letters.")

    block_size = len(key_clean)
    result = []

    for i in range(0, len(text), block_size):
        block = text[i:i + block_size]

        if decrypt:
            # Un-Vigenère first, then Reverse
            unvig = do_vigenere(block, key_clean, decrypt=True)
            result.append(unvig[::-1])
        else:
            # Reverse first, then Vigenère
            rev = block[::-1]
            vig = do_vigenere(rev, key_clean, decrypt=False)
            result.append(vig)

    return "".join(result)


# --- LEVEL 3 HINTING ENGINE ---

def generate_hint_lvl3(expected: str, attempt: str, cipher_type: str, extra_data: dict = None) -> dict:
    if expected == attempt:
        return {"status": "success", "message": "Access Granted! Encryption protocols matched."}

    extra_data = extra_data or {}
    exp_list = list(expected)
    att_list = list(attempt)

    for i in range(max(len(exp_list), len(att_list))):
        if i >= len(att_list):
            return {"status": "error", "index": i, "message": "Fragmented data: Your text is too short."}
        if i >= len(exp_list):
            return {"status": "error", "index": i,
                    "message": f"Buffer overflow: Your text is too long. Stop at index {i - 1}."}

        e_char = exp_list[i]
        a_char = att_list[i]

        if e_char != a_char:
            hint_msg = f"Mismatch at index {i}. You put '{a_char}', but "

            if cipher_type == "modular":
                hint_msg += f"using (Index + {extra_data.get('key')}) mod 26, the correct character is '{e_char}'."
            elif cipher_type == "vigenere":
                k_char = extra_data.get("k_char", "the corresponding key letter")
                hint_msg += f"when shifted by the active key letter '{k_char}', the output should be '{e_char}'."
            elif cipher_type == "affine":
                a, b = extra_data.get("a"), extra_data.get("b")
                hint_msg += f"applying the formula ({a} * Index + {b}) mod 26 yields '{e_char}'."
            elif cipher_type == "permutation":
                hint_msg += f"according to the block reordering rule, the character mapped here is '{e_char}'."
            elif cipher_type == "block_rotate":
                hint_msg += f"remember each block is REVERSED first, then modified by the Vigenère key. Expecting '{e_char}'."

            return {"status": "error", "index": i, "message": hint_msg, "expected": e_char, "yours": a_char}