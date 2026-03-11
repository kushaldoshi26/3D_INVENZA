from fastapi import APIRouter
from pydantic import BaseModel
from engines.pricing_engine import pricing_engine

router = APIRouter()

class PricingRequest(BaseModel):
    upload_id: str
    material: str = "PLA"
    tier: str = "individual"
    quantity: int = 1

@router.post("/calculate")
async def calculate_pricing(request: PricingRequest):
    """Calculate pricing for uploaded model"""
    
    # This would integrate with the analysis results
    # For now, return sample pricing
    
    return {
        "upload_id": request.upload_id,
        "pricing": {
            "material": request.material,
            "tier": request.tier,
            "quantity": request.quantity,
            "unit_price": 150,
            "total_price": 150 * request.quantity,
            "currency": "INR"
        }
    }