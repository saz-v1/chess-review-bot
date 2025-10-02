import React, { useState } from 'react';
import Chessboard from 'chessboardjsx';
import { Chess } from 'chess.js';

export default function ChessReviewBot() {
  const [username, setUsername] = useState('');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [chess, setChess] = useState(new Chess());
  const [fen, setFen] = useState('start');
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);

  // Fetch latest month archive games
  const fetchGames = async () => {
    if (!username) return alert('Enter a username');

    try {
      setLoading(true);
      setGames([]);
      setSelectedGame(null);

      // Step 1: Get archives
      const archivesRes = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);
      if (!archivesRes.ok) throw new Error('Could not fetch archives');
      const archivesData = await archivesRes.json();

      // Step 2: Get latest archive games
      const latestArchive = archivesData.archives[archivesData.archives.length - 1];
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

  // Load a game into the board
  const loadGame = (g) => {
    try {
      if (!g.pgn) return alert('This game has no PGN available.');

      const newChess = new Chess();
      const loaded = newChess.loadPgn(g.pgn);
      
      if (!loaded) return alert('Failed to parse PGN for this game.');

      setChess(newChess);
      setFen(newChess.fen());
      setCurrentMoveIndex(0);
      setSelectedGame(newChess);
    } catch (err) {
      console.error(err);
      alert('Failed to load this game.');
    }
  };


  const nextMove = () => {
    if (!selectedGame) return;
    const history = selectedGame.history();
    if (currentMoveIndex < history.length) {
      selectedGame.reset();
      for (let i = 0; i <= currentMoveIndex; i++) {
        selectedGame.move(history[i]);
      }
      setFen(selectedGame.fen());
      setCurrentMoveIndex(currentMoveIndex + 1);
    }
  };

  const prevMove = () => {
    if (!selectedGame) return;
    const history = selectedGame.history();
    if (currentMoveIndex > 0) {
      selectedGame.reset();
      for (let i = 0; i < currentMoveIndex - 1; i++) {
        selectedGame.move(history[i]);
      }
      setFen(selectedGame.fen());
      setCurrentMoveIndex(currentMoveIndex - 1);
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
              <li
                key={idx}
                style={{
                  cursor: 'pointer',
                  margin: '0.25rem 0',
                  textDecoration: 'underline',
                  color: 'blue',
                }}
                onClick={() => loadGame(g)}
              >
                {g.white.username} vs {g.black.username} —{' '}
                {new Date(g.end_time * 1000).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedGame && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Game Board</h2>
          <Chessboard position={fen} width={400} />
          <div style={{ marginTop: '1rem' }}>
            <button onClick={prevMove} style={{ marginRight: '0.5rem' }}>
              Prev
            </button>
            <button onClick={nextMove}>Next</button>
            <span style={{ marginLeft: '1rem' }}>Move {currentMoveIndex}</span>
          </div>
        </div>
      )}
    </div>
  );
}
