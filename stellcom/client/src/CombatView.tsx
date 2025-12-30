import React, { useEffect, useState } from 'react';

// We need to duplicate types here or import from shared if possible.
// Assuming CombatResult is passed in.
interface CombatViewProps {
  combatResult: any; // Using any to avoid complex type import for now, but should be CombatResult
  onClose: () => void;
}

const CombatView: React.FC<CombatViewProps> = ({ combatResult, onClose }) => {
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(() => {
        if (currentRoundIndex < combatResult.rounds.length - 1) {
          setCurrentRoundIndex(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, 1500); // 1.5s per round
      return () => clearTimeout(timer);
    }
  }, [currentRoundIndex, isPlaying, combatResult]);

  useEffect(() => {
    // Auto start
    setIsPlaying(true);
  }, []);

  const round = combatResult.rounds[currentRoundIndex];

  return (
    <div style={{
      position: 'fixed', top: '20%', left: '20%', right: '20%', bottom: '20%',
      background: 'rgba(0,0,0,0.9)', border: '2px solid red', borderRadius: 10,
      padding: 20, color: 'white', display: 'flex', flexDirection: 'column', zIndex: 1000
    }}>
      <h2 style={{ textAlign: 'center' }}>Battle at System {combatResult.systemId}</h2>

      <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1 }}>
        {/* Attacker */}
        <div style={{ width: '45%', borderRight: '1px solid gray', paddingRight: 10 }}>
          <h3 style={{ color: 'red' }}>Attacker</h3>
          <div>Fleets: {round.attackerRemaining + round.attackerLosses} → {round.attackerRemaining}</div>
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
             {round.attackerRolls.map((r: number, i: number) => (
                <div key={i} style={{
                  width: 30, height: 30, borderRadius: 15,
                  background: r >= 6 ? 'red' : '#333',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {r}
                </div>
             ))}
          </div>
        </div>

        {/* Defender */}
        <div style={{ width: '45%', paddingLeft: 10 }}>
          <h3 style={{ color: 'cyan' }}>Defender</h3>
           <div>Fleets: {round.defenderRemaining + round.defenderLosses} → {round.defenderRemaining}</div>
           <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
             {round.defenderRolls.map((r: number, i: number) => (
                <div key={i} style={{
                  width: 30, height: 30, borderRadius: 15,
                  background: r >= 6 ? 'cyan' : '#333',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {r}
                </div>
             ))}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <h3>Round {round.roundNumber} / {combatResult.rounds.length}</h3>
        {currentRoundIndex === combatResult.rounds.length - 1 && (
            <div style={{ fontSize: 24, color: 'gold', marginBottom: 10 }}>
                Winner: {combatResult.winnerId}
            </div>
        )}
        <button onClick={onClose} style={{ padding: '10px 20px' }}>
          {currentRoundIndex === combatResult.rounds.length - 1 ? "Close" : "Skip"}
        </button>
      </div>
    </div>
  );
};

export default CombatView;
