from __future__ import annotations

import base64
import binascii
import hashlib
import json
import os
from pathlib import Path
from typing import Any

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)

from .exceptions import CryptographicError
from .models import Bytecript


def _decode_base64_flexible(data: str) -> bytes:
    cleaned = data.strip()
    padding = "=" * (-len(cleaned) % 4)
    if "-" in cleaned or "_" in cleaned:
        return base64.urlsafe_b64decode(cleaned + padding)
    return base64.b64decode(cleaned + padding, validate=True)


def parse_public_key_bytes(key_str: str) -> bytes:
    """Parse base64, hex, SPKI PEM, or OpenSSH Ed25519 public key into 32 raw bytes."""
    raw = (key_str or "").strip()
    if not raw:
        raise CryptographicError("Public key cannot be empty")

    if "-----BEGIN" in raw:
        try:
            pub = serialization.load_pem_public_key(raw.encode("utf-8"))
        except Exception as exc:
            raise CryptographicError("Malformed PEM public key") from exc
        if not isinstance(pub, Ed25519PublicKey):
            raise CryptographicError("Only Ed25519 public keys are supported")
        return pub.public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)

    if raw.startswith("ssh-ed25519 "):
        try:
            pub = serialization.load_ssh_public_key(raw.encode("utf-8"))
        except Exception as exc:
            raise CryptographicError("Malformed OpenSSH Ed25519 public key") from exc
        if not isinstance(pub, Ed25519PublicKey):
            raise CryptographicError("Only Ed25519 public keys are supported")
        return pub.public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)

    if raw.lower().startswith("ed25519/"):
        raw = raw.split("/", 1)[1].strip()

    if len(raw) == 64:
        try:
            candidate = bytes.fromhex(raw)
            Ed25519PublicKey.from_public_bytes(candidate)
            return candidate
        except ValueError:
            pass

    try:
        decoded = _decode_base64_flexible(raw)
    except (binascii.Error, ValueError) as exc:
        raise CryptographicError("Public key format not recognized") from exc

    if len(decoded) == 32:
        try:
            Ed25519PublicKey.from_public_bytes(decoded)
            return decoded
        except Exception as exc:
            raise CryptographicError("Invalid Ed25519 public key bytes") from exc

    try:
        pub = serialization.load_der_public_key(decoded)
        if not isinstance(pub, Ed25519PublicKey):
            raise CryptographicError("Only Ed25519 public keys are supported")
        return pub.public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    except CryptographicError:
        raise
    except Exception as exc:
        raise CryptographicError(f"Unsupported Ed25519 public key length: {len(decoded)} bytes") from exc


def format_fingerprint(fingerprint_hex: str) -> str:
    return " ".join(fingerprint_hex[i : i + 8] for i in range(0, len(fingerprint_hex), 8))


def compute_fingerprint(public_key: str | bytes) -> str:
    raw = public_key if isinstance(public_key, bytes) else parse_public_key_bytes(public_key)
    return hashlib.sha256(raw).hexdigest()


def decode_signature(signature: str | bytes) -> bytes:
    if isinstance(signature, bytes):
        if len(signature) != 64:
            raise CryptographicError(f"Signature must be 64 bytes, got {len(signature)}")
        return signature
    cleaned = signature.strip()
    if len(cleaned) == 128:
        try:
            return bytes.fromhex(cleaned)
        except ValueError:
            pass
    try:
        raw = _decode_base64_flexible(cleaned)
    except (binascii.Error, ValueError) as exc:
        raise CryptographicError("Signature must be valid hex or base64") from exc
    if len(raw) != 64:
        raise CryptographicError(f"Signature must be 64 bytes, got {len(raw)}")
    return raw


def verify_signature(public_key: str | bytes, message: str | bytes, signature: str | bytes) -> bool:
    """Verify an Ed25519 signature offline."""
    try:
        raw_pub = public_key if isinstance(public_key, bytes) else parse_public_key_bytes(public_key)
        msg_bytes = message.encode("utf-8") if isinstance(message, str) else message
        sig_bytes = decode_signature(signature)
        Ed25519PublicKey.from_public_bytes(raw_pub).verify(sig_bytes, msg_bytes)
        return True
    except (CryptographicError, InvalidSignature, ValueError):
        return False


