# engines/mesh_analyzer/analyzer.py
import trimesh
import numpy as np
from typing import Dict, Tuple, Optional
import os

class MeshAnalyzer:
    def __init__(self):
        self.supported_formats = ['.stl', '.obj', '.ply', '.3mf']
    
    def analyze_file(self, file_path: str) -> Dict:
        """Analyze 3D mesh file and return comprehensive data"""
        try:
            # Load mesh
            mesh = trimesh.load(file_path)
            
            # Handle multiple meshes (like in 3MF files)
            if isinstance(mesh, trimesh.Scene):
                mesh = mesh.dump().sum()
            
            if not isinstance(mesh, trimesh.Trimesh):
                raise ValueError("Invalid mesh format")
            
            # Basic properties
            volume_mm3 = mesh.volume if mesh.is_volume else 0
            volume_cm3 = volume_mm3 / 1000.0  # Convert mm³ to cm³
            
            # Dimensions
            bounds = mesh.bounds
            dimensions = bounds[1] - bounds[0]  # [x, y, z] in mm
            
            # Weight calculation (PLA density = 1.24 g/cm³)
            weight_grams = volume_cm3 * 1.24
            
            # Print time estimation (rough: 8 grams per hour)
            print_time_hours = max(0.5, weight_grams / 8.0)
            
            # Quality checks
            is_watertight = mesh.is_watertight
            is_printable = self._check_printability(mesh, dimensions)
            needs_repair = not is_watertight or mesh.body_count > 1
            
            # Repair notes
            repair_notes = []
            if not is_watertight:
                repair_notes.append("Mesh has holes - needs repair")
            if mesh.body_count > 1:
                repair_notes.append("Multiple separate objects detected")
            if dimensions[2] < 0.2:  # Z-height less than 0.2mm
                repair_notes.append("Model too thin for printing")
            
            return {
                'volume_cm3': round(volume_cm3, 2),
                'weight_grams': round(weight_grams, 1),
                'dimensions_x': round(dimensions[0], 2),
                'dimensions_y': round(dimensions[1], 2),
                'dimensions_z': round(dimensions[2], 2),
                'print_time_hours': round(print_time_hours, 2),
                'is_printable': is_printable,
                'needs_repair': needs_repair,
                'repair_notes': '; '.join(repair_notes) if repair_notes else None,
                'face_count': len(mesh.faces),
                'vertex_count': len(mesh.vertices),
                'is_watertight': is_watertight,
                'surface_area': round(mesh.area, 2)
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'is_printable': False,
                'needs_repair': True,
                'repair_notes': f"Analysis failed: {str(e)}"
            }
    
    def _check_printability(self, mesh: trimesh.Trimesh, dimensions: np.ndarray) -> bool:
        """Check if mesh is printable"""
        # Basic size checks
        max_size = 200  # 200mm max print size
        min_size = 0.5  # 0.5mm minimum feature size
        
        if any(d > max_size for d in dimensions):
            return False
        
        if any(d < min_size for d in dimensions):
            return False
        
        # Volume check
        if mesh.volume <= 0:
            return False
        
        return True
    
    def repair_mesh(self, file_path: str, output_path: str) -> bool:
        """Attempt basic mesh repair"""
        try:
            mesh = trimesh.load(file_path)
            
            if isinstance(mesh, trimesh.Scene):
                mesh = mesh.dump().sum()
            
            # Basic repairs
            mesh.remove_duplicate_faces()
            mesh.remove_degenerate_faces()
            mesh.fill_holes()
            
            # Export repaired mesh
            mesh.export(output_path)
            return True
            
        except Exception as e:
            print(f"Repair failed: {e}")
            return False