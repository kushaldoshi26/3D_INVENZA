import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';

const STLViewer = ({ fileUrl, width = 400, height = 300 }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    if (!fileUrl) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    
    // Clear previous content
    if (mountRef.current) {
      mountRef.current.innerHTML = '';
      mountRef.current.appendChild(renderer.domElement);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Load STL
    const loader = new STLLoader();
    loader.load(fileUrl, (geometry) => {
      const material = new THREE.MeshPhongMaterial({ 
        color: 0x00ff88,
        shininess: 100 
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      // Center the model
      geometry.computeBoundingBox();
      const center = geometry.boundingBox.getCenter(new THREE.Vector3());
      mesh.position.sub(center);
      
      scene.add(mesh);
      
      // Position camera
      const size = geometry.boundingBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      camera.position.set(maxDim, maxDim, maxDim);
      camera.lookAt(0, 0, 0);
    });

    sceneRef.current = { scene, camera, renderer };

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Auto-rotate
      if (scene.children.length > 2) {
        scene.children[2].rotation.y += 0.01;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [fileUrl, width, height]);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        border: '2px solid #ddd', 
        borderRadius: '8px',
        display: 'inline-block'
      }} 
    />
  );
};

export default STLViewer;