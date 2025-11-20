import * as THREE from 'three';

export type ParticleShape = 'circle' | 'square' | 'diamond' | 'ring';

export interface SphereProps {
  count?: number;
  radius?: number;
  baseColor?: string;
  highlightColor?: string;
  noiseFrequency?: number;
  noiseAmplitude?: number;
  particleShape?: ParticleShape;
}

export interface Uniforms {
  uTime: { value: number };
  uMouse: { value: THREE.Vector3 };
  uHover: { value: number }; // 0 to 1 float indicating hover intensity
  uColorBase: { value: THREE.Color };
  uColorHighlight: { value: THREE.Color };
  uNoiseFreq: { value: number };
  uNoiseAmp: { value: number };
  uShape: { value: number };
}