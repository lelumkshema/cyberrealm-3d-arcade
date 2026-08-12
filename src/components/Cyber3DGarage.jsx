import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { soundEngine } from '../utils/soundEngine';
import { Shield, Sparkles, Zap, Check, RotateCw, Car, Flame, Sliders } from 'lucide-react';

const BODY_COLORS = [
  { id: 'cyan', name: 'Cyber Cyan', hex: '#00f3ff' },
  { id: 'magenta', name: 'Magenta Viper', hex: '#ff0055' },
  { id: 'gold', name: 'Gold Cyberlord', hex: '#ffb703' },
  { id: 'stealth', name: 'Stealth Black', hex: '#1e293b' },
  { id: 'emerald', name: 'Neon Emerald', hex: '#00ff88' }
];

const UNDERGLOW_COLORS = [
  { id: 'cyan', name: 'Cyan Glow', hex: '#00f3ff' },
  { id: 'magenta', name: 'Pink Glow', hex: '#ff0055' },
  { id: 'gold', name: 'Gold Glow', hex: '#ffb703' },
  { id: 'purple', name: 'Purple Glow', hex: '#a855f7' }
];

export default function Cyber3DGarage({ settings, onEquip }) {
  const mountRef = useRef(null);
  const [activeColor, setActiveColor] = useState(settings?.shipSkin || 'cyan');
  const [underglow, setUnderglow] = useState('cyan');
  const [weaponType, setWeaponType] = useState('gatling'); // 'gatling' | 'laser' | 'missile'

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#07090e');
    scene.fog = new THREE.FogExp2('#07090e', 0.03);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 4, 9);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 3D Grid Floor
    const gridHelper = new THREE.GridHelper(30, 30, 0x00f3ff, 0x1e293b);
    gridHelper.position.y = -0.6;
    scene.add(gridHelper);

    // Group for Car
    const carGroup = new THREE.Group();
    scene.add(carGroup);

    // 1. Car Body Mesh
    const bodyGeo = new THREE.BoxGeometry(2.4, 0.7, 4.2);
    const currentColorObj = BODY_COLORS.find(c => c.id === activeColor) || BODY_COLORS[0];
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(currentColorObj.hex),
      metalness: 0.8,
      roughness: 0.2
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.castShadow = true;
    carGroup.add(bodyMesh);

    // 2. Cabin Glass
    const cabinGeo = new THREE.BoxGeometry(1.6, 0.5, 2.0);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85
    });
    const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
    cabinMesh.position.set(0, 0.5, -0.2);
    carGroup.add(cabinMesh);

    // 3. Wheels
    const wheels = [];
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.35, 24);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });

    const wheelPositions = [
      [-1.3, -0.3, 1.4],
      [1.3, -0.3, 1.4],
      [-1.3, -0.3, -1.4],
      [1.3, -0.3, -1.4]
    ];

    wheelPositions.forEach((pos) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(...pos);
      w.castShadow = true;
      carGroup.add(w);
      wheels.push(w);
    });

    // 4. Mounted Turret
    const turretGeo = new THREE.BoxGeometry(0.8, 0.4, 0.8);
    const turretMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 });
    const turret = new THREE.Mesh(turretGeo, turretMat);
    turret.position.set(0, 0.9, 0);

    const barrelGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 16);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0xff0055, emissiveIntensity: 0.5 });
    const barrel1 = new THREE.Mesh(barrelGeo, barrelMat);
    barrel1.rotation.x = Math.PI / 2;
    barrel1.position.set(-0.25, 0, 0.6);
    turret.add(barrel1);

    const barrel2 = new THREE.Mesh(barrelGeo, barrelMat);
    barrel2.rotation.x = Math.PI / 2;
    barrel2.position.set(0.25, 0, 0.6);
    turret.add(barrel2);

    carGroup.add(turret);

    // 5. Underglow Light Ring
    const ugObj = UNDERGLOW_COLORS.find(u => u.id === underglow) || UNDERGLOW_COLORS[0];
    const underglowLight = new THREE.PointLight(new THREE.Color(ugObj.hex), 3, 6);
    underglowLight.position.set(0, -0.5, 0);
    carGroup.add(underglowLight);

    // Mouse Controls for 360 Rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y
      };

      carGroup.rotation.y += deltaMove.x * 0.008;
      carGroup.rotation.x += deltaMove.y * 0.004;
      carGroup.rotation.x = Math.max(-0.4, Math.min(0.6, carGroup.rotation.x));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Resize Handler
    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId;
    const animate = () => {
      if (!isDragging) {
        carGroup.rotation.y += 0.005; // slow idle spin
      }

      // Rotate wheels slowly
      wheels.forEach(w => w.rotation.x += 0.02);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
    };
  }, [activeColor, underglow, weaponType]);

  const applyColor = (colorId) => {
    soundEngine.playMenuClick();
    setActiveColor(colorId);
    if (onEquip) onEquip('shipSkin', colorId);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 font-outfit">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black font-orbitron text-cyan-400 glow-cyan flex items-center gap-3">
            <Car className="text-cyan-400" /> 3D ARMORY VEHICLE GARAGE
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Drag with your mouse to rotate and inspect your 3D armored combat vehicle in 360°.
          </p>
        </div>

        <div className="neon-badge flex items-center gap-1.5">
          <RotateCw size={12} className="animate-spin text-cyan-400" /> REAL-TIME WEBGL 3D
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 3D Canvas Viewer */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-2 relative h-[500px] overflow-hidden scanlines flex items-center justify-center border border-cyan-500/30">
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing rounded-xl" />

          <div className="absolute bottom-4 left-4 z-10 pointer-events-none text-xs font-orbitron text-gray-400 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-cyan-500/20">
            🖱️ CLICK & DRAG TO ROTATE 3D CAR
          </div>
        </div>

        {/* Customization Panel */}
        <div className="glass-card p-6 rounded-2xl flex flex-col gap-6 font-orbitron">
          {/* 1. Paint Color Selection */}
          <div>
            <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
              <Sliders size={16} /> 3D CAR PAINT COAT
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {BODY_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => applyColor(c.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                    activeColor === c.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,243,255,0.3)]'
                      : 'bg-slate-900/60 border-slate-800 text-gray-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full border border-white/40" style={{ backgroundColor: c.hex }} />
                    {c.name}
                  </div>
                  {activeColor === c.id && <Check size={14} className="text-cyan-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Underglow Lighting */}
          <div>
            <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
              <Sparkles size={16} /> NEON UNDERGLOW LIGHT
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {UNDERGLOW_COLORS.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    soundEngine.playMenuClick();
                    setUnderglow(u.id);
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                    underglow === u.id
                      ? 'bg-purple-500/20 border-purple-400 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-gray-400'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: u.hex }} />
                  {u.name}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Weapon Loadout */}
          <div>
            <h3 className="text-sm font-bold text-yellow-400 mb-3 flex items-center gap-2">
              <Zap size={16} /> TURRET MOUNT LOADOUT
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => { soundEngine.playMenuClick(); setWeaponType('gatling'); }}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left ${
                  weaponType === 'gatling' ? 'btn-gold' : 'bg-slate-900/60 border-slate-800 text-gray-400'
                }`}
              >
                💥 DUAL PLASMA GATLING
              </button>
              <button
                onClick={() => { soundEngine.playMenuClick(); setWeaponType('missile'); }}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left ${
                  weaponType === 'missile' ? 'btn-magenta' : 'bg-slate-900/60 border-slate-800 text-gray-400'
                }`}
              >
                🚀 HOMING MISSILE PODS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
