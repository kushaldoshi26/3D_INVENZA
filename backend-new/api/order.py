from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
import uuid

router = APIRouter()

class OrderRequest(BaseModel):
    upload_id: str
    customer_details: Dict[str, Any]
    service_type: str
    pricing: Dict[str, Any]

@router.post("/create")
async def create_order(request: OrderRequest):
    """Create new order"""
    
    order_id = f"3DI-{str(uuid.uuid4())[:8].upper()}"
    
    return {
        "order_id": order_id,
        "status": "created",
        "upload_id": request.upload_id,
        "service_type": request.service_type,
        "customer": request.customer_details,
        "pricing": request.pricing
    }

@router.get("/{order_id}")
async def get_order(order_id: str):
    """Get order details"""
    
    return {
        "order_id": order_id,
        "status": "processing",
        "estimated_completion": "2-3 days"
    }