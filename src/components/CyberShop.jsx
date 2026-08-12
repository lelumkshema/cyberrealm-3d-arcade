import React from 'react';
import { soundEngine } from '../utils/soundEngine';
import { ShoppingBag, Check, Lock, Zap, Shield, Sparkles } from 'lucide-react';

const SHOP_ITEMS = [
  {
    id: 'skin_magenta',
    type: 'shipSkin',
    value: 'magenta',
    name: 'Magenta Viper Ship',
    price: 300,
    desc: 'Sleek neon magenta hull with high-contrast plasma engine trails.',
    icon: '🚀'
  },
  {
    id: 'skin_gold',
    type: 'shipSkin',
    value: 'gold',
    name: 'Gold Cyberlord Ship',
    price: 800,
    desc: 'Golden titanium alloy plating designed for elite space pilots.',
    icon: '👑'
  },
  {
    id: 'laser_magenta',
    type: 'laserColor',
    value: '#ff0055',
    name: 'Neon Magenta Laser',
    price: 250,
    desc: 'High-frequency particle beam rendering in deep magenta glow.',
    icon: '⚡'
  },
  {
    id: 'laser_gold',
    type: 'laserColor',
    value: '#ffb703',
    name: 'Plasma Gold Laser',
    price: 600,
    desc: 'Solar flare thermal lasers dealing hyper visual impact.',
    icon: '🔥'
  }
];

export default function CyberShop({ credits, inventory, settings, onBuy, onEquip }) {
  return (
    <div className="w-full max-w-5xl mx-auto p-4 font-outfit">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black font-orbitron text-cyan-400 glow-cyan flex items-center gap-3">
            <ShoppingBag className="text-cyan-400" /> CYBER ARMORY & SHOP
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Upgrade your battle gear, custom lasers, and ship hulls with earned Cyber Credits.
          </p>
        </div>

        <div className="glass-card-magenta px-6 py-3 rounded-xl flex items-center gap-3 font-orbitron">
          <span className="text-xs text-gray-400">CREDITS BALANCE:</span>
          <span className="text-2xl font-extrabold text-yellow-400 glow-gold">{credits} 🪙</span>
        </div>
      </div>

      {/* Grid of Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SHOP_ITEMS.map((item) => {
          const isUnlocked = inventory?.unlockedItems?.includes(item.id);
          const isEquipped = 
            (item.type === 'shipSkin' && settings?.shipSkin === item.value) ||
            (item.type === 'laserColor' && settings?.laserColor === item.value);

          return (
            <div key={item.id} className="glass-card p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
              {isEquipped && (
                <div className="absolute top-3 right-3 neon-badge flex items-center gap-1 bg-cyan-500/20 border-cyan-400 text-cyan-400">
                  <Check size={12} /> EQUIPPED
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-center text-3xl shadow-inner">
                  {item.icon}
                </div>

                <div>
                  <h3 className="text-xl font-bold font-orbitron text-gray-100 group-hover:text-cyan-300 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-cyan-500/10 flex items-center justify-between">
                <div className="text-lg font-bold font-orbitron text-yellow-400">
                  {item.price} 🪙
                </div>

                {isUnlocked ? (
                  <button
                    onClick={() => {
                      soundEngine.playMenuClick();
                      onEquip(item.type, item.value);
                    }}
                    disabled={isEquipped}
                    className={`px-4 py-2 rounded-lg font-orbitron text-xs font-bold transition-all ${
                      isEquipped ? 'bg-gray-800 text-gray-500 cursor-default' : 'btn-cyan'
                    }`}
                  >
                    {isEquipped ? 'EQUIPPED' : 'EQUIP'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (credits >= item.price) {
                        soundEngine.playAchievement();
                        onBuy(item);
                      } else {
                        soundEngine.playHit();
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-orbitron text-xs font-bold flex items-center gap-2 ${
                      credits >= item.price ? 'btn-gold' : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {credits >= item.price ? <Sparkles size={14} /> : <Lock size={14} />}
                    {credits >= item.price ? 'UNLOCK ITEM' : 'NEED MORE CREDITS'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
