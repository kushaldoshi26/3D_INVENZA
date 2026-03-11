from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    phone = Column(String)
    user_type = Column(String)  # individual, business, dental, enterprise
    created_at = Column(DateTime, default=datetime.utcnow)
    
    uploads = relationship("Upload", back_populates="user")
    orders = relationship("Order", back_populates="user")

class Upload(Base):
    __tablename__ = "uploads"
    
    id = Column(Integer, primary_key=True)
    file_id = Column(String, unique=True, index=True)
    original_name = Column(String)
    file_path = Column(String)
    file_size = Column(Integer)
    category = Column(String)  # normal, gift, dental, ai
    status = Column(String, default="uploaded")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="uploads")
    analysis = relationship("GeometryAnalysis", back_populates="upload", uselist=False)
    pricing = relationship("Pricing", back_populates="upload", uselist=False)

class GeometryAnalysis(Base):
    __tablename__ = "geometry_analysis"
    
    id = Column(Integer, primary_key=True)
    upload_id = Column(Integer, ForeignKey("uploads.id"))
    
    volume_cm3 = Column(Float)
    weight_grams = Column(Float)
    bbox_x = Column(Float)
    bbox_y = Column(Float) 
    bbox_z = Column(Float)
    faces_count = Column(Integer)
    vertices_count = Column(Integer)
    is_watertight = Column(Boolean)
    complexity_score = Column(Float)
    print_time_hours = Column(Float)
    
    upload = relationship("Upload", back_populates="analysis")

class Pricing(Base):
    __tablename__ = "pricing"
    
    id = Column(Integer, primary_key=True)
    upload_id = Column(Integer, ForeignKey("uploads.id"))
    
    material = Column(String, default="PLA")
    material_cost = Column(Float)
    machine_cost = Column(Float)
    service_fee = Column(Float)
    total_price = Column(Float)
    currency = Column(String, default="INR")
    pricing_tier = Column(String)  # individual, business, dental, enterprise
    
    upload = relationship("Upload", back_populates="pricing")

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True)
    order_id = Column(String, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    service_type = Column(String)  # printing, gift, dental, modeling
    status = Column(String, default="pending")
    payment_status = Column(String, default="unpaid")
    total_amount = Column(Float)
    
    shipping_address = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="orders")

class CustomGift(Base):
    __tablename__ = "custom_gifts"
    
    id = Column(Integer, primary_key=True)
    gift_type = Column(String)  # keychain, frame, lamp, case
    customization_data = Column(JSON)  # text, images, parameters
    template_used = Column(String)
    generated_file_path = Column(String)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

class DentalCase(Base):
    __tablename__ = "dental_cases"
    
    id = Column(Integer, primary_key=True)
    case_type = Column(String)  # study_model, crown, bridge, guide
    patient_id = Column(String)
    dentist_name = Column(String)
    clinic_name = Column(String)
    
    scan_file_path = Column(String)
    processed_file_path = Column(String)
    validation_status = Column(String, default="pending")
    admin_approved = Column(Boolean, default=False)
    
    special_instructions = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class AITrainingData(Base):
    __tablename__ = "ai_training_data"
    
    id = Column(Integer, primary_key=True)
    input_type = Column(String)  # text, image, scan
    input_data = Column(JSON)
    output_file_path = Column(String)
    quality_score = Column(Float)
    user_feedback = Column(Integer)  # 1-5 rating
    labeled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class PrintResult(Base):
    __tablename__ = "print_results"
    
    id = Column(Integer, primary_key=True)
    order_id = Column(String, ForeignKey("orders.order_id"))
    
    actual_weight = Column(Float)
    actual_time = Column(Float)
    quality_rating = Column(Integer)
    success = Column(Boolean)
    issues = Column(JSON)
    photos = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class PrinterProfile(Base):
    __tablename__ = "printer_profiles"
    
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    model = Column(String)  # e.g. Bambu Lab A1
    
    # Build Volume (mm)
    build_volume_x = Column(Float)
    build_volume_y = Column(Float)
    build_volume_z = Column(Float)
    
    # Capabilities
    nozzle_size = Column(Float, default=0.4)
    min_layer_height = Column(Float, default=0.08)
    max_layer_height = Column(Float, default=0.28)
    heated_bed = Column(Boolean, default=True)
    multi_color = Column(Boolean, default=False)
    
    supported_materials = Column(JSON)  # ["PLA", "PETG", "TPU"]
    status = Column(String, default="active")  # active, maintenance, offline, printing, error
    
    # OctoPrint / API Integration
    api_url = Column(String, nullable=True) # e.g. http://192.168.1.100/api
    api_key = Column(String, nullable=True)
    printer_type = Column(String, default="octoprint") # octoprint, moonraker, bamboo

class SlicingJob(Base):
    __tablename__ = "slicing_jobs"
    
    id = Column(Integer, primary_key=True)
    job_id = Column(String, unique=True, index=True)
    upload_id = Column(Integer, ForeignKey("uploads.id"))
    
    layer_height = Column(Float, default=0.2)
    infill_percentage = Column(Integer, default=20)
    
    status = Column(String, default="pending")  # pending, processing, completed, failed
    progress = Column(Integer, default=0)       # 0-100
    layer_data_path = Column(String)  # Path to JSON file with layer coordinates
    gcode_path = Column(String)       # Path to G-code file (optional)
    
    duration_seconds = Column(Float)
    error_message = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    upload = relationship("Upload", back_populates="slicing_jobs")

class AdminLog(Base):
    __tablename__ = "admin_logs"
    
    id = Column(Integer, primary_key=True)
    admin_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)  # approve_dental, assign_printer, rejection
    target_id = Column(String)  # order_id, case_id, etc.
    details = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow)

# Extend Upload to have relation to SlicingJob
Upload.slicing_jobs = relationship("SlicingJob", back_populates="upload")