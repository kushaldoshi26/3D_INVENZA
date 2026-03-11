import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';

const EnhancedSTLViewer = ({ fileUrl, width = 400, height = 300 }) => {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fileUrl) return;

    setLoading(true);
    setError(null);

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Clear previous content
    if (mountRef.current) {
      mountRef.current.innerHTML = '';
      mountRef.current.appendChild(renderer.domElement);
    }

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);
    
    const directionalLight1 = new THREE.DirectionalLight(0x3bf2ff, 0.8);
    directionalLight1.position.set(5, 5, 5);
    directionalLight1.castShadow = true;
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0x7c5cff, 0.6);
    directionalLight2.position.set(-5, 3, -5);
    scene.add(directionalLight2);

    // Add grid
    const gridHelper = new THREE.GridHelper(10, 10, 0x3bf2ff, 0x444444);
    gridHelper.position.y = -2;
    scene.add(gridHelper);

    // Mouse controls
    let mouseX = 0, mouseY = 0;
    let targetRotationX = 0, targetRotationY = 0;
    let mesh = null;

    const onMouseMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseX = (event.clientX - rect.left) / rect.width * 2 - 1;
      mouseY = -(event.clientY - rect.top) / rect.height * 2 + 1;
      
      if (mesh) {
        targetRotationX = mouseY * 0.5;
        targetRotationY = mouseX * 0.5;
      }
    };

    renderer.domElement.addEventListener('mousemove', onMouseMove);

    // Load STL
    const loader = new STLLoader();
    loader.load(
      fileUrl,
      (geometry) => {
        const material = new THREE.MeshPhongMaterial({ 
          color: 0x00ff88,
          shininess: 100,
          transparent: true,
          opacity: 0.9
        });
        
        mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Center and scale the model
        geometry.computeBoundingBox();
        const center = geometry.boundingBox.getCenter(new THREE.Vector3());
        const size = geometry.boundingBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        mesh.position.sub(center);
        mesh.scale.setScalar(3 / maxDim); // Normalize size
        
        scene.add(mesh);
        
        // Position camera
        camera.position.set(4, 4, 4);
        camera.lookAt(0, 0, 0);
        
        setLoading(false);
      },
      (progress) => {
        // Loading progress
      },
      (error) => {
        console.error('STL loading error:', error);
        setError('Failed to load 3D model');
        setLoading(false);
      }
    );

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (mesh) {
        // Smooth rotation towards mouse
        mesh.rotation.x += (targetRotationX - mesh.rotation.x) * 0.05;
        mesh.rotation.y += (targetRotationY - mesh.rotation.y) * 0.05;
        
        // Auto-rotate when not interacting
        if (Math.abs(targetRotationX) < 0.1 && Math.abs(targetRotationY) < 0.1) {
          mesh.rotation.y += 0.005;
        }
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [fileUrl, width, height]);

  if (loading) {
    return (
      <div style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderRadius: '8px',
        border: '2px solid #3bf2ff'
      }}>
        <div style={{ textAlign: 'center', color: '#3bf2ff' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚡</div>
          <div>Loading 3D Model...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #2e1a1a 0%, #3e1616 100%)',
        borderRadius: '8px',
        border: '2px solid #ff3b3b',
        color: '#ff3b3b'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>❌</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div 
        ref={mountRef} 
        style={{ 
          border: '2px solid #3bf2ff', 
          borderRadius: '8px',
          display: 'inline-block',
          cursor: 'grab'
        }} 
      />
      <div style={{
        position: 'absolute',
        bottom: '8px',
        right: '8px',
        background: 'rgba(59, 242, 255, 0.2)',
        color: '#3bf2ff',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '10px',
        backdropFilter: 'blur(4px)'
      }}>
        Move mouse to rotate
      </div>
    </div>
  );
};

export default EnhancedSTLViewer;