from __future__ import annotations

import base64
import binascii
import hashlib
import hmac
import json
import secrets
from typing import Any

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)


class CryptoValidationError(ValueError):
    """Raised when cryptographic key material or signatures cannot be parsed."""


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    derived = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1, dklen=32)
    return f"scrypt$16384$8$1${base64.b64encode(salt).decode()}${base64.b64encode(derived).decode()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        parts = stored_hash.split("$")
        if len(parts) != 6 or parts[0] != "scrypt":
            return False
        n, r, p = int(parts[1]), int(parts[2]), int(parts[3])
        salt = base64.b64decode(parts[4])
        expected = base64.b64decode(parts[5])
        actual = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=n, r=r, p=p, dklen=len(expected))
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def hash_api_key(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _decode_base64_flexible(data: str) -> bytes:
    cleaned = data.strip()
    padding = "=" * (-len(cleaned) % 4)
    if "-" in cleaned or "_" in cleaned:
        return base64.urlsafe_b64decode(cleaned + padding)
    return base64.b64decode(cleaned + padding, validate=True)


def parse_ed25519_public_key(key_str: str) -> bytes:
    """Parse base64, base64url, hex, SPKI PEM, or OpenSSH Ed25519 public key into 32 raw bytes."""
    raw = (key_str or "").strip()
    if not raw:
        raise CryptoValidationError("Public key cannot be empty")

    # 1. PEM format
    if "-----BEGIN" in raw:
        try:
            pub = serialization.load_pem_public_key(raw.encode("utf-8"))
        except Exception as exc:
            raise CryptoValidationError("Malformed PEM public key") from exc
        if not isinstance(pub, Ed25519PublicKey):
            raise CryptoValidationError("Only Ed25519 public keys are supported in MVP")
        return pub.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw,
        )

    # 2. OpenSSH format (ssh-ed25519 AAAA... [comment])
    if raw.startswith("ssh-ed25519 "):
        try:
            pub = serialization.load_ssh_public_key(raw.encode("utf-8"))
        except Exception as exc:
            raise CryptoValidationError("Malformed OpenSSH Ed25519 public key") from exc
        if not isinstance(pub, Ed25519PublicKey):
            raise CryptoValidationError("Only Ed25519 public keys are supported in MVP")
        return pub.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw,
        )
    if raw.startswith(("ssh-rsa ", "ecdsa-sha2-")):
        raise CryptoValidationError("Only Ed25519 public keys are supported in MVP")

    # Strip optional prefix like "ed25519/"
    if raw.lower().startswith("ed25519/"):
        raw = raw.split("/", 1)[1].strip()

    # 3. Hex format (64 hex chars = 32 raw bytes)
    if len(raw) == 64:
        try:
            candidate = bytes.fromhex(raw)
            Ed25519PublicKey.from_public_bytes(candidate)
            return candidate
        except ValueError:
            pass

    # 4. Base64 / Base64URL (either 32-byte raw or 44-byte SPKI DER)
    try:
        decoded = _decode_base64_flexible(raw)
    except (binascii.Error, ValueError) as exc:
        raise CryptoValidationError("Public key format not recognized (expected base64, PEM, or OpenSSH)") from exc

    if len(decoded) == 32:
        try:
            Ed25519PublicKey.from_public_bytes(decoded)
            return decoded
        except Exception as exc:
            raise CryptoValidationError("Invalid Ed25519 public key bytes") from exc

    # Try SPKI DER
    try:
        pub = serialization.load_der_public_key(decoded)
        if not isinstance(pub, Ed25519PublicKey):
            raise CryptoValidationError("Only Ed25519 public keys are supported in MVP")
        return pub.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw,
        )
    except CryptoValidationError:
        raise
    except Exception as exc:
        raise CryptoValidationError(
            f"Public key must be 32 raw bytes (Ed25519) or valid SPKI DER, got {len(decoded)} bytes"
        ) from exc


def public_key_to_base64(raw_32: bytes) -> str:
    return base64.b64encode(raw_32).decode("ascii")


def public_key_to_pem(raw_32: bytes) -> str:
    pub = Ed25519PublicKey.from_public_bytes(raw_32)
    return pub.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode("ascii")


def public_key_fingerprint(raw_32: bytes) -> str:
    return hashlib.sha256(raw_32).hexdigest()


def decode_signature(signature_str: str) -> bytes:
    cleaned = (signature_str or "").strip()
    if not cleaned:
        raise CryptoValidationError("Signature cannot be empty")
    if len(cleaned) == 128:
        try:
            return bytes.fromhex(cleaned)
        except ValueError:
            pass
    try:
        raw = _decode_base64_flexible(cleaned)
    except (binascii.Error, ValueError) as exc:
        raise CryptoValidationError("Signature must be valid hex or base64") from exc
    if len(raw) != 64:
        raise CryptoValidationError(f"Ed25519 signature must be 64 bytes, got {len(raw)}")
    return raw


def verify_ed25519_signature(raw_public_key: bytes, message: bytes, signature_str: str) -> bool:
    try:
        sig_bytes = decode_signature(signature_str)
        pub = Ed25519PublicKey.from_public_bytes(raw_public_key)
        pub.verify(sig_bytes, message)
        return True
    except (CryptoValidationError, InvalidSignature, ValueError):
        return False


def canonical_json_bytes(payload: dict[str, Any]) -> bytes:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sign_bytecript_payload(payload_without_signature: dict[str, Any], issuer_seed: bytes) -> str:
    priv = Ed25519PrivateKey.from_private_bytes(issuer_seed)
    sig = priv.sign(canonical_json_bytes(payload_without_signature))
    return sig.hex()


def generate_ed25519_keypair_dict() -> dict[str, str]:
    """Generate a secure Ed25519 keypair on the server and export strings for provisioning."""
    priv = Ed25519PrivateKey.generate()
    pub = priv.public_key()
    priv_raw = priv.private_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PrivateFormat.Raw,
        encryption_algorithm=serialization.NoEncryption(),
    )
    pub_raw = pub.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )
    pub_pem = pub.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode("ascii")
    priv_pem = priv.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode("ascii")

    return {
        "algorithm": "ed25519",
        "publicKey": base64.b64encode(pub_raw).decode("ascii"),
        "publicKeyPem": pub_pem,
        "privateKeyBase64": base64.b64encode(priv_raw).decode("ascii"),
        "privateKeyPem": priv_pem,
        "fingerprint": public_key_fingerprint(pub_raw),
    }


def get_issuer_public_key_bytes(issuer_seed: bytes) -> bytes:

    priv = Ed25519PrivateKey.from_private_bytes(issuer_seed)
    return priv.public_key().public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )


def verify_bytecript_signature(bytecript_doc: dict[str, Any], issuer_public_key_b64: str) -> bool:
    sig = bytecript_doc.get("signature")
    if not isinstance(sig, str) or not sig:
        return False
    payload = {k: v for k, v in bytecript_doc.items() if k not in ("signature", "issuerPublicKey")}
    try:
        raw_pub = parse_ed25519_public_key(issuer_public_key_b64)
    except CryptoValidationError:
        return False
    return verify_ed25519_signature(raw_pub, canonical_json_bytes(payload), sig)
