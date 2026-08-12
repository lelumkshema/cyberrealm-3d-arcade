import React from 'react';
import { soundEngine } from '../utils/soundEngine';
import { Gamepad2, ShoppingBag, Trophy, Volume2, VolumeX, Car } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, credits, isMuted, setIsMuted }) {
  const toggleAudio = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundEngine.setMuted(nextMute);
    if (!nextMute) soundEngine.playMenuClick();
  };

  return (
    <nav className="w-full glass-card sticky top-0 z-50 px-4 py-3 border-b border-cyan-500/20 mb-6 font-outfit">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => { soundEngine.playMenuClick(); setActiveTab('hub'); }}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(0,243,255,0.4)] group-hover:scale-105 transition-transform">
            👾
          </div>
          <div>
            <h1 className="font-orbitron font-black text-xl text-cyan-400 glow-cyan tracking-wider">
              CYBER<span className="text-purple-400">REALM</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-retro tracking-widest">3D WEBGL ENGINE v3.0</p>
          </div>
        </div>

        {/* Center Tabs */}
        <div className="hidden md:flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-cyan-500/20 font-orbitron">
          <button
            onClick={() => { soundEngine.playMenuClick(); setActiveTab('hub'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'hub' ? 'btn-cyan' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Gamepad2 size={16} /> ARCADE HUB
          </button>

          <button
            onClick={() => { soundEngine.playMenuClick(); setActiveTab('garage'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'garage' ? 'btn-gold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Car size={16} /> 3D GARAGE
          </button>

          <button
            onClick={() => { soundEngine.playMenuClick(); setActiveTab('shop'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'shop' ? 'btn-magenta' : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShoppingBag size={16} /> SHOP
          </button>

          <button
            onClick={() => { soundEngine.playMenuClick(); setActiveTab('leaderboard'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'leaderboard' ? 'btn-cyan' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Trophy size={16} /> RANKS
          </button>
        </div>

        {/* Right Status */}
        <div className="flex items-center gap-4">
          <div className="glass-card px-3 py-1.5 rounded-lg flex items-center gap-2 font-orbitron text-xs border-yellow-500/40">
            <span className="text-yellow-400 font-bold glow-gold">{credits} 🪙</span>
          </div>

          <button
            onClick={toggleAudio}
            className="p-2.5 rounded-lg bg-slate-900 border border-cyan-500/30 text-cyan-400 hover:border-cyan-400 transition-colors"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="flex md:hidden items-center justify-around mt-3 pt-3 border-t border-cyan-500/10">
        <button
          onClick={() => { soundEngine.playMenuClick(); setActiveTab('hub'); }}
          className={`text-xs font-orbitron flex flex-col items-center gap-1 ${activeTab === 'hub' ? 'text-cyan-400 font-bold' : 'text-gray-400'}`}
        >
          <Gamepad2 size={16} /> HUB
        </button>

        <button
          onClick={() => { soundEngine.playMenuClick(); setActiveTab('garage'); }}
          className={`text-xs font-orbitron flex flex-col items-center gap-1 ${activeTab === 'garage' ? 'text-yellow-400 font-bold' : 'text-gray-400'}`}
        >
          <Car size={16} /> 3D CAR
        </button>

        <button
          onClick={() => { soundEngine.playMenuClick(); setActiveTab('shop'); }}
          className={`text-xs font-orbitron flex flex-col items-center gap-1 ${activeTab === 'shop' ? 'text-magenta-400 font-bold' : 'text-gray-400'}`}
        >
          <ShoppingBag size={16} /> SHOP
        </button>

        <button
          onClick={() => { soundEngine.playMenuClick(); setActiveTab('leaderboard'); }}
          className={`text-xs font-orbitron flex flex-col items-center gap-1 ${activeTab === 'leaderboard' ? 'text-cyan-400 font-bold' : 'text-gray-400'}`}
        >
          <Trophy size={16} /> RANKS
        </button>
      </div>
    </nav>
  );
}
