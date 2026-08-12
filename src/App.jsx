import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ArcadeHub from './components/ArcadeHub';
import CyberShop from './components/CyberShop';
import Leaderboard from './components/Leaderboard';
import Cyber3DGarage from './components/Cyber3DGarage';
import CyberStrikeGame from './components/games/CyberStrikeGame';
import NeonPulseGame from './components/games/NeonPulseGame';
import CyberMazeGame from './components/games/CyberMazeGame';
import CyberIgi3DGame from './components/games/CyberIgi3DGame';

export default function App() {
  const [activeTab, setActiveTab] = useState('hub'); // 'hub' | 'garage' | 'shop' | 'leaderboard' | 'game_strike' | 'game_pulse' | 'game_maze' | 'game_igi'
  const [isMuted, setIsMuted] = useState(false);

  // User persistence state
  const [credits, setCredits] = useState(() => {
    return parseInt(localStorage.getItem('cyber_credits') || '500', 10);
  });

  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('cyber_user');
    return saved ? JSON.parse(saved) : { username: 'CyberRider' };
  });

  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('cyber_inventory');
    return saved ? JSON.parse(saved) : { unlockedItems: ['default_ship', 'default_laser', 'cyan'] };
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('cyber_settings');
    return saved ? JSON.parse(saved) : { shipSkin: 'cyan', laserColor: '#00f3ff' };
  });

  const [stats, setStats] = useState(() => {
    const igiHigh = parseInt(localStorage.getItem('cyber_igi3d_high') || '0', 10);
    const strikeHigh = parseInt(localStorage.getItem('cyber_strike_high') || '0', 10);
    const pulseHigh = parseInt(localStorage.getItem('cyber_pulse_high') || '0', 10);
    const mazeHigh = parseInt(localStorage.getItem('cyber_maze_high') || '0', 10);
    const badges = JSON.parse(localStorage.getItem('cyber_badges') || '[]');
    return {
      high_igi: igiHigh,
      high_strike: strikeHigh,
      high_pulse: pulseHigh,
      high_maze: mazeHigh,
      badges
    };
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('cyber_credits', credits.toString());
  }, [credits]);

  useEffect(() => {
    localStorage.setItem('cyber_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('cyber_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('cyber_user', JSON.stringify(userProfile));
  }, [userProfile]);

  // Handle Game End
  const handleGameEnd = ({ score, credits: earnedCredits, gameId }) => {
    const newCredits = credits + earnedCredits;
    setCredits(newCredits);

    setStats((prev) => {
      const updated = { ...prev };
      const key = gameId.split('_')[1];
      const currentHigh = prev[`high_${key}`] || 0;
      if (score > currentHigh) {
        updated[`high_${key}`] = score;
        localStorage.setItem(`cyber_${key}_high`, score.toString());
      }

      // Check badges
      const newBadges = [...prev.badges];
      if (score >= 100 && !newBadges.includes('first_win')) newBadges.push('first_win');
      if (gameId === 'cyber_igi' && !newBadges.includes('igi_master')) newBadges.push('igi_master');
      if (gameId === 'cyber_strike' && score >= 1000 && !newBadges.includes('score_1000')) newBadges.push('score_1000');
      updated.badges = newBadges;
      localStorage.setItem('cyber_badges', JSON.stringify(newBadges));

      return updated;
    });
  };

  // Buy Shop Item
  const handleBuy = (item) => {
    if (credits >= item.price) {
      setCredits(credits - item.price);
      const updatedUnlocked = [...inventory.unlockedItems, item.id];
      setInventory({ unlockedItems: updatedUnlocked });

      if (item.type === 'shipSkin') setSettings((prev) => ({ ...prev, shipSkin: item.value }));
      if (item.type === 'laserColor') setSettings((prev) => ({ ...prev, laserColor: item.value }));
    }
  };

  // Equip Shop Item
  const handleEquip = (type, value) => {
    if (type === 'shipSkin') setSettings((prev) => ({ ...prev, shipSkin: value }));
    if (type === 'laserColor') setSettings((prev) => ({ ...prev, laserColor: value }));
  };

  // Update Profile Name
  const handleUpdateName = (name) => {
    setUserProfile({ username: name });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 flex flex-col font-outfit">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        credits={credits}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
      />

      <main className="flex-1 pb-12">
        {activeTab === 'hub' && (
          <ArcadeHub
            onSelectGame={(gameId) => setActiveTab(`game_${gameId.split('_')[1]}`)}
            stats={stats}
            userProfile={userProfile}
          />
        )}

        {activeTab === 'garage' && (
          <Cyber3DGarage
            settings={settings}
            onEquip={handleEquip}
          />
        )}

        {activeTab === 'shop' && (
          <CyberShop
            credits={credits}
            inventory={inventory}
            settings={settings}
            onBuy={handleBuy}
            onEquip={handleEquip}
          />
        )}

        {activeTab === 'leaderboard' && (
          <Leaderboard
            stats={stats}
            userProfile={userProfile}
            onUpdateName={handleUpdateName}
          />
        )}

        {activeTab === 'game_igi' && (
          <CyberIgi3DGame
            userSettings={settings}
            onGameEnd={handleGameEnd}
            onBack={() => setActiveTab('hub')}
          />
        )}

        {activeTab === 'game_strike' && (
          <CyberStrikeGame
            userSettings={settings}
            onGameEnd={handleGameEnd}
            onBack={() => setActiveTab('hub')}
          />
        )}

        {activeTab === 'game_pulse' && (
          <NeonPulseGame
            onGameEnd={handleGameEnd}
            onBack={() => setActiveTab('hub')}
          />
        )}

        {activeTab === 'game_maze' && (
          <CyberMazeGame
            onGameEnd={handleGameEnd}
            onBack={() => setActiveTab('hub')}
          />
        )}
      </main>

      <footer className="py-6 border-t border-cyan-500/10 text-center text-xs text-gray-500 font-orbitron">
        CYBER REALM 3D &copy; 2026 | POWERED BY THREE.JS WEBGL ENGINE & REACT
      </footer>
    </div>
  );
}
