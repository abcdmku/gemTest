import { useEffect, useState } from 'react';
import { initSocket } from './socket';
import type { GameState, Player } from '@stellcom/shared';
import GameMap from './GameMap';
import CombatView from './CombatView';

function App() {
  const [socket, setSocket] = useState<any>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);

  // Selection
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [fleetsToSend, setFleetsToSend] = useState(1);

  // Combat
  const [combatResults, setCombatResults] = useState<any[]>([]);
  const [currentCombat, setCurrentCombat] = useState<any>(null);

  useEffect(() => {
    const s = initSocket();
    setSocket(s);

    s.on('connect', () => {
      console.log('Connected to server');
    });

    s.on('game_state', (state: GameState) => {
      setGameState(state);
    });

    s.on('player_info', (p: Player) => {
      setPlayer(p);
      setHasJoined(true);
    });

    s.on('combat_results', (results: any[]) => {
        setCombatResults(prev => [...prev, ...results]);
    });

    return () => {
      s.off('connect');
      s.off('game_state');
      s.off('player_info');
      s.off('combat_results');
    };
  }, []);

  // Handle Combat Queue
  useEffect(() => {
      if (!currentCombat && combatResults.length > 0) {
          setCurrentCombat(combatResults[0]);
          setCombatResults(prev => prev.slice(1));
      }
  }, [combatResults, currentCombat]);

  const handleJoin = () => {
    if (socket && playerName) {
      socket.emit('join_game', playerName);
    }
  };

  const handleEndTurn = () => {
      socket.emit('end_turn');
  };

  const handleSystemClick = (sysId: string) => {
      if (!gameState || !player) return;

      if (!selectedSystemId) {
          // Select source
          if (gameState.systems[sysId].owner === player.id) {
              setSelectedSystemId(sysId);
              setFleetsToSend(gameState.systems[sysId].fleets); // Default to max
          }
      } else {
          // Select target
          if (sysId === selectedSystemId) {
              setSelectedSystemId(null); // Deselect
              return;
          }

          // Send Move Order
          // Check adjacency (client-side validation for UX)
          const source = gameState.systems[selectedSystemId];
          if (source?.wormholes.includes(sysId)) {
             socket.emit('submit_order', {
                 type: 'move',
                 playerId: player.id,
                 sourceId: selectedSystemId,
                 targetId: sysId,
                 fleetCount: fleetsToSend
             });
             // Provide feedback?
             console.log(`Sent ${fleetsToSend} fleets from ${selectedSystemId} to ${sysId}`);
             setSelectedSystemId(null);
          } else {
              alert("Systems not connected!");
              setSelectedSystemId(null);
          }
      }
  };

  if (!hasJoined) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 100 }}>
        <h1>StellCom Strategy</h1>
        <input
          placeholder="Enter Admiral Name"
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
          style={{ padding: 10, fontSize: 16 }}
        />
        <button onClick={handleJoin} style={{ marginTop: 10, padding: 10 }}>Enter Command</button>
      </div>
    );
  }

  if (!gameState || !player) return <div>Loading System Data...</div>;

  const selectedSys = selectedSystemId ? gameState.systems[selectedSystemId] : null;

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <GameMap
        gameState={gameState}
        currentPlayerId={player.id}
        onSystemClick={handleSystemClick}
        selectedSystemId={selectedSystemId}
      />

      {/* Combat Modal */}
      {currentCombat && (
          <CombatView
            combatResult={currentCombat}
            onClose={() => setCurrentCombat(null)}
          />
      )}

      {/* Top Bar: Resources */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 50, background: 'rgba(0,0,0,0.8)', color: 'white', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between' }}>
        <div>
           <span style={{ fontWeight: 'bold' }}>{player.name}</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <span>M: {player.resources.metal} (+{player.research.metal})</span>
          <span>B: {player.resources.biomass} (+{player.research.biomass})</span>
          <span>E: {player.resources.energy} (+{player.research.energy})</span>
          <span>X: {player.resources.exotics} (+{player.research.exotics})</span>
        </div>
        <div>
           Fleets Avail: {player.fleetsAvailable}
        </div>
      </div>

       {/* Selection Panel */}
       {selectedSys && (
           <div style={{ position: 'absolute', top: 60, right: 20, width: 200, background: 'rgba(0,0,0,0.8)', color: 'white', padding: 10, borderRadius: 5 }}>
               <h3>{selectedSys.name}</h3>
               <p>Owner: {selectedSys.owner || 'None'}</p>
               <p>Fleets: {selectedSys.fleets}</p>
               {selectedSys.owner === player.id && (
                   <div>
                       <label>Send Fleets:</label>
                       <input
                         type="number"
                         value={fleetsToSend}
                         min={1}
                         max={selectedSys.fleets}
                         onChange={e => setFleetsToSend(parseInt(e.target.value))}
                         style={{ width: '100%' }}
                       />
                       <p style={{ fontSize: 12, color: '#aaa' }}>Click adjacent system to move</p>
                   </div>
               )}
           </div>
       )}

      {/* Bottom Bar: Controls */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'rgba(0,0,0,0.8)', color: 'white', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'center' }}>
          <div>Turn: {gameState.turn} | Phase: {gameState.phase}</div>
          <button onClick={handleEndTurn} style={{ marginLeft: 20, padding: 10, background: 'green', color: 'white' }}>END TURN</button>
      </div>
    </div>
  );
}

export default App;