def verify_bytecript_signature(
    bytecript: Bytecript | dict[str, Any],
    issuer_public_key: str | None = None,
) -> bool:
    """Verify the Descript issuer's Ed25519 signature on a Bytecript offline."""
    doc = bytecript.model_dump(mode="json") if isinstance(bytecript, Bytecript) else dict(bytecript)
    sig = doc.get("signature")
    pub_key = issuer_public_key or doc.get("issuerPublicKey")
    if not isinstance(sig, str) or not isinstance(pub_key, str):
        return False

    payload = {k: v for k, v in doc.items() if k not in ("signature", "issuerPublicKey")}
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return verify_signature(pub_key, canonical, sig)


class KeyPair:
    """Client-side Ed25519 keypair for signing agent challenges and payloads."""

    def __init__(self, private_key: Ed25519PrivateKey) -> None:
        self._private_key = private_key
        self._public_key = private_key.public_key()

    @classmethod
    def generate(cls) -> KeyPair:
        return cls(Ed25519PrivateKey.generate())

    @classmethod
    def from_pem(cls, pem_data: str | bytes) -> KeyPair:
        raw = pem_data.encode("utf-8") if isinstance(pem_data, str) else pem_data
        try:
            key = serialization.load_pem_private_key(raw, password=None)
        except Exception as exc:
            raise CryptographicError("Failed to parse PEM Ed25519 private key") from exc
        if not isinstance(key, Ed25519PrivateKey):
            raise CryptographicError("Only Ed25519 private keys are supported")
        return cls(key)

    @classmethod
    def from_base64(cls, key_b64: str) -> KeyPair:
        try:
            raw = _decode_base64_flexible(key_b64)
        except (binascii.Error, ValueError) as exc:
            raise CryptographicError("Invalid base64 private key") from exc
        if len(raw) == 64:
            # Support 64-byte NaCl-style secret keys (32-byte seed + 32-byte pub)
            raw = raw[:32]
        if len(raw) == 32:
            return cls(Ed25519PrivateKey.from_private_bytes(raw))
        try:
            key = serialization.load_der_private_key(raw, password=None)
        except Exception as exc:
            raise CryptographicError("Unsupported Ed25519 private key format") from exc
        if not isinstance(key, Ed25519PrivateKey):
            raise CryptographicError("Only Ed25519 private keys are supported")
        return cls(key)

    @classmethod
    def from_file(cls, path: str | os.PathLike[str]) -> KeyPair:
        content = Path(path).read_text(encoding="utf-8")
        if "-----BEGIN" in content:
            return cls.from_pem(content)
        return cls.from_base64(content)

    @property
    def public_key_bytes(self) -> bytes:
        return self._public_key.public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)

    @property
    def public_key_b64(self) -> str:
        return base64.b64encode(self.public_key_bytes).decode("ascii")

    @property
    def public_key_pem(self) -> str:
        return self._public_key.public_bytes(
            serialization.Encoding.PEM,
            serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode("ascii")

    @property
    def public_key_openssh(self) -> str:
        return self._public_key.public_bytes(
            serialization.Encoding.OpenSSH,
            serialization.PublicFormat.OpenSSH,
        ).decode("ascii")

    @property
    def private_key_bytes(self) -> bytes:
        return self._private_key.private_bytes(
            serialization.Encoding.Raw,
            serialization.PrivateFormat.Raw,
            serialization.NoEncryption(),
        )

    @property
    def private_key_b64(self) -> str:
        return base64.b64encode(self.private_key_bytes).decode("ascii")

    @property
    def private_key_pem(self) -> str:
        return self._private_key.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        ).decode("ascii")

    @property
    def fingerprint(self) -> str:
        return hashlib.sha256(self.public_key_bytes).hexdigest()

    @property
    def formatted_fingerprint(self) -> str:
        return format_fingerprint(self.fingerprint)

    def sign_bytes(self, payload: str | bytes) -> bytes:
        data = payload.encode("utf-8") if isinstance(payload, str) else payload
        return self._private_key.sign(data)

    def sign(self, payload: str | bytes, *, encoding: str = "base64") -> str:
        sig = self.sign_bytes(payload)
        if encoding == "hex":
            return sig.hex()
        if encoding == "base64":
            return base64.b64encode(sig).decode("ascii")
        raise ValueError("encoding must be 'base64' or 'hex'")

    def save_pem(self, path: str | os.PathLike[str]) -> Path:
        target = Path(path)
        target.write_text(self.private_key_pem, encoding="utf-8")
        try:
            os.chmod(target, 0o600)
        except OSError:
            pass
        return target
