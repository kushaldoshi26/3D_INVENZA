import trimesh
import numpy as np
from pathlib import Path
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SlicingEngine:
    def __init__(self):
        pass

    def slice_file(self, file_path: str, layer_height: float = 0.2) -> dict:
        """
        Slice a 3D model into 2D layers.
        Returns a list of layers in the format required by the frontend.
        """
        try:
            mesh = trimesh.load(file_path)
            
            # Handle scenes
            if isinstance(mesh, trimesh.Scene):
                mesh = mesh.dump().sum()

            # Align to bed (min z = 0)
            mesh.apply_translation([0, 0, -mesh.bounds[0][2]])

            height = mesh.extents[2]
            
            # Respect max layers for performance
            max_layers = 400
            current_layer_height = layer_height
            if height / current_layer_height > max_layers:
                current_layer_height = height / max_layers
            
            layer_count = int(height / current_layer_height)
            
            # Generate section planes
            z_levels = np.arange(current_layer_height * 0.5, height, current_layer_height)
            if len(z_levels) > max_layers:
                z_levels = z_levels[:max_layers]
            
            # Use trimesh's multi-plane section
            sections = mesh.section_multiplane(plane_origin=[0,0,0], 
                                              plane_normal=[0,0,1], 
                                              heights=z_levels)
            
            layers_data = []
            
            for i, section in enumerate(sections):
                if section is None:
                    continue
                    
                layer_paths = []
                
                # Check if section is valid and has paths
                if hasattr(section, 'paths'):
                    for path in section.polygons_full:
                        # Exterior
                        exterior = [[float(p[0]), float(p[1])] for p in path.exterior.coords]
                        layer_paths.append(exterior)
                        
                        # Interiors
                        for interior in path.interiors:
                            layer_paths.append([[float(p[0]), float(p[1])] for p in interior.coords])

                layers_data.append({
                    "z": float(z_levels[i]),
                    "paths": layer_paths
                })

            return {
                "status": "success",
                "layer_count": len(layers_data),
                "layers": layers_data
            }

        except Exception as e:
            return {"status": "failed", "error": str(e)}

slicing_engine = SlicingEngine()
