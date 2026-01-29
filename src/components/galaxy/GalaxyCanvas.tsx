"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Text, Line } from "@react-three/drei";
import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { calculateBookPositions } from "@/lib/positioning";

export interface BookStar {
    id: string;
    title: string;
    author: string | null;
    pos_x: number;
    pos_y: number;
    pos_z: number;
    brightness: number;
    rating?: number | null;
    image_color?: string | null;
    emotion_tags?: string[];
    tags: Array<{ id: string; name: string; color: string }>;
}

interface GalaxyCanvasProps {
    books: BookStar[];
    onBookClick?: (book: BookStar) => void;
}

type ConnectionType = "tag" | "author";

interface Connection {
    from: [number, number, number];
    to: [number, number, number];
    color: string;
    type: ConnectionType;
}

export function GalaxyCanvas({ books, onBookClick }: GalaxyCanvasProps) {
    // カテゴリ・著者ベースの空間配置を計算
    const bookPositions = useMemo(() => {
        return calculateBookPositions(books.map(b => ({
            id: b.id,
            author: b.author,
            tags: b.tags,
            pos_x: b.pos_x,
            pos_y: b.pos_y,
            pos_z: b.pos_z,
        })));
    }, [books]);

    // 配置済み座標を使って接続を計算
    const connections = useMemo(() => {
        const lines: Connection[] = [];
        const connectionSet = new Set<string>();

        const getPos = (bookId: string): [number, number, number] | null => {
            const pos = bookPositions.get(bookId);
            return pos ? [pos.pos_x, pos.pos_y, pos.pos_z] : null;
        };

        const addConnection = (bookA: BookStar, bookB: BookStar, color: string, type: ConnectionType) => {
            const key = [bookA.id, bookB.id].sort().join("-");
            if (connectionSet.has(key)) return;
            connectionSet.add(key);

            const posA = getPos(bookA.id);
            const posB = getPos(bookB.id);
            if (!posA || !posB) return;

            lines.push({ from: posA, to: posB, color, type });
        };

        // タグ接続
        const tagToBooks = new Map<string, BookStar[]>();
        books.forEach((book) => {
            book.tags.forEach((tag) => {
                if (!tagToBooks.has(tag.id)) tagToBooks.set(tag.id, []);
                tagToBooks.get(tag.id)!.push(book);
            });
        });

        tagToBooks.forEach((booksWithTag, tagId) => {
            if (booksWithTag.length < 2) return;
            const tagColor = booksWithTag[0].tags.find((t) => t.id === tagId)?.color || "#7c3aed";
            for (let i = 0; i < booksWithTag.length; i++) {
                for (let j = i + 1; j < booksWithTag.length; j++) {
                    addConnection(booksWithTag[i], booksWithTag[j], tagColor, "tag");
                }
            }
        });

        // 著者接続
        const authorToBooks = new Map<string, BookStar[]>();
        books.forEach((book) => {
            if (book.author) {
                const key = book.author.toLowerCase().trim();
                if (!authorToBooks.has(key)) authorToBooks.set(key, []);
                authorToBooks.get(key)!.push(book);
            }
        });

        authorToBooks.forEach((booksWithAuthor) => {
            if (booksWithAuthor.length < 2) return;
            for (let i = 0; i < booksWithAuthor.length; i++) {
                for (let j = i + 1; j < booksWithAuthor.length; j++) {
                    addConnection(booksWithAuthor[i], booksWithAuthor[j], "#fbbf24", "author");
                }
            }
        });

        return lines;
    }, [books, bookPositions]);

    return (
        <div className="w-full h-full bg-black">
            <Canvas
                camera={{ position: [0, 0, 150], fov: 60 }}
                style={{ background: "radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0a 100%)" }}
            >
                <Suspense fallback={null}>
                    <Stars radius={300} depth={100} count={8000} factor={4} saturation={0.3} fade speed={0.3} />
                    <ambientLight intensity={0.2} />
                    <pointLight position={[100, 100, 100]} intensity={0.8} color="#ffffff" />
                    <pointLight position={[-100, -100, -100]} intensity={0.3} color="#7c3aed" />

                    {books.map((book) => {
                        const pos = bookPositions.get(book.id);
                        if (!pos) return null;
                        return (
                            <CelestialBody
                                key={book.id}
                                book={book}
                                position={[pos.pos_x, pos.pos_y, pos.pos_z]}
                                onClick={() => onBookClick?.(book)}
                            />
                        );
                    })}

                    {connections.map((conn, i) => (
                        <ConnectionLine key={i} start={conn.from} end={conn.to} color={conn.color} type={conn.type} />
                    ))}

                    <OrbitControls
                        enablePan enableZoom enableRotate
                        minDistance={20} maxDistance={300}
                        autoRotate autoRotateSpeed={0.3}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}

// 天体コンポーネント
function CelestialBody({
    book,
    position,
    onClick,
}: {
    book: BookStar;
    position: [number, number, number];
    onClick: () => void;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);

    // 色のパースとマーブルテクスチャ生成
    const colors = useMemo(() => {
        if (book.image_color) return book.image_color.split(",");
        const tagColor = book.tags[0]?.color;
        return tagColor ? [tagColor] : ["#fbbf24"];
    }, [book.image_color, book.tags]);

    const baseColor = colors[0];
    const color = new THREE.Color(baseColor);

    const marbleTexture = useMemo(() => {
        if (colors.length <= 1 || typeof document === 'undefined') return null;

        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        // ベース色
        ctx.fillStyle = colors[0];
        ctx.fillRect(0, 0, 256, 256);

        // 混色（簡易的なマーブル模様）
        colors.slice(1).forEach((c) => {
            for (let i = 0; i < 15; i++) {
                const x = Math.random() * 256;
                const y = Math.random() * 256;
                const r = 30 + Math.random() * 60;

                const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
                // 16進数カラーに透明度を追加するのは複雑なので、globalAlphaで対応
                ctx.fillStyle = c;
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        return new THREE.CanvasTexture(canvas);
    }, [colors]);

    // 感情タグによるエフェクト判定
    const emotions = book.emotion_tags || [];
    const hasRing = emotions.includes("want-to-reread");
    const hasMoons = emotions.includes("life-changing");
    const hasAurora = emotions.includes("moved");
    const hasAsteroidBelt = emotions.includes("thought-provoking");

    // 評価によるサイズ調整
    const ratingFactor = book.rating ? (book.rating / 5) * 0.5 + 0.75 : 1;
    const baseSize = 1.8 * book.brightness * ratingFactor;

    // 色温度
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    const isHotStar = hsl.h < 0.1 || hsl.h > 0.9;
    const isCoolStar = hsl.h > 0.5 && hsl.h < 0.7;

    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.002;
            const targetScale = hovered ? 1.2 : 1;
            groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        }
    });

    return (
        <group ref={groupRef} position={position}>
            <mesh
                onClick={onClick}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <sphereGeometry args={[baseSize, 32, 32]} />
                <meshStandardMaterial
                    color={colors.length === 1 ? baseColor : "#ffffff"}
                    map={marbleTexture}
                    emissive={baseColor}
                    emissiveIntensity={isHotStar ? 0.8 : 0.4}
                    roughness={isCoolStar ? 0.8 : 0.3}
                    metalness={0.2}
                />
            </mesh>

            {/* グロー */}
            <mesh>
                <sphereGeometry args={[baseSize * 1.3, 16, 16]} />
                <meshBasicMaterial color={baseColor} transparent opacity={0.15} />
            </mesh>
            <mesh>
                <sphereGeometry args={[baseSize * 1.6, 16, 16]} />
                <meshBasicMaterial color={baseColor} transparent opacity={0.08} />
            </mesh>

            {hasRing && <PlanetRing size={baseSize} color={baseColor} />}
            {hasMoons && <OrbitingMoons size={baseSize} />}
            {hasAurora && <AuroraEffect size={baseSize} />}
            {hasAsteroidBelt && <AsteroidBelt size={baseSize} />}

            {/* 新しいエフェクト */}
            {emotions.includes("shocking") && <StormEffect size={baseSize} />}
            {emotions.includes("healed") && <HealingAura size={baseSize} />}
            {emotions.includes("complex") && <NebulaCloud size={baseSize} />}
            {emotions.includes("passionate") && <CoronaFlare size={baseSize} color={baseColor} />}
            {emotions.includes("dark") && <DarkMatter size={baseSize} />}

            <Text
                position={[0, baseSize + 2, 0]}
                fontSize={1.2}
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.05}
                outlineColor="#000000"
            >
                {book.title}
            </Text>

            {hovered && book.author && (
                <Text
                    position={[0, baseSize + 3.5, 0]}
                    fontSize={0.9}
                    color="#a0a0a0"
                    anchorX="center"
                    anchorY="middle"
                >
                    {book.author}
                </Text>
            )}
        </group>
    );
}

