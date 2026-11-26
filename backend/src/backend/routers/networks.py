from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import ByteNetwork
from ..schemas import ByteNetworkOut

router = APIRouter(prefix="/networks", tags=["Byte Networks"])


def _serialize_network(net: ByteNetwork) -> ByteNetworkOut:
    return ByteNetworkOut(
        slug=net.slug,
        name=net.name,
        residenceDomain=net.residence_domain,
        description=net.description,
        issuer=net.issuer,
        policySummary=net.policy_summary,
        isPublic=net.is_public,
    )


@router.get("", response_model=list[ByteNetworkOut])
async def list_networks(db: AsyncSession = Depends(get_db)) -> list[ByteNetworkOut]:
    rows = (await db.execute(select(ByteNetwork).order_by(ByteNetwork.created_at.asc()))).scalars().all()
    return [_serialize_network(net) for net in rows]


@router.get("/{slug}", response_model=ByteNetworkOut)
async def get_network(slug: str, db: AsyncSession = Depends(get_db)) -> ByteNetworkOut:
    net = (await db.execute(select(ByteNetwork).where(ByteNetwork.slug == slug))).scalar_one_or_none()
    if net is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "NETWORK_NOT_FOUND", "message": f"Byte Network '{slug}' not found"},
        )
    return _serialize_network(net)
