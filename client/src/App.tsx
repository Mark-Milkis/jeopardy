import React from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { GameProvider } from './services/gameService';
import BoardView from './components/BoardView';
import PlayerView from './components/PlayerView';
import HostView from './components/HostView';
import DeveloperView from './components/DeveloperView';

const Navigation = () => {
  const location = useLocation();
  if (location.pathname !== '/') return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 text-white flex flex-col items-center justify-center font-sans p-6">
      <div className="max-w-3xl w-full bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl border border-white/20">
        <h1 className="text-5xl font-bold mb-8 text-center text-[#FFCC00] drop-shadow-lg" style={{ fontFamily: 'serif' }}>Jeopardy Pro</h1>
        <p className="text-center text-blue-200 mb-8 text-lg">Select your interface to begin.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/board" className="group">
            <div className="h-32 bg-indigo-600 hover:bg-indigo-500 rounded-lg flex flex-col items-center justify-center p-4 transition-all transform hover:scale-105 shadow-lg border-b-4 border-indigo-800 hover:border-indigo-600">
              <span className="text-3xl mb-2">📺</span>
              <span className="font-bold text-lg uppercase tracking-wider">Board</span>
            </div>
          </Link>

          <Link to="/play" className="group">
            <div className="h-32 bg-green-600 hover:bg-green-500 rounded-lg flex flex-col items-center justify-center p-4 transition-all transform hover:scale-105 shadow-lg border-b-4 border-green-800 hover:border-green-600">
              <span className="text-3xl mb-2">📱</span>
              <span className="font-bold text-lg uppercase tracking-wider">Player</span>
            </div>
          </Link>

          <Link to="/host" className="group">
            <div className="h-32 bg-red-600 hover:bg-red-500 rounded-lg flex flex-col items-center justify-center p-4 transition-all transform hover:scale-105 shadow-lg border-b-4 border-red-800 hover:border-red-600">
              <span className="text-3xl mb-2">💻</span>
              <span className="font-bold text-lg uppercase tracking-wider">Host</span>
            </div>
          </Link>

          <Link to="/dev" className="group">
            <div className="h-32 bg-gray-700 hover:bg-gray-600 rounded-lg flex flex-col items-center justify-center p-4 transition-all transform hover:scale-105 shadow-lg border-b-4 border-gray-900 hover:border-gray-700">
              <span className="text-3xl mb-2">🛠️</span>
              <span className="font-bold text-lg uppercase tracking-wider">Dev</span>
            </div>
          </Link>
        </div>

        <div className="mt-8 text-center text-sm text-blue-300">
          <p>Tip: "Dev" mode opens Host and Players in a single window for testing.</p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GameProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigation />} />
          <Route path="/board" element={<BoardView />} />
          <Route path="/play" element={<PlayerView />} />
          <Route path="/host" element={<HostView />} />
          <Route path="/dev" element={<DeveloperView />} />
        </Routes>
      </HashRouter>
    </GameProvider>
  );
};

export default App;