
"use client";



import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Canvas,
  useFrame,
  useLoader,
  useThree,
} from "@react-three/fiber";

import { Html, Text } from "@react-three/drei";
import * as THREE from "three";

type Memory = {
  id: string;
  title: string;
  date?: string;
  description?: string;
  image: string;
  thumbnail?: string;
};

type ApiResponse = {
  memories: Memory[];
  total?: number;
  error?: string;
};

type InputState = {
  forward: number;
  turn: number;
};

const PAGE_SIZE = 32;
const ROOM_WIDTH = 15;
const ROOM_HEIGHT = 7;
const ROOM_DEPTH = 43;
const WALL_Z_START = 3;
const WALL_Z_END = -38;

function makeSafeImageUrl(url: string) {
  if (url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }

  return "";
}

function PhotoTexture({ url }: { url: string }) {
  const texture = useLoader(THREE.TextureLoader, url);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
  }, [texture]);

  return <primitive object={texture} attach="map" />;
}

function PhotoFrame({
  memory,
  position,
  rotation,
  onSelect,
}: {
  memory: Memory;
  position: [number, number, number];
  rotation: [number, number, number];
  onSelect: (memory: Memory) => void;
}) {
  const [failed, setFailed] = useState(false);
  const imageUrl = makeSafeImageUrl(memory.thumbnail || memory.image);

  return (
    <group position={position} rotation={rotation}>
      {/* Golden outer frame */}
      <mesh>
        <boxGeometry args={[2.05, 2.2, 0.16]} />
        <meshStandardMaterial
          color="#b68b4a"
          metalness={0.7}
          roughness={0.28}
        />
      </mesh>

      {/* Dark inner border */}
      <mesh position={[0, 0, 0.09]}>
        <boxGeometry args={[1.87, 2.02, 0.045]} />
        <meshStandardMaterial color="#102c31" />
      </mesh>

      {/* Photo */}
      <mesh
        position={[0, 0.04, 0.125]}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(memory);
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        <planeGeometry args={[1.72, 1.72]} />
        {imageUrl && !failed ? (
          <Suspense
            fallback={
              <meshBasicMaterial color="#29464a" />
            }
          >
            <PhotoMaterial
              url={imageUrl}
              onError={() => setFailed(true)}
            />
          </Suspense>
        ) : (
          <meshBasicMaterial color="#29464a" />
        )}
      </mesh>

      {/* Frame caption */}
      <Text
        position={[0, -0.91, 0.16]}
        fontSize={0.105}
        maxWidth={1.7}
        color="#f6e7c7"
        anchorX="center"
        anchorY="middle"
      >
        {memory.title || `Memory ${memory.id}`}
      </Text>

      {/* Clickable area over the entire frame */}
      <mesh
        position={[0, 0, 0.19]}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(memory);
        }}
      >
        <planeGeometry args={[1.8, 2.05]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function PhotoMaterial({
  url,
  onError,
}: {
  url: string;
  onError: () => void;
}) {
  const texture = useLoader(
    THREE.TextureLoader,
    url,
    undefined,
    onError
  );

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
  }, [texture]);

  return (
    <meshBasicMaterial
      map={texture}
      toneMapped={false}
    />
  );
}

