from level1 import CipherRequest, HintRequest
from typing import Tuple, List
import math


# --- HELPER FUNCTIONS ---
def _parse_int_list(text: str, separator: str = ',') -> List[int]:
    """Parses a string of separated numbers into a list of integers."""
    try:
        return [int(x.strip()) for x in text.replace('_', ',').split(separator) if x.strip()]
    except ValueError:
        raise ValueError(f"Input must be {separator}-separated integers.")


def _parse_key_pair(key_str: str) -> Tuple[int, int]:
    """Parses keys formatted as 'a,b'."""
    try:
        parts = key_str.split(',')
        return int(parts[0].strip()), int(parts[1].strip())
    except (ValueError, AttributeError, IndexError):
        raise ValueError("Key must be two comma-separated integers (e.g., '3,5').")


# --- LEVEL 4 CIPHER LOGIC ---

# 1. Pairing (a,b) -> (a+b, a*b)
def do_pairing(text: str, decrypt=False) -> str:
    nums = _parse_int_list(text)
    if len(nums) % 2 != 0:
        raise ValueError("Input must contain an even number of integers to form pairs.")

    result = []
    for i in range(0, len(nums), 2):
        if decrypt:
            S, P = nums[i], nums[i + 1]
            # Solve quadratic: t^2 - S*t + P = 0
            discriminant = S ** 2 - 4 * P
            if discriminant < 0:
                raise ValueError(f"Pair ({S},{P}) has no real integer roots.")

            root = math.isqrt(discriminant)
            if root * root != discriminant:
                raise ValueError(f"Pair ({S},{P}) does not resolve to integers.")

            x = (S - root) // 2
            y = (S + root) // 2
            result.extend([str(x), str(y)])
        else:
            a, b = nums[i], nums[i + 1]
            result.extend([str(a + b), str(a * b)])

    return ",".join(result)


# 2. Rotate and Add (I_Original + I_Reverse)
def do_rotate_add(text: str, decrypt=False) -> str:
    if decrypt:
        raise ValueError(
            "Rotate and Add is a lossy operation (One-Way). It cannot be deterministically decrypted without auxiliary data.")

    nums = _parse_int_list(text)
    reversed_nums = nums[::-1]
    result = [str(a + b) for a, b in zip(nums, reversed_nums)]

    return ",".join(result)


# 3. Additive Block Flip
def do_additive_flip(text: str, key_str: str, decrypt=False) -> str:
    key = _parse_int_list(key_str)
    blocks = [b.strip() for b in text.split('_')]

    result_blocks = []
    for block in blocks:
        if len(block) != len(key):
            raise ValueError(f"Block '{block}' length ({len(block)}) does not match key length ({len(key)}).")

        if decrypt:
            # Step 1: Flip back
            unflipped = block[::-1]
            # Step 2: Subtract key modulo 10
            dec_digits = [str((int(unflipped[i]) - key[i]) % 10) for i in range(len(block))]
            result_blocks.append("".join(dec_digits))
        else:
            # Step 1: Add key modulo 10
            enc_digits = [str((int(block[i]) + key[i]) % 10) for i in range(len(block))]
            # Step 2: Flip
            flipped = "".join(enc_digits)[::-1]
            result_blocks.append(flipped)

    return "_".join(result_blocks)


# 4. Mini RSA (y = x^a mod n)
def do_mini_rsa(text: str, key_str: str) -> str:
    # Key is 'exp,n' (works identically for 'e,n' encrypt or 'd,n' decrypt)
    exp, n = _parse_key_pair(key_str)
    nums = _parse_int_list(text)

    # Modular exponentiation
    result = [str(pow(x, exp, n)) for x in nums]
    return ",".join(result)


# 5. Mini Merkle Tree
def do_merkle_tree(text: str, key_str: str) -> str:
    a, b = _parse_key_pair(key_str)
    layer = _parse_int_list(text)

    # Pad with 0s to make the length a power of 2
    n = len(layer)
    if n == 0: return ""
    power = 1
    while power < n: power *= 2
    layer.extend([0] * (power - n))

    # Hash upwards until 1 root remains
    while len(layer) > 1:
        next_layer = []
        for i in range(0, len(layer), 2):
            combined_val = layer[i] + layer[i + 1]
            # Hash function: H(x) = (a*x + b) mod 26
            hashed = (a * combined_val + b) % 26
            next_layer.append(hashed)
        layer = next_layer

    return str(layer[0])


# --- ADVANCED HINTING ENGINE ---

def generate_hint_lvl4(expected: str, attempt: str, cipher_type: str, extra_data: dict = None) -> dict:
    if expected == attempt:
        return {"status": "success", "message": "Cryptographic proof verified. Block matched."}

    extra_data = extra_data or {}

    # For chunked outputs (comma or underscore separated)
    separator = '_' if cipher_type == 'additive_flip' else ','
    exp_list = expected.split(separator) if separator in expected else list(expected)
    att_list = attempt.split(separator) if separator in attempt else list(attempt)

    for i in range(max(len(exp_list), len(att_list))):
        if i >= len(att_list):
            return {"status": "error", "index": i, "message": "Incomplete payload sequence."}
        if i >= len(exp_list):
            return {"status": "error", "index": i, "message": f"Sequence overflow. Terminate at index {i - 1}."}

        e_val = exp_list[i]
        a_val = att_list[i]

        if e_val != a_val:
            hint_msg = f"Mismatch at segment {i}. You provided '{a_val}', but "

            if cipher_type == "pairing":
                hint_msg += f"calculating the (Sum, Product) or finding the quadratic roots yields '{e_val}'."
            elif cipher_type == "rotate_add":
                hint_msg += f"adding the array to its reversed counterpart results in '{e_val}'."
            elif cipher_type == "additive_flip":
                hint_msg += f"after applying the modulo 10 addition and reversing the block, the correct chunk is '{e_val}'."
            elif cipher_type == "rsa":
                exp, n = extra_data.get("exp"), extra_data.get("n")
                hint_msg += f"evaluating x^{exp} mod {n} yields '{e_val}'."
            elif cipher_type == "merkle":
                a, b = extra_data.get("a"), extra_data.get("b")
                hint_msg += f"hashing the pairs iteratively using ({a}x + {b}) mod 26 yields a final root of '{e_val}'."

            return {"status": "error", "index": i, "message": hint_msg, "expected": e_val, "yours": a_val}