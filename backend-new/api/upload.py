from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
import uuid
import os
from pathlib import Path
import aiofiles
from sqlalchemy.orm import Session
import json
from database.connection import get_db
from database.models import Upload, GeometryAnalysis, Pricing
from engines.mesh_analyzer import mesh_analyzer
from engines.pricing_engine import pricing_engine

router = APIRouter()

UPLOAD_DIR = Path("storage/uploads")
PROCESSED_DIR = Path("storage/processed")

# Ensure directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    category: str = Form("normal"),  # normal, gift, dental, ai
    service_type: str = Form("printing"),  # printing, modeling, analysis
    user_tier: str = Form("individual"),  # individual, business, dental, enterprise
    db: Session = Depends(get_db)
):
    """Universal file upload for all services"""
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Check file extension
    ext = Path(file.filename).suffix.lower()
    allowed_extensions = ['.stl', '.obj', '.ply', '.3mf', '.step', '.stp', '.jpg', '.png']
    
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
    
    # Generate unique file ID
    file_id = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{file_id}{ext}"
    
    try:
        # Save uploaded file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Create DB Upload record
        db_upload = Upload(
            file_id=file_id,
            original_name=file.filename,
            file_path=str(file_path),
            file_size=len(content),
            category=category,
            status="uploaded"
        )
        db.add(db_upload)
        db.commit()
        db.refresh(db_upload)

        # Prepare response
        response = {
            "upload_id": file_id,
            "db_id": db_upload.id,
            "original_name": file.filename,
            "file_path": str(file_path),
            "file_size": len(content),
            "category": category,
            "service_type": service_type,
            "user_tier": user_tier,
            "status": "uploaded"
        }
        
        # Process based on category
        if category in ["normal", "dental"] and ext in ['.stl', '.obj', '.ply', '.3mf']:
            # 3D model analysis
            analysis = mesh_analyzer.analyze_file(str(file_path))
            
            # Printer Validation
            import trimesh
            try:
                mesh = trimesh.load(str(file_path))
                if isinstance(mesh, trimesh.Scene):
                     mesh = mesh.dump().sum()
                printer_check = mesh_analyzer.validate_printer_compatibility(mesh)
                response["printer_check"] = printer_check
            except Exception:
                response["printer_check"] = {"compatible": False, "error": "Could not validate"}

            response["analysis"] = analysis
            
            # Save Analysis to DB
            if "error" not in analysis:
                db_analysis = GeometryAnalysis(
                    upload_id=db_upload.id,
                    volume_cm3=analysis.get('volume_cm3'),
                    weight_grams=analysis.get('weight_pla_g'), # Approximation
                    bbox_x=analysis.get('bbox_mm', [0,0,0])[0],
                    bbox_y=analysis.get('bbox_mm', [0,0,0])[1],
                    bbox_z=analysis.get('bbox_mm', [0,0,0])[2],
                    faces_count=analysis.get('faces_count'),
                    vertices_count=analysis.get('vertices_count'),
                    is_watertight=analysis.get('is_watertight'),
                    complexity_score=analysis.get('complexity_score'),
                    print_time_hours=analysis.get('print_time_hours')
                )
                db.add(db_analysis)
                
                # Calculate pricing
                if category == "dental":
                    pricing_data = pricing_engine.calculate_dental_price("study_model", analysis)
                else:
                    pricing_data = pricing_engine.calculate_printing_price(analysis, "PLA", user_tier)
                
                response["pricing"] = pricing_data
                
                # Save Pricing to DB
                db_pricing = Pricing(
                    upload_id=db_upload.id,
                    material=pricing_data.get('material', 'PLA'),
                    material_cost=pricing_data.get('material_cost', 0),
                    machine_cost=pricing_data.get('machine_cost', 0),
                    service_fee=pricing_data.get('service_fee', 0),
                    total_price=pricing_data.get('final_price', 0),
                    pricing_tier=user_tier
                )
                db.add(db_pricing)
                
                # Log to AI Training Pool (CRITICAL Requirement)
                from database.models import AITrainingData
                training_data = AITrainingData(
                    input_type="scan",
                    input_data={
                        "analysis": analysis,
                        "printer_check": response.get("printer_check"),
                        "category": category
                    },
                    output_file_path=str(file_path),
                    quality_score=None, # To be filled after print result
                    labeled=False
                )
                db.add(training_data)
                
                db.commit()
        
        elif category == "gift":
            gift_pricing = pricing_engine.calculate_gift_price("keychain", "basic")
            response["pricing"] = gift_pricing
        
        elif category == "ai" and ext in ['.jpg', '.png']:
            response["ai_ready"] = True
            response["services_available"] = ["image_to_3d", "text_to_3d", "enhancement"]
        
        return JSONResponse(content=response)
        
    except Exception as e:
        if file_path.exists():
            # file_path.unlink() # Keep for debug
            pass
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@router.get("/{upload_id}/status")
async def get_upload_status(upload_id: str):
    """Get upload processing status"""
    
    # Check if file exists
    for ext in ['.stl', '.obj', '.ply', '.3mf', '.jpg', '.png']:
        file_path = UPLOAD_DIR / f"{upload_id}{ext}"
        if file_path.exists():
            return {
                "upload_id": upload_id,
                "status": "completed",
                "file_exists": True,
                "file_path": str(file_path)
            }
    
    return {
        "upload_id": upload_id,
        "status": "not_found",
        "file_exists": False
    }

@router.post("/{upload_id}/reanalyze")
async def reanalyze_file(upload_id: str, material: str = "PLA", tier: str = "individual"):
    """Reanalyze file with different parameters"""
    
    # Find the file
    file_path = None
    for ext in ['.stl', '.obj', '.ply', '.3mf']:
        potential_path = UPLOAD_DIR / f"{upload_id}{ext}"
        if potential_path.exists():
            file_path = potential_path
            break
    
    if not file_path:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        # Re-run analysis
        analysis = mesh_analyzer.analyze_file(str(file_path))
        
        if "error" in analysis:
            return {"error": analysis["error"]}
        
        # Calculate new pricing
        pricing = pricing_engine.calculate_printing_price(analysis, material, tier)
        
        return {
            "upload_id": upload_id,
            "analysis": analysis,
            "pricing": pricing,
            "parameters": {
                "material": material,
                "tier": tier
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reanalysis failed: {str(e)}")

@router.delete("/{upload_id}")
async def delete_upload(upload_id: str):
    """Delete uploaded file"""
    
    deleted_files = []
    
    # Check all possible extensions
    for ext in ['.stl', '.obj', '.ply', '.3mf', '.jpg', '.png']:
        file_path = UPLOAD_DIR / f"{upload_id}{ext}"
        if file_path.exists():
            file_path.unlink()
            deleted_files.append(str(file_path))
    
    if not deleted_files:
        raise HTTPException(status_code=404, detail="File not found")
    
    return {
        "upload_id": upload_id,
        "deleted_files": deleted_files,
        "status": "deleted"
    }