"use client";

// src/components/FloorMap3D.js
// A lightweight 3D isometric view of the casino floor, built with
// three.js via @react-three/fiber + @react-three/drei. Purely a visual
// read-out of the same state useGameLoop already produces — it holds no
// simulation logic of its own, same as the 2D FloorPanel.
//
// Each game module is a glowing neon pedestal whose light intensity and
// "crowd" of little guest cubes track live occupancy; security nodes are
// rotating turrets patrolling the floor edge; cheaters show up as a
// pulsing red marker hovering over whichever pedestal they're targeting.

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Html, Float } from "@react-three/drei";

const PEDESTAL_LAYOUT = {
  slots: { position: [-4.2, 0, 0], color: "#33fff0" },
  blackjack: { position: [0, 0, 0], color: "#ff3ec8" },
  roulette: { position: [4.2, 0, 0], color: "#b6ff3a" },
};

function GuestCrowd({ count, radius, color }) {
  const groupRef = useRef(null);
  const offsets = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        angle: (i / Math.max(count, 1)) * Math.PI * 2 + i * 0.37,
        r: radius * (0.4 + 0.5 * ((i * 13) % 7) / 7),
        bob: Math.random() * Math.PI * 2,
      })),
    [count, radius]
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
        <mesh
          key={i}
          position={[Math.cos(o.angle) * o.r, 0.18, Math.sin(o.angle) * o.r]}
        >
          <boxGeometry args={[0.14, 0.3, 0.14]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function GamePedestal({ game }) {
  const layout = PEDESTAL_LAYOUT[game.key];
  if (!layout) return null;

  const occupancyPct = game.capacity ? game.guests / game.capacity : 0;
  const glowIntensity = game.unlocked ? 0.6 + occupancyPct * 1.8 : 0.1;
  const color = game.unlocked ? layout.color : "#3a4258";
  const coreRef = useRef(null);

  useFrame(({ clock }) => {
    if (!coreRef.current) return;
    coreRef.current.rotation.y = clock.getElapsedTime() * 0.5;
  });

  return (
    <group position={layout.position}>
      {/* base */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[1.3, 1.5, 0.1, 24]} />
        <meshStandardMaterial color="#141a26" metalness={0.4} roughness={0.6} />
      </mesh>

      {/* glowing core */}
      <mesh ref={coreRef} position={[0, 0.5, 0]}>
        <octahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={glowIntensity}
          toneMapped={false}
        />
      </mesh>
      <pointLight color={color} intensity={game.unlocked ? glowIntensity * 2 : 0} distance={5} />

      {game.unlocked && (
        <GuestCrowd count={Math.min(game.guests, 24)} radius={1.1} color={color} />
      )}

      <Html position={[0, 1.3, 0]} center distanceFactor={10} occlude>
        <div className="floor3d-label" style={{ borderColor: color, color }}>
          <div className="floor3d-label-title">
            {game.icon} {game.name}
          </div>
          {game.unlocked ? (
            <div className="floor3d-label-sub">
              {game.guests}/{game.capacity} · {game.houseEdge}% edge
            </div>
          ) : (
            <div className="floor3d-label-sub">LOCKED</div>
          )}
        </div>
      </Html>
    </group>
  );
}

function SecurityTurret({ index, total }) {
  const ref = useRef(null);
  const radius = 6.5;
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
  const layout = PEDESTAL_LAYOUT[cheater.gameKey];
  if (!layout) return null;
  const [x, , z] = layout.position;

  return (
    <Float speed={4} floatIntensity={1.2} rotationIntensity={0}>
      <group position={[x, 2.1, z]}>
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

function Scene({ games, cheaters, security }) {
  const unlockedList = Object.values(games);
  const nodeCount = Math.min(security.nodes, 8);

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 10, 4]} intensity={0.4} color="#9d4bff" />

      <Grid
        args={[20, 20]}
        cellColor="#2a3346"
        sectionColor="#33fff0"
        cellThickness={0.5}
        sectionThickness={1}
        fadeDistance={22}
        infiniteGrid
      />

      {unlockedList.map((game) => (
        <GamePedestal key={game.key} game={game} />
      ))}

      {Array.from({ length: nodeCount }, (_, i) => (
        <SecurityTurret key={i} index={i} total={nodeCount} />
      ))}

      {cheaters.map((c) => (
        <CheaterMarker key={c.id} cheater={c} />
      ))}

      <OrbitControls
        enablePan={false}
        minDistance={6}
        maxDistance={18}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  );
}

export default function FloorMap3D({ games, cheaters, security }) {
  return (
    <div className="floor3d-canvas-wrap">
      <Canvas
        camera={{ position: [0, 7, 10], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#0a0e17"]} />
        <fog attach="fog" args={["#0a0e17", 10, 24]} />
        <Suspense fallback={null}>
          <Scene games={games} cheaters={cheaters} security={security} />
        </Suspense>
      </Canvas>
    </div>
  );
}
