from __future__ import annotations
from django.core import signing

import secrets
from datetime import timedelta
from django.utils import timezone

SIGNER = signing.TimestampSigner(salt="email-verify")

def make_email_token(user_id: int) -> str:
    return SIGNER.sign(str(user_id))

def read_email_token(token: str, max_age=60*60*24) -> int:
    raw = SIGNER.unsign(token, max_age=max_age)
    return int(raw)


def new_token(length: int = 32) -> str:
    # 64 hex chars by default (length*2)
    return secrets.token_hex(length)