// 惑星リング
function PlanetRing({ size, color }: { size: number; color: string }) {
    const ringRef = useRef<THREE.Mesh>(null);
    useFrame(() => {
        if (ringRef.current) ringRef.current.rotation.z += 0.001;
    });
    return (
        <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
            <ringGeometry args={[size * 1.8, size * 2.5, 64]} />
            <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
    );
}

// 周回衛星
function OrbitingMoons({ size }: { size: number }) {
    const moon1Ref = useRef<THREE.Mesh>(null);
    const moon2Ref = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (moon1Ref.current) {
            moon1Ref.current.position.x = Math.cos(t * 0.8) * (size * 2.5);
            moon1Ref.current.position.z = Math.sin(t * 0.8) * (size * 2.5);
        }
        if (moon2Ref.current) {
            moon2Ref.current.position.x = Math.cos(t * 0.5 + Math.PI) * (size * 3.2);
            moon2Ref.current.position.y = Math.sin(t * 0.3) * (size * 0.5);
            moon2Ref.current.position.z = Math.sin(t * 0.5 + Math.PI) * (size * 3.2);
        }
    });
    return (
        <>
            <mesh ref={moon1Ref}>
                <sphereGeometry args={[size * 0.2, 16, 16]} />
                <meshStandardMaterial color="#cccccc" />
            </mesh>
            <mesh ref={moon2Ref}>
                <sphereGeometry args={[size * 0.15, 16, 16]} />
                <meshStandardMaterial color="#aaaaaa" />
            </mesh>
        </>
    );
}

