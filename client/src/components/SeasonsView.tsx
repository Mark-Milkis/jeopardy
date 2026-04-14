import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Season {
  id: string;
  name: string;
  description: string;
  note: string;
}

const SeasonsView: React.FC = () => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSeasons();
  }, []);

  const fetchSeasons = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/seasons');
      if (!response.ok) {
        throw new Error(`Failed to fetch seasons: ${response.statusText}`);
      }
      const data = await response.json();
      setSeasons(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load seasons');
      console.error('Error fetching seasons:', err);
    } finally {
      setLoading(false);
    }
  };

  const isCustomGamesSection = (season: Season) => season.id === '00';

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-900 to-indigo-900 text-white font-sans overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 border-b-4 border-[#FFCC00] shadow-lg flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#FFCC00]" style={{ fontFamily: 'serif' }}>
                Jeopardy! Archive
              </h1>
              <p className="text-blue-200 mt-2">Browse all seasons and select a game</p>
            </div>
            <Link 
              to="/" 
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition-colors"
            >
              ← Back to Home
            </Link>
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
              <p className="text-blue-200">Loading seasons...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-red-200 mb-2">Error Loading Seasons</h3>
            <p className="text-red-100">{error}</p>
            <button 
              onClick={fetchSeasons}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded font-bold transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && seasons.length === 0 && (
          <div className="text-center py-20">
            <p className="text-2xl text-blue-200">No seasons found.</p>
          </div>
        )}

        {!loading && !error && seasons.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 overflow-auto">
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead>
                <tr className="bg-[#000080] border-b border-blue-700">
                  <th className="px-6 py-4 text-left font-bold text-[#FFCC00] uppercase tracking-wider">
                    Season
                  </th>
                  <th className="px-6 py-4 text-left font-bold text-[#FFCC00] uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left font-bold text-[#FFCC00] uppercase tracking-wider">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody>
                {seasons.map((season, index) => (
                  <tr 
                    key={season.id}
                    className={`
                      border-b border-white/10 hover:bg-white/20 transition-colors
                      ${isCustomGamesSection(season) ? 'bg-purple-500/20' : ''}
                    `}
                  >
                    <td className="px-6 py-4">
                      <Link 
                        to={`/seasons/${season.id}`}
                        className="font-bold text-[#FFCC00] hover:text-yellow-300 hover:underline flex items-center gap-2"
                      >
                        {isCustomGamesSection(season) && (
                          <span className="text-xl">⭐</span>
                        )}
                        {season.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-blue-100">
                      {season.description}
                    </td>
                    <td className="px-6 py-4 text-blue-200 text-sm italic">
                      {season.note}
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
    </div>
  );
};

export default SeasonsView;
