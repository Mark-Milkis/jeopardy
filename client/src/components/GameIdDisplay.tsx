import React, { useState } from 'react';

interface GameIdDisplayProps {
  gameId: string | null | undefined;
  role?: 'host' | 'player' | 'observer';
  isConnected?: boolean;
  isOriginalHost?: boolean;
  className?: string;
}

const GameIdDisplay: React.FC<GameIdDisplayProps> = ({ 
  gameId, 
  role = 'observer', 
  isConnected = true,
  isOriginalHost = false,
  className = '' 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!gameId) return;
    
    navigator.clipboard.writeText(gameId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy game ID:', err);
    });
  };

  if (!gameId) {
    return null;
  }

  const getRoleColor = () => {
    switch (role) {
      case 'host':
        return 'bg-yellow-500 text-gray-900';
      case 'player':
        return 'bg-blue-500 text-white';
      case 'observer':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getRoleLabel = () => {
    if (role === 'host' && isOriginalHost) {
      return '👑 Host';
    }
    switch (role) {
      case 'host':
        return '📺 Host';
      case 'player':
        return '🎮 Player';
      case 'observer':
        return '👁️ Board';
      default:
        return 'Observer';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Role Badge */}
      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getRoleColor()}`}>
        {getRoleLabel()}
      </span>
      
      {/* Game ID */}
      <div className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded border border-gray-700">
        <span className="text-xs text-gray-400 uppercase tracking-wider">Game:</span>
        <span className="text-lg font-mono font-bold text-yellow-400">{gameId}</span>
        
        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="ml-1 p-1 text-gray-400 hover:text-yellow-400 transition-colors"
          title="Copy Game ID"
        >
          {copied ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Connection Status */}
      {!isConnected && (
        <span className="text-xs text-red-400 animate-pulse">⚠️ Disconnected</span>
      )}
    </div>
  );
};

export default GameIdDisplay;
