import trimesh
import numpy as np
import json

class SlicerLayers:
    @staticmethod
    def generate_layers(file_path: str, layer_height: float = 0.2) -> dict:
        """
        Slices a 3D model into horizontal layers for visualization.
        """
        try:
            mesh = trimesh.load(file_path)
            
            if isinstance(mesh, trimesh.Scene):
                mesh = mesh.dump().sum()

            # Align bottom to Z=0
            mesh.apply_translation([0, 0, -mesh.bounds[0][2]])
            
            height = mesh.extents[2]
            
            # Performance rule: Max 400 layers
            max_layers = 400
            if height / layer_height > max_layers:
                layer_height = height / max_layers
            
            # Generate planes
            z_levels = np.arange(layer_height * 0.5, height, layer_height)
            if len(z_levels) > max_layers:
                z_levels = z_levels[:max_layers]
            
            # Slice intersection
            sections = mesh.section_multiplane(
                plane_origin=[0, 0, 0],
                plane_normal=[0, 0, 1],
                heights=z_levels
            )
            
            layers_data = []
            for i, section in enumerate(sections):
                if section is None: continue
                
                paths = []
                if hasattr(section, 'paths'):
                    # section.polygons_full handles nesting (holes)
                    for poly in section.polygons_full:
                        # Exterior coordinates
                        paths.append([[float(p[0]), float(p[1])] for p in poly.exterior.coords])
                        # Interior coordinates (holes)
                        for interior in poly.interiors:
                            paths.append([[float(p[0]), float(p[1])] for p in interior.coords])
                
                layers_data.append({
                    "z": float(z_levels[i]),
                    "paths": paths
                })
                
            return {
                "layers": layers_data
            }
            
        except Exception as e:
            return {"error": str(e)}

# Global function as requested
def generate_layers(file_path, layer_height):
    return SlicerLayers.generate_layers(file_path, layer_height)
