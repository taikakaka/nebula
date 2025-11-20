import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { SphereProps, ParticleShape } from '../types';

// GLSL Simplex Noise functions
const noiseGLSL = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) { 
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i); 
    vec4 p = permute( permute( permute( 
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                  dot(p2,x2), dot(p3,x3) ) );
  }
`;

const vertexShader = `
  uniform float uTime;
  uniform vec3 uMouse;
  uniform float uHover;
  uniform float uNoiseFreq;
  uniform float uNoiseAmp;
  
  varying float vDistance;
  varying float vNoise;

  ${noiseGLSL}

  void main() {
    vec3 pos = position;
    
    // 1. Fluid Noise Flow
    // We use noise to displace vertices along their normal
    vec3 noisePos = vec3(pos.x * uNoiseFreq + uTime * 0.5, pos.y * uNoiseFreq, pos.z * uNoiseFreq);
    float noiseVal = snoise(noisePos);
    
    // Apply noise to position
    vec3 fluidPos = pos + normal * noiseVal * uNoiseAmp;
    
    // 2. Interaction (Attraction)
    // Calculate distance to mouse in local space
    float dist = distance(fluidPos, uMouse);
    
    // Attraction strength based on distance (closer = stronger)
    float attractionRadius = 1.0;
    float attractionStrength = 0.0;
    
    if (dist < attractionRadius && uHover > 0.5) {
      attractionStrength = smoothstep(attractionRadius, 0.0, dist);
      // Pull point towards mouse
      fluidPos = mix(fluidPos, uMouse, attractionStrength * 0.3);
    }

    // Pass data to fragment shader
    vDistance = dist;
    vNoise = noiseVal;

    vec4 mvPosition = modelViewMatrix * vec4(fluidPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation: points are smaller when further away
    // Increased base size for better visibility of "intervals"
    float baseSize = 8.0;
    // Make points larger when attracted/highlighted
    float sizeHover = 1.0 + attractionStrength * 1.5;
    gl_PointSize = baseSize * sizeHover * (10.0 / -mvPosition.z);
  }
`;

const fragmentShader = `
  uniform vec3 uColorBase;
  uniform vec3 uColorHighlight;
  uniform int uShape; // 0: Circle, 1: Square, 2: Diamond, 3: Ring
  
  varying float vDistance;
  varying float vNoise;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float distFromCenter = length(coord);
    float alphaShape = 0.0;

    if (uShape == 0) { // Circle
      if (distFromCenter > 0.5) discard;
      alphaShape = 1.0 - smoothstep(0.3, 0.5, distFromCenter);
    } 
    else if (uShape == 1) { // Square
      float d = max(abs(coord.x), abs(coord.y));
      if (d > 0.5) discard;
      alphaShape = 1.0 - smoothstep(0.4, 0.5, d);
    }
    else if (uShape == 2) { // Diamond
      float d = abs(coord.x) + abs(coord.y);
      if (d > 0.5) discard;
      alphaShape = 1.0 - smoothstep(0.4, 0.5, d);
    }
    else if (uShape == 3) { // Ring
      if (distFromCenter > 0.5) discard;
      float ringDist = abs(distFromCenter - 0.35);
      alphaShape = 1.0 - smoothstep(0.1, 0.15, ringDist);
    }

    // Gradient Color Logic
    // Map distance to mouse (vDistance) to a mixing factor
    // Closer to mouse = more highlight color
    float mixFactor = smoothstep(0.8, 0.0, vDistance);
    
    // Also add some variation based on noise for the "living" feel
    mixFactor += vNoise * 0.2;
    mixFactor = clamp(mixFactor, 0.0, 1.0);

    vec3 finalColor = mix(uColorBase, uColorHighlight, mixFactor);

    gl_FragColor = vec4(finalColor, alphaShape * 0.8);
  }
`;

const getShapeId = (shape: ParticleShape): number => {
  switch (shape) {
    case 'square': return 1;
    case 'diamond': return 2;
    case 'ring': return 3;
    case 'circle': default: return 0;
  }
};

const InteractiveSphere: React.FC<SphereProps> = ({ 
  count = 128, 
  radius = 1.5,
  baseColor = '#4b0082',
  highlightColor = '#00ffff',
  noiseFrequency = 1.5,
  noiseAmplitude = 0.15,
  particleShape = 'circle'
}) => {
  const meshRef = useRef<THREE.Points>(null);
  const hitMeshRef = useRef<THREE.Mesh>(null);
  
  // Uniforms for the shader
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector3(999, 999, 999) }, // Start far away
      uHover: { value: 0 },
      uColorBase: { value: new THREE.Color(baseColor) }, 
      uColorHighlight: { value: new THREE.Color(highlightColor) },
      uNoiseFreq: { value: noiseFrequency },
      uNoiseAmp: { value: noiseAmplitude },
      uShape: { value: getShapeId(particleShape) }
    }),
    [] // Init once, we update values in useEffect
  );

  // Update Uniforms when props change
  useEffect(() => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uColorBase.value.set(baseColor);
      material.uniforms.uColorHighlight.value.set(highlightColor);
      material.uniforms.uNoiseFreq.value = noiseFrequency;
      material.uniforms.uNoiseAmp.value = noiseAmplitude;
      material.uniforms.uShape.value = getShapeId(particleShape);
    }
  }, [baseColor, highlightColor, noiseFrequency, noiseAmplitude, particleShape]);

  useFrame((state) => {
    if (meshRef.current) {
      // Update time
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.getElapsedTime();
      
      // Slow rotation of the entire system
      meshRef.current.rotation.y += 0.002;
      meshRef.current.rotation.z += 0.001;
      
      // Sync hit mesh rotation so mouse tracking works correctly
      if (hitMeshRef.current) {
        hitMeshRef.current.rotation.copy(meshRef.current.rotation);
      }
    }
  });

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (meshRef.current) {
      // Get the point on the invisible sphere where the mouse is
      const worldPoint = e.point.clone();
      
      // Convert world point to local space of the rotating mesh
      const localPoint = meshRef.current.worldToLocal(worldPoint);
      
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uMouse.value.copy(localPoint);
      material.uniforms.uHover.value = 1;
    }
  };

  const handlePointerOut = () => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uHover.value = 0;
      // Move target far away to stop attraction
      material.uniforms.uMouse.value.set(999, 999, 999);
    }
  };

  return (
    <group>
      {/* Visible Particles */}
      <points ref={meshRef}>
        {/* The count prop determines the number of segments, increasing particle density */}
        <sphereGeometry args={[radius, count, count]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Invisible Hit Mesh for Raycasting */}
      <mesh
        ref={hitMeshRef}
        visible={false}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
};

export default InteractiveSphere;