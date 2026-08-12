import React, { useRef, useEffect, useState } from 'react';
import { soundEngine } from '../../utils/soundEngine';
import { ArrowLeft, Play, RotateCcw, Shield, Radio, Crosshair, Zap, Navigation, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

const MAP_WIDTH = 2200;
const MAP_HEIGHT = 1600;

export default function CyberIgiCarGame({ userSettings, onGameEnd, onBack }) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('menu'); // 'menu' | 'playing' | 'victory' | 'gameover'
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [nitro, setNitro] = useState(100);
  const [radarsLeft, setRadarsLeft] = useState(3);
  const [intelSecured, setIntelSecured] = useState(false);
  const [helipadActive, setHelipadActive] = useState(false);
  const [creditsEarned, setCreditsEarned] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('cyber_igi_high') || '0', 10));

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = Math.min(window.innerWidth - 32, 920);
    canvas.height = 580;

    let animId;
    let currentScore = 0;
    let playerHealth = 100;
    let playerNitro = 100;

    // Car state
    const car = {
      x: 200,
      y: MAP_HEIGHT - 200,
      width: 44,
      height: 24,
      angle: -Math.PI / 2,
      turretAngle: 0,
      speed: 0,
      maxSpeed: 7,
      accel: 0.25,
      friction: 0.96,
      turnSpeed: 0.05
    };

    // Camera
    const camera = { x: 0, y: 0 };

    // Keys
    const keys = { w: false, s: false, a: false, d: false, space: false, shift: false };
    const mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    const handleKeyDown = (e) => {
      if (['KeyW', 'ArrowUp'].includes(e.code)) keys.w = true;
      if (['KeyS', 'ArrowDown'].includes(e.code)) keys.s = true;
      if (['KeyA', 'ArrowLeft'].includes(e.code)) keys.a = true;
      if (['KeyD', 'ArrowRight'].includes(e.code)) keys.d = true;
      if (['Space', 'KeyK'].includes(e.code)) keys.space = true;
      if (['ShiftLeft', 'ShiftRight'].includes(e.code)) keys.shift = true;
    };

    const handleKeyUp = (e) => {
      if (['KeyW', 'ArrowUp'].includes(e.code)) keys.w = false;
      if (['KeyS', 'ArrowDown'].includes(e.code)) keys.s = false;
      if (['KeyA', 'ArrowLeft'].includes(e.code)) keys.a = false;
      if (['KeyD', 'ArrowRight'].includes(e.code)) keys.d = false;
      if (['Space', 'KeyK'].includes(e.code)) keys.space = false;
      if (['ShiftLeft', 'ShiftRight'].includes(e.code)) keys.shift = false;
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseDown = () => {
      keys.space = true;
    };
    const handleMouseUp = () => {
      keys.space = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    // Map Entities
    const radars = [
      { id: 1, x: 700, y: 350, hp: 15, alive: true },
      { id: 2, x: 1600, y: 400, hp: 15, alive: true },
      { id: 3, x: 1200, y: 1100, hp: 15, alive: true }
    ];

    const towers = [
      { x: 500, y: 600, hp: 10, alive: true, lastShoot: 0 },
      { x: 1400, y: 700, hp: 10, alive: true, lastShoot: 0 },
      { x: 1800, y: 250, hp: 10, alive: true, lastShoot: 0 },
      { x: 900, y: 1300, hp: 10, alive: true, lastShoot: 0 }
    ];

    const enemyTanks = [
      { x: 900, y: 450, hp: 20, alive: true, vx: 2, angle: 0, lastShoot: 0 },
      { x: 1500, y: 1000, hp: 20, alive: true, vx: -2, angle: Math.PI, lastShoot: 0 }
    ];

    const landmines = [
      { x: 650, y: 750, active: true },
      { x: 1100, y: 900, active: true },
      { x: 1350, y: 550, active: true },
      { x: 800, y: 1250, active: true }
    ];

    const intelBriefcase = { x: 1800, y: 1300, collected: false };
    const helipad = { x: 2000, y: 200 };

    let playerBullets = [];
    let enemyBullets = [];
    let particles = [];
    let lastShot = 0;
    let vroomCooldown = 0;

    const createExplosion = (wx, wy, color = '#ff0055', count = 25) => {
      soundEngine.playExplosion();
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = Math.random() * 6 + 1;
        particles.push({
          x: wx, y: wy,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          life: 1,
          decay: Math.random() * 0.04 + 0.02,
          color,
          size: Math.random() * 5 + 2
        });
      }
    };

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Car Physics & Movement
      const isBoosting = keys.shift && playerNitro > 5;
      if (isBoosting) playerNitro -= 0.6;
      else if (playerNitro < 100) playerNitro += 0.2;
      setNitro(Math.floor(playerNitro));

      const topSpeed = isBoosting ? car.maxSpeed * 1.6 : car.maxSpeed;

      if (keys.w) {
        car.speed = Math.min(topSpeed, car.speed + car.accel);
        vroomCooldown++;
        if (vroomCooldown % 30 === 0) soundEngine.playEngineVroom();
      } else if (keys.s) {
        car.speed = Math.max(-topSpeed * 0.5, car.speed - car.accel);
      } else {
        car.speed *= car.friction;
      }

      if (Math.abs(car.speed) > 0.2) {
        const turnDir = car.speed >= 0 ? 1 : -1;
        if (keys.a) car.angle -= car.turnSpeed * turnDir;
        if (keys.d) car.angle += car.turnSpeed * turnDir;
      }

      car.x += Math.cos(car.angle) * car.speed;
      car.y += Math.sin(car.angle) * car.speed;

      // Keep car inside map bounds
      car.x = Math.max(40, Math.min(MAP_WIDTH - 40, car.x));
      car.y = Math.max(40, Math.min(MAP_HEIGHT - 40, car.y));

      // Camera Follows Car
      camera.x = car.x - canvas.width / 2;
      camera.y = car.y - canvas.height / 2;
      camera.x = Math.max(0, Math.min(MAP_WIDTH - canvas.width, camera.x));
      camera.y = Math.max(0, Math.min(MAP_HEIGHT - canvas.height, camera.y));

      // Calculate Turret Angle pointing to mouse
      const screenCarX = car.x - camera.x;
      const screenCarY = car.y - camera.y;
      car.turretAngle = Math.atan2(mouse.y - screenCarY, mouse.x - screenCarX);

      // Fire Cannons
      const now = Date.now();
      if (keys.space && now - lastShot > 180) {
        lastShot = now;
        soundEngine.playCannon();
        playerBullets.push({
          x: car.x + Math.cos(car.turretAngle) * 25,
          y: car.y + Math.sin(car.turretAngle) * 25,
          vx: Math.cos(car.turretAngle) * 14,
          vy: Math.sin(car.turretAngle) * 14,
          life: 90
        });
      }

      // Draw World Grid & Terrain (Offset by Camera)
      ctx.save();
      ctx.translate(-camera.x, -camera.y);

      // Base Ground
      ctx.fillStyle = '#0c101a';
      ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

      // Grid lines
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < MAP_WIDTH; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, MAP_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < MAP_HEIGHT; y += 100) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(MAP_WIDTH, y);
        ctx.stroke();
      }

      // Military Roads
      ctx.fillStyle = '#161c2d';
      ctx.fillRect(100, 200, MAP_WIDTH - 200, 120);
      ctx.fillRect(1100, 200, 120, MAP_HEIGHT - 400);

      // Helipad Zone
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(helipad.x, helipad.y, 70, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = '28px Orbitron';
      ctx.fillStyle = '#00f3ff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('H', helipad.x, helipad.y);

      // Draw Landmines
      landmines.forEach(m => {
        if (m.active) {
          ctx.fillStyle = '#ff0055';
          ctx.shadowColor = '#ff0055';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(m.x, m.y, 8, 0, Math.PI * 2);
          ctx.fill();

          // Distance to car
          const dist = Math.hypot(m.x - car.x, m.y - car.y);
          if (dist < 28) {
            m.active = false;
            createExplosion(m.x, m.y, '#ff0055', 30);
            playerHealth -= 35;
            setHealth(playerHealth);
          }
        }
      });

      // Draw Intel Briefcase
      if (!intelBriefcase.collected) {
        ctx.fillStyle = '#ffb703';
        ctx.shadowColor = '#ffb703';
        ctx.shadowBlur = 14;
        ctx.fillRect(intelBriefcase.x - 12, intelBriefcase.y - 10, 24, 20);

        const dist = Math.hypot(intelBriefcase.x - car.x, intelBriefcase.y - car.y);
        if (dist < 40) {
          intelBriefcase.collected = true;
          setIntelSecured(true);
          soundEngine.playRadioIntel();
          soundEngine.playAchievement();
          currentScore += 500;
          setScore(currentScore);
          confetti({ particleCount: 30, spread: 50 });
        }
      }

      // Draw Military Radars
      let aliveRadars = 0;
      radars.forEach(r => {
        if (r.alive) {
          aliveRadars++;
          ctx.save();
          ctx.translate(r.x, r.y);
          ctx.shadowColor = '#00f3ff';
          ctx.shadowBlur = 15;
          ctx.strokeStyle = '#00f3ff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 30, 0, Math.PI * 2);
          ctx.stroke();

          // Radar Scanner Beam
          const sweep = (Date.now() / 300) % (Math.PI * 2);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(sweep) * 30, Math.sin(sweep) * 30);
          ctx.stroke();
          ctx.restore();
        }
      });
      setRadarsLeft(aliveRadars);
      if (aliveRadars === 0 && intelBriefcase.collected && !helipadActive) {
        setHelipadActive(true);
      }

      // Draw Watchtowers & Shoot
      towers.forEach(t => {
        if (t.alive) {
          ctx.fillStyle = '#ff0055';
          ctx.shadowColor = '#ff0055';
          ctx.shadowBlur = 10;
          ctx.fillRect(t.x - 18, t.y - 18, 36, 36);

          // Tower Searchlight
          const distToCar = Math.hypot(car.x - t.x, car.y - t.y);
          if (distToCar < 350 && Date.now() - t.lastShoot > 1200) {
            t.lastShoot = Date.now();
            const angleToCar = Math.atan2(car.y - t.y, car.x - t.x);
            enemyBullets.push({
              x: t.x, y: t.y,
              vx: Math.cos(angleToCar) * 8,
              vy: Math.sin(angleToCar) * 8
            });
          }
        }
      });

      // Draw Enemy Patrol Tanks
      enemyTanks.forEach(et => {
        if (et.alive) {
          et.x += et.vx;
          if (et.x < 400 || et.x > 1800) et.vx *= -1;

          ctx.save();
          ctx.translate(et.x, et.y);
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 12;
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(-22, -15, 44, 30);

          const distToCar = Math.hypot(car.x - et.x, car.y - et.y);
          if (distToCar < 400 && Date.now() - et.lastShoot > 1500) {
            et.lastShoot = Date.now();
            const a = Math.atan2(car.y - et.y, car.x - et.x);
            enemyBullets.push({
              x: et.x, y: et.y,
              vx: Math.cos(a) * 9,
              vy: Math.sin(a) * 9
            });
          }
          ctx.restore();
        }
      });

      // Update Player Bullets & Collision
      playerBullets.forEach((pb, pIdx) => {
        pb.x += pb.vx;
        pb.y += pb.vy;
        pb.life--;

        ctx.fillStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(pb.x, pb.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Hit Radars
        radars.forEach(r => {
          if (r.alive && Math.hypot(pb.x - r.x, pb.y - r.y) < 32) {
            r.hp -= 1;
            pb.life = 0;
            if (r.hp <= 0) {
              r.alive = false;
              createExplosion(r.x, r.y, '#00f3ff', 35);
              currentScore += 300;
              setScore(currentScore);
            }
          }
        });

        // Hit Towers
        towers.forEach(t => {
          if (t.alive && Math.hypot(pb.x - t.x, pb.y - t.y) < 24) {
            t.hp -= 1;
            pb.life = 0;
            if (t.hp <= 0) {
              t.alive = false;
              createExplosion(t.x, t.y, '#ff0055', 25);
              currentScore += 200;
              setScore(currentScore);
            }
          }
        });

        // Hit Enemy Tanks
        enemyTanks.forEach(et => {
          if (et.alive && Math.hypot(pb.x - et.x, pb.y - et.y) < 28) {
            et.hp -= 1;
            pb.life = 0;
            if (et.hp <= 0) {
              et.alive = false;
              createExplosion(et.x, et.y, '#a855f7', 30);
              currentScore += 400;
              setScore(currentScore);
            }
          }
        });

        if (pb.life <= 0) playerBullets.splice(pIdx, 1);
      });

      // Update Enemy Bullets
      enemyBullets.forEach((eb, eIdx) => {
        eb.x += eb.vx;
        eb.y += eb.vy;

        ctx.fillStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(eb.x, eb.y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Hit player car
        if (Math.hypot(eb.x - car.x, eb.y - car.y) < 24) {
          enemyBullets.splice(eIdx, 1);
          soundEngine.playHit();
          playerHealth -= 12;
          setHealth(playerHealth);
        }
      });

      // Draw Player Armored Car
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);

      // Car Hull Body
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#00f3ff';
      ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);

      // Car Wheels
      ctx.fillStyle = '#000';
      ctx.fillRect(-18, -14, 10, 5);
      ctx.fillRect(10, -14, 10, 5);
      ctx.fillRect(-18, 9, 10, 5);
      ctx.fillRect(10, 9, 10, 5);

      // Rear Exhaust Flame if boosting
      if (isBoosting) {
        ctx.fillStyle = '#ffb703';
        ctx.beginPath();
        ctx.moveTo(-car.width / 2, -5);
        ctx.lineTo(-car.width / 2 - 15 - Math.random() * 10, 0);
        ctx.lineTo(-car.width / 2, 5);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();

      // Draw Mounted Turret (Rotates towards Mouse)
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.turretAngle);
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 10;
      ctx.fillRect(0, -4, 22, 8);
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Render Particles
      particles.forEach((p, pIdx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) {
          particles.splice(pIdx, 1);
        } else {
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1.0;

      ctx.restore(); // Restore World Camera

      // Check Extraction Helipad Victory Condition
      if (aliveRadars === 0 && intelBriefcase.collected) {
        const distToHelipad = Math.hypot(car.x - helipad.x, car.y - helipad.y);
        if (distToHelipad < 70) {
          soundEngine.playAchievement();
          confetti({ particleCount: 80, spread: 80 });
          cancelAnimationFrame(animId);

          const finalScore = currentScore + 1000;
          const creds = Math.floor(finalScore / 5);
          setCreditsEarned(creds);
          setScore(finalScore);
          setGameState('victory');

          if (finalScore > highScore) {
            setHighScore(finalScore);
            localStorage.setItem('cyber_igi_high', finalScore.toString());
          }

          if (onGameEnd) {
            onGameEnd({ score: finalScore, credits: creds, gameId: 'cyber_igi' });
          }
          return;
        }
      }

      // Check Game Over
      if (playerHealth <= 0) {
        createExplosion(car.x, car.y, '#ff0055', 40);
        soundEngine.playExplosion();
        cancelAnimationFrame(animId);

        const creds = Math.floor(currentScore / 10);
        setCreditsEarned(creds);
        setGameState('gameover');

        if (onGameEnd) {
          onGameEnd({ score: currentScore, credits: creds, gameId: 'cyber_igi' });
        }
        return;
      }

      // Render Top-Right I.G.I. Tactical Satellite Minimap Radar
      renderRadar(ctx, canvas, car, radars, towers, enemyTanks, intelBriefcase, helipad);

      animId = requestAnimationFrame(render);
    };

    const renderRadar = (ctx, canvas, car, radars, towers, enemyTanks, intelBriefcase, helipad) => {
      const rw = 160;
      const rh = 120;
      const rx = canvas.width - rw - 16;
      const ry = 16;

      ctx.fillStyle = 'rgba(12, 16, 26, 0.85)';
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeRect(rx, ry, rw, rh);

      const scaleX = rw / MAP_WIDTH;
      const scaleY = rh / MAP_HEIGHT;

      // Radars Blips
      ctx.fillStyle = '#00f3ff';
      radars.forEach(r => {
        if (r.alive) ctx.fillRect(rx + r.x * scaleX - 3, ry + r.y * scaleY - 3, 6, 6);
      });

      // Towers Blips
      ctx.fillStyle = '#ff0055';
      towers.forEach(t => {
        if (t.alive) ctx.fillRect(rx + t.x * scaleX - 2, ry + t.y * scaleY - 2, 4, 4);
      });

      // Tanks Blips
      ctx.fillStyle = '#a855f7';
      enemyTanks.forEach(et => {
        if (et.alive) ctx.fillRect(rx + et.x * scaleX - 3, ry + et.y * scaleY - 3, 6, 6);
      });

      // Intel Blip
      if (!intelBriefcase.collected) {
        ctx.fillStyle = '#ffb703';
        ctx.fillRect(rx + intelBriefcase.x * scaleX - 3, ry + intelBriefcase.y * scaleY - 3, 6, 6);
      }

      // Helipad Blip
      ctx.fillStyle = '#00ff88';
      ctx.beginPath();
      ctx.arc(rx + helipad.x * scaleX, ry + helipad.y * scaleY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Player Car Blip
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(rx + car.x * scaleX, ry + car.y * scaleY, 4, 0, Math.PI * 2);
      ctx.fill();
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [gameState]);

  const startGame = () => {
    soundEngine.playMenuClick();
    soundEngine.startBgm();
    setScore(0);
    setHealth(100);
    setNitro(100);
    setRadarsLeft(3);
    setIntelSecured(false);
    setHelipadActive(false);
    setGameState('playing');
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl mx-auto p-4 font-outfit">
      {/* Header Bar */}
      <div className="w-full flex items-center justify-between glass-card p-4 mb-4">
        <button onClick={onBack} className="btn-cyan text-sm flex items-center gap-2">
          <ArrowLeft size={16} /> Exit Mission
        </button>

        <div className="text-center font-orbitron">
          <h2 className="text-xl font-bold text-cyan-400 glow-cyan">CYBER I.G.I. - TACTICAL CAR MISSION</h2>
          <p className="text-xs text-gray-400">Armored Recon Vehicle Infiltration</p>
        </div>

        <div className="flex items-center gap-2 font-retro text-xs text-yellow-400">
          <Award size={16} /> BEST: {highScore}
        </div>
      </div>

      {/* Main Canvas Box */}
      <div className="relative w-full glass-card p-2 rounded-2xl overflow-hidden scanlines flex justify-center items-center">
        {gameState === 'playing' && (
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 font-orbitron pointer-events-none">
            {/* Armor & Nitro */}
            <div className="glass-card p-3 rounded-xl flex flex-col gap-1.5 w-52 border-cyan-500/40">
              <div className="flex justify-between text-xs text-cyan-400">
                <span>CAR ARMOR</span>
                <span>{health}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-900 rounded-full border border-cyan-500 overflow-hidden">
                <div className="h-full bg-cyan-400 transition-all duration-200" style={{ width: `${Math.max(0, health)}%` }} />
              </div>

              <div className="flex justify-between text-xs text-yellow-400 mt-1">
                <span>NITRO TURBO</span>
                <span>{nitro}%</span>
              </div>
              <div className="w-full h-2 bg-gray-900 rounded-full border border-yellow-500 overflow-hidden">
                <div className="h-full bg-yellow-400" style={{ width: `${nitro}%` }} />
              </div>
            </div>

            {/* Mission Objective Checklist */}
            <div className="glass-card p-3 rounded-xl text-xs text-gray-300 flex flex-col gap-1 w-64">
              <span className="font-bold text-cyan-400 border-b border-cyan-500/20 pb-1 mb-1">MISSION OBJECTIVES</span>
              <div className="flex items-center justify-between">
                <span>1. Destroy Radars:</span>
                <span className={radarsLeft === 0 ? 'text-green-400 font-bold' : 'text-yellow-400'}>{radarsLeft > 0 ? `${3 - radarsLeft}/3` : 'DONE ✓'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>2. Intel Briefcase:</span>
                <span className={intelSecured ? 'text-green-400 font-bold' : 'text-red-400'}>{intelSecured ? 'SECURED ✓' : 'MISSING 💼'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>3. Helipad Escape:</span>
                <span className={helipadActive ? 'text-cyan-400 font-bold animate-pulse' : 'text-gray-500'}>{helipadActive ? 'READY 🚁' : 'LOCKED 🔒'}</span>
              </div>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="w-full h-[580px] bg-slate-950 rounded-xl cursor-crosshair border border-cyan-500/30" />

        {/* Start Overlay */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-6">
            <h1 className="text-4xl md:text-5xl font-black font-orbitron text-cyan-400 glow-cyan mb-2 text-center">
              CYBER I.G.I. CAR MISSION
            </h1>
            <p className="text-gray-300 text-sm mb-6 max-w-md text-center">
              Drive your armored vehicle into the enemy military base. Destroy 3 communication radars, steal the secret intel briefcase, and reach the helipad!
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8 text-xs font-orbitron text-gray-400">
              <div className="glass-card p-3 flex items-center gap-2">
                <Navigation className="text-cyan-400" /> Drive: WASD / Arrows
              </div>
              <div className="glass-card p-3 flex items-center gap-2">
                <Crosshair className="text-red-400" /> Aim Turret & Fire: Mouse / Space
              </div>
              <div className="glass-card p-3 flex items-center gap-2 col-span-2 justify-center">
                <Zap className="text-yellow-400" /> Nitro Boost: Shift Key
              </div>
            </div>

            <button onClick={startGame} className="btn-cyan text-lg px-8 py-3 rounded-xl flex items-center gap-3 animated-glow">
              <Play fill="currentColor" /> INFILTRATE BASE
            </button>
          </div>
        )}

        {/* Victory Overlay */}
        {gameState === 'victory' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-lg p-6">
            <h2 className="text-4xl font-black font-orbitron text-green-400 glow-cyan mb-2">
              MISSION ACCOMPLISHED!
            </h2>
            <p className="text-gray-300 text-sm mb-6 font-orbitron">EXTRACTED SAFELY FROM MILITARY COMPOUND</p>

            <div className="glass-card p-6 rounded-2xl w-full max-w-sm flex flex-col items-center gap-3 mb-6">
              <div className="text-xs text-gray-400 font-retro">TOTAL MISSION SCORE</div>
              <div className="text-3xl font-extrabold text-cyan-400 glow-cyan font-orbitron">{score}</div>

              <div className="w-full border-t border-cyan-500/30 my-2" />

              <div className="flex items-center justify-between w-full text-sm font-orbitron">
                <span className="text-gray-400">CREDITS EARNED:</span>
                <span className="text-yellow-400 font-bold glow-gold">+{creditsEarned} 🪙</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={startGame} className="btn-cyan text-md px-6 py-3 rounded-xl flex items-center gap-2">
                <RotateCcw size={18} /> REPLAY MISSION
              </button>
              <button onClick={onBack} className="btn-magenta text-md px-6 py-3 rounded-xl">
                RETURN TO HUB
              </button>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-lg p-6">
            <h2 className="text-4xl font-black font-orbitron text-red-500 glow-magenta mb-2">
              CAR DESTROYED!
            </h2>

            <div className="glass-card-magenta p-6 rounded-2xl w-full max-w-sm flex flex-col items-center gap-3 mb-6">
              <div className="text-xs text-gray-400 font-retro">FINAL SCORE</div>
              <div className="text-3xl font-extrabold text-cyan-400 glow-cyan font-orbitron">{score}</div>

              <div className="w-full border-t border-red-500/30 my-2" />

              <div className="flex items-center justify-between w-full text-sm font-orbitron">
                <span className="text-gray-400">CREDITS EARNED:</span>
                <span className="text-yellow-400 font-bold glow-gold">+{creditsEarned} 🪙</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={startGame} className="btn-cyan text-md px-6 py-3 rounded-xl flex items-center gap-2">
                <RotateCcw size={18} /> RETRY MISSION
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
