import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { soundEngine } from '../../utils/soundEngine';
import { ArrowLeft, Play, RotateCcw, Shield, Radio, Crosshair, Zap, Navigation, Award, Target, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

const WORLD_BOUNDS = 180;

export default function CyberIgi3DGame({ userSettings, onGameEnd, onBack }) {
  const mountRef = useRef(null);
  const [gameState, setGameState] = useState('menu'); // 'menu' | 'playing' | 'victory' | 'gameover'
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [nitro, setNitro] = useState(100);
  const [empAmmo, setEmpAmmo] = useState(3);
  const [missileAmmo, setMissileAmmo] = useState(10);
  const [radarsLeft, setRadarsLeft] = useState(3);
  const [intelSecured, setIntelSecured] = useState(false);
  const [helipadActive, setHelipadActive] = useState(false);
  const [creditsEarned, setCreditsEarned] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('cyber_igi3d_high') || '0', 10));

  const carSkin = userSettings?.shipSkin || 'cyan';

  useEffect(() => {
    if (gameState !== 'playing') return;

    const container = mountRef.current;
    if (!container) return;

    soundEngine.speakVoice("Tactical I.G.I. mission active. Destroy military radars and secure intel.");

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#07090e');
    scene.fog = new THREE.FogExp2('#07090e', 0.015);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(40, 80, 50);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Ground Grid Terrain
    const gridHelper = new THREE.GridHelper(WORLD_BOUNDS * 2, 40, 0x00f3ff, 0x1e293b);
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    // Car Object & Physics
    const carGroup = new THREE.Group();
    carGroup.position.set(0, 0, 140);
    scene.add(carGroup);

    // Car Body Mesh
    const skinHex = carSkin === 'magenta' ? 0xff0055 : carSkin === 'gold' ? 0xffb703 : 0x00f3ff;
    const bodyGeo = new THREE.BoxGeometry(2.4, 0.7, 4.2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: skinHex, metalness: 0.8, roughness: 0.2 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.castShadow = true;
    carGroup.add(bodyMesh);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.6, 0.5, 2.0);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.1, transparent: true, opacity: 0.8 });
    const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
    cabinMesh.position.set(0, 0.5, -0.2);
    carGroup.add(cabinMesh);

    // Wheels
    const wheels = [];
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.35, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    [[-1.3, 0, 1.4], [1.3, 0, 1.4], [-1.3, 0, -1.4], [1.3, 0, -1.4]].forEach(pos => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(...pos);
      carGroup.add(w);
      wheels.push(w);
    });

    // Dual Turret
    const turretGeo = new THREE.BoxGeometry(0.8, 0.4, 0.8);
    const turretMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 });
    const turret = new THREE.Mesh(turretGeo, turretMat);
    turret.position.set(0, 0.9, 0);

    const barrelGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 12);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0xff0055, emissiveIntensity: 0.6 });
    const b1 = new THREE.Mesh(barrelGeo, barrelMat);
    b1.rotation.x = Math.PI / 2;
    b1.position.set(-0.25, 0, -0.6);
    turret.add(b1);
    const b2 = new THREE.Mesh(barrelGeo, barrelMat);
    b2.rotation.x = Math.PI / 2;
    b2.position.set(0.25, 0, -0.6);
    turret.add(b2);
    carGroup.add(turret);

    // State Variables
    let carSpeed = 0;
    let carAngle = 0;
    let playerHealth = 100;
    let playerNitro = 100;
    let currentScore = 0;
    let pEmp = 3;
    let pMissile = 10;

    // Keys
    const keys = { w: false, s: false, a: false, d: false, space: false, shift: false, f: false, e: false };
    const handleKeyDown = (e) => {
      if (['KeyW', 'ArrowUp'].includes(e.code)) keys.w = true;
      if (['KeyS', 'ArrowDown'].includes(e.code)) keys.s = true;
      if (['KeyA', 'ArrowLeft'].includes(e.code)) keys.a = true;
      if (['KeyD', 'ArrowRight'].includes(e.code)) keys.d = true;
      if (['Space', 'KeyK'].includes(e.code)) keys.space = true;
      if (['ShiftLeft', 'ShiftRight'].includes(e.code)) keys.shift = true;
      if (e.code === 'KeyF') triggerMissile();
      if (e.code === 'KeyE') triggerEmp();
    };
    const handleKeyUp = (e) => {
      if (['KeyW', 'ArrowUp'].includes(e.code)) keys.w = false;
      if (['KeyS', 'ArrowDown'].includes(e.code)) keys.s = false;
      if (['KeyA', 'ArrowLeft'].includes(e.code)) keys.a = false;
      if (['KeyD', 'ArrowRight'].includes(e.code)) keys.d = false;
      if (['Space', 'KeyK'].includes(e.code)) keys.space = false;
      if (['ShiftLeft', 'ShiftRight'].includes(e.code)) keys.shift = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 3D Map Entities
    const radars = [];
    const radarsData = [
      { x: -80, z: -80 },
      { x: 80, z: -90 },
      { x: 0, z: 20 }
    ];

    radarsData.forEach(rd => {
      const g = new THREE.Group();
      g.position.set(rd.x, 0, rd.z);

      const dishGeo = new THREE.SphereGeometry(3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const dishMat = new THREE.MeshStandardMaterial({ color: 0x00f3ff, wireframe: true });
      const dish = new THREE.Mesh(dishGeo, dishMat);
      dish.position.y = 4;
      g.add(dish);

      const baseGeo = new THREE.CylinderGeometry(1.5, 2.5, 4, 12);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 2;
      g.add(base);

      scene.add(g);
      radars.push({ group: g, dish, hp: 15, alive: true, x: rd.x, z: rd.z });
    });

    // 3D Enemy Tanks
    const enemyTanks = [];
    [[-50, -40], [60, -30]].forEach((pos, idx) => {
      const tg = new THREE.Group();
      tg.position.set(pos[0], 0, pos[1]);

      const tBodyGeo = new THREE.BoxGeometry(3, 1.2, 5);
      const tBodyMat = new THREE.MeshStandardMaterial({ color: 0xa855f7 });
      const tBody = new THREE.Mesh(tBodyGeo, tBodyMat);
      tBody.position.y = 0.6;
      tg.add(tBody);

      scene.add(tg);
      enemyTanks.push({ group: tg, hp: 20, alive: true, vx: idx === 0 ? 0.3 : -0.3, lastShot: 0 });
    });

    // Projectiles & FX Arrays
    const playerBullets = [];
    const homingMissiles = [];
    const enemyBullets = [];
    const empRings = [];
    let lastShot = 0;

    // Trigger Homing Missile
    function triggerMissile() {
      if (pMissile <= 0) return;
      pMissile -= 1;
      setMissileAmmo(pMissile);
      soundEngine.playMissile();
      soundEngine.speakVoice("Missile launched!");

      // Find closest alive radar or tank target
      const target = radars.find(r => r.alive) || enemyTanks.find(t => t.alive);
      const targetPos = target ? (target.group ? target.group.position : new THREE.Vector3(target.x, 0, target.z)) : null;

      const mGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.0, 8);
      const mMat = new THREE.MeshStandardMaterial({ color: 0xffb703, emissive: 0xffb703 });
      const mMesh = new THREE.Mesh(mGeo, mMat);
      mMesh.position.copy(carGroup.position);
      mMesh.position.y += 1.5;
      scene.add(mMesh);

      homingMissiles.push({ mesh: mMesh, targetPos, life: 120 });
    }

    // Trigger EMP
    function triggerEmp() {
      if (pEmp <= 0) return;
      pEmp -= 1;
      setEmpAmmo(pEmp);
      soundEngine.playEmp();
      soundEngine.speakVoice("EMP shockwave activated!");

      const empGeo = new THREE.RingGeometry(0.5, 1.5, 32);
      const empMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
      const empMesh = new THREE.Mesh(empGeo, empMat);
      empMesh.rotation.x = Math.PI / 2;
      empMesh.position.copy(carGroup.position);
      empMesh.position.y = 0.2;
      scene.add(empMesh);

      empRings.push({ mesh: empMesh, radius: 1, maxRadius: 35 });
    }

    // Main Render Loop
    let animId;
    const animate = () => {
      // Car Driving Physics
      const isBoosting = keys.shift && playerNitro > 5;
      if (isBoosting) playerNitro -= 0.6;
      else if (playerNitro < 100) playerNitro += 0.2;
      setNitro(Math.floor(playerNitro));

      const maxSpd = isBoosting ? 0.9 : 0.5;

      if (keys.w) carSpeed = Math.min(maxSpd, carSpeed + 0.02);
      else if (keys.s) carSpeed = Math.max(-maxSpd * 0.5, carSpeed - 0.02);
      else carSpeed *= 0.94;

      if (Math.abs(carSpeed) > 0.02) {
        if (keys.a) carAngle += 0.035;
        if (keys.d) carAngle -= 0.035;
      }

      carGroup.rotation.y = carAngle;
      carGroup.position.x += Math.sin(carAngle) * carSpeed;
      carGroup.position.z += Math.cos(carAngle) * carSpeed;

      // Wheel Spin
      wheels.forEach(w => w.rotation.x += carSpeed * 2);

      // Camera Follow 3rd Person
      const camOffset = new THREE.Vector3(0, 7, -14).applyAxisAngle(new THREE.Vector3(0, 1, 0), carAngle);
      camera.position.copy(carGroup.position).add(camOffset);
      camera.lookAt(carGroup.position.x, carGroup.position.y + 1.5, carGroup.position.z);

      // Fire Plasma Guns
      const now = Date.now();
      if (keys.space && now - lastShot > 160) {
        lastShot = now;
        soundEngine.playCannon();

        const bGeo = new THREE.SphereGeometry(0.25, 8, 8);
        const bMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
        const bMesh = new THREE.Mesh(bGeo, bMat);
        bMesh.position.copy(carGroup.position);
        bMesh.position.y += 1.2;

        const dir = new THREE.Vector3(Math.sin(carAngle), 0, Math.cos(carAngle)).normalize();
        scene.add(bMesh);
        playerBullets.push({ mesh: bMesh, dir, life: 60 });
      }

      // Update Bullets
      playerBullets.forEach((b, idx) => {
        b.mesh.position.addScaledVector(b.dir, 1.8);
        b.life--;

        // Hit Radars
        radars.forEach(r => {
          if (r.alive && b.mesh.position.distanceTo(r.group.position) < 5) {
            r.hp -= 1;
            b.life = 0;
            if (r.hp <= 0) {
              r.alive = false;
              r.group.visible = false;
              soundEngine.playExplosion();
              soundEngine.speakVoice("Radar station destroyed!");
              currentScore += 400;
              setScore(currentScore);
            }
          }
        });

        // Hit Tanks
        enemyTanks.forEach(t => {
          if (t.alive && b.mesh.position.distanceTo(t.group.position) < 4) {
            t.hp -= 1;
            b.life = 0;
            if (t.hp <= 0) {
              t.alive = false;
              t.group.visible = false;
              soundEngine.playExplosion();
              currentScore += 300;
              setScore(currentScore);
            }
          }
        });

        if (b.life <= 0) {
          scene.remove(b.mesh);
          playerBullets.splice(idx, 1);
        }
      });

      // Update Homing Missiles
      homingMissiles.forEach((m, idx) => {
        if (m.targetPos) {
          const moveDir = new THREE.Vector3().subVectors(m.targetPos, m.mesh.position).normalize();
          m.mesh.position.addScaledVector(moveDir, 1.4);
        } else {
          m.mesh.position.z -= 1.4;
        }

        m.life--;
        // Hit check
        radars.forEach(r => {
          if (r.alive && m.mesh.position.distanceTo(r.group.position) < 5) {
            r.hp -= 10;
            m.life = 0;
            if (r.hp <= 0) {
              r.alive = false;
              r.group.visible = false;
              soundEngine.playExplosion();
              soundEngine.speakVoice("Radar station destroyed!");
              currentScore += 400;
              setScore(currentScore);
            }
          }
        });

        if (m.life <= 0) {
          scene.remove(m.mesh);
          homingMissiles.splice(idx, 1);
        }
      });

      // Update EMP Shockwaves
      empRings.forEach((emp, idx) => {
        emp.radius += 0.8;
        emp.mesh.scale.set(emp.radius, emp.radius, 1);

        // Damage all enemies inside ring
        radars.forEach(r => {
          if (r.alive && emp.mesh.position.distanceTo(r.group.position) < emp.radius) {
            r.hp -= 0.5;
            if (r.hp <= 0) {
              r.alive = false;
              r.group.visible = false;
            }
          }
        });

        if (emp.radius >= emp.maxRadius) {
          scene.remove(emp.mesh);
          empRings.splice(idx, 1);
        }
      });

      // Rotate 3D Radar Dishes
      radars.forEach(r => {
        if (r.alive && r.dish) r.dish.rotation.y += 0.03;
      });

      // Check Radars Left
      const aliveCount = radars.filter(r => r.alive).length;
      setRadarsLeft(aliveCount);

      if (aliveCount === 0 && !intelSecured) {
        setIntelSecured(true);
        soundEngine.speakVoice("All radars destroyed. Helipad extraction active!");
        soundEngine.playAchievement();
        confetti({ particleCount: 50, spread: 70 });
        setHelipadActive(true);
      }

      // Check Victory Condition at origin
      if (aliveCount === 0 && carGroup.position.length() < 15) {
        soundEngine.speakVoice("Mission accomplished! Extraction complete.");
        cancelAnimationFrame(animId);

        const finalScore = currentScore + 1500;
        const creds = Math.floor(finalScore / 5);
        setCreditsEarned(creds);
        setScore(finalScore);
        setGameState('victory');

        if (finalScore > highScore) {
          setHighScore(finalScore);
          localStorage.setItem('cyber_igi3d_high', finalScore.toString());
        }

        if (onGameEnd) {
          onGameEnd({ score: finalScore, credits: creds, gameId: 'cyber_igi' });
        }
        return;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [gameState]);

  const startGame = () => {
    soundEngine.playMenuClick();
    soundEngine.startBgm();
    setScore(0);
    setHealth(100);
    setNitro(100);
    setEmpAmmo(3);
    setMissileAmmo(10);
    setRadarsLeft(3);
    setIntelSecured(false);
    setHelipadActive(false);
    setGameState('playing');
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-6xl mx-auto p-4 font-outfit">
      {/* Header */}
      <div className="w-full flex items-center justify-between glass-card p-4 mb-4">
        <button onClick={onBack} className="btn-cyan text-sm flex items-center gap-2">
          <ArrowLeft size={16} /> Exit Mission
        </button>

        <div className="text-center font-orbitron">
          <h2 className="text-xl font-bold text-cyan-400 glow-cyan flex items-center justify-center gap-2">
            CYBER I.G.I. 3D ADVANCED WARFARE
          </h2>
          <p className="text-xs text-gray-400">Three.js 3D WebGL Graphics Engine</p>
        </div>

        <div className="flex items-center gap-2 font-retro text-xs text-yellow-400">
          <Award size={16} /> TOP: {highScore}
        </div>
      </div>

      {/* Main 3D Canvas Container */}
      <div className="relative w-full glass-card p-2 rounded-2xl overflow-hidden scanlines flex justify-center items-center h-[600px] border border-cyan-500/30">
        {gameState === 'playing' && (
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 font-orbitron pointer-events-none">
            {/* Health & Boost Gauges */}
            <div className="glass-card p-3 rounded-xl flex flex-col gap-1.5 w-56 border-cyan-500/40">
              <div className="flex justify-between text-xs text-cyan-400">
                <span>3D ARMOR HP</span>
                <span>{health}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-900 rounded-full border border-cyan-500 overflow-hidden">
                <div className="h-full bg-cyan-400" style={{ width: `${Math.max(0, health)}%` }} />
              </div>

              <div className="flex justify-between text-xs text-yellow-400 mt-1">
                <span>NITRO SURGE</span>
                <span>{nitro}%</span>
              </div>
              <div className="w-full h-2 bg-gray-900 rounded-full border border-yellow-500 overflow-hidden">
                <div className="h-full bg-yellow-400" style={{ width: `${nitro}%` }} />
              </div>
            </div>

            {/* Tactical Weapons Ammo Counter */}
            <div className="glass-card p-3 rounded-xl text-xs text-gray-300 flex flex-col gap-1.5 w-56 border-purple-500/40">
              <div className="flex justify-between items-center text-purple-300 font-bold">
                <span>🚀 HOMING MISSILES (F):</span>
                <span className="text-yellow-400">{missileAmmo}</span>
              </div>
              <div className="flex justify-between items-center text-cyan-300 font-bold">
                <span>⚡ EMP SHOCKWAVE (E):</span>
                <span className="text-cyan-400">{empAmmo}</span>
              </div>
            </div>

            {/* Objective Checklist */}
            <div className="glass-card p-3 rounded-xl text-xs text-gray-300 flex flex-col gap-1 w-56">
              <span className="font-bold text-cyan-400 border-b border-cyan-500/20 pb-1 mb-1">3D OBJECTIVES</span>
              <div className="flex items-center justify-between">
                <span>1. 3D Radars:</span>
                <span className={radarsLeft === 0 ? 'text-green-400 font-bold' : 'text-yellow-400'}>{radarsLeft > 0 ? `${3 - radarsLeft}/3` : 'DONE ✓'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>2. Extraction Helipad:</span>
                <span className={helipadActive ? 'text-cyan-400 font-bold animate-pulse' : 'text-gray-500'}>{helipadActive ? 'ACTIVE 🚁' : 'LOCKED 🔒'}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={mountRef} className="w-full h-full rounded-xl" />

        {/* Start Overlay */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-6">
            <h1 className="text-4xl md:text-6xl font-black font-orbitron text-cyan-400 glow-cyan mb-2 text-center">
              CYBER I.G.I. 3D
            </h1>
            <p className="text-gray-300 text-sm mb-6 max-w-lg text-center">
              Experience full 3D WebGL graphics! Destroy 3D enemy radar dishes, lock-on homing missiles, unleash EMP shockwaves, and extract safely.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8 text-xs font-orbitron text-gray-400">
              <div className="glass-card p-3 flex items-center gap-2">
                <Navigation className="text-cyan-400" /> Drive: WASD / Arrows
              </div>
              <div className="glass-card p-3 flex items-center gap-2">
                <Crosshair className="text-red-400" /> Fire Guns: Spacebar
              </div>
              <div className="glass-card p-3 flex items-center gap-2">
                <Target className="text-yellow-400" /> Homing Missile: F Key
              </div>
              <div className="glass-card p-3 flex items-center gap-2">
                <Zap className="text-purple-400" /> EMP Blast: E Key
              </div>
              <div className="glass-card p-3 flex items-center gap-2 col-span-2 justify-center">
                <Flame className="text-orange-400" /> Nitro Boost: Shift Key
              </div>
            </div>

            <button onClick={startGame} className="btn-cyan text-lg px-8 py-3.5 rounded-xl flex items-center gap-3 animated-glow">
              <Play fill="currentColor" /> INFILTRATE IN 3D
            </button>
          </div>
        )}

        {/* Victory Overlay */}
        {gameState === 'victory' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-lg p-6">
            <h2 className="text-4xl font-black font-orbitron text-green-400 glow-cyan mb-2">
              3D MISSION ACCOMPLISHED!
            </h2>
            <p className="text-gray-300 text-sm mb-6 font-orbitron">3D COMPOUND CLEARED SAFELY</p>

            <div className="glass-card p-6 rounded-2xl w-full max-w-sm flex flex-col items-center gap-3 mb-6">
              <div className="text-xs text-gray-400 font-retro">FINAL SCORE</div>
              <div className="text-3xl font-extrabold text-cyan-400 glow-cyan font-orbitron">{score}</div>

              <div className="w-full border-t border-cyan-500/30 my-2" />

              <div className="flex items-center justify-between w-full text-sm font-orbitron">
                <span className="text-gray-400">CREDITS EARNED:</span>
                <span className="text-yellow-400 font-bold glow-gold">+{creditsEarned} 🪙</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={startGame} className="btn-cyan text-md px-6 py-3 rounded-xl flex items-center gap-2">
                <RotateCcw size={18} /> REPLAY 3D
              </button>
              <button onClick={onBack} className="btn-magenta text-md px-6 py-3 rounded-xl">
                RETURN TO HUB
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
