from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
import uuid
import json
import os
from pathlib import Path
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import CustomGift
from engines.pricing_engine import pricing_engine
from engines.gift_generator import gift_generator

router = APIRouter()

class GiftCustomization(BaseModel):
    gift_type: str  # keychain, phone_case, photo_frame, lithophane_lamp, mini_trophy
    customization_data: Dict[str, Any]
    customization_level: str = "basic"  # basic, premium

class KeychainCustomization(BaseModel):
    text: str
    font: str = "Arial"
    size_mm: float = 30.0
    thickness_mm: float = 3.0
    shape: str = "rectangle"  # rectangle, circle, heart, star

class PhoneCaseCustomization(BaseModel):
    phone_model: str  # iPhone_14, Samsung_S23, etc.
    design_type: str = "text"  # text, image, pattern
    text: Optional[str] = None
    pattern: Optional[str] = None
    color_scheme: str = "default"

@router.post("/keychain/generate")
async def generate_custom_keychain(
    customization: KeychainCustomization,
    db: Session = Depends(get_db)
):
    """Generate custom keychain 3D model"""
    
    try:
        # Validate text
        if len(customization.text) > 20:
            raise HTTPException(status_code=400, detail="Text too long (max 20 characters)")
        
        # Calculate volume and pricing (Estimate first)
        volume_cm3_est = (customization.size_mm * customization.size_mm * 0.6 * customization.thickness_mm) / 1000
        
        # Get gift pricing
        pricing = pricing_engine.calculate_gift_price("keychain", "basic")
        
        # Real Generation
        result = gift_generator.generate_keychain(
            text=customization.text,
            shape=customization.shape,
            size_mm=customization.size_mm,
            thickness_mm=customization.thickness_mm
        )
        
        if result["status"] == "failed":
             raise HTTPException(status_code=500, detail=result.get("error", "Generation failed"))
             
        output_path = result["file_path"]
        volume_cm3 = result.get("volume_cm3", volume_cm3_est)
        
        # Save to DB
        new_gift = CustomGift(
            gift_type="keychain",
            customization_data=customization.dict(),
            template_used=customization.shape,
            generated_file_path=output_path,
            status="generated"
        )
        db.add(new_gift)
        db.commit()
        db.refresh(new_gift)

        model_data = {
            "generation_id": new_gift.id,
            "gift_type": "keychain",
            "parameters": customization.dict(),
            "output_file": output_path
        }
        
        return {
            "generation_id": str(new_gift.id),
            "status": "generated",
            "model_data": model_data,
            "pricing": pricing,
            "estimated_volume_cm3": round(volume_cm3, 2),
            "output_file": output_path,
            "preview_available": True
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@router.post("/phone-case/generate")
async def generate_phone_case(customization: PhoneCaseCustomization):
    """Generate custom phone case"""
    
    # Phone model dimensions (simplified)
    phone_dimensions = {
        "iPhone_14": {"length": 147, "width": 72, "thickness": 8},
        "iPhone_15": {"length": 148, "width": 72, "thickness": 8},
        "Samsung_S23": {"length": 147, "width": 71, "thickness": 8},
        "OnePlus_11": {"length": 164, "width": 75, "thickness": 9}
    }
    
    if customization.phone_model not in phone_dimensions:
        raise HTTPException(status_code=400, detail="Unsupported phone model")
    
    try:
        generation_id = str(uuid.uuid4())
        dims = phone_dimensions[customization.phone_model]
        
        # Calculate case dimensions (add margins)
        case_dims = {
            "length_mm": dims["length"] + 4,
            "width_mm": dims["width"] + 4,
            "thickness_mm": dims["thickness"] + 2
        }
        
        model_data = {
            "generation_id": generation_id,
            "gift_type": "phone_case",
            "phone_model": customization.phone_model,
            "parameters": {
                "design_type": customization.design_type,
                "text": customization.text,
                "pattern": customization.pattern,
                "color_scheme": customization.color_scheme
            },
            "dimensions": case_dims
        }
        
        # Calculate volume
        volume_cm3 = (case_dims["length_mm"] * case_dims["width_mm"] * case_dims["thickness_mm"]) / 1000
        
        # Get pricing
        pricing = pricing_engine.calculate_gift_price("phone_case", "basic")
        
        return {
            "generation_id": generation_id,
            "status": "generated",
            "model_data": model_data,
            "pricing": pricing,
            "estimated_volume_cm3": round(volume_cm3, 2),
            "material_recommendation": "TPU",  # Flexible material for phone cases
            "output_file": f"storage/outputs/{generation_id}_phone_case.stl"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@router.post("/lithophane/generate")
async def generate_lithophane_lamp(image_upload_id: str, lamp_style: str = "cylinder"):
    """Generate lithophane lamp from uploaded image"""
    
    try:
        generation_id = str(uuid.uuid4())
        
        # Validate image exists
        image_path = Path(f"storage/uploads/{image_upload_id}.jpg")
        if not image_path.exists():
            image_path = Path(f"storage/uploads/{image_upload_id}.png")
        
        if not image_path.exists():
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Lamp specifications
        lamp_specs = {
            "cylinder": {"diameter_mm": 100, "height_mm": 120},
            "square": {"width_mm": 100, "height_mm": 120},
            "heart": {"width_mm": 100, "height_mm": 100}
        }
        
        if lamp_style not in lamp_specs:
            raise HTTPException(status_code=400, detail="Invalid lamp style")
        
        specs = lamp_specs[lamp_style]
        
        model_data = {
            "generation_id": generation_id,
            "gift_type": "lithophane_lamp",
            "parameters": {
                "image_path": str(image_path),
                "lamp_style": lamp_style,
                "specifications": specs
            }
        }
        
        # Calculate volume (hollow lamp)
        if lamp_style == "cylinder":
            volume_cm3 = 3.14159 * (specs["diameter_mm"]/2)**2 * specs["height_mm"] / 1000 * 0.3  # 30% fill
        else:
            volume_cm3 = specs["width_mm"] * specs["width_mm"] * specs["height_mm"] / 1000 * 0.3
        
        # Get pricing
        pricing = pricing_engine.calculate_gift_price("lithophane_lamp", "premium")
        
        return {
            "generation_id": generation_id,
            "status": "generated",
            "model_data": model_data,
            "pricing": pricing,
            "estimated_volume_cm3": round(volume_cm3, 2),
            "processing_time": "24-48 hours",  # Lithophanes need manual review
            "includes": ["3D Model", "LED Base", "Assembly Instructions"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@router.get("/templates")
async def get_gift_templates():
    """Get available gift templates and customization options"""
    
    return {
        "keychains": {
            "shapes": ["rectangle", "circle", "heart", "star", "hexagon"],
            "fonts": ["Arial", "Times", "Impact", "Comic Sans"],
            "max_text_length": 20,
            "size_range_mm": [20, 50]
        },
        "phone_cases": {
            "supported_models": [
                "iPhone_14", "iPhone_15", "Samsung_S23", "OnePlus_11"
            ],
            "design_types": ["text", "pattern", "image"],
            "patterns": ["geometric", "floral", "abstract", "minimal"]
        },
        "lithophane_lamps": {
            "styles": ["cylinder", "square", "heart"],
            "supported_formats": ["jpg", "png"],
            "max_image_size_mb": 10
        },
        "photo_frames": {
            "sizes": ["4x6", "5x7", "8x10"],
            "styles": ["classic", "modern", "ornate"],
            "customization": ["text_engraving", "date_stamp"]
        }
    }

@router.get("/{generation_id}/status")
async def get_generation_status(generation_id: str):
    """Get gift generation status"""
    
    # Check if output file exists
    output_files = list(Path("storage/outputs").glob(f"{generation_id}_*"))
    
    if output_files:
        return {
            "generation_id": generation_id,
            "status": "completed",
            "output_files": [str(f) for f in output_files],
            "ready_for_order": True
        }
    else:
        return {
            "generation_id": generation_id,
            "status": "processing",
            "estimated_completion": "5-10 minutes"
        }