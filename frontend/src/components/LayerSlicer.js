import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { upload, slicer as sliceApi } from '../api';

const LayerSlicer = ({ file, onEstimate }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const layerGroupRef = useRef(new THREE.Group());
  const modelRef = useRef(null);

  const [status, setStatus] = useState('idle'); // idle, uploading, analyzing, slicing, ready, error
  const [progress, setProgress] = useState(0);
  const [layers, setLayers] = useState([]);
  const [currentLayer, setCurrentLayer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [modelStats, setModelStats] = useState(null);

  // Initialize Three.js Scene
  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 2000);
    camera.position.set(150, 150, 150);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;
    currentMount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x404040, 2));
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(100, 200, 100);
    scene.add(sun);

    const grid = new THREE.GridHelper(200, 20, 0x333333, 0x111111);
    scene.add(grid);

    scene.add(layerGroupRef.current);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose();
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Handle File Upload and Slicing Trigger
  useEffect(() => {
    if (!file) return;

    const startProcessing = async () => {
      try {
        setStatus('uploading');
        setProgress(10);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', 'normal');

        const { data: uploadRes } = await upload.model(formData);
        const uploadId = uploadRes.db_id;

        setStatus('analyzing');
        setProgress(40);

        // Start slicing job
        const { data: jobRes } = await sliceApi.start(uploadId);
        const jobId = jobRes.job_id;

        // Poll for progress
        const pollInterval = setInterval(async () => {
          try {
            const { data: statusRes } = await sliceApi.getStatus(jobId);

            if (statusRes.status === 'processing') {
              setStatus('slicing');
              const calcProgress = 40 + (statusRes.progress || 0) * 0.3;
              setProgress(Math.round(calcProgress));
            } else if (statusRes.status === 'completed') {
              clearInterval(pollInterval);
              setStatus('loading_data');
              setProgress(90);

              const { data: layerData } = await sliceApi.getData(jobId);
              setLayers(layerData.layers);
              setStatus('ready');
              setProgress(100);
              setIsPlaying(true);

              if (onEstimate && uploadRes.analysis) {
                const analysis = uploadRes.analysis;
                onEstimate({
                  volumeCm3: analysis.volume_cm3,
                  weightGrams: analysis.weight_pla_g || (analysis.volume_cm3 * 1.24),
                  printHours: analysis.print_time_hours || (analysis.volume_cm3 / 8)
                });

                setModelStats({
                  volume: analysis.volume_cm3.toFixed(1),
                  dimensions: `${analysis.bbox_mm[0].toFixed(1)}x${analysis.bbox_mm[1].toFixed(1)}x${analysis.bbox_mm[2].toFixed(1)} mm`,
                  weight: (analysis.weight_pla_g || analysis.volume_cm3 * 1.24).toFixed(1),
                  printTime: analysis.print_time_hours.toFixed(1)
                });
              }
              loadModelMesh(file);
            } else if (statusRes.status === 'failed') {
              clearInterval(pollInterval);
              setStatus('error');
            }
          } catch (e) {
            console.error("Poll error", e);
            clearInterval(pollInterval);
            setStatus('error');
          }
        }, 1500);

      } catch (err) {
        console.error("Processing failed", err);
        setStatus('error');
      }
    };

    startProcessing();
  }, [file, onEstimate]);

  const loadModelMesh = (file) => {
    const loader = new STLLoader();
    const url = URL.createObjectURL(file);
    loader.load(url, (geometry) => {
      const material = new THREE.MeshPhongMaterial({
        color: 0x3bf2ff,
        transparent: true,
        opacity: 0.15,
        wireframe: false
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;

      if (modelRef.current) sceneRef.current.remove(modelRef.current);
      modelRef.current = mesh;
      sceneRef.current.add(mesh);

      URL.revokeObjectURL(url);
    });
  };

  // Rendering Layers
  useEffect(() => {
    if (!layers.length || !sceneRef.current) return;
    layerGroupRef.current.clear();
    layers.forEach((layer, idx) => {
      if (idx > currentLayer) return;
      const isCurrent = idx === currentLayer;
      const opacity = isCurrent ? 1.0 : 0.25;
      const color = isCurrent ? 0xffa500 : 0x00f2ff;
      const layerMaterial = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: opacity
      });
      layer.paths.forEach(path => {
        const geometry = new THREE.BufferGeometry().setFromPoints(
          path.map(p => new THREE.Vector3(p[0], layer.z, -p[1]))
        );
        const line = new THREE.LineLoop(geometry, layerMaterial);
        line.rotation.x = -Math.PI / 2;
        layerGroupRef.current.add(line);
      });
    });
  }, [layers, currentLayer]);

  // Animation Control Logic
  useEffect(() => {
    if (!isPlaying || layers.length === 0) return;
    const timer = setInterval(() => {
      setCurrentLayer(prev => {
        if (prev >= layers.length - 1) return 0;
        return prev + 1;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [isPlaying, layers.length]);

  const playSlices = () => setIsPlaying(true);
  const pauseSlices = () => setIsPlaying(false);

  return (
    <div className="relative">
      <div
        ref={mountRef}
        className="slicer-viewport-render glass rounded-2xl overflow-hidden border border-white/5 relative"
        style={{ width: '100%', height: 300, background: '#050505' }}
      />

      {/* Progress Overlay */}
      {status !== 'ready' && status !== 'idle' && status !== 'error' && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-2xl z-20 backdrop-blur-sm">
          <div className="font-tech text-[10px] text-brand-cyan mb-3 tracking-[0.2em] animate-pulse">
            {status.toUpperCase()} // {progress}%
          </div>
          <div className="w-[60%] h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-cyan shadow-[0_0_10px_#00f2ff] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Telemetry Panel */}
      {status === 'ready' && (
        <div className="mt-6 space-y-4">
          <div className="flex gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/5">
            <button
              onClick={() => isPlaying ? pauseSlices() : playSlices()}
              className="w-10 h-10 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan hover:bg-brand-cyan/20 transition-all"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1 text-[9px] font-tech text-gray-500 uppercase tracking-widest">
                <span>Layer Progress</span>
                <span>{Math.round((currentLayer / layers.length) * 100)}%</span>
              </div>
              <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-cyan transition-all duration-50"
                  style={{ width: `${(currentLayer / layers.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Layer_ID', val: `L-${currentLayer + 1}` },
              { label: 'Z_Alt', val: `${layers[currentLayer]?.z.toFixed(2)}mm` },
              { label: 'Print_Time', val: `${modelStats?.printTime || '0.0'}h` },
              { label: 'Material', val: `${modelStats?.weight || '0.0'}g` }
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/5">
                <div className="text-[8px] font-tech text-gray-500 uppercase tracking-widest mb-1">{stat.label}</div>
                <div className="text-[10px] font-tech text-white">{stat.val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 font-tech text-[10px] text-center uppercase tracking-widest">
          Analysis_Failure // Please check file integrity
        </div>
      )}
    </div>
  );
};

export default LayerSlicer;