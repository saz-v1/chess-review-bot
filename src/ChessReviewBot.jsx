import React, { useState } from 'react';

export default function ChessReviewBot() {
  const [username, setUsername] = useState('');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch latest month archive games
  const fetchGames = async () => {
    if (!username) return alert('Enter a username');

    try {
      setLoading(true);
      setGames([]);

      // Step 1: Get archives
      const archivesRes = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);
      if (!archivesRes.ok) throw new Error('Could not fetch archives');
      const archivesData = await archivesRes.json();

      const latestArchive = archivesData.archives[archivesData.archives.length - 1];

      // Step 2: Get games from latest archive
      const gamesRes = await fetch(latestArchive);
      if (!gamesRes.ok) throw new Error('Could not fetch games');
      const gamesData = await gamesRes.json();

      setGames(gamesData.games || []);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch games. Make sure the username exists.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Chess Review Bot</h1>

      <div style={{ margin: '1rem 0' }}>
        <input
          placeholder="Enter Chess.com username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ padding: '0.5rem', width: '250px', marginRight: '0.5rem' }}
        />
        <button onClick={fetchGames} style={{ padding: '0.5rem 1rem' }}>
          {loading ? 'Loading...' : 'Fetch Games'}
        </button>
      </div>

      <div>
        <h2>Latest Games:</h2>
        {games.length === 0 ? (
          <p>No games fetched yet.</p>
        ) : (
          <ul>
            {games.map((g, idx) => (
              <li key={idx}>
                {g.white.username} vs {g.black.username} — {new Date(g.end_time * 1000).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
