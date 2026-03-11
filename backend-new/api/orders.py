from fastapi import APIRouter, HTTPException, Depends, Body
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import Order, User
from pydantic import BaseModel
from typing import Dict, Any, Optional
import uuid
from datetime import datetime

router = APIRouter()

class ShippingSchema(BaseModel):
    speed: str
    cost: float
    courier: str
    eta: str

class OrderCreate(BaseModel):
    customer: Dict[str, Any]
    estimate: Dict[str, Any]
    fileId: Optional[str] = None
    paymentMethod: str
    shipping: ShippingSchema
    codExtra: float
    total: float

@router.post("/")
async def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    # Create unique order ID
    order_id = "INV-" + uuid.uuid4().hex[:8].upper()
    
    # Check for user (simplified: assume guest or handle user_id later if auth present)
    # user_id = ... 
    
    new_order = Order(
        order_id=order_id,
        user_id=None, # Guest for now
        service_type="printing", 
        status="pending",
        payment_status="unpaid" if order_data.paymentMethod != "COD" else "cod_pending",
        total_amount=order_data.total,
        shipping_address=order_data.customer
    )
    
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    return {"success": True, "order": {"orderId": order_id, "status": new_order.status}}

@router.get("/{order_id}")
async def get_order(order_id: str, db: Session = Depends(get_db)):
    """Get order details"""
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.get("/")
async def get_orders(db: Session = Depends(get_db)):
    """Get all orders (simplified for now)"""
    orders = db.query(Order).all()
    return orders

class PaymentOrderCreate(BaseModel):
    amount: float
    orderId: str

@router.post("/{order_id}/pay")
async def confirm_payment(order_id: str, db: Session = Depends(get_db)):
    """Mark order as paid (Prototype/Bypass Mode)"""
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order.payment_status = "paid"
    order.status = "processing" # Move to processing immediately for prototype
    db.commit()
    
    return {"status": "success", "message": "Payment confirmed (Prototype)"}

class PaymentOrderCreate(BaseModel):
    amount: float
    orderId: str

# Keep this for reference or future use, but we will bypass it in frontend
@router.post("/payment/create-order")
async def create_payment_order(data: PaymentOrderCreate):
    # Mock Razorpay/Payment Gateway response
    import random
    mock_payment_id = "order_" + uuid.uuid4().hex[:14]
    
    return {
        "id": mock_payment_id,
        "amount": data.amount * 100,
        "currency": "INR",
        "key": "rzp_test_mock_key_12345"
    }
