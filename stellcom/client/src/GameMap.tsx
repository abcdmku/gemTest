import React, { useState } from 'react';
import { Stage, Layer, Circle, Line, Text, Group } from 'react-konva';
import type { GameState, System } from '@stellcom/shared';

interface GameMapProps {
  gameState: GameState;
  currentPlayerId: string;
  onSystemClick: (id: string) => void;
  selectedSystemId: string | null;
}

const SYSTEM_RADIUS = 15;
const COLORS = {
  NEUTRAL: '#888',
  TEXT: '#FFF',
  WORMHOLE: '#444',
  SELECTED: 'yellow'
};

const GameMap: React.FC<GameMapProps> = ({ gameState, currentPlayerId, onSystemClick, selectedSystemId }) => {
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    setStageScale(newScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setStagePos(newPos);
  };

  const systems = Object.values(gameState.systems);

  const getSystemColor = (sys: System) => {
    if (!sys.owner) return COLORS.NEUTRAL;
    const owner = gameState.players[sys.owner];
    return owner ? owner.color : COLORS.NEUTRAL;
  };

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      draggable
      onWheel={handleWheel}
      scaleX={stageScale}
      scaleY={stageScale}
      x={stagePos.x}
      y={stagePos.y}
      style={{ background: '#000' }}
    >
      <Layer>
        {systems.map(sys =>
          sys.wormholes.map(targetId => {
             const target = gameState.systems[targetId];
             if (!target) return null;
             if (sys.id > targetId) return null;

             return (
               <Line
                 key={`${sys.id}-${targetId}`}
                 points={[sys.x, sys.y, target.x, target.y]}
                 stroke={COLORS.WORMHOLE}
                 strokeWidth={2}
                 opacity={0.5}
               />
             );
          })
        )}

        {systems.map(sys => (
          <Group
            key={sys.id}
            x={sys.x}
            y={sys.y}
            onClick={() => onSystemClick(sys.id)}
            onTap={() => onSystemClick(sys.id)}
            >
            <Circle
              radius={SYSTEM_RADIUS + (sys.tier * 2)}
              fill={getSystemColor(sys)}
              stroke={selectedSystemId === sys.id ? COLORS.SELECTED : "white"}
              strokeWidth={sys.owner === currentPlayerId || selectedSystemId === sys.id ? 3 : 0}
            />
            {sys.tier > 1 && <Circle radius={SYSTEM_RADIUS + 5} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />}
            {sys.tier > 2 && <Circle radius={SYSTEM_RADIUS + 8} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />}

            <Text
              text={sys.name}
              y={-25}
              x={-50}
              width={100}
              align="center"
              fill={COLORS.TEXT}
              fontSize={10}
            />
             <Text
              text={sys.fleets.toString()}
              y={-5}
              x={-10}
              width={20}
              align="center"
              fill="#000"
              fontStyle="bold"
              fontSize={12}
            />
          </Group>
        ))}
      </Layer>
    </Stage>
  );
};

export default GameMap;
