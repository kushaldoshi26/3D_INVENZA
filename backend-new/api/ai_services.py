from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import uuid
import json
from pathlib import Path
from engines.ai_engine import ai_engine

router = APIRouter()

class TextTo3DRequest(BaseModel):
    prompt: str
    style: str = "realistic"  # realistic, cartoon, mechanical, organic
    complexity: str = "medium"  # simple, medium, complex
    size_preference: str = "medium"  # small, medium, large

class ImageTo3DRequest(BaseModel):
    image_upload_id: str
    conversion_type: str = "relief"  # relief, full_3d, lithophane
    depth_mm: float = 5.0
    base_thickness_mm: float = 2.0

@router.post("/text-to-3d")
async def generate_3d_from_text(request: TextTo3DRequest):
    """Generate 3D model from text description"""
    
    try:
        # Validate prompt
        if len(request.prompt) < 5:
            raise HTTPException(status_code=400, detail="Prompt too short (minimum 5 characters)")
        
        if len(request.prompt) > 200:
            raise HTTPException(status_code=400, detail="Prompt too long (maximum 200 characters)")
        
        # Generate unique ID
        generation_id = str(uuid.uuid4())
        
        # Use AI to refine prompt
        refined_prompt = ai_engine.refine_prompt(request.prompt, request.style)
        
        # Simulate AI processing (in real implementation, integrate with AI models)
        processing_data = {
            "generation_id": generation_id,
            "original_prompt": request.prompt,
            "refined_prompt": refined_prompt,
            "parameters": {
                "style": request.style,
                "complexity": request.complexity,
                "size_preference": request.size_preference
            },
            "estimated_processing_time": _estimate_processing_time(request.complexity),
            "status": "processing"
        }
        
        # Estimate output specifications
        estimated_specs = _estimate_model_specs(request)
        
        return {
            "generation_id": generation_id,
            "status": "initiated",
            "processing_data": processing_data,
            "estimated_specs": estimated_specs,
            "estimated_completion": "5-15 minutes",
            "cost_estimate": _calculate_ai_cost(request.complexity),
            "preview_available": False,
            "webhook_url": f"/api/ai/{generation_id}/status"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@router.post("/image-to-3d")
async def generate_3d_from_image(request: ImageTo3DRequest):
    """Generate 3D model from uploaded image"""
    
    try:
        # Validate image exists
        image_path = None
        for ext in ['.jpg', '.jpeg', '.png']:
            potential_path = Path(f"storage/uploads/{request.image_upload_id}{ext}")
            if potential_path.exists():
                image_path = potential_path
                break
        
        if not image_path:
            raise HTTPException(status_code=404, detail="Image not found")
        
        generation_id = str(uuid.uuid4())
        
        # Process based on conversion type
        if request.conversion_type == "relief":
            result = _process_relief_conversion(image_path, request, generation_id)
        elif request.conversion_type == "lithophane":
            result = _process_lithophane_conversion(image_path, request, generation_id)
        else:  # full_3d
            result = _process_full_3d_conversion(image_path, request, generation_id)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image to 3D conversion failed: {str(e)}")

def _estimate_processing_time(complexity: str) -> int:
    """Estimate AI processing time in minutes"""
    time_map = {
        "simple": 3,
        "medium": 8,
        "complex": 15
    }
    return time_map.get(complexity, 8)

def _estimate_model_specs(request: TextTo3DRequest) -> Dict[str, Any]:
    """Estimate output model specifications"""
    
    size_map = {
        "small": {"max_dim_mm": 50, "volume_cm3": 10},
        "medium": {"max_dim_mm": 100, "volume_cm3": 50},
        "large": {"max_dim_mm": 200, "volume_cm3": 200}
    }
    
    specs = size_map.get(request.size_preference, size_map["medium"])
    
    return {
        "estimated_dimensions_mm": specs["max_dim_mm"],
        "estimated_volume_cm3": specs["volume_cm3"],
        "estimated_weight_g": specs["volume_cm3"] * 1.24,  # PLA density
        "recommended_material": "PLA",
        "estimated_print_time_hours": specs["volume_cm3"] * 0.1
    }

def _calculate_ai_cost(complexity: str) -> Dict[str, Any]:
    """Calculate AI generation cost"""
    
    base_costs = {
        "simple": 99,
        "medium": 199,
        "complex": 399
    }
    
    cost = base_costs.get(complexity, 199)
    
    return {
        "ai_generation_cost": cost,
        "includes": ["AI Processing", "3D Model Generation", "Basic Optimization"],
        "currency": "INR",
        "note": "Printing cost calculated separately"
    }

def _process_relief_conversion(image_path: Path, request: ImageTo3DRequest, generation_id: str) -> Dict[str, Any]:
    """Process image to relief 3D conversion"""
    
    # Simulate relief processing
    estimated_dimensions = {
        "width_mm": 100,
        "height_mm": 100,
        "depth_mm": request.depth_mm,
        "base_thickness_mm": request.base_thickness_mm
    }
    
    total_thickness = request.depth_mm + request.base_thickness_mm
    volume_cm3 = (100 * 100 * total_thickness) / 1000
    
    return {
        "generation_id": generation_id,
        "conversion_type": "relief",
        "status": "processing",
        "input_image": str(image_path),
        "parameters": {
            "depth_mm": request.depth_mm,
            "base_thickness_mm": request.base_thickness_mm
        },
        "estimated_specs": {
            "dimensions_mm": estimated_dimensions,
            "volume_cm3": round(volume_cm3, 2),
            "weight_g": round(volume_cm3 * 1.24, 2)
        },
        "estimated_completion": "3-5 minutes",
        "output_file": f"storage/outputs/{generation_id}_relief.stl"
    }

def _process_lithophane_conversion(image_path: Path, request: ImageTo3DRequest, generation_id: str) -> Dict[str, Any]:
    """Process image to lithophane conversion"""
    
    return {
        "generation_id": generation_id,
        "conversion_type": "lithophane",
        "status": "processing",
        "input_image": str(image_path),
        "parameters": {
            "thickness_variation": "0.5-3.0mm",
            "resolution": "0.2mm layers"
        },
        "estimated_specs": {
            "dimensions_mm": {"width": 100, "height": 100, "thickness": 3},
            "volume_cm3": 15,
            "weight_g": 18.6
        },
        "special_requirements": {
            "material": "White PLA recommended",
            "layer_height": "0.1mm for best quality",
            "infill": "100%"
        },
        "estimated_completion": "5-8 minutes"
    }

def _process_full_3d_conversion(image_path: Path, request: ImageTo3DRequest, generation_id: str) -> Dict[str, Any]:
    """Process image to full 3D model conversion"""
    
    return {
        "generation_id": generation_id,
        "conversion_type": "full_3d",
        "status": "processing",
        "input_image": str(image_path),
        "note": "Full 3D reconstruction from single image",
        "estimated_specs": {
            "dimensions_mm": {"width": 80, "height": 80, "depth": 60},
            "volume_cm3": 25,
            "weight_g": 31
        },
        "accuracy_note": "Single-image 3D reconstruction has limitations",
        "estimated_completion": "10-15 minutes"
    }

@router.get("/{generation_id}/status")
async def get_ai_generation_status(generation_id: str):
    """Get AI generation status"""
    
    # Check if output file exists
    output_files = list(Path("storage/outputs").glob(f"{generation_id}_*"))
    
    if output_files:
        return {
            "generation_id": generation_id,
            "status": "completed",
            "output_files": [str(f) for f in output_files],
            "ready_for_analysis": True,
            "next_steps": ["Download model", "Analyze geometry", "Calculate printing cost"]
        }
    else:
        return {
            "generation_id": generation_id,
            "status": "processing",
            "progress": "65%",
            "estimated_remaining": "3-5 minutes"
        }

@router.get("/capabilities")
async def get_ai_capabilities():
    """Get AI service capabilities and limitations"""
    
    return {
        "text_to_3d": {
            "supported_prompts": [
                "Objects and items",
                "Simple characters",
                "Mechanical parts",
                "Decorative items"
            ],
            "limitations": [
                "Complex scenes not supported",
                "Human faces limited accuracy",
                "Very detailed textures not preserved"
            ],
            "styles": ["realistic", "cartoon", "mechanical", "organic"],
            "complexity_levels": ["simple", "medium", "complex"]
        },
        "image_to_3d": {
            "supported_formats": ["jpg", "jpeg", "png"],
            "max_file_size_mb": 10,
            "conversion_types": {
                "relief": "2.5D relief from image",
                "lithophane": "Light-transmitting 3D image",
                "full_3d": "3D reconstruction (limited accuracy)"
            },
            "best_results": [
                "High contrast images",
                "Clear subject boundaries",
                "Good lighting"
            ]
        },
        "processing_times": {
            "text_to_3d_simple": "3-5 minutes",
            "text_to_3d_complex": "10-15 minutes",
            "image_relief": "2-4 minutes",
            "image_lithophane": "5-8 minutes",
            "image_full_3d": "10-15 minutes"
        },
        "pricing": {
            "text_to_3d": "₹99-399 (complexity based)",
            "image_to_3d": "₹149-299 (type based)",
            "note": "3D printing cost calculated separately"
        }
    }

@router.post("/{generation_id}/enhance")
async def enhance_ai_model(generation_id: str, enhancement_type: str = "optimize"):
    """Enhance AI-generated model"""
    
    enhancement_types = {
        "optimize": "Reduce file size while preserving quality",
        "repair": "Fix mesh issues and make watertight",
        "smooth": "Smooth surfaces for better printing",
        "detail": "Enhance fine details"
    }
    
    if enhancement_type not in enhancement_types:
        raise HTTPException(status_code=400, detail="Invalid enhancement type")
    
    return {
        "generation_id": generation_id,
        "enhancement_type": enhancement_type,
        "description": enhancement_types[enhancement_type],
        "status": "processing",
        "estimated_completion": "2-3 minutes",
        "additional_cost": 49  # ₹49 for enhancement
    }