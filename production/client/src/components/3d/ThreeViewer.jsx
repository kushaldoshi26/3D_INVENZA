import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage, Center } from '@react-three/drei';
import * as THREE from 'three';

const Model = ({ url }) => {
    const mesh = useRef();
    // Here we would load the STL/OBJ url using useLoader
    // For demo, we use a box
    return (
        <mesh ref={mesh}>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial color="#00f2ff" wireframe />
        </mesh>
    );
};

const ThreeViewer = ({ stlUrl }) => {
    return (
        <div className="w-full h-[400px] bg-black/40 rounded-xl border border-white/10 overflow-hidden relative">
            <div className="absolute top-4 left-4 z-10 font-tech text-[10px] text-brand-accent px-2 py-1 bg-black/60 rounded border border-brand-accent/20">
                3D VIEWPORT // ACTIVE
            </div>
            <Canvas camera={{ position: [5, 5, 5], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <Stage environment="city" intensity={0.6}>
                    <Center>
                        <Model url={stlUrl} />
                    </Center>
                </Stage>
                <OrbitControls makeDefault />
                <gridHelper args={[20, 20, 0x00f2ff, 0x111111]} position={[0, -1, 0]} />
            </Canvas>
        </div>
    );
};

export default ThreeViewer;
