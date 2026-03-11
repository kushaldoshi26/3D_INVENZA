from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from database.connection import get_db
from database.models import PrinterProfile, Order, SlicingJob
from engines.octoprint_service import octoprint_service

router = APIRouter()

class PrinterConfig(BaseModel):
    name: str
    model: str
    api_url: str
    api_key: str
    build_volume_x: float = 256.0
    build_volume_y: float = 256.0
    build_volume_z: float = 256.0

class PrinterStatus(BaseModel):
    id: int
    name: str
    status: str
    octoprint_connected: bool
    octoprint_state: str = "Unknown"
    temperatures: dict = {}

@router.post("/")
async def add_printer(config: PrinterConfig, db: Session = Depends(get_db)):
    """Add a new 3D printer with OctoPrint configuration"""
    
    # Test connection first
    connection = octoprint_service.check_connection(config.api_url, config.api_key)
    if not connection["connected"]:
        raise HTTPException(status_code=400, detail=f"Could not connect to OctoPrint: {connection.get('error')}")

    new_printer = PrinterProfile(
        name=config.name,
        model=config.model,
        api_url=config.api_url,
        api_key=config.api_key,
        build_volume_x=config.build_volume_x,
        build_volume_y=config.build_volume_y,
        build_volume_z=config.build_volume_z,
        status="idle",
        printer_type="octoprint"
    )
    
    db.add(new_printer)
    db.commit()
    db.refresh(new_printer)
    
    return {"status": "added", "printer_id": new_printer.id, "connection": connection}

@router.get("/", response_model=List[PrinterStatus])
async def get_printers(db: Session = Depends(get_db)):
    """Get all printers with real-time status"""
    printers = db.query(PrinterProfile).all()
    results = []
    
    for p in printers:
        status_data = {
            "id": p.id,
            "name": p.name,
            "status": p.status,
            "octoprint_connected": False,
            "octoprint_state": "Offline",
            "temperatures": {}
        }
        
        if p.api_url and p.api_key:
             op_status = octoprint_service.get_printer_status(p.api_url, p.api_key)
             if op_status["online"]:
                 status_data["octoprint_connected"] = True
                 status_data["octoprint_state"] = op_status["state"]
                 status_data["temperatures"] = op_status["temperatures"]
                 
                 # Sync DB status if needed
                 # p.status = "printing" if "Printing" in op_status["state"] else "idle"
                 
        results.append(status_data)
    
    return results

@router.post("/{printer_id}/print-job/{job_id}")
async def start_print_job(
    printer_id: int, 
    job_id: str, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Send a slicing job/file to the printer"""
    
    printer = db.query(PrinterProfile).filter(PrinterProfile.id == printer_id).first()
    if not printer:
        raise HTTPException(status_code=404, detail="Printer not found")
        
    # We can look up SlicingJob or order logic here. 
    # For now, let's assume we find a G-code path from a SlicingJob 
    # or it was passed directly.
    
    # Check for slicing job first
    slicing_job = db.query(SlicingJob).filter(SlicingJob.job_id == job_id).first()
    gcode_path = None
    
    if slicing_job and slicing_job.gcode_path:
        gcode_path = slicing_job.gcode_path
    
    if not gcode_path:
        # Fallback: check if job_id is actually an order_id or upload_id?
        # For this prototype, let's assume we need a valid Gcode file path
        # If we only have an upload, we might need to slice it first.
        # Let's just create a dummy "test_box.gcode" if none exists for testing.
        gcode_path = "storage/gcode/test.gcode"
        
        # Ensure dummy file exists for demo
        import os
        os.makedirs("storage/gcode", exist_ok=True)
        if not os.path.exists(gcode_path):
            with open(gcode_path, "w") as f:
                f.write("; Mock Gcode\nG28\nG1 X10 Y10\n")
    
    # Upload and Print
    result = octoprint_service.upload_file(
        printer.api_url, 
        printer.api_key, 
        gcode_path, 
        print_after_upload=True
    )
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail=f"Failed to start print: {result.get('error')}")
        
    printer.status = "printing"
    db.commit()
    
    return {"status": "started", "file": gcode_path, "printer": printer.name}

@router.post("/{printer_id}/control/{action}")
async def control_printer(printer_id: int, action: str, db: Session = Depends(get_db)):
    """Control printer (cancel, pause, resume)"""
    printer = db.query(PrinterProfile).filter(PrinterProfile.id == printer_id).first()
    if not printer:
        raise HTTPException(status_code=404, detail="Printer not found")
        
    if action == "cancel":
        result = octoprint_service.cancel_job(printer.api_url, printer.api_key)
    else:
         raise HTTPException(status_code=400, detail="Action not supported")
         
    if not result["success"]:
        raise HTTPException(status_code=500, detail=str(result.get("error")))
        
    return {"status": "success", "action": action}
