import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import InteractiveSphere from './components/InteractiveSphere';
import { ParticleShape } from './types';

export default function App() {
  const [baseColor, setBaseColor] = useState('#4b0082');
  const [highlightColor, setHighlightColor] = useState('#00ffff');
  const [particleCount, setParticleCount] = useState(128);
  const [rotationSpeed, setRotationSpeed] = useState(0.5);
  const [noiseFrequency, setNoiseFrequency] = useState(1.5);
  const [noiseAmplitude, setNoiseAmplitude] = useState(0.15);
  const [particleShape, setParticleShape] = useState<ParticleShape>('circle');

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <div className="absolute top-0 left-0 w-full p-6 z-10 pointer-events-none">
        <h1 className="text-white text-4xl font-thin tracking-widest opacity-80">NEBULA</h1>
        <p className="text-blue-200 text-sm tracking-wider opacity-60 mt-2">
          INTERACTIVE PARTICLE SYSTEM
        </p>
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl min-w-[240px] max-h-[80vh] overflow-y-auto">
        {/* Color Pickers */}
        <div className="flex items-center justify-between gap-4">
          <label className="text-xs text-white/70 uppercase tracking-wider font-light">Base Color</label>
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 cursor-pointer hover:scale-105 transition-transform">
             <input 
                type="color" 
                value={baseColor} 
                onChange={(e) => setBaseColor(e.target.value)}
                className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer p-0 border-0"
             />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <label className="text-xs text-white/70 uppercase tracking-wider font-light">Highlight</label>
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 cursor-pointer hover:scale-105 transition-transform">
            <input 
                type="color" 
                value={highlightColor} 
                onChange={(e) => setHighlightColor(e.target.value)}
                className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer p-0 border-0"
            />
          </div>
        </div>

        {/* Particle Shape Selector */}
        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/10">
           <label className="text-xs text-white/70 uppercase tracking-wider font-light">Particle Shape</label>
           <select 
              value={particleShape}
              onChange={(e) => setParticleShape(e.target.value as ParticleShape)}
              className="w-full bg-white/10 border border-white/20 rounded p-1 text-white text-xs outline-none focus:border-cyan-500"
           >
              <option value="circle">Circle</option>
              <option value="square">Square</option>
              <option value="diamond">Diamond</option>
              <option value="ring">Ring</option>
           </select>
        </div>

        {/* Particle Density Slider */}
        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/10">
           <div className="flex justify-between items-center">
             <label className="text-xs text-white/70 uppercase tracking-wider font-light">Particle Density</label>
             <span className="text-xs text-white/50 font-mono">{particleCount}</span>
           </div>
           <input 
             type="range" 
             min="64" 
             max="256" 
             step="16" 
             value={particleCount}
             onChange={(e) => setParticleCount(Number(e.target.value))}
             className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300"
           />
        </div>

        {/* Rotation Speed Slider */}
        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/10">
           <div className="flex justify-between items-center">
             <label className="text-xs text-white/70 uppercase tracking-wider font-light">Rotation Speed</label>
             <span className="text-xs text-white/50 font-mono">{rotationSpeed.toFixed(1)}</span>
           </div>
           <input 
             type="range" 
             min="0.1" 
             max="2.0" 
             step="0.1" 
             value={rotationSpeed}
             onChange={(e) => setRotationSpeed(Number(e.target.value))}
             className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300"
           />
        </div>

        {/* Noise Frequency Slider */}
        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/10">
           <div className="flex justify-between items-center">
             <label className="text-xs text-white/70 uppercase tracking-wider font-light">Flow Frequency</label>
             <span className="text-xs text-white/50 font-mono">{noiseFrequency.toFixed(1)}</span>
           </div>
           <input 
             type="range" 
             min="0.1" 
             max="5.0" 
             step="0.1" 
             value={noiseFrequency}
             onChange={(e) => setNoiseFrequency(Number(e.target.value))}
             className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300"
           />
        </div>

        {/* Noise Amplitude Slider */}
        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/10">
           <div className="flex justify-between items-center">
             <label className="text-xs text-white/70 uppercase tracking-wider font-light">Flow Strength</label>
             <span className="text-xs text-white/50 font-mono">{noiseAmplitude.toFixed(2)}</span>
           </div>
           <input 
             type="range" 
             min="0.0" 
             max="1.0" 
             step="0.05" 
             value={noiseAmplitude}
             onChange={(e) => setNoiseAmplitude(Number(e.target.value))}
             className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300"
           />
        </div>

      </div>
      
      <Canvas camera={{ position: [0, 0, 2.8], fov: 45 }} dpr={[1, 2]}>
        <color attach="background" args={['#020205']} />
        <fog attach="fog" args={['#020205', 2, 6]} />
        
        <Suspense fallback={null}>
          <ambientLight intensity={0.2} />
          <InteractiveSphere 
            count={particleCount} 
            radius={1.2} 
            baseColor={baseColor}
            highlightColor={highlightColor}
            noiseFrequency={noiseFrequency}
            noiseAmplitude={noiseAmplitude}
            particleShape={particleShape}
          />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        </Suspense>
        
        <OrbitControls 
          enableZoom={true} 
          enablePan={false} 
          rotateSpeed={rotationSpeed}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI * 0.75}
          minDistance={0.5}
          maxDistance={5}
        />
        
        <EffectComposer enableNormalPass={false}>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}