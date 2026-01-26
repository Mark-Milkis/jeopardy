import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../services/gameService';

interface GamePreviewModalProps {
  gameId: string;
  onClose: () => void;
}

interface GameData {
  id: string;
  game_title: string;
  game_comments?: string;
  game_complete?: boolean;
  [key: string]: any; // For category_* and clue_* keys
}

const GamePreviewModal: React.FC<GamePreviewModalProps> = ({ gameId, onClose }) => {
  const navigate = useNavigate();
  const { loadGameFromApi } = useGame();
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchGameData();
  }, [gameId]);

  const fetchGameData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/games/${gameId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch game: ${response.statusText}`);
      }
      const data = await response.json();
      setGameData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game');
      console.error('Error fetching game:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadGame = async () => {
    if (!gameData) return;

    try {
      setIsLoading(true);
      await loadGameFromApi(gameId);
      navigate('/host');
      onClose();
    } catch (err) {
      alert(`Error loading game: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error loading game:', err);
      setIsLoading(false);
    }
  };

  const extractCategories = (data: GameData, round: 'J' | 'DJ' | 'FJ') => {
    const categories: Array<{ name: string; comments?: string; clueCount: number }> = [];
    const categoryKeys = Object.keys(data).filter(key => key.startsWith(`category_${round}_`));
    
    categoryKeys.forEach(key => {
      const catData = data[key];
      if (catData && typeof catData === 'object') {
        categories.push({
          name: catData.category_name || 'Unknown Category',
          comments: catData.category_comments,
          clueCount: catData.clue_count || 0
        });
      }
    });

    return categories;
  };

  // Handle clicking outside modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (loading) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading game preview...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Game</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={fetchGameData}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors"
              >
                Retry
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!gameData) return null;

  const jeopardyCategories = extractCategories(gameData, 'J');
  const doubleJeopardyCategories = extractCategories(gameData, 'DJ');
  const finalJeopardyCategories = extractCategories(gameData, 'FJ');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#000080] text-white px-6 py-4 flex justify-between items-start shrink-0">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">{gameData.game_title}</h2>
            {gameData.game_comments && (
              <p className="text-blue-200 text-sm">{gameData.game_comments}</p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white text-3xl leading-none ml-4"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Game Status */}
          <div className="mb-6 flex items-center gap-4">
            <span className={`
              px-4 py-2 rounded-lg font-bold uppercase text-sm
              ${gameData.game_complete 
                ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                : 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
              }
            `}>
              {gameData.game_complete ? '✓ All Clues Complete' : '⚠ Some Clues Missing'}
            </span>
            <span className="text-gray-500 text-sm">Game ID: {gameData.id}</span>
          </div>

          {/* Jeopardy Round */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3 pb-2 border-b-2 border-blue-200">
              Jeopardy! Round
            </h3>
            {jeopardyCategories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {jeopardyCategories.map((cat, i) => (
                  <div key={i} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="font-bold text-gray-800 text-sm mb-1">{cat.name}</div>
                    <div className="text-xs text-gray-500">
                      {cat.clueCount} clue{cat.clueCount !== 1 ? 's' : ''}
                    </div>
                    {cat.comments && (
                      <div className="text-xs text-gray-600 italic mt-1">{cat.comments}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No categories found</p>
            )}
          </div>

          {/* Double Jeopardy Round */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3 pb-2 border-b-2 border-purple-200">
              Double Jeopardy! Round
            </h3>
            {doubleJeopardyCategories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {doubleJeopardyCategories.map((cat, i) => (
                  <div key={i} className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <div className="font-bold text-gray-800 text-sm mb-1">{cat.name}</div>
                    <div className="text-xs text-gray-500">
                      {cat.clueCount} clue{cat.clueCount !== 1 ? 's' : ''}
                    </div>
                    {cat.comments && (
                      <div className="text-xs text-gray-600 italic mt-1">{cat.comments}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No categories found</p>
            )}
          </div>

          {/* Final Jeopardy */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3 pb-2 border-b-2 border-red-200">
              Final Jeopardy!
            </h3>
            {finalJeopardyCategories.length > 0 ? (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200 inline-block">
                <div className="font-bold text-gray-800">{finalJeopardyCategories[0].name}</div>
                {finalJeopardyCategories[0].comments && (
                  <div className="text-sm text-gray-600 italic mt-1">{finalJeopardyCategories[0].comments}</div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">No Final Jeopardy category found</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-6 py-4 border-t border-gray-200 flex justify-between items-center shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleLoadGame}
            disabled={isLoading}
            className="px-8 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg shadow-lg transition-colors"
          >
            {isLoading ? 'Loading Game...' : 'Load Game & Start Hosting'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GamePreviewModal;
