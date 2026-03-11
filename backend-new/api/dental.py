from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import uuid
from pathlib import Path
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import DentalCase as DentalCaseModel
from engines.mesh_analyzer import mesh_analyzer
from engines.pricing_engine import pricing_engine

router = APIRouter()

class DentalCase(BaseModel):
    case_type: str  # study_model, crown, bridge, surgical_guide, full_arch
    patient_id: str
    dentist_name: str
    clinic_name: str
    special_instructions: Optional[str] = None

class DentalValidation(BaseModel):
    upload_id: str
    case_details: DentalCase
    scan_quality: str = "good"  # poor, fair, good, excellent

@router.post("/validate-scan")
async def validate_dental_scan(
    validation: DentalValidation,
    db: Session = Depends(get_db)
):
    """Validate dental scan for 3D printing"""
    
    try:
        # Find the uploaded scan file
        scan_file = None
        for ext in ['.stl', '.obj', '.ply']:
            potential_path = Path(f"storage/uploads/{validation.upload_id}{ext}")
            if potential_path.exists():
                scan_file = potential_path
                break
        
        if not scan_file:
            # Fallback path logic
            scan_file = Path(f"storage/uploads/{validation.upload_id}")
            if not scan_file.exists():
                raise HTTPException(status_code=404, detail="Scan file not found")
        
        # Analyze the dental scan
        analysis = mesh_analyzer.analyze_file(str(scan_file))
        
        if "error" in analysis:
            raise HTTPException(status_code=400, detail=f"Scan analysis failed: {analysis['error']}")
        
        # Dental-specific validation
        validation_results = _validate_dental_geometry(analysis, validation.case_details.case_type)
        
        # Calculate dental pricing
        pricing = pricing_engine.calculate_dental_price(validation.case_details.case_type, analysis)
        
        # Save to DB
        case_id = f"DENTAL-{str(uuid.uuid4())[:8].upper()}"
        
        new_case = DentalCaseModel(
            case_type=validation.case_details.case_type,
            patient_id=validation.case_details.patient_id,
            dentist_name=validation.case_details.dentist_name,
            clinic_name=validation.case_details.clinic_name,
            scan_file_path=str(scan_file),
            processed_file_path=str(scan_file), # same for until processed
            validation_status="valid" if validation_results["validation_passed"] else "flagged",
            special_instructions=validation.case_details.special_instructions,
            admin_approved=False
        )
        db.add(new_case)
        db.commit()
        db.refresh(new_case)
        
        return {
            "case_id": case_id, # Actually should use new_case.id but format differs
            "db_id": new_case.id,
            "validation_status": new_case.validation_status,
            "scan_analysis": analysis,
            "validation_results": validation_results,
            "pricing": pricing,
            "case_details": validation.case_details.dict(),
            "next_steps": [
                "Manual review by dental technician",
                "Admin approval required",
                "Processing time: 2-3 business days"
            ],
            "compliance_note": "Final approval must be obtained from licensed dentist"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")

def _validate_dental_geometry(analysis: Dict, case_type: str) -> Dict[str, Any]:
    """Perform dental-specific geometry validation"""
    
    issues = []
    recommendations = []
    
    # Check dimensions (dental models should be in mm)
    bbox = analysis.get('bbox_mm', [0, 0, 0])
    max_dim = max(bbox)
    min_dim = min([x for x in bbox if x > 0])
    
    # Dental model size validation
    if case_type in ['study_model', 'full_arch']:
        if max_dim > 100:  # Larger than 100mm
            issues.append("Model appears oversized for dental application")
        if max_dim < 20:   # Smaller than 20mm
            issues.append("Model appears too small for dental application")
    
    elif case_type in ['crown', 'bridge']:
        if max_dim > 30:
            issues.append("Crown/bridge model appears oversized")
        if max_dim < 5:
            issues.append("Crown/bridge model appears too small")
    
    # Check mesh quality
    if not analysis.get('is_watertight', False):
        issues.append("Scan is not watertight - may cause printing issues")
        recommendations.append("Mesh repair recommended before printing")
    
    # Check resolution/complexity
    face_count = analysis.get('faces_count', 0)
    if face_count < 1000:
        issues.append("Low resolution scan - may lack detail")
        recommendations.append("Higher resolution scan recommended")
    elif face_count > 100000:
        issues.append("Very high resolution - may need optimization")
        recommendations.append("Mesh simplification recommended")
    
    # Dental-specific checks
    volume_cm3 = analysis.get('volume_cm3', 0)
    if case_type == 'study_model' and volume_cm3 > 50:
        issues.append("Study model volume seems excessive")
    
    return {
        "validation_passed": len(issues) == 0,
        "issues": issues,
        "recommendations": recommendations,
        "quality_score": _calculate_dental_quality_score(analysis),
        "print_ready": len(issues) == 0 and analysis.get('is_watertight', False)
    }

def _calculate_dental_quality_score(analysis: Dict) -> float:
    """Calculate quality score for dental scan (0-10)"""
    
    score = 5.0  # Base score
    
    # Mesh quality
    if analysis.get('is_watertight', False):
        score += 2.0
    
    if analysis.get('is_winding_consistent', False):
        score += 1.0
    
    # Resolution appropriateness
    face_count = analysis.get('faces_count', 0)
    if 5000 <= face_count <= 50000:  # Good range for dental
        score += 1.5
    elif face_count < 1000:
        score -= 2.0
    elif face_count > 100000:
        score -= 1.0
    
    # Geometry checks
    bbox = analysis.get('bbox_mm', [0, 0, 0])
    if all(10 <= dim <= 80 for dim in bbox):  # Reasonable dental dimensions
        score += 0.5
    
    return min(10.0, max(0.0, score))

@router.get("/case-types")
async def get_dental_case_types():
    """Get available dental case types and specifications"""
    
    return {
        "case_types": {
            "study_model": {
                "description": "Diagnostic study models",
                "typical_size_mm": [40, 60, 20],
                "material": "Resin",
                "accuracy_required": "±0.1mm",
                "base_price": 1500
            },
            "crown": {
                "description": "Single crown models",
                "typical_size_mm": [12, 12, 8],
                "material": "High-precision resin",
                "accuracy_required": "±0.05mm",
                "base_price": 2500
            },
            "bridge": {
                "description": "Multi-unit bridge models",
                "typical_size_mm": [25, 12, 8],
                "material": "High-precision resin",
                "accuracy_required": "±0.05mm",
                "base_price": 3500
            },
            "surgical_guide": {
                "description": "Implant surgical guides",
                "typical_size_mm": [30, 25, 15],
                "material": "Biocompatible resin",
                "accuracy_required": "±0.02mm",
                "base_price": 4500
            },
            "full_arch": {
                "description": "Complete arch models",
                "typical_size_mm": [60, 40, 25],
                "material": "Resin",
                "accuracy_required": "±0.1mm",
                "base_price": 5500
            }
        },
        "requirements": {
            "file_formats": [".stl", ".obj", ".ply"],
            "max_file_size_mb": 100,
            "scan_resolution": "Minimum 50 microns",
            "approval_process": "Licensed dentist approval required",
            "turnaround_time": "2-3 business days"
        },
        "compliance": {
            "note": "All dental models are for educational and planning purposes only",
            "disclaimer": "Final clinical decisions must be made by licensed dental professionals",
            "quality_assurance": "Manual review by certified dental technician"
        }
    }

@router.get("/{case_id}/status")
async def get_dental_case_status(case_id: str):
    """Get dental case processing status"""
    
    # In a real implementation, this would query the database
    # For now, return mock status
    
    return {
        "case_id": case_id,
        "status": "under_review",
        "progress": {
            "scan_uploaded": True,
            "validation_complete": True,
            "technician_review": "in_progress",
            "admin_approval": "pending",
            "printing": "not_started"
        },
        "estimated_completion": "2-3 business days",
        "assigned_technician": "Dr. Smith (Certified Dental Technician)",
        "notes": "Scan quality is excellent. Minor mesh optimization applied."
    }

@router.post("/{case_id}/approve")
async def approve_dental_case(case_id: str, admin_notes: Optional[str] = None):
    """Admin approval for dental case (requires admin authentication)"""
    
    # This would require admin authentication in production
    
    return {
        "case_id": case_id,
        "status": "approved",
        "approved_by": "Admin",
        "approval_timestamp": "2024-01-15T10:30:00Z",
        "admin_notes": admin_notes,
        "next_step": "Ready for 3D printing",
        "estimated_print_time": "4-6 hours"
    }

@router.get("/quality-guidelines")
async def get_dental_quality_guidelines():
    """Get dental scan quality guidelines"""
    
    return {
        "scan_requirements": {
            "resolution": "50 microns or better",
            "coverage": "Complete area of interest",
            "artifacts": "Minimal motion artifacts",
            "contrast": "Clear tissue boundaries"
        },
        "file_preparation": {
            "units": "Millimeters (mm)",
            "orientation": "Occlusal surface facing up",
            "cleanup": "Remove scan artifacts and supports",
            "validation": "Ensure watertight mesh"
        },
        "quality_checklist": [
            "Scan covers complete area of interest",
            "No missing surfaces or holes",
            "Proper scale and orientation",
            "Clean mesh without artifacts",
            "Appropriate file size (under 100MB)"
        ]
    }