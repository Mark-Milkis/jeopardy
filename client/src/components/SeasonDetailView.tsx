import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import GamePreviewModal from './GamePreviewModal';

interface Game {
  id: string;
  name: string;
  description?: string;
  note?: string;
  game_complete?: boolean;
}

const SeasonDetailView: React.FC = () => {
  const { seasonId } = useParams<{ seasonId: string }>();
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [deletingGameId, setDeletingGameId] = useState<string | null>(null);

  const isCustomGamesSection = seasonId === '00';

  useEffect(() => {
    fetchGames();
  }, [seasonId]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/seasons/${seasonId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch games: ${response.statusText}`);
      }
      const data = await response.json();
      setGames(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load games');
      console.error('Error fetching games:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGame = async (gameId: string, gameName: string) => {
    if (!confirm(`Are you sure you want to delete "${gameName}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingGameId(gameId);
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to delete game');
      }

      // Remove from list
      setGames(games.filter(g => g.id !== gameId));
      alert(`Game "${gameName}" deleted successfully.`);
    } catch (err) {
      alert(`Error deleting game: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error deleting game:', err);
    } finally {
      setDeletingGameId(null);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-900 to-indigo-900 text-white font-sans overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 border-b-4 border-[#FFCC00] shadow-lg flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#FFCC00]" style={{ fontFamily: 'serif' }}>
                {isCustomGamesSection ? '⭐ Custom Games' : `Season ${seasonId}`}
              </h1>
              <p className="text-blue-200 mt-2">
                {isCustomGamesSection 
                  ? 'Games created with the editor'
                  : 'Select a game to play'
                }
              </p>
            </div>
            <div className="flex gap-3">
              {isCustomGamesSection && (
                <Link
                  to="/editor"
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-bold transition-colors"
                >
                  + Create New Game
                </Link>
              )}
              <Link 
                to="/seasons" 
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition-colors"
              >
                ← Back to Seasons
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FFCC00] mx-auto mb-4"></div>
              <p className="text-blue-200">Loading games...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-red-200 mb-2">Error Loading Games</h3>
            <p className="text-red-100">{error}</p>
            <button 
              onClick={fetchGames}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded font-bold transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && games.length === 0 && (
          <div className="text-center py-20">
            <p className="text-2xl text-blue-200 mb-4">
              {isCustomGamesSection ? 'No custom games yet.' : 'No games found in this season.'}
            </p>
            {isCustomGamesSection && (
              <Link
                to="/editor"
                className="inline-block px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold transition-colors"
              >
                Create Your First Game
              </Link>
            )}
          </div>
        )}

        {!loading && !error && games.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 overflow-auto">
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead>
                <tr className="bg-[#000080] border-b border-blue-700">
                  <th className="px-6 py-4 text-left font-bold text-[#FFCC00] uppercase tracking-wider">
                    Game
                  </th>
                  <th className="px-6 py-4 text-left font-bold text-[#FFCC00] uppercase tracking-wider">
                    Comments
                  </th>
                  <th className="px-6 py-4 text-center font-bold text-[#FFCC00] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center font-bold text-[#FFCC00] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {games.map((game) => (
                  <tr 
                    key={game.id}
                    className="border-b border-white/10 hover:bg-white/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedGameId(game.id)}
                        className="font-bold text-[#FFCC00] hover:text-yellow-300 hover:underline text-left"
                      >
                        {game.name}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-blue-100 text-sm">
                      {game.note || game.description || '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {game.game_complete !== undefined && (
                        <span className={`
                          px-3 py-1 rounded-full text-xs font-bold uppercase
                          ${game.game_complete 
                            ? 'bg-green-500/30 text-green-200 border border-green-400' 
                            : 'bg-yellow-500/30 text-yellow-200 border border-yellow-400'
                          }
                        `}>
                          {game.game_complete ? '✓ Complete' : '⚠ Incomplete'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => setSelectedGameId(game.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-sm transition-colors"
                        >
                          Preview
                        </button>
                        {isCustomGamesSection && (
                          <>
                            <Link
                              to={`/editor/${game.id}`}
                              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded font-bold text-sm transition-colors"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDeleteGame(game.id, game.name)}
                              disabled={deletingGameId === game.id}
                              className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded font-bold text-sm transition-colors"
                            >
                              {deletingGameId === game.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Game Preview Modal */}
      {selectedGameId && (
        <GamePreviewModal
          gameId={selectedGameId}
          onClose={() => setSelectedGameId(null)}
        />
      )}
    </div>
  );
};

export default SeasonDetailView;
