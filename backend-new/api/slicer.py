from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import SlicingJob, Upload
from engines.slicer_layers import generate_layers
import uuid
import json
import os
from pathlib import Path

router = APIRouter()

def process_slicing_job(job_id: str, file_path: str, db: Session):
    """Background task to run slicing with progress updates"""
    from database.connection import SessionLocal
    db = SessionLocal()
    
    try:
        job = db.query(SlicingJob).filter(SlicingJob.job_id == job_id).first()
        if not job:
            return

        job.status = "processing"
        job.progress = 10
        db.commit()

        # Step 1: Mesh Analysis (Already done mostly during upload, but we simulate progress for UI)
        # If we wanted to re-run it: analysis = mesh_analyzer.analyze_file(file_path)
        job.progress = 40
        db.commit()

        # Step 2: Slicing (40–70%)
        result = generate_layers(file_path, layer_height=job.layer_height)
        
        job.progress = 70
        db.commit()

        if "layers" in result:
            # Step 3: Data Preparation (70–100%)
            output_dir = "storage/slicing"
            os.makedirs(output_dir, exist_ok=True)
            output_path = f"{output_dir}/{job_id}.json"
            
            with open(output_path, "w") as f:
                json.dump(result["layers"], f)

            job.status = "completed"
            job.progress = 100
            job.layer_data_path = output_path
        else:
            job.status = "failed"
            job.error_message = result.get("error", "Unknown error")

        db.commit()

    except Exception as e:
        if job:
            job.status = "failed"
            job.error_message = str(e)
            db.commit()
    finally:
        db.close()

@router.post("/slice/{upload_id}")
async def create_slicing_job(
    upload_id: int, 
    background_tasks: BackgroundTasks,
    layer_height: float = 0.2, 
    db: Session = Depends(get_db)
):
    """Start a slicing job for an uploaded file"""
    
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    # Check if file exists
    if not os.path.exists(upload.file_path):
         # Try to find it in storage/uploads if path is relative
         potential_path = f"storage/uploads/{upload.file_id}.stl" # Assumption
         if os.path.exists(potential_path):
             upload.file_path = potential_path
         else:
             raise HTTPException(status_code=404, detail="File not found on server")

    # Create job
    job_id = str(uuid.uuid4())
    new_job = SlicingJob(
        job_id=job_id,
        upload_id=upload_id,
        layer_height=layer_height,
        status="pending"
    )
    db.add(new_job)
    db.commit()

    # Start background task
    background_tasks.add_task(process_slicing_job, job_id, upload.file_path, db)

    return {"job_id": job_id, "status": "pending"}

@router.get("/slice/{job_id}")
async def get_slicing_status(job_id: str, db: Session = Depends(get_db)):
    """Get status and result of slicing job"""
    job = db.query(SlicingJob).filter(SlicingJob.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    response = {
        "job_id": job_id,
        "status": job.status,
        "progress": job.progress,
        "error": job.error_message
    }

    if job.status == "completed" and job.layer_data_path:
        # If requested, we could return the data here, but it might be large
        # For a viewer, usually we want to fetch the JSON file content
        pass
    
    return response

@router.get("/slice/{job_id}/data")
async def get_slicing_data(job_id: str, db: Session = Depends(get_db)):
    """Get the actual layer data for visualization"""
    job = db.query(SlicingJob).filter(SlicingJob.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.status != "completed":
        raise HTTPException(status_code=400, detail="Job not completed")
    
    if not job.layer_data_path or not os.path.exists(job.layer_data_path):
        raise HTTPException(status_code=500, detail="Data file missing")

    with open(job.layer_data_path, "r") as f:
        data = json.load(f)
        
    return data
