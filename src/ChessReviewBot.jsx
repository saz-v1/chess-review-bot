import React, { useState } from 'react';
import Chessboard from 'chessboardjsx';
import { Chess } from 'chess.js';

export default function ChessReviewBot() {
  const [username, setUsername] = useState('');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [fen, setFen] = useState('start');
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [moveHistory, setMoveHistory] = useState([]);

  // Fetch latest month archive games
  const fetchGames = async () => {
    if (!username.trim()) return alert('Please enter a username');

    try {
      setLoading(true);
      setGames([]);
      setSelectedGame(null);

      const archivesRes = await fetch(`https://api.chess.com/pub/player/${username.trim()}/games/archives`);
      if (!archivesRes.ok) throw new Error('User not found');
      const archivesData = await archivesRes.json();

      if (!archivesData.archives || archivesData.archives.length === 0) {
        throw new Error('No games found for this user');
      }

      const latestArchive = archivesData.archives[archivesData.archives.length - 1];
      const gamesRes = await fetch(latestArchive);
      if (!gamesRes.ok) throw new Error('Could not fetch games');
      const gamesData = await gamesRes.json();

      setGames(gamesData.games || []);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to fetch games. Please check the username.');
    } finally {
      setLoading(false);
    }
  };

  // Load a game into the board
  const loadGame = (g) => {
    try {
      if (!g.pgn) {
        alert('This game has no PGN available.');
        return;
      }

      const chess = new Chess();

      // Correct usage for chess.js v1.x
      const ok = chess.load_pgn(g.pgn, { sloppy: true });
      if (!ok) {
        alert('Failed to parse this game.');
        return;
      }

      const history = chess.history();
      chess.reset();

      setSelectedGame(chess);
      setMoveHistory(history);
      setFen(chess.fen());
      setCurrentMoveIndex(0);
    } catch (err) {
      console.error(err);
      alert('Error loading game: ' + err.message);
    }
  };

  const goToMove = (moveIndex) => {
    if (!selectedGame || moveIndex < 0 || moveIndex > moveHistory.length) return;

    selectedGame.reset();
    for (let i = 0; i < moveIndex; i++) {
      selectedGame.move(moveHistory[i]);
    }
    setFen(selectedGame.fen());
    setCurrentMoveIndex(moveIndex);
  };

  const nextMove = () => {
    if (currentMoveIndex < moveHistory.length) goToMove(currentMoveIndex + 1);
  };

  const prevMove = () => {
    if (currentMoveIndex > 0) goToMove(currentMoveIndex - 1);
  };

  const resetBoard = () => goToMove(0);
  const goToEnd = () => goToMove(moveHistory.length);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Chess Review Bot</h1>

      <div style={{ margin: '1rem 0' }}>
        <input
          placeholder="Enter Chess.com username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && fetchGames()}
          style={{ padding: '0.5rem', width: '250px', marginRight: '0.5rem' }}
        />
        <button onClick={fetchGames} disabled={loading} style={{ padding: '0.5rem 1rem' }}>
          {loading ? 'Loading...' : 'Fetch Games'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Games list */}
        <div style={{ flex: 1 }}>
          <h2>Recent Games</h2>
          {games.length === 0 ? (
            <p>No games loaded yet. Enter a username to get started.</p>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {games.map((g, idx) => (
                <div
                  key={idx}
                  onClick={() => loadGame(g)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #ccc',
                    marginBottom: '0.25rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <div>{g.white.username} vs {g.black.username}</div>
                  <div style={{ fontSize: '0.8rem', color: '#555' }}>
                    {new Date(g.end_time * 1000).toLocaleString()} • {g.time_class} • {g.rules}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chessboard */}
        <div style={{ flex: 1 }}>
          {selectedGame ? (
            <>
              <h2>Game Board</h2>
              <Chessboard position={fen} width={400} />
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={resetBoard}>⏮ Start</button>
                <button onClick={prevMove} disabled={currentMoveIndex === 0}>◀ Prev</button>
                <button onClick={nextMove} disabled={currentMoveIndex === moveHistory.length}>Next ▶</button>
                <button onClick={goToEnd}>End ⏭</button>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                Move {currentMoveIndex} of {moveHistory.length}
                {currentMoveIndex > 0 && (
                  <div>Last move: {moveHistory[currentMoveIndex - 1]}</div>
                )}
              </div>
            </>
          ) : (
            <p>Select a game to begin reviewing</p>
          )}
        </div>
      </div>
    </div>
  );
}