function Door({
  side,
  opened,
}: {
  side: "left" | "right";
  opened: boolean;
}) {
  const hinge = useRef<THREE.Group>(null);
  const direction = side === "left" ? 1 : -1;

  useFrame((_, delta) => {
    if (!hinge.current) return;

    const target = opened
      ? direction * 1.18
      : 0;

    hinge.current.rotation.y = THREE.MathUtils.damp(
      hinge.current.rotation.y,
      target,
      3.5,
      delta
    );
  });

  return (
    <group
      ref={hinge}
      position={[side === "left" ? -1.45 : 1.45, 0, 0]}
    >
      <mesh position={[side === "left" ? 0.725 : -0.725, 2.1, 0]}>
        <boxGeometry args={[1.45, 4.2, 0.25]} />
        <meshStandardMaterial
          color="#123b40"
          metalness={0.45}
          roughness={0.3}
        />
      </mesh>

      <mesh position={[side === "left" ? 0.725 : -0.725, 2.1, 0.145]}>
        <boxGeometry args={[1.2, 3.95, 0.035]} />
        <meshStandardMaterial
          color="#194a4e"
          metalness={0.25}
          roughness={0.38}
        />
      </mesh>

      <mesh
        position={[
          side === "left" ? 1.17 : -1.17,
          2.1,
          0.2,
        ]}
      >
        <sphereGeometry args={[0.085, 16, 16]} />
        <meshStandardMaterial
          color="#e7bd75"
          metalness={0.85}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

function Entrance({
  opened,
}: {
  opened: boolean;
}) {
  return (
    <group position={[0, 0, 2.3]}>
      {/* Door frame */}
      <mesh position={[-1.57, 2.18, -0.05]}>
        <boxGeometry args={[0.22, 4.5, 0.45]} />
        <meshStandardMaterial color="#c39b5b" metalness={0.6} />
      </mesh>

      <mesh position={[1.57, 2.18, -0.05]}>
        <boxGeometry args={[0.22, 4.5, 0.45]} />
        <meshStandardMaterial color="#c39b5b" metalness={0.6} />
      </mesh>

      <mesh position={[0, 4.38, -0.05]}>
        <boxGeometry args={[3.35, 0.25, 0.45]} />
        <meshStandardMaterial color="#c39b5b" metalness={0.6} />
      </mesh>

      <Door side="left" opened={opened} />
      <Door side="right" opened={opened} />

      <pointLight
        position={[0, 3.8, 0.8]}
        intensity={4}
        distance={10}
        color="#e7c78d"
      />
    </group>
  );
}

function Boy({
  
  moving,
  heading,
}: {
  moving: boolean;
  heading: number;
}) {
  const body = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const clock = useRef(0);

  useFrame((_, delta) => {
    clock.current += delta;

    if (body.current) {
      body.current.rotation.y = THREE.MathUtils.damp(
        body.current.rotation.y,
        heading,
        10,
        delta
      );

      body.current.position.y = moving
        ? Math.sin(clock.current * 10) * 0.045
        : 0;
    }

    const swing = moving
      ? Math.sin(clock.current * 10) * 0.45
      : 0;

    if (leftLeg.current) {
      leftLeg.current.rotation.x = swing;
    }

    if (rightLeg.current) {
      rightLeg.current.rotation.x = -swing;
    }

    if (leftArm.current) {
      leftArm.current.rotation.x = -swing * 0.65;
    }

    if (rightArm.current) {
      rightArm.current.rotation.x = swing * 0.65;
    }
  });

  return (
    <group ref={body}>
      {/* Torso */}
      <mesh position={[0, 1.1, 0]}>
        <capsuleGeometry args={[0.34, 0.65, 6, 12]} />
        <meshStandardMaterial
          color="#17616a"
          roughness={0.6}
        />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.93, 0]}>
        <sphereGeometry args={[0.29, 24, 24]} />
        <meshStandardMaterial
          color="#d9a57c"
          roughness={0.72}
        />
      </mesh>

      {/* Hair */}
      <mesh position={[0, 2.12, -0.025]}>
        <sphereGeometry
          args={[0.295, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]}
        />
        <meshStandardMaterial color="#241e20" roughness={0.85} />
      </mesh>

      {/* Legs */}
      <group ref={leftLeg} position={[-0.15, 0.68, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <capsuleGeometry args={[0.105, 0.45, 4, 8]} />
          <meshStandardMaterial color="#23344f" />
        </mesh>
        <mesh position={[0, -0.52, 0.06]}>
          <boxGeometry args={[0.22, 0.12, 0.36]} />
          <meshStandardMaterial color="#e9dfd0" />
        </mesh>
      </group>

      <group ref={rightLeg} position={[0.15, 0.68, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <capsuleGeometry args={[0.105, 0.45, 4, 8]} />
          <meshStandardMaterial color="#23344f" />
        </mesh>
        <mesh position={[0, -0.52, 0.06]}>
          <boxGeometry args={[0.22, 0.12, 0.36]} />
          <meshStandardMaterial color="#e9dfd0" />
        </mesh>
      </group>

      {/* Arms */}
      <group ref={leftArm} position={[-0.39, 1.37, 0]}>
        <mesh position={[0, -0.24, 0]}>
          <capsuleGeometry args={[0.09, 0.4, 4, 8]} />
          <meshStandardMaterial color="#17616a" />
        </mesh>
      </group>

      <group ref={rightArm} position={[0.39, 1.37, 0]}>
        <mesh position={[0, -0.24, 0]}>
          <capsuleGeometry args={[0.09, 0.4, 4, 8]} />
          <meshStandardMaterial color="#17616a" />
        </mesh>
      </group>
    </group>
  );
}


function GirlFollower({
  target,
}: {
  target: React.RefObject<THREE.Group | null>;
}) {
  const girl = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const [comment, setComment] = useState("Let's explore together ♥");

  const comments = [
    "This memory is so special ♥",
    "Remember this moment? 🥹",
    "I love being with you ♡",
    "Let's keep making memories!",
    "You make me so happy ♥",
  ];

  const nextCommentTime = useRef(0);
  const commentIndex = useRef(0);

  useFrame((state, delta) => {
    if (!target.current || !girl.current) return;

    const boy = target.current;
    const girlGroup = girl.current;
    const angle = boy.rotation.y;

    // Follow slightly behind and to the boy's right.
    const offset = new THREE.Vector3(0.8, 0, 0.65);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);

    const targetX = boy.position.x + offset.x;
    const targetZ = boy.position.z + offset.z;

    const distance = Math.hypot(
      targetX - girlGroup.position.x,
      targetZ - girlGroup.position.z,
    );

    // Follow the boy smoothly, catching up when she falls behind.
    const followSpeed = distance > 1.8 ? 7 : 3.5;

    girlGroup.position.x = THREE.MathUtils.damp(
      girlGroup.position.x,
      targetX,
      followSpeed,
      delta,
    );

    girlGroup.position.z = THREE.MathUtils.damp(
      girlGroup.position.z,
      targetZ,
      followSpeed,
      delta,
    );

    girlGroup.rotation.y = THREE.MathUtils.damp(
      girlGroup.rotation.y,
      angle,
      4,
      delta,
    );

    // Cute head movement.
    if (head.current) {
      head.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 1.3) * 0.12;
      head.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 1.8) * 0.04;
    }

    // Change her dialogue occasionally.
    if (state.clock.elapsedTime > nextCommentTime.current) {
      commentIndex.current =
        (commentIndex.current + 1) % comments.length;

      setComment(comments[commentIndex.current]);
      nextCommentTime.current = state.clock.elapsedTime + 6;
    }
  });

  return (
    <group ref={girl} position={[0.8, 0, 3.65]}>
      {/* Legs */}
      <mesh position={[-0.1, 0.27, 0]}>
        <capsuleGeometry args={[0.075, 0.35, 4, 8]} />
        <meshStandardMaterial color="#76506e" />
      </mesh>

      <mesh position={[0.1, 0.27, 0]}>
        <capsuleGeometry args={[0.075, 0.35, 4, 8]} />
        <meshStandardMaterial color="#76506e" />
      </mesh>

      {/* Shoes */}
      <mesh position={[-0.1, 0.055, 0.06]}>
        <boxGeometry args={[0.15, 0.09, 0.24]} />
        <meshStandardMaterial color="#fff0e9" />
      </mesh>

      <mesh position={[0.1, 0.055, 0.06]}>
        <boxGeometry args={[0.15, 0.09, 0.24]} />
        <meshStandardMaterial color="#fff0e9" />
      </mesh>

      {/* Pink outfit */}
      <mesh position={[0, 0.72, 0]}>
        <capsuleGeometry args={[0.19, 0.3, 5, 12]} />
        <meshStandardMaterial color="#e9a4bd" roughness={0.7} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.22, 0.68, 0]}>
        <capsuleGeometry args={[0.06, 0.25, 4, 8]} />
        <meshStandardMaterial color="#e9a4bd" />
      </mesh>

      <mesh position={[0.22, 0.68, 0]}>
        <capsuleGeometry args={[0.06, 0.25, 4, 8]} />
        <meshStandardMaterial color="#e9a4bd" />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.065, 0.07, 0.12, 12]} />
        <meshStandardMaterial color="#f4c5a7" />
      </mesh>

      {/* Head and hair */}
      <group ref={head} position={[0, 1.22, 0]}>
        <mesh>
          <sphereGeometry args={[0.19, 20, 20]} />
          <meshStandardMaterial color="#f4c5a7" />
        </mesh>

        <mesh position={[0, 0.08, -0.025]}>
          <sphereGeometry args={[0.205, 20, 16]} />
          <meshStandardMaterial color="#402632" />
        </mesh>

        {/* Long hair */}
        <mesh position={[-0.17, -0.12, -0.015]}>
          <capsuleGeometry args={[0.055, 0.28, 4, 8]} />
          <meshStandardMaterial color="#402632" />
        </mesh>

        <mesh position={[0.17, -0.12, -0.015]}>
          <capsuleGeometry args={[0.055, 0.28, 4, 8]} />
          <meshStandardMaterial color="#402632" />
        </mesh>

        {/* Hair bow */}
        <mesh position={[0.12, 0.18, 0.06]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color="#d45f8a" />
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.065, -0.015, 0.17]}>
          <sphereGeometry args={[0.018, 10, 10]} />
          <meshBasicMaterial color="#30222a" />
        </mesh>

        <mesh position={[0.065, -0.015, 0.17]}>
          <sphereGeometry args={[0.018, 10, 10]} />
          <meshBasicMaterial color="#30222a" />
        </mesh>

        {/* Smile */}
        <mesh position={[0, -0.075, 0.17]}>
          <sphereGeometry args={[0.022, 10, 8]} />
          <meshBasicMaterial color="#b85f69" />
        </mesh>
      </group>

      {/* Dialogue bubble */}
      <Html
        position={[0, 1.85, 0]}
        center
        distanceFactor={8}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            background: "rgba(255, 249, 245, 0.97)",
            color: "#87566a",
            padding: "9px 12px",
            borderRadius: "14px",
            border: "1px solid #f0d5df",
            boxShadow: "0 5px 18px rgba(80, 35, 50, 0.13)",
            fontSize: "12px",
            whiteSpace: "nowrap",
            textAlign: "center",
          }}
        >
          {comment}
        </div>
      </Html>
    </group>
  );
}


