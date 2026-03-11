from fastapi import APIRouter
from engines.mesh_analyzer import mesh_analyzer

router = APIRouter()

@router.post("/{upload_id}")
async def analyze_uploaded_file(upload_id: str):
    """Analyze uploaded 3D model"""
    
    # Find the file
    from pathlib import Path
    
    file_path = None
    for ext in ['.stl', '.obj', '.ply', '.3mf']:
        potential_path = Path(f"storage/uploads/{upload_id}{ext}")
        if potential_path.exists():
            file_path = potential_path
            break
    
    if not file_path:
        return {"error": "File not found"}
    
    # Analyze the mesh
    analysis = mesh_analyzer.analyze_file(str(file_path))
    
    return {
        "upload_id": upload_id,
        "analysis": analysis,
        "file_path": str(file_path)
    }