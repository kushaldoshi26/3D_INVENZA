import trimesh
import numpy as np
from pathlib import Path
import subprocess
import json
import os

class MeshAnalyzer:
    def __init__(self):
        self.supported_formats = ['.stl', '.obj', '.ply', '.3mf', '.step', '.stp']
        
    def analyze_file(self, file_path: str) -> dict:
        """Comprehensive 3D model analysis"""
        try:
            # Load mesh
            mesh = trimesh.load(file_path)
            
            # Handle multiple meshes
            if isinstance(mesh, trimesh.Scene):
                mesh = mesh.dump().sum()
            
            # Basic geometry analysis
            analysis = {
                'volume_cm3': float(mesh.volume / 1000),  # Convert mm³ to cm³
                'surface_area_cm2': float(mesh.area / 100),  # Convert mm² to cm²
                'bbox_mm': mesh.bounding_box.extents.tolist(),
                'faces_count': len(mesh.faces),
                'vertices_count': len(mesh.vertices),
                'is_watertight': mesh.is_watertight,
                'is_winding_consistent': mesh.is_winding_consistent,
                'euler_number': mesh.euler_number
            }
            
            # Advanced analysis
            analysis.update(self._calculate_complexity(mesh))
            analysis.update(self._estimate_print_time(mesh))
            analysis.update(self._check_printability(mesh))
            analysis.update(self._material_estimation(mesh))
            
            return analysis
            
        except Exception as e:
            return {'error': str(e), 'status': 'failed'}
    
    def _calculate_complexity(self, mesh) -> dict:
        """Calculate model complexity metrics"""
        bbox = mesh.bounding_box.extents
        max_dim = max(bbox)
        min_dim = min(bbox)
        
        # Complexity based on geometry
        face_density = len(mesh.faces) / mesh.area if mesh.area > 0 else 0
        aspect_ratio = max_dim / min_dim if min_dim > 0 else 1
        
        complexity_score = min(10, (face_density * 0.001 + aspect_ratio * 0.1) * 10)
        
        return {
            'complexity_score': round(complexity_score, 2),
            'face_density': round(face_density, 4),
            'aspect_ratio': round(aspect_ratio, 2)
        }
    
    def _estimate_print_time(self, mesh) -> dict:
        """Estimate 3D printing time"""
        volume_cm3 = mesh.volume / 1000
        bbox = mesh.bounding_box.extents
        height_mm = bbox[2]  # Z-axis is typically height
        
        # Layer-based time estimation
        layer_height = 0.2  # mm
        layers = height_mm / layer_height
        
        # Time per layer (varies by complexity)
        base_time_per_layer = 2  # minutes
        complexity_multiplier = 1 + (len(mesh.faces) / 10000)
        
        total_time_minutes = layers * base_time_per_layer * complexity_multiplier
        
        return {
            'estimated_layers': int(layers),
            'print_time_minutes': round(total_time_minutes, 1),
            'print_time_hours': round(total_time_minutes / 60, 2)
        }
    
    def _check_printability(self, mesh) -> dict:
        """Check 3D printing feasibility"""
        issues = []
        
        if not mesh.is_watertight:
            issues.append("Non-watertight mesh - may cause printing issues")
        
        if not mesh.is_winding_consistent:
            issues.append("Inconsistent face normals")
        
        bbox = mesh.bounding_box.extents
        if min(bbox) < 1:  # Less than 1mm
            issues.append("Very thin features - may not print well")
        
        if max(bbox) > 200:  # Larger than 200mm
            issues.append("Large model - may need to be split")
        
        return {
            'printable': len(issues) == 0,
            'issues': issues,
            'repair_needed': not mesh.is_watertight
        }
    
    def _material_estimation(self, mesh) -> dict:
        """Estimate material usage"""
        volume_cm3 = mesh.volume / 1000
        
        # Material densities (g/cm³)
        densities = {
            'PLA': 1.24,
            'ABS': 1.04,
            'PETG': 1.27,
            'TPU': 1.20,
            'Resin': 1.15
        }
        
        weights = {}
        for material, density in densities.items():
            weights[f'weight_{material.lower()}_g'] = round(volume_cm3 * density, 2)
        
        return weights
    
    def repair_mesh(self, file_path: str, output_path: str) -> dict:
        """Attempt to repair mesh issues"""
        try:
            mesh = trimesh.load(file_path)
            
            if isinstance(mesh, trimesh.Scene):
                mesh = mesh.dump().sum()
            
            # Basic repairs
            mesh.remove_duplicate_faces()
            mesh.remove_degenerate_faces()
            mesh.remove_unreferenced_vertices()
            
            # Fill holes if possible
            if hasattr(mesh, 'fill_holes'):
                mesh.fill_holes()
            
            # Export repaired mesh
            mesh.export(output_path)
            
            return {
                'repaired': True,
                'output_path': output_path,
                'repairs_applied': ['duplicates_removed', 'degenerate_faces_removed']
            }
            
            
        except Exception as e:
            return {'repaired': False, 'error': str(e)}

    def validate_printer_compatibility(self, mesh, printer_profile: dict = None) -> dict:
        """Validate mesh against printer constraints"""
        if printer_profile is None:
            # Default to Bambu Lab A1 specs
            printer_profile = {
                "name": "Bambu Lab A1",
                "build_volume_x": 256.0,
                "build_volume_y": 256.0,
                "build_volume_z": 256.0,
                "min_wall_thickness": 0.8
            }
            
        issues = []
        warnings = []
        
        # Check dimensions
        bbox = mesh.bounding_box.extents
        if bbox[0] > printer_profile['build_volume_x']:
            issues.append(f"Width ({bbox[0]:.1f}mm) exceeds printer limit ({printer_profile['build_volume_x']}mm)")
        if bbox[1] > printer_profile['build_volume_y']:
            issues.append(f"Depth ({bbox[1]:.1f}mm) exceeds printer limit ({printer_profile['build_volume_y']}mm)")
        if bbox[2] > printer_profile['build_volume_z']:
            issues.append(f"Height ({bbox[2]:.1f}mm) exceeds printer limit ({printer_profile['build_volume_z']}mm)")
            
        # Check wall thickness (heuristic - using ray casting or approximation if possible, 
        # but for now rely on thin features check from check_printability)
        
        return {
            "compatible": len(issues) == 0,
            "issues": issues,
            "warnings": warnings,
            "printer": printer_profile['name']
        }

# Global analyzer instance
mesh_analyzer = MeshAnalyzer()