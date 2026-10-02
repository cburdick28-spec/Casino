"use client";

// src/components/FloorMap3D.js
// A lightweight 3D isometric view of the casino floor, built with
// three.js via @react-three/fiber + @react-three/drei. Purely a visual
// read-out of the same state useGameLoop already produces — it holds no
// simulation logic of its own, same as the 2D FloorPanel.
//
// Each game module is a small row of individual machines/tables instead
// of one abstract pedestal: Neon Slots gets a bank of cabinets,
// Holo-Blackjack and Neon Poker get rows of felt tables, and High-Roller
// Roulette / Quantum Dice get one (or more, at higher capacity) big
// single tables — a spinning wheel and a dice pit respectively. Machine
// count scales with the module's capacity level, so upgrading the floor
// visibly grows it. Security nodes patrol as rotating turrets, cheaters
// pulse a red marker over whatever zone they're hitting, and a scatter of
// ambient Sparkles plus neon pillars dress the room.

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Html, Float, Sparkles } from "@react-three/drei";

const ZONES = {
  slots: { centerX: -10, color: "#33fff0" },
  blackjack: { centerX: -5, color: "#ff3ec8" },
  roulette: { centerX: 0, color: "#b6ff3a" },
  poker: { centerX: 5, color: "#ffb347" },
  dice: { centerX: 10, color: "#ff6b4a" },
};

// Big single-table games (one wheel, one pit) don't multiply the same way
// a bank of slot cabinets or a row of card tables does.
const SINGLE_TABLE_GAMES = new Set(["roulette", "dice"]);

function machineCount(game) {
  if (SINGLE_TABLE_GAMES.has(game.key)) {
    return Math.max(1, Math.min(3, Math.round(game.capacity / 6)));
  }
  return Math.max(2, Math.min(8, Math.round(game.capacity / 4)));
}

// --- Individual machine/table models --------------------------------------