function GalleryScene({
  memories,
  onSelect,
  opened,
  input,
  onEntered,
}: {
  memories: Memory[];
  onSelect: (memory: Memory) => void;
  opened: boolean;
  input: InputState;
  onEntered: () => void;
}) {
  const player = useRef<THREE.Group>(null);
  const playerPosition = useRef(new THREE.Vector3(0, 0, 6.1));
  const heading = useRef(Math.PI);
  const moving = useRef(false);
  const { camera } = useThree();

  const [isMoving, setIsMoving] = useState(false);
  const [playerHeading, setPlayerHeading] = useState(Math.PI);

  useEffect(() => {
    const keys = new Set<string>();

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (
        ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)
      ) {
        event.preventDefault();
      }

      keys.add(key);

      if (key === "e" || key === "enter") {
        onEntered();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      keys.delete(event.key.toLowerCase());
    };

    const onBlur = () => keys.clear();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    const interval = window.setInterval(() => {
      const forward =
        (keys.has("w") || keys.has("arrowup") ? 1 : 0) -
        (keys.has("s") || keys.has("arrowdown") ? 1 : 0);

      const turn =
        (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
        (keys.has("a") || keys.has("arrowleft") ? 1 : 0);

      keyboardInput.current = { forward, turn };
    }, 16);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      window.clearInterval(interval);
    };
  }, [onEntered]);

  const keyboardInput = useRef<InputState>({
    forward: 0,
    turn: 0,
  });

  useFrame((_, delta) => {
    const p = playerPosition.current;

    const forward = THREE.MathUtils.clamp(
      input.forward + keyboardInput.current.forward,
      -1,
      1
    );

    const turn = THREE.MathUtils.clamp(
      input.turn + keyboardInput.current.turn,
      -1,
      1
    );

    const hasMovement = Math.abs(forward) > 0.01;
    moving.current = hasMovement;

    if (turn !== 0) {
      heading.current -= turn * delta * 1.9;
    }

    if (hasMovement) {
      const speed = 3.7 * forward * delta;

      p.x += Math.sin(heading.current) * speed;
      p.z += Math.cos(heading.current) * speed;
    }

    // Keep the player inside the museum.
    p.x = THREE.MathUtils.clamp(
      p.x,
      -ROOM_WIDTH / 2 + 0.9,
      ROOM_WIDTH / 2 - 0.9
    );

    p.z = THREE.MathUtils.clamp(
      p.z,
      WALL_Z_END + 1.5,
      WALL_Z_START + 0.8
    );

    if (player.current) {
      player.current.position.copy(p);
    }

    // Smooth third-person camera, always following the character.
    const behind = new THREE.Vector3(
      -Math.sin(heading.current) * 5.2,
      2.8,
      -Math.cos(heading.current) * 5.2
    );

    const desiredCamera = new THREE.Vector3(
      p.x - behind.x,
      p.y + behind.y,
      p.z - behind.z
    );

    camera.position.lerp(
      desiredCamera,
      1 - Math.exp(-delta * 4)
    );

    const lookAt = new THREE.Vector3(
      p.x,
      p.y + 1.3,
      p.z
    );

    camera.lookAt(lookAt);

    // Only update React when the movement state changes.
    const currentlyMoving = moving.current;

    if (currentlyMoving !== lastMoving.current) {
      lastMoving.current = currentlyMoving;
      setIsMoving(currentlyMoving);
    }

    if (Math.abs(heading.current - lastHeading.current) > 0.08) {
      lastHeading.current = heading.current;
      setPlayerHeading(heading.current);
    }
  });

  const lastMoving = useRef(false);
  const lastHeading = useRef(Math.PI);

  const frameSpacing = 2.45;
  const wallFrames = memories.map((memory, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const row = Math.floor(index / 2);

    return {
      memory,
      position: [
        side * (ROOM_WIDTH / 2 - 0.12),
        2.75,
        -0.3 - row * frameSpacing,
      ] as [number, number, number],
      rotation: [0, side === -1 ? Math.PI / 2 : -Math.PI / 2, 0] as [
        number,
        number,
        number
      ],
    };
  });

  return (
    <>
      <color attach="background" args={["#07191e"]} />
      <fog attach="fog" args={["#07191e", 23, 53]} />

      <ambientLight intensity={1.15} />
      <hemisphereLight
        args={["#d9e8e5", "#17292c", 1.1]}
      />

      <directionalLight
        position={[0, 10, 4]}
        intensity={2.3}
        color="#f6d7a0"
      />

      {/* Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.12, -17]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial
          color="#102c31"
          metalness={0.35}
          roughness={0.32}
        />
      </mesh>

      {/* Floor center runner */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.105, -17]}
      >
        <planeGeometry args={[3.5, ROOM_DEPTH]} />
        <meshStandardMaterial
          color="#183d41"
          metalness={0.25}
          roughness={0.38}
        />
      </mesh>

      {/* Left and right walls */}
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <mesh
            position={[
              side * (ROOM_WIDTH / 2),
              ROOM_HEIGHT / 2,
              -17,
            ]}
          >
            <boxGeometry args={[0.35, ROOM_HEIGHT, ROOM_DEPTH]} />
            <meshStandardMaterial
              color="#0b252b"
              metalness={0.15}
              roughness={0.5}
            />
          </mesh>

          <mesh
            position={[
              side * (ROOM_WIDTH / 2 - 0.2),
              0.45,
              -17,
            ]}
          >
            <boxGeometry args={[0.12, 0.18, ROOM_DEPTH]} />
            <meshStandardMaterial
              color="#bd914d"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>

          <mesh
            position={[
              side * (ROOM_WIDTH / 2 - 0.2),
              5.95,
              -17,
            ]}
          >
            <boxGeometry args={[0.12, 0.12, ROOM_DEPTH]} />
            <meshStandardMaterial color="#bd914d" metalness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Ceiling */}
      <mesh position={[0, ROOM_HEIGHT, -17]}>
        <boxGeometry args={[ROOM_WIDTH, 0.25, ROOM_DEPTH]} />
        <meshStandardMaterial
          color="#102f34"
          metalness={0.2}
          roughness={0.55}
        />
      </mesh>

      {/* Ceiling light strips */}
      {Array.from({ length: 9 }, (_, i) => (
        <group key={i} position={[0, 6.75, 0.2 - i * 4.4]}>
          <mesh>
            <boxGeometry args={[2.2, 0.035, 0.13]} />
            <meshBasicMaterial color="#e6c58d" />
          </mesh>
          <pointLight
            position={[0, -0.5, 0]}
            color="#c4a56e"
            intensity={1.8}
            distance={11}
          />
        </group>
      ))}

      {/* Entrance */}
      <Entrance opened={opened} />

      <Text
        position={[0, 4.9, -0.5]}
        fontSize={0.35}
        color="#e8c98d"
        anchorX="center"
        anchorY="middle"
        maxWidth={7}
      >
        OUR STORY, OUR FOREVER
      </Text>

      {/* Gallery photos */}
      {wallFrames.map(({ memory, position, rotation }) => (
        <PhotoFrame
          key={memory.id}
          memory={memory}
          position={position}
          rotation={rotation}
          onSelect={onSelect}
        />
      ))}

      {/* Character */}
      <group ref={player}>
        <Boy moving={isMoving} heading={playerHeading} />
      </group>

      {/* Small decorative lights along the gallery */}
      {Array.from({ length: 9 }, (_, i) => (
        <pointLight
          key={i}
          position={[0, 3.8, -1.5 - i * 4]}
          color="#3faaa9"
          intensity={0.75}
          distance={8}
        />
      ))}
    </>
  );
}

