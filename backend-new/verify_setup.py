# verify_setup.py
import os
import sys

def verify_core_api():
    print("Verifying 3D INVENZA Core API Setup...")
    
    # Check files
    required_files = [
        "main.py",
        "database/models.py", 
        "database/connection.py",
        "engines/mesh_analyzer/analyzer.py",
        "engines/pricing_engine/calculator.py",
        ".env"
    ]
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
        else:
            print(f"OK {file}")
    
    if missing_files:
        print(f"\n❌ Missing files: {missing_files}")
        return False
    
    # Check directories
    required_dirs = [
        "storage/uploads",
        "storage/processed", 
        "storage/outputs"
    ]
    
    for dir_path in required_dirs:
        os.makedirs(dir_path, exist_ok=True)
        print(f"OK {dir_path}/")
    
    print("\nCore API Components:")
    print("├── 📊 Database Models (Users, Orders, Analysis)")
    print("├── 🔧 Mesh Analyzer (Trimesh + Volume Calculation)")
    print("├── 💰 Pricing Engine (Category-based + Materials)")
    print("├── 📁 File Storage (Uploads + Processing)")
    print("└── 🚀 FastAPI Endpoints (Upload, Orders, Admin)")
    
    print("\nCore API Setup Complete!")
    print("Ready to handle:")
    print("   • STL/OBJ/3MF file uploads")
    print("   • Real-time mesh analysis") 
    print("   • Volume-based pricing")
    print("   • Order management")
    print("   • Admin oversight")
    
    return True

if __name__ == "__main__":
    if verify_core_api():
        print("\nStart server with: python -m uvicorn main:app --reload --port 8001")
        print("📖 API docs at: http://localhost:8001/docs")
    else:
        print("\nSetup incomplete. Check missing files.")
        sys.exit(1)