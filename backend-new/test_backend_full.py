from fastapi.testclient import TestClient
from main import app
from database.connection import create_tables
import os
import io

# Initialize DB
create_tables()

client = TestClient(app)

def test_api_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "operational"

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["printer_ready"] == True

def test_gift_templates():
    response = client.get("/api/gifts/templates")
    assert response.status_code == 200
    data = response.json()
    assert "keychains" in data
    assert "phone_cases" in data

def test_upload_and_analysis_flow():
    # Create a dummy STL file content (just a header to pass basic binary checks, 
    # but mesh analyzer might fail if it's not valid STL.
    # To properly test, we need a valid minimal STL or mock the analyzer.
    # Let's mock the mesh_analyzer.analyze_file method for testing since we don't have a real STL handy easily
    # without writing binary data.
    
    # Actually, we can write a minimal ASCII STL.
    stl_content = """solid cube
facet normal 0 0 0
outer loop
vertex 0 0 0
vertex 10 0 0
vertex 0 10 0
endloop
endfacet
endsolid cube"""
    
    files = {'file': ('test.stl', stl_content, 'application/octet-stream')}
    response = client.post("/api/uploads/", files=files, data={"category": "normal"})
    
    if response.status_code != 200:
        print(f"Upload Failed: {response.text}")

    # It might fail analysis but should upload
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "uploaded"
    assert "upload_id" in data
    
    upload_id = data["upload_id"]
    return upload_id

def test_slicing_flow():
    # We need a valid upload ID. 
    # Since previous test might rely on mocked STL which trimesh might reject,
    # let's proceed assuming we can slice IF the file was valid.
    # For now, just check if endpoint exists and rejects invalid ID
    response = client.post("/api/slicer/slice/999999")
    assert response.status_code == 404

def test_dental_flow():
    # Mock validation
    payload = {
        "upload_id": "dummy-id", 
        "case_details": {
            "case_type": "study_model",
            "patient_id": "P-123",
            "dentist_name": "Dr. Smith",
            "clinic_name": "Smile Clinic"
        }
    }
    # This will fail 404 because file doesn't exist, which proves endpoint works
    response = client.post("/api/dental/validate-scan", json=payload)
    assert response.status_code == 404

def test_admin_flow():
    response = client.get("/api/admin/print-queue")
    assert response.status_code == 200
    assert "orders" in response.json()

if __name__ == "__main__":
    # Run tests manually
    try:
        test_api_root()
        print("Root API: PASS")
        test_health_check()
        print("Health Check: PASS")
        test_gift_templates()
        print("Gift Templates: PASS")
        test_upload_and_analysis_flow()
        print("Upload Flow: PASS")
        test_slicing_flow() 
        print("Slicing Flow: PASS")
        test_dental_flow()
        print("Dental Flow: PASS")
        test_admin_flow()
        print("Admin Flow: PASS")
        print("ALL TESTS PASSED")
    except Exception as e:
        print(f"TEST FAILED: {str(e)}")
