from __future__ import annotations

import argparse
import json
from pathlib import Path

from .client import DescriptClient
from .crypto import KeyPair, verify_bytecript_signature


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="descript", description="Descript AI Agent Identity CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    health_p = sub.add_parser("health", help="Check Descript API and database health")
    health_p.add_argument("--base-url", default="http://localhost:8000")

    keygen_p = sub.add_parser("keygen", help="Generate a new Ed25519 keypair locally")
    keygen_p.add_argument("--out", help="Write PKCS#8 private key PEM to file")

    lookup_p = sub.add_parser("lookup", help="Fetch public Bytecript profile for an agent ID")
    lookup_p.add_argument("agent_id")
    lookup_p.add_argument("--base-url", default="http://localhost:8000")

    verify_p = sub.add_parser("verify-bytecript", help="Verify an exported Bytecript JSON file offline")
    verify_p.add_argument("file")

    args = parser.parse_args(argv)

    if args.command == "health":
        with DescriptClient(base_url=args.base_url) as client:
            status = client.health()
            print(json.dumps(status.model_dump(mode="json"), indent=2))
            return 0 if status.status == "ok" and status.databaseConnected else 1

    if args.command == "keygen":
        kp = KeyPair.generate()
        if args.out:
            out_path = kp.save_pem(args.out)
            print(f"Saved private key to {out_path} (chmod 600)")
        else:
            print(kp.private_key_pem)
        print(f"Public Key (Base64): {kp.public_key_b64}")
        print(f"Fingerprint (SHA256): {kp.formatted_fingerprint}")
        return 0

    if args.command == "lookup":
        with DescriptClient(base_url=args.base_url) as client:
            agent = client.agents.get_public(args.agent_id)
            print(json.dumps(agent.model_dump(mode="json"), indent=2))
        return 0

    if args.command == "verify-bytecript":
        doc = json.loads(Path(args.file).read_text(encoding="utf-8"))
        valid = verify_bytecript_signature(doc)
        print("Signature valid:" if valid else "Signature INVALID!", valid)
        return 0 if valid else 1

    return 1
