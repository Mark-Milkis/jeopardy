import React from 'react';
import HostView from './HostView';
import PlayerView from './PlayerView';

const DeveloperView: React.FC = () => {
  return (
    <div className="flex h-full w-full bg-black overflow-hidden">
      {/* Host Section - Takes major space */}
      <div className="flex-1 border-r-4 border-gray-800 relative min-w-0">
        <HostView />
      </div>

      {/* Players Section - Scrollable sidebar */}
      <div className="w-[375px] bg-gray-900 flex flex-col gap-6 p-4 overflow-y-auto shrink-0 shadow-xl z-10">
        <div className="text-white text-center pb-2 border-b border-gray-700">
             <h2 className="font-bold uppercase tracking-widest text-[#FFCC00]">Dev Console</h2>
             <p className="text-xs text-gray-400">Player Simulator</p>
             <p className="text-xs text-blue-300 mt-1">For multiple players: open /#/play in separate tabs</p>
        </div>
        
        {/* Player Simulator */}
        <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-xs font-bold uppercase">Player View (Mobile)</label>
            <div className="aspect-[9/16] w-full bg-black rounded-3xl border-8 border-gray-800 overflow-hidden shadow-2xl relative ring-1 ring-white/10">
                <PlayerView />
            </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperView;