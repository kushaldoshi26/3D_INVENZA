from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from database.connection import get_db
from database.models import Order, PrinterProfile, PrintResult, AdminLog, DentalCase
from pydantic import BaseModel
import datetime

router = APIRouter()

class PrinterAssignRequest(BaseModel):
    order_id: str
    printer_name: str

class PrintResultLog(BaseModel):
    order_id: str
    success: bool
    actual_time_minutes: float
    material_used_grams: float
    quality_rating: int # 1-5
    issues: Optional[List[str]] = None

@router.get("/print-queue")
async def get_print_queue(db: Session = Depends(get_db)):
    """Get pending orders ready for printing"""
    # Orders that are paid but not completed
    orders = db.query(Order).filter(
        Order.payment_status == "paid",
        Order.status.in_(["pending", "processing"])
    ).all()
    
    # Also fetch approved dental cases
    dental_cases = db.query(DentalCase).filter(
        DentalCase.admin_approved == True,
        DentalCase.validation_status == "valid"
    ).all()
    
    return {
        "orders": orders,
        "dental_cases": dental_cases,
        "count": len(orders) + len(dental_cases)
    }

@router.get("/printers")
async def get_printers(db: Session = Depends(get_db)):
    """Get all printer profiles"""
    printers = db.query(PrinterProfile).all()
    return printers

@router.post("/assign-printer")
async def assign_printer(request: PrinterAssignRequest, db: Session = Depends(get_db)):
    """Assign an order to a printer"""
    order = db.query(Order).filter(Order.order_id == request.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    printer = db.query(PrinterProfile).filter(PrinterProfile.name == request.printer_name).first()
    if not printer:
        raise HTTPException(status_code=404, detail="Printer not found")
        
    # Log action
    log = AdminLog(
        admin_id=1, # Mock admin ID
        action="assign_printer",
        target_id=request.order_id,
        details={"printer": request.printer_name}
    )
    db.add(log)
    
    order.status = "printing"
    db.commit()
    
    return {"status": "assigned", "printer": printer.name}

@router.post("/log-result")
async def log_print_result(result: PrintResultLog, db: Session = Depends(get_db)):
    """Log the result of a print job"""
    order = db.query(Order).filter(Order.order_id == result.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    print_result = PrintResult(
        order_id=result.order_id,
        actual_weight=result.material_used_grams,
        actual_time=result.actual_time_minutes,
        quality_rating=result.quality_rating,
        success=result.success,
        issues=result.issues
    )
    db.add(print_result)
    
    # Update order status
    if result.success:
        order.status = "completed"
    else:
        order.status = "failed"
        
    db.commit()
    
    # Log to AI training pool (Mock)
    # In real system, we'd add to AITrainingData table
    
    return {"status": "logged"}