// オーロラ
function AuroraEffect({ size }: { size: number }) {
    const auroraRef = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (auroraRef.current) {
            auroraRef.current.rotation.y += 0.01;
            const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
            auroraRef.current.scale.set(scale, 1, scale);
        }
    });
    return (
        <mesh ref={auroraRef} position={[0, size * 1.2, 0]}>
            <torusGeometry args={[size * 0.8, size * 0.1, 8, 32]} />
            <meshBasicMaterial color="#00ff88" transparent opacity={0.3} />
        </mesh>
    );
}

// 小惑星帯
function AsteroidBelt({ size }: { size: number }) {
    const asteroids = useMemo(() => {
        const positions: [number, number, number][] = [];
        for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2 + Math.random() * 0.3;
            const radius = size * 2.8 + Math.random() * size * 0.5;
            positions.push([
                Math.cos(angle) * radius,
                (Math.random() - 0.5) * size * 0.3,
                Math.sin(angle) * radius,
            ]);
        }
        return positions;
    }, [size]);

    return (
        <group rotation={[Math.PI / 6, 0, 0]}>
            {asteroids.map((pos, i) => (
                <mesh key={i} position={pos}>
                    <dodecahedronGeometry args={[size * 0.08, 0]} />
                    <meshStandardMaterial color="#888888" roughness={0.9} />
                </mesh>
            ))}
        </group>
    );
}

