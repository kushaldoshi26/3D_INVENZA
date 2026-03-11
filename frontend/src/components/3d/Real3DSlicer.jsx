import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

export default function Real3DSlicer({ file, onEstimate }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const meshRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const [slicing, setSlicing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [clipPercent, setClipPercent] = useState(0);
  const clippingRef = useRef({ plane: null, minY: 0, maxY: 1 });

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 400;
    const height = 280;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1628);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(60, 50, 60);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.localClippingEnabled = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 0.8);
    scene.add(hemi);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(50, 50, 50);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Grid
    const grid = new THREE.GridHelper(120, 24, 0x0e3b3e, 0x0a2b2b);
    scene.add(grid);

    // Clipping plane
    const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    renderer.clippingPlanes = [plane];
    clippingRef.current.plane = plane;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (meshRef.current && !slicing) {
        meshRef.current.rotation.y += 0.003;
      }
      
      // Update clipping plane
      if (meshRef.current && clippingRef.current.plane) {
        const { minY, maxY } = clippingRef.current;
        const clipPos = minY + (maxY - minY) * clipPercent;
        clippingRef.current.plane.constant = -clipPos;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [clipPercent]);

  // Load STL
  useEffect(() => {
    if (!file || !sceneRef.current) return;

    const loader = new STLLoader();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const geometry = loader.parse(e.target.result);
        geometry.computeVertexNormals();
        geometry.center();

        // Use your improved pricing heuristic
        const sizeKb = file.size / 1024;
        const weightGrams = Math.max(3, Math.round(sizeKb * 0.4));
        const printHours = Math.max(0.5, weightGrams / 8);
        const volumeCm3 = weightGrams / 1.24; // Approximate volume

        // Material with clipping
        const material = new THREE.MeshPhongMaterial({
          color: 0x0ab3a8,
          shininess: 20,
          side: THREE.DoubleSide,
          clippingPlanes: [clippingRef.current.plane],
          clipShadows: true
        });

        const mesh = new THREE.Mesh(geometry, material);
        
        // Remove old mesh
        if (meshRef.current) {
          sceneRef.current.remove(meshRef.current);
        }
        
        // Scale and add mesh
        mesh.scale.set(0.6, 0.6, 0.6);
        meshRef.current = mesh;
        sceneRef.current.add(mesh);

        // Setup clipping bounds
        const bbox = new THREE.Box3().setFromObject(mesh);
        clippingRef.current.minY = bbox.min.y;
        clippingRef.current.maxY = bbox.max.y;

        // Position camera based on model
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        cameraRef.current.position.set(maxDim * 2, maxDim * 1.5, maxDim * 2);
        cameraRef.current.lookAt(0, 0, 0);

        if (onEstimate) {
          onEstimate({ volumeCm3, weightGrams, printHours });
        }
      } catch (error) {
        console.error("STL load error:", error);
      }
    };
    
    reader.readAsArrayBuffer(file);
  }, [file, onEstimate]);

  // Slicing animation
  useEffect(() => {
    if (!slicing) return;

    const duration = 4000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setClipPercent(progress);
      setProgress(Math.round(progress * 100));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setSlicing(false);
        setTimeout(() => {
          setProgress(0);
          setClipPercent(0);
        }, 1000);
      }
    };
    
    requestAnimationFrame(animate);
  }, [slicing]);

  const handleSliderChange = (e) => {
    if (!slicing) {
      setClipPercent(Number(e.target.value));
    }
  };

  return (
    <div>
      <div 
        ref={mountRef} 
        style={{ 
          width: "100%", 
          height: 280, 
          borderRadius: 12, 
          overflow: "hidden",
          border: "1px solid rgba(59,242,255,0.3)",
          background: "linear-gradient(135deg, #0a1628 0%, #071226 100%)"
        }} 
      />
      
      {/* Layer slider */}
      <div style={{ marginTop: 12, marginBottom: 8 }}>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={clipPercent}
          onChange={handleSliderChange}
          disabled={slicing}
          style={{ width: "100%" }}
        />
      </div>
      
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          className="btn-primary"
          onClick={() => setSlicing(true)}
          disabled={!file || slicing}
          style={{ fontSize: 12, padding: "6px 12px" }}
        >
          {slicing ? `Slicing ${progress}%` : "▶ Start Slicing"}
        </button>
        <button
          className="btn-ghost"
          onClick={() => { setSlicing(false); setProgress(0); setClipPercent(0); }}
          style={{ fontSize: 12, padding: "6px 12px" }}
        >
          ⏹ Reset
        </button>
        <span style={{ fontSize: 11, color: "#a4afc6", marginLeft: 8 }}>
          Layer {Math.round(clipPercent * 100)}%
        </span>
      </div>
    </div>
  );
}