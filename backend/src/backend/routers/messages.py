from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..auth import AuthActor, get_current_actor
from ..crypto import parse_ed25519_public_key, verify_ed25519_signature
from ..database import get_db
from ..models import Agent, AgentMessage, Credential
from ..schemas import AgentMessageOut, AgentMessageSendRequest

router = APIRouter(prefix="/messages", tags=["Descript Agent-to-Agent Messaging"])


def _ensure_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


def _match_active_credential(agent: Agent, message: bytes, signature: str) -> Credential | None:
    now = datetime.now(UTC)
    for cred in agent.credentials:
        if cred.status != "active":
            continue
        if cred.expires_at is not None:
            exp = _ensure_utc(cred.expires_at)
            if exp < now:
                continue
        try:
            raw_pub = parse_ed25519_public_key(cred.public_key)
            if verify_ed25519_signature(raw_pub, message, signature):
                return cred
        except Exception:
            continue
    return None


@router.post("", response_model=AgentMessageOut, status_code=status.HTTP_201_CREATED)
async def send_agent_message(
    payload: AgentMessageSendRequest,
    db: AsyncSession = Depends(get_db),
) -> AgentMessageOut:
    """Send a signed direct message from one agent to another through Descript."""
    # Load sender agent
    stmt_sender = (
        select(Agent)
        .where(Agent.id == payload.senderAgentId)
        .options(selectinload(Agent.credentials))
    )
    sender = (await db.execute(stmt_sender)).scalar_one_or_none()
    if sender is None or sender.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "SENDER_INACTIVE", "message": "Sender agent not found or inactive"},
        )

    # Load recipient agent
    stmt_recipient = select(Agent).where(Agent.id == payload.recipientAgentId)
    recipient = (await db.execute(stmt_recipient)).scalar_one_or_none()
    if recipient is None or recipient.status != "active":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "RECIPIENT_INACTIVE", "message": "Recipient agent not found or inactive"},
        )

    # Verify sender's signature over canonical message
    canonical = f"descript-msg-v1:{payload.senderAgentId}:{payload.recipientAgentId}:{payload.content}"
    matched = _match_active_credential(sender, canonical.encode("utf-8"), payload.signature)
    if not matched:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "INVALID_SIGNATURE", "message": "Sender signature verification failed"},
        )

    msg = AgentMessage(
        sender_agent_id=payload.senderAgentId,
        recipient_agent_id=payload.recipientAgentId,
        message_type=payload.messageType,
        subject=payload.subject,
        content=payload.content,
        message_metadata=payload.metadata,
        signature=payload.signature,
        status="unread",
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    return AgentMessageOut(
        id=msg.id,
        senderAgentId=msg.sender_agent_id,
        senderAgentName=sender.name,
        recipientAgentId=msg.recipient_agent_id,
        recipientAgentName=recipient.name,
        messageType=msg.message_type,
        subject=msg.subject,
        content=msg.content,
        metadata=msg.message_metadata,
        signature=msg.signature,
        status=msg.status,
        readAt=msg.read_at,
        createdAt=msg.created_at,
    )


@router.get("", response_model=list[AgentMessageOut])
async def list_agent_messages(
    agent_id: str = Query(..., alias="agentId"),
    box: str = Query(default="inbox", pattern="^(inbox|sent|all)$"),
    status_filter: str | None = Query(default=None, alias="status"),
    db: AsyncSession = Depends(get_db),
) -> list[AgentMessageOut]:
    """
    Retrieve messages programmatically for an agent (or viewable in the controller dashboard).
    """
    stmt = (
        select(AgentMessage)
        .options(selectinload(AgentMessage.sender), selectinload(AgentMessage.recipient))
        .order_by(AgentMessage.created_at.desc())
    )
    if box == "inbox":
        stmt = stmt.where(AgentMessage.recipient_agent_id == agent_id)
    elif box == "sent":
        stmt = stmt.where(AgentMessage.sender_agent_id == agent_id)
    else:
        stmt = stmt.where(
            or_(
                AgentMessage.sender_agent_id == agent_id,
                AgentMessage.recipient_agent_id == agent_id,
            )
        )

    if status_filter:
        stmt = stmt.where(AgentMessage.status == status_filter)

    rows = (await db.execute(stmt)).scalars().all()
    return [
        AgentMessageOut(
            id=r.id,
            senderAgentId=r.sender_agent_id,
            senderAgentName=r.sender.name if r.sender else None,
            recipientAgentId=r.recipient_agent_id,
            recipientAgentName=r.recipient.name if r.recipient else None,
            messageType=r.message_type,
            subject=r.subject,
            content=r.content,
            metadata=r.message_metadata,
            signature=r.signature,
            status=r.status,
            readAt=r.read_at,
            createdAt=r.created_at,
        )
        for r in rows
    ]


@router.patch("/{message_id}/read", response_model=AgentMessageOut)
async def mark_message_as_read(
    message_id: str,
    db: AsyncSession = Depends(get_db),
) -> AgentMessageOut:
    """Mark an agent message as read."""
    stmt = (
        select(AgentMessage)
        .where(AgentMessage.id == message_id)
        .options(selectinload(AgentMessage.sender), selectinload(AgentMessage.recipient))
    )
    msg = (await db.execute(stmt)).scalar_one_or_none()
    if msg is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    msg.status = "read"
    msg.read_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(msg)

    return AgentMessageOut(
        id=msg.id,
        senderAgentId=msg.sender_agent_id,
        senderAgentName=msg.sender.name if msg.sender else None,
        recipientAgentId=msg.recipient_agent_id,
        recipientAgentName=msg.recipient.name if msg.recipient else None,
        messageType=msg.message_type,
        subject=msg.subject,
        content=msg.content,
        metadata=msg.message_metadata,
        signature=msg.signature,
        status=msg.status,
        readAt=msg.read_at,
        createdAt=msg.created_at,
    )
