# Tests

## Overview
The `tui/tests/` directory contains the Python test suite for the Terminal UI (TUI) and shared crypto utilities. The primary test file is `test_crypto.py`, which validates the AES-256-GCM + scrypt implementation used by the TUI's credential storage and by the Vault Worker's encryption layer.

## File Overview

| File | Purpose |
|------|---------|
| `tui/tests/test_crypto.py` | Pytest suite covering key derivation, encryption, decryption, payload serialization, and input validation. |

## Test Coverage

### `TestDeriveKey`
- Verifies `derive_key` returns a 32-byte key for a valid password and salt.
- Confirms the same password + salt always produces the same key.
- Confirms different salts produce different keys.
- Rejects empty passwords and invalid salt sizes.

### `TestEncrypt`
- Verifies `encrypt` returns all required payload fields (`salt`, `iv`, `auth_tag`, `ciphertext`).
- Confirms salt and IV are random per call.
- Confirms identical plaintexts encrypt to different ciphertexts.
- Rejects empty plaintext and empty master password.

### `TestDecrypt`
- Verifies round-trip encryption/decryption returns the original plaintext.
- Verifies decryption fails with the wrong password.
- Verifies decryption fails when the ciphertext or auth tag is tampered with.

### `TestSerialization`
- Verifies `serialize_payload` and `deserialize_payload` are inverses.
- Checks correct byte offsets for salt, IV, auth tag, and ciphertext.

### `TestInputValidation`
- Ensures the crypto module rejects non-string plaintext.
- Ensures the module rejects empty inputs where required.

## Running the Tests
```bash
pytest tui/tests/test_crypto.py
```

Or, if the TUI package exposes a test script:
```bash
cd tui && pytest
```

## Integration Points
- **TUI (`tui/src/crypto.py`)**: the same crypto primitives are tested here.
- **Vault Worker (`workers/vault/src/crypto.ts`)**: conceptually equivalent AES-256-GCM + scrypt implementation in TypeScript/Node.js.
- **Verification scripts**: `scripts/verify-s02.sh` relies on these guarantees when proving SugarVault does not leak plaintext.