function Joystick({
  onChange,
}: {
  onChange: (input: InputState) => void;
}) {
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const activePointer = useRef<number | null>(null);

  const updateStick = useCallback(
    (clientX: number, clientY: number, element: HTMLDivElement) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let x = (clientX - centerX) / (rect.width * 0.36);
      let y = (clientY - centerY) / (rect.height * 0.36);

      const length = Math.hypot(x, y);

      if (length > 1) {
        x /= length;
        y /= length;
      }

      setStick({ x, y });

      onChange({
        forward: -y,
        turn: x,
      });
    },
    [onChange]
  );

  const release = () => {
    activePointer.current = null;
    setStick({ x: 0, y: 0 });
    onChange({ forward: 0, turn: 0 });
  };

  return (
    <div
      className="museum-joystick"
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        activePointer.current = event.pointerId;
        updateStick(
          event.clientX,
          event.clientY,
          event.currentTarget
        );
      }}
      onPointerMove={(event) => {
        if (activePointer.current !== event.pointerId) return;

        updateStick(
          event.clientX,
          event.clientY,
          event.currentTarget
        );
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      aria-label="Museum movement joystick"
      role="application"
    >
      <div
        className="museum-joystick-knob"
        style={{
          transform: `translate(${stick.x * 28}px, ${stick.y * 28}px)`,
        }}
      />
      <span className="joystick-arrow up">▲</span>
      <span className="joystick-arrow down">▼</span>
      <span className="joystick-arrow left">◀</span>
      <span className="joystick-arrow right">▶</span>
    </div>
  );
}