function SlotMachine({ position, color, active, phase }) {
  const screenRef = useRef(null);
  useFrame(({ clock }) => {
    if (!screenRef.current) return;
    const t = clock.getElapsedTime();
    const flicker = active ? 0.9 + Math.sin(t * 3 + phase) * 0.5 : 0.08;
    screenRef.current.material.emissiveIntensity = Math.max(0.05, flicker);
  });

  return (
    <group position={position}>
      {/* cabinet body */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.55, 1.1, 0.5]} />
        <meshStandardMaterial color="#141a26" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* glowing screen */}
      <mesh ref={screenRef} position={[0, 0.85, 0.26]}>
        <boxGeometry args={[0.4, 0.4, 0.04]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} toneMapped={false} />
      </mesh>
      {/* little reel drums on top */}
      {[-0.15, 0, 0.15].map((dx, i) => (
        <mesh key={i} position={[dx, 1.2, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.1, 10]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 0.6 : 0.1} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function BlackjackTable({ position, color, active, phase }) {
  const chipRef = useRef(null);
  useFrame(({ clock }) => {
    if (!chipRef.current) return;
    chipRef.current.rotation.y = clock.getElapsedTime() * 0.6 + phase;
  });

  return (
    <group position={position}>
      {/* table legs */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
        <meshStandardMaterial color="#2a3346" />
      </mesh>
      {/* felt top */}
      <mesh position={[0, 0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.08, 20]} />
        <meshStandardMaterial
          color={active ? color : "#2a3346"}
          emissive={active ? color : "#000000"}
          emissiveIntensity={active ? 0.4 : 0}
          toneMapped={false}
        />
      </mesh>
      {/* chip stack */}
      <group ref={chipRef} position={[0, 0.72, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0.2, i * 0.035, 0.1]}>
            <cylinderGeometry args={[0.07, 0.07, 0.03, 12]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 0.5 : 0.05} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function RouletteWheel({ position, color, active, speed }) {
  const wheelRef = useRef(null);
  const ballRef = useRef(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (wheelRef.current) wheelRef.current.rotation.y = t * speed;
    if (ballRef.current) {
      const ballAngle = -t * speed * 1.6;
      ballRef.current.position.set(Math.cos(ballAngle) * 0.5, 0.72, Math.sin(ballAngle) * 0.5);
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.5, 0.55, 0.6, 20]} />
        <meshStandardMaterial color="#141a26" metalness={0.6} roughness={0.4} />
      </mesh>
      <group ref={wheelRef} position={[0, 0.65, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.5, 0.06, 10, 28]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={active ? 1 : 0.1}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.44, 28]} />
          <meshStandardMaterial color="#0d1119" />
        </mesh>
      </group>
      {active && (
        <mesh ref={ballRef} position={[0.5, 0.72, 0]}>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

function PokerTable({ position, color, active, phase }) {
  const cardsRef = useRef(null);
  useFrame(({ clock }) => {
    if (!cardsRef.current) return;
    const t = clock.getElapsedTime();
    cardsRef.current.position.y = 0.63 + (active ? Math.sin(t * 1.5 + phase) * 0.01 : 0);
  });

  return (
    <group position={position}>
      {/* table legs */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.12, 0.6, 0.12]} />
        <meshStandardMaterial color="#2a3346" />
      </mesh>
      {/* oval felt top */}
      <mesh position={[0, 0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.08, 24]} />
        <meshStandardMaterial
          color={active ? color : "#2a3346"}
          emissive={active ? color : "#000000"}
          emissiveIntensity={active ? 0.35 : 0}
          toneMapped={false}
        />
      </mesh>
      {/* the "board" — a fanned row of community cards */}
      <group ref={cardsRef} position={[0, 0.63, 0]}>
        {[-0.18, -0.06, 0.06, 0.18].map((dx, i) => (
          <mesh key={i} position={[dx, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.1, 0.14]} />
            <meshStandardMaterial
              color="#f4f4f4"
              emissive={color}
              emissiveIntensity={active ? 0.3 : 0}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function DiceTable({ position, color, active, phase }) {
  const die1Ref = useRef(null);
  const die2Ref = useRef(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (die1Ref.current) {
      die1Ref.current.rotation.set(t * 1.3 + phase, t * 1.7, t * 0.9);
      die1Ref.current.position.y = 0.72 + Math.abs(Math.sin(t * 2.2 + phase)) * 0.12;
    }
    if (die2Ref.current) {
      die2Ref.current.rotation.set(t * 1.6, t * 1.1 + phase, t * 1.4);
      die2Ref.current.position.y = 0.72 + Math.abs(Math.sin(t * 2.2 + phase + 1.3)) * 0.12;
    }
  });

  return (
    <group position={position}>
      {/* pit base */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[1.1, 0.7, 0.6]} />
        <meshStandardMaterial color="#141a26" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* glowing rail */}
      <mesh position={[0, 0.68, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.46, 0.5, 4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 0.8 : 0.1} toneMapped={false} />
      </mesh>
      {active && (
        <>
          <mesh ref={die1Ref} position={[-0.15, 0.72, 0]}>
            <boxGeometry args={[0.14, 0.14, 0.14]} />
            <meshStandardMaterial color="#f4f4f4" emissive={color} emissiveIntensity={0.3} toneMapped={false} />
          </mesh>
          <mesh ref={die2Ref} position={[0.15, 0.72, 0]}>
            <boxGeometry args={[0.14, 0.14, 0.14]} />
            <meshStandardMaterial color="#f4f4f4" emissive={color} emissiveIntensity={0.3} toneMapped={false} />
          </mesh>
        </>
      )}
    </group>
  );
}

function GuestCrowd({ count, spreadX, color }) {
  const groupRef = useRef(null);
  const offsets = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (((i * 17) % 23) / 23 - 0.5) * spreadX,
        z: (((i * 31) % 19) / 19 - 0.5) * 1.6 - 1.1,
        bob: Math.random() * Math.PI * 2,
      })),
    [count, spreadX]
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.children.forEach((mesh, i) => {
      const o = offsets[i];
      if (!o) return;
      mesh.position.y = 0.18 + Math.sin(t * 2 + o.bob) * 0.06;
    });
  });

  return (
    <group ref={groupRef}>
      {offsets.map((o, i) => (
        <mesh key={i} position={[o.x, 0.18, o.z]}>
          <boxGeometry args={[0.14, 0.3, 0.14]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function GameZone({ game }) {
  const zone = ZONES[game.key];
  if (!zone) return null;

  const count = machineCount(game);
  const spacing = 1.15;
  const totalWidth = (count - 1) * spacing;
  const occupancyPct = game.capacity ? game.guests / game.capacity : 0;
  const speed = 1.5 + game.houseEdge / 4; // roulette spin speed tracks greed

  const machines = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        z: -totalWidth / 2 + i * spacing,
        phase: (i * 1.7) % (Math.PI * 2),
      })),
    [count, totalWidth]
  );

  return (
    <group position={[zone.centerX, 0, 0]}>
      {/* zone floor pad */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.2, Math.max(totalWidth + 1.6, 2.6)]} />
        <meshStandardMaterial
          color="#10151f"
          emissive={game.unlocked ? zone.color : "#000000"}
          emissiveIntensity={game.unlocked ? 0.05 : 0}
        />
      </mesh>

      {machines.map((m, i) => {
        const common = { key: i, position: [0, 0, m.z], color: zone.color, active: game.unlocked, phase: m.phase };
        switch (game.key) {
          case "roulette":
            return <RouletteWheel {...common} speed={game.unlocked ? speed : 0} />;
          case "blackjack":
            return <BlackjackTable {...common} />;
          case "poker":
            return <PokerTable {...common} />;
          case "dice":
            return <DiceTable {...common} />;
          default:
            return <SlotMachine {...common} />;
        }
      })}

      <pointLight
        position={[0, 1.8, 0]}
        color={zone.color}
        intensity={game.unlocked ? 0.5 + occupancyPct * 1.5 : 0}
        distance={6}
      />

      {game.unlocked && (
        <GuestCrowd count={Math.min(game.guests, 24)} spreadX={2.4} color={zone.color} />
      )}

      <Html position={[0, 1.9, -totalWidth / 2 - 0.9]} center distanceFactor={10} occlude>
        <div className="floor3d-label" style={{ borderColor: zone.color, color: zone.color }}>
          <div className="floor3d-label-title">
            {game.icon} {game.name}
          </div>
          {game.unlocked ? (
            <div className="floor3d-label-sub">
              {game.guests}/{game.capacity} · {game.houseEdge}% edge · Lv.{game.level}
            </div>
          ) : (
            <div className="floor3d-label-sub">LOCKED</div>
          )}
        </div>
      </Html>
    </group>
  );
}

function NeonPillar({ position }) {
  const topRef = useRef(null);
  useFrame(({ clock }) => {
    if (!topRef.current) return;
    topRef.current.material.emissiveIntensity = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.4;
  });
  return (
    <group position={position}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 2.4, 10]} />
        <meshStandardMaterial color="#141a26" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh ref={topRef} position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial color="#9d4bff" emissive="#9d4bff" emissiveIntensity={1} toneMapped={false} />
      </mesh>
    </group>
  );
}

function SecurityTurret({ index, total }) {
  const ref = useRef(null);
  const radius = 15;
  const angle = (index / Math.max(total, 1)) * Math.PI * 2;
  const position = [Math.cos(angle) * radius, 0, Math.sin(angle) * radius];

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 1.2 + index;
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 0.6, 8]} />
        <meshStandardMaterial color="#2a3346" />
      </mesh>
      <mesh ref={ref} position={[0, 0.65, 0]}>
        <coneGeometry args={[0.18, 0.3, 6]} />
        <meshStandardMaterial
          color="#9d4bff"
          emissive="#9d4bff"
          emissiveIntensity={1.2}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function CheaterMarker({ cheater }) {
  const zone = ZONES[cheater.gameKey];
  if (!zone) return null;

  return (
    <Float speed={4} floatIntensity={1.2} rotationIntensity={0}>
      <group position={[zone.centerX, 2.3, 0]}>
        <mesh>
          <sphereGeometry args={[0.18, 12, 12]} />
          <meshStandardMaterial
            color="#ff3ec8"
            emissive="#ff3ec8"
            emissiveIntensity={2}
            toneMapped={false}
          />
        </mesh>
        <Html center distanceFactor={10}>
          <div className="floor3d-cheater-tag">🚨 CHEATER</div>
        </Html>
      </group>
    </Float>
  );
}

const PILLAR_POSITIONS = [
  [-13.5, 0, -4],
  [-13.5, 0, 4],
  [0, 0, -4.5],
  [13.5, 0, -4],
  [13.5, 0, 4],
];

function Scene({ games, cheaters, security }) {
  const gameList = Object.values(games);
  const nodeCount = Math.min(security.nodes, 8);

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 10, 4]} intensity={0.4} color="#9d4bff" />

      <Grid
        args={[36, 36]}
        cellColor="#2a3346"
        sectionColor="#33fff0"
        cellThickness={0.5}
        sectionThickness={1}
        fadeDistance={36}
        infiniteGrid
      />

      <Sparkles count={90} scale={[30, 4, 14]} size={2} speed={0.2} color="#9d4bff" opacity={0.5} />

      {gameList.map((game) => (
        <GameZone key={game.key} game={game} />
      ))}

      {PILLAR_POSITIONS.map((p, i) => (
        <NeonPillar key={i} position={p} />
      ))}

      {Array.from({ length: nodeCount }, (_, i) => (
        <SecurityTurret key={i} index={i} total={nodeCount} />
      ))}

      {cheaters.map((c) => (
        <CheaterMarker key={c.id} cheater={c} />
      ))}

      <OrbitControls
        enablePan={false}
        minDistance={8}
        maxDistance={34}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  );
}

export default function FloorMap3D({ games, cheaters, security }) {
  return (
    <div className="floor3d-canvas-wrap">
      <Canvas
        camera={{ position: [0, 11, 20], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#0a0e17"]} />
        <fog attach="fog" args={["#0a0e17", 18, 40]} />
        <Suspense fallback={null}>
          <Scene games={games} cheaters={cheaters} security={security} />
        </Suspense>
      </Canvas>
    </div>
  );
}
