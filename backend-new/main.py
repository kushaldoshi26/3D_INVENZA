from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager

from database.connection import create_tables
from api import gifts, dental, slicer, admin, upload, orders, printers, ai_services

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield

app = FastAPI(title="3D Invenza API", version="2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(gifts.router, prefix="/api/gifts", tags=["Gift Customization"])
app.include_router(dental.router, prefix="/api/dental", tags=["Dental Workflow"])
app.include_router(slicer.router, prefix="/api/slicer", tags=["Slicing Engine"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin Management"])
app.include_router(upload.router, prefix="/api/uploads", tags=["File Uploads"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders & Checkout"])
app.include_router(printers.router, prefix="/api/printers", tags=["Printer Management"])
app.include_router(ai_services.router, prefix="/api/ai", tags=["AI 3D Services"])

@app.get("/")
async def root():
    return {
        "platform": "3D INVENZA",
        "services": [
            "3D Printing (STL/OBJ/3MF/STEP)",
            "Custom Gifts & Products", 
            "Dental 3D Printing",
            "AI-Assisted Modeling",
            "Global Manufacturing"
        ],
        "printer": "Bambu Lab A1",
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "printer_ready": True}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)