// 台風/大赤斑 (Shocking)
function StormEffect({ size }: { size: number }) {
    const stormRef = useRef<THREE.Group>(null);
    useFrame(() => {
        if (stormRef.current) {
            stormRef.current.rotation.z -= 0.05;
        }
    });
    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <group ref={stormRef} position={[size, 0, 0]}>
                <mesh>
                    <ringGeometry args={[size * 0.2, size * 0.6, 32]} />
                    <meshBasicMaterial color="#ef4444" transparent opacity={0.6} side={THREE.DoubleSide} />
                </mesh>
                <mesh>
                    <ringGeometry args={[size * 0.1, size * 0.3, 32]} />
                    <meshBasicMaterial color="#7f1d1d" transparent opacity={0.8} side={THREE.DoubleSide} />
                </mesh>
            </group>
        </group>
    );
}

// 癒やしのオーラ (Healed)
function HealingAura({ size }: { size: number }) {
    const particles = useMemo(() => {
        return Array.from({ length: 20 }).map(() => ({
            position: [
                (Math.random() - 0.5) * size * 3,
                (Math.random() - 0.5) * size * 3,
                (Math.random() - 0.5) * size * 3,
            ] as [number, number, number],
            scale: Math.random() * 0.5 + 0.5,
        }));
    }, [size]);

    const groupRef = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.005;
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * size * 0.1;
        }
    });

    return (
        <group ref={groupRef}>
            {particles.map((p, i) => (
                <mesh key={i} position={p.position}>
                    <sphereGeometry args={[size * 0.1 * p.scale, 8, 8]} />
                    <meshBasicMaterial color="#4ade80" transparent opacity={0.6} />
                </mesh>
            ))}
        </group>
    );
}

// 難解な霧 (Complex)
function NebulaCloud({ size }: { size: number }) {
    const cloudRef = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (cloudRef.current) {
            cloudRef.current.rotation.x += 0.002;
            cloudRef.current.rotation.y += 0.003;
            const s = 1.2 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
            cloudRef.current.scale.set(s, s, s);
        }
    });
    return (
        <mesh ref={cloudRef}>
            <dodecahedronGeometry args={[size * 1.5, 0]} />
            <meshStandardMaterial color="#94a3b8" transparent opacity={0.3} wireframe />
        </mesh>
    );
}

// 情熱のフレア (Passionate)
function CoronaFlare({ size, color }: { size: number, color: THREE.Color | string }) {
    const flareRef = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (flareRef.current) {
            const s = 1.3 + Math.sin(state.clock.elapsedTime * 10) * 0.1 + Math.random() * 0.1;
            flareRef.current.scale.set(s, s, s);
        }
    });
    return (
        <mesh ref={flareRef}>
            <sphereGeometry args={[size, 32, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </mesh>
    );
}

// 暗黒物質 (Dark)
function DarkMatter({ size }: { size: number }) {
    const particles = useMemo(() => {
        return Array.from({ length: 40 }).map(() => ({
            position: [
                (Math.random() - 0.5) * size * 4,
                (Math.random() - 0.5) * size * 4,
                (Math.random() - 0.5) * size * 4,
            ] as [number, number, number],
        }));
    }, [size]);

    const groupRef = useRef<THREE.Group>(null);
    useFrame(() => {
        if (groupRef.current) groupRef.current.rotation.y -= 0.005;
    });

    return (
        <group ref={groupRef}>
            {particles.map((p, i) => (
                <mesh key={i} position={p.position}>
                    <boxGeometry args={[size * 0.1, size * 0.1, size * 0.1]} />
                    <meshBasicMaterial color="#000000" />
                </mesh>
            ))}
        </group>
    );
}

// 接続線
function ConnectionLine({
    start,
    end,
    color,
    type,
}: {
    start: [number, number, number];
    end: [number, number, number];
    color: string;
    type: ConnectionType;
}) {
    return (
        <Line
            points={[start, end]}
            color={color}
            lineWidth={type === "author" ? 2 : 1}
            transparent
            opacity={0.4}
            dashed={type === "author"}
            dashSize={type === "author" ? 2 : 0}
            gapSize={type === "author" ? 1 : 0}
        />
    );
}