export default function MemoryRoom() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Memory | null>(null);
  const [opened, setOpened] = useState(false);
  const [input, setInput] = useState<InputState>({
    forward: 0,
    turn: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadMemories() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/memories", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            "Photos could not be loaded. Check public/photos and app/api/memories/route.ts."
          );
        }

        const data = (await response.json()) as ApiResponse;

        if (!Array.isArray(data.memories)) {
          throw new Error(
            "The API response is incorrect. It must contain a memories array."
          );
        }

        const validMemories = data.memories.filter(
          (memory) =>
            memory &&
            typeof memory.id === "string" &&
            typeof memory.image === "string" &&
            memory.image.length > 0
        );

        if (!cancelled) {
          setMemories(validMemories);
          setTotal(data.total ?? validMemories.length);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong while loading memories."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMemories();

    return () => {
      cancelled = true;
    };
  }, []);

  const pageCount = Math.max(
    1,
    Math.ceil(memories.length / PAGE_SIZE)
  );

  const currentMemories = memories.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

  const changePage = (direction: number) => {
    setPage((current) =>
      Math.max(0, Math.min(pageCount - 1, current + direction))
    );
    setSelected(null);
  };

  const updateInput = useCallback((next: InputState) => {
    setInput(next);
  }, []);

  useEffect(() => {
    if (!selected) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selected]);

  return (
    <section className="museum-experience">
      <div className="museum-topbar">
        <div>
          <p className="museum-eyebrow">
            A WORLD MADE OF MEMORIES
          </p>
          <h2>Our Memory Museum</h2>
          <p className="museum-count">
            {loading
              ? "Discovering your memories..."
              : `${total} memories`}
          </p>
        </div>

        <div className="museum-status">
          <span className="museum-status-dot" />
          IMMERSIVE 3D GALLERY
        </div>
      </div>

      <div className="museum-stage">
        <Canvas
          camera={{
            position: [0, 3.1, 11.5],
            fov: 65,
            near: 0.1,
            far: 100,
          }}
          dpr={[1, 1.5]}
          shadows
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl }) => {
            gl.setClearColor("#07191e");
          }}
        >
          <Suspense fallback={null}>
            <GalleryScene
              memories={currentMemories}
              onSelect={setSelected}
              opened={opened}
              input={input}
              onEntered={() => setOpened(true)}
            />
          </Suspense>
        </Canvas>

        {!opened && (
          <div className="museum-welcome">
            <span className="museum-welcome-icon">✦</span>
            <div>
              <strong>Your story awaits</strong>
              <p>Open the doors and step into your memories.</p>
            </div>
            <button
              type="button"
              className="museum-primary-button"
              onClick={() => setOpened(true)}
            >
              Open the doors
            </button>
          </div>
        )}

        {opened && (
          <div className="museum-controls-hint">
            <strong>Explore your story</strong>
            <span>W A S D / Arrow keys</span>
            <span>Turn: A / D</span>
            <span>Click a photo to view</span>
          </div>
        )}

        <div className="museum-mobile-controls">
          <Joystick onChange={updateInput} />
        </div>

        <button
          type="button"
          className="museum-open-toggle"
          onClick={() => setOpened((current) => !current)}
          aria-label={opened ? "Close the doors" : "Open the doors"}
          title={opened ? "Close doors" : "Open doors"}
        >
          {opened ? "✦" : "↗"}
        </button>
      </div>

      <div className="museum-gallery-footer">
        <div>
          <strong>Gallery Collection</strong>
          <p>
            {loading
              ? "Preparing the gallery..."
              : error
                ? error
                : memories.length
                  ? `Memories ${page * PAGE_SIZE + 1}–${Math.min(
                      (page + 1) * PAGE_SIZE,
                      memories.length
                    )} of ${memories.length}`
                  : "Add your memories to begin"}
          </p>
        </div>

        <div className="museum-pagination">
          <button
            type="button"
            onClick={() => changePage(-1)}
            disabled={page === 0}
          >
            ← Previous
          </button>

          <span>
            {page + 1} / {pageCount}
          </span>

          <button
            type="button"
            onClick={() => changePage(1)}
            disabled={page >= pageCount - 1}
          >
            Next →
          </button>
        </div>
      </div>

      {loading && (
        <div className="museum-message">
          <span className="museum-spinner" />
          Preparing your memory museum...
        </div>
      )}

      {!loading && error && (
        <div className="museum-error" role="alert">
          <strong>Unable to load your photos</strong>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && memories.length === 0 && (
        <div className="museum-message">
          No photos were found in public/photos.
        </div>
      )}

      {selected && (
        <div
          className="museum-modal-backdrop"
          role="presentation"
          onClick={() => setSelected(null)}
        >
          <div
            className="museum-photo-modal"
            role="dialog"
            aria-modal="true"
            aria-label={selected.title}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="museum-modal-close"
              onClick={() => setSelected(null)}
              aria-label="Close photo"
            >
              ×
            </button>

            <div className="museum-modal-image-wrap">
              <img
                src={selected.image}
                alt={selected.title}
                className="museum-modal-image"
              />
            </div>

            <div className="museum-modal-details">
              <span>OUR MEMORY COLLECTION</span>
              <h3>{selected.title}</h3>

              {selected.date && <p>{selected.date}</p>}

              <p>
                {selected.description ||
                  "A special moment from our story, kept here forever."}
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .museum-experience {
          width: 100%;
          color: #f7eee2;
          font-family: Arial, Helvetica, sans-serif;
        }

        .museum-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin: 0 0 18px;
        }

        .museum-eyebrow {
          color: #c5a36a;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.24em;
          margin: 0 0 8px;
        }

        .museum-topbar h2 {
          color: #fff8ec;
          font-family: Georgia, serif;
          font-size: clamp(26px, 4vw, 43px);
          font-weight: 500;
          margin: 0 0 7px;
        }

        .museum-count {
          color: #c6b9a8;
          font-size: 14px;
          margin: 0;
        }

        .museum-status {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #d2bd91;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          white-space: nowrap;
        }

        .museum-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #69c7a9;
          box-shadow: 0 0 12px #69c7a9;
        }

        .museum-stage {
          position: relative;
          width: 100%;
          height: clamp(440px, 68vw, 760px);
          overflow: hidden;
          isolation: isolate;
          border: 1px solid rgba(202, 164, 99, 0.48);
          border-radius: 20px;
          background: #07191e;
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.3);
          touch-action: none;
        }

        .museum-stage canvas {
          display: block;
          width: 100%;
          height: 100%;
          touch-action: none;
        }

        .museum-welcome {
          position: absolute;
          z-index: 4;
          left: 20px;
          bottom: 20px;
          display: flex;
          align-items: center;
          gap: 13px;
          max-width: min(520px, calc(100% - 40px));
          padding: 15px 17px;
          color: #f6ead6;
          border: 1px solid rgba(225, 194, 140, 0.35);
          border-radius: 15px;
          background: rgba(7, 27, 32, 0.88);
          backdrop-filter: blur(15px);
        }

        .museum-welcome-icon {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          border-radius: 50%;
          background: rgba(198, 158, 93, 0.16);
          color: #e6c68b;
          font-size: 20px;
        }

        .museum-welcome strong,
        .museum-controls-hint strong {
          display: block;
          font-size: 13px;
        }

        .museum-welcome p {
          margin: 5px 0 0;
          color: #c9c0b1;
          font-size: 12px;
          line-height: 1.5;
        }

        .museum-primary-button {
          flex: 0 0 auto;
          border: 1px solid #dfbf82;
          border-radius: 9px;
          background: #c6a164;
          color: #132b2e;
          font-size: 12px;
          font-weight: 700;
          padding: 11px 14px;
          cursor: pointer;
        }

        .museum-primary-button:hover {
          background: #ecd3a4;
        }

        .museum-controls-hint {
          position: absolute;
          z-index: 3;
          top: 16px;
          left: 16px;
          display: grid;
          gap: 6px;
          padding: 12px 15px;
          color: #f4e7d3;
          border: 1px solid rgba(211, 177, 120, 0.22);
          border-radius: 12px;
          background: rgba(5, 24, 29, 0.75);
          backdrop-filter: blur(12px);
          font-size: 11px;
          pointer-events: none;
        }

        .museum-controls-hint strong {
          color: #e5c48a;
          margin-bottom: 3px;
        }

        .museum-mobile-controls {
          position: absolute;
          z-index: 5;
          right: 18px;
          bottom: 18px;
          display: none;
          touch-action: none;
        }

        .museum-joystick {
          position: relative;
          width: 104px;
          height: 104px;
          border: 1px solid rgba(245, 225, 191, 0.65);
          border-radius: 50%;
          background: rgba(222, 220, 207, 0.24);
          box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(8px);
          touch-action: none;
          user-select: none;
        }

        .museum-joystick-knob {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 39px;
          height: 39px;
          margin: -19.5px 0 0 -19.5px;
          border: 1px solid rgba(255, 255, 255, 0.85);
          border-radius: 50%;
          background: #c17b83;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
          pointer-events: none;
        }

        .joystick-arrow {
          position: absolute;
          color: rgba(255, 241, 220, 0.8);
          font-size: 9px;
          pointer-events: none;
        }

        .joystick-arrow.up {
          top: 8px;
          left: 47px;
        }

        .joystick-arrow.down {
          bottom: 8px;
          left: 47px;
        }

        .joystick-arrow.left {
          left: 8px;
          top: 46px;
        }

        .joystick-arrow.right {
          right: 8px;
          top: 46px;
        }

        .museum-open-toggle {
          position: absolute;
          z-index: 4;
          top: 17px;
          right: 17px;
          display: grid;
          place-items: center;
          width: 43px;
          height: 43px;
          border: 1px solid rgba(235, 206, 153, 0.55);
          border-radius: 50%;
          color: #f1d7a6;
          background: rgba(6, 27, 32, 0.82);
          font-size: 21px;
          cursor: pointer;
        }

        .museum-gallery-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 2px;
          color: #f7eee2;
        }

        .museum-gallery-footer strong {
          font-family: Georgia, serif;
          font-size: 17px;
          font-weight: 500;
        }

        .museum-gallery-footer p {
          margin: 5px 0 0;
          color: #b9a995;
          font-size: 12px;
        }

        .museum-pagination {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          color: #d8c5a8;
          font-size: 12px;
          white-space: nowrap;
        }

        .museum-pagination button {
          padding: 9px 12px;
          border: 1px solid rgba(202, 164, 99, 0.32);
          border-radius: 8px;
          color: #f5e7d2;
          background: #102c31;
          cursor: pointer;
        }

        .museum-pagination button:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .museum-message,
        .museum-error {
          padding: 18px;
          margin-top: 12px;
          border: 1px solid rgba(202, 164, 99, 0.25);
          border-radius: 12px;
          color: #e5d6c2;
          background: #10282c;
          font-size: 13px;
        }

        .museum-error {
          color: #ffe0d7;
          border-color: rgba(222, 125, 109, 0.4);
        }

        .museum-error p {
          overflow-wrap: anywhere;
        }

        .museum-error button {
          padding: 9px 13px;
          border: 1px solid #bd8e69;
          border-radius: 8px;
          background: #3b2825;
          color: white;
          cursor: pointer;
        }

        .museum-spinner {
          display: inline-block;
          width: 13px;
          height: 13px;
          margin-right: 9px;
          vertical-align: -2px;
          border: 2px solid #8d795c;
          border-top-color: #f2d19a;
          border-radius: 50%;
          animation: museum-spin 0.8s linear infinite;
        }

        @keyframes museum-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .museum-modal-backdrop {
          position: fixed;
          z-index: 10000;
          inset: 0;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(2, 12, 15, 0.82);
          backdrop-filter: blur(12px);
        }

        .museum-photo-modal {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(220px, 0.7fr);
          width: min(920px, 100%);
          max-height: 90vh;
          overflow: auto;
          border: 1px solid rgba(206, 170, 108, 0.5);
          border-radius: 17px;
          background: #10282c;
          box-shadow: 0 30px 100px rgba(0, 0, 0, 0.5);
        }

        .museum-modal-close {
          position: absolute;
          z-index: 2;
          top: 10px;
          right: 10px;
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          color: white;
          background: rgba(5, 18, 21, 0.8);
          font-size: 27px;
          cursor: pointer;
        }

        .museum-modal-image-wrap {
          display: grid;
          place-items: center;
          min-height: 300px;
          background: #06171b;
        }

        .museum-modal-image {
          display: block;
          width: 100%;
          max-height: 76vh;
          object-fit: contain;
        }

        .museum-modal-details {
          align-self: center;
          padding: 30px 25px;
        }

        .museum-modal-details span {
          color: #d6b577;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.17em;
        }

        .museum-modal-details h3 {
          margin: 13px 0;
          color: #fff2dc;
          font-family: Georgia, serif;
          font-size: 26px;
          font-weight: 500;
          overflow-wrap: anywhere;
        }

        .museum-modal-details p {
          color: #c9c0b1;
          font-size: 13px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        @media (pointer: coarse), (max-width: 760px) {
          .museum-mobile-controls {
            display: block;
          }

          .museum-stage {
            height: min(70vh, 650px);
            min-height: 430px;
            border-radius: 13px;
          }

          .museum-controls-hint {
            top: 10px;
            left: 10px;
            font-size: 10px;
          }

          .museum-welcome {
            right: 10px;
            left: 10px;
            bottom: 12px;
            gap: 9px;
            max-width: none;
            padding: 11px;
          }

          .museum-welcome-icon {
            display: none;
          }

          .museum-welcome strong {
            font-size: 12px;
          }

          .museum-welcome p {
            max-width: 150px;
            font-size: 10px;
          }

          .museum-primary-button {
            padding: 10px;
            font-size: 10px;
          }

          .museum-topbar {
            align-items: flex-start;
          }

          .museum-status {
            display: none;
          }

          .museum-gallery-footer {
            align-items: flex-start;
            flex-direction: column;
          }

          .museum-pagination {
            width: 100%;
            justify-content: space-between;
          }

          .museum-photo-modal {
            grid-template-columns: 1fr;
            max-height: 88vh;
          }

          .museum-modal-image-wrap {
            min-height: 180px;
            max-height: 53vh;
          }

          .museum-modal-image {
            max-height: 53vh;
          }

          .museum-modal-details {
            padding: 18px;
          }

          .museum-modal-details h3 {
            font-size: 22px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .museum-spinner {
            animation-duration: 2s;
          }
        }
      `}</style>
    </section>
  );
}
