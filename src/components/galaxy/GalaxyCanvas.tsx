"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Text, Line } from "@react-three/drei";
import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";

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
    const connections = useMemo(() => {
        const lines: Connection[] = [];
        const connectionSet = new Set<string>();

        const addConnection = (bookA: BookStar, bookB: BookStar, color: string, type: ConnectionType) => {
            const key = [bookA.id, bookB.id].sort().join("-");
            if (connectionSet.has(key)) return;
            connectionSet.add(key);

            lines.push({
                from: [
                    (bookA.pos_x - 50) * 2,
                    (bookA.pos_y - 50) * 2,
                    (bookA.pos_z - 50) * 2,
                ],
                to: [
                    (bookB.pos_x - 50) * 2,
                    (bookB.pos_y - 50) * 2,
                    (bookB.pos_z - 50) * 2,
                ],
                color,
                type,
            });
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
    }, [books]);

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

                    {books.map((book) => (
                        <CelestialBody key={book.id} book={book} onClick={() => onBookClick?.(book)} />
                    ))}

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

// 天体コンポーネント - イメージカラーと感情タグに基づく表現
function CelestialBody({ book, onClick }: { book: BookStar; onClick: () => void }) {
    const groupRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);

    const position: [number, number, number] = [
        (book.pos_x - 50) * 2,
        (book.pos_y - 50) * 2,
        (book.pos_z - 50) * 2,
    ];

    // イメージカラーを使用（なければデフォルト黄色）
    const baseColor = book.image_color || book.tags[0]?.color || "#fbbf24";
    const color = new THREE.Color(baseColor);

    // 感情タグによるエフェクト判定
    const emotions = book.emotion_tags || [];
    const hasRing = emotions.includes("want-to-reread");
    const hasMoons = emotions.includes("life-changing");
    const hasAurora = emotions.includes("moved");
    const hasAsteroidBelt = emotions.includes("thought-provoking");

    // 評価によるサイズ調整
    const ratingFactor = book.rating ? (book.rating / 5) * 0.5 + 0.75 : 1;
    const baseSize = 1.8 * book.brightness * ratingFactor;

    // 色温度による天体タイプ
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    const isHotStar = hsl.h < 0.1 || hsl.h > 0.9; // 赤系
    const isCoolStar = hsl.h > 0.5 && hsl.h < 0.7; // 青系

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.002;
            if (hovered) {
                groupRef.current.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.1);
            } else {
                groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
            }
        }
    });

    return (
        <group ref={groupRef} position={position}>
            {/* メインの天体 */}
            <mesh
                onClick={onClick}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <sphereGeometry args={[baseSize, 32, 32]} />
                <meshStandardMaterial
                    color={baseColor}
                    emissive={baseColor}
                    emissiveIntensity={isHotStar ? 0.8 : 0.4}
                    roughness={isCoolStar ? 0.8 : 0.3}
                />
            </mesh>

            {/* グローエフェクト */}
            <mesh>
                <sphereGeometry args={[baseSize * 1.3, 16, 16]} />
                <meshBasicMaterial color={baseColor} transparent opacity={0.15} />
            </mesh>
            <mesh>
                <sphereGeometry args={[baseSize * 1.6, 16, 16]} />
                <meshBasicMaterial color={baseColor} transparent opacity={0.08} />
            </mesh>

            {/* 土星型リング (また読みたい) */}
            {hasRing && <PlanetRing size={baseSize} color={baseColor} />}

            {/* 衛星 (人生観が変わった) */}
            {hasMoons && <OrbitingMoons size={baseSize} color={baseColor} />}

            {/* オーロラ (感動した) */}
            {hasAurora && <AuroraEffect size={baseSize} />}

            {/* 小惑星帯 (考えさせられた) */}
            {hasAsteroidBelt && <AsteroidBelt size={baseSize} />}

            {/* タイトル表示 */}
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

            {/* ホバー時に著者表示 */}
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
        if (ringRef.current) {
            ringRef.current.rotation.z += 0.001;
        }
    });

    return (
        <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
            <ringGeometry args={[size * 1.8, size * 2.5, 64]} />
            <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
    );
}

// 周回する衛星
function OrbitingMoons({ size, color }: { size: number; color: string }) {
    const moonRef1 = useRef<THREE.Mesh>(null);
    const moonRef2 = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (moonRef1.current) {
            moonRef1.current.position.x = Math.cos(t * 0.8) * (size * 2.5);
            moonRef1.current.position.z = Math.sin(t * 0.8) * (size * 2.5);
        }
        if (moonRef2.current) {
            moonRef2.current.position.x = Math.cos(t * 0.5 + Math.PI) * (size * 3.2);
            moonRef2.current.position.y = Math.sin(t * 0.3) * (size * 0.5);
            moonRef2.current.position.z = Math.sin(t * 0.5 + Math.PI) * (size * 3.2);
        }
    });

    return (
        <>
            <mesh ref={moonRef1}>
                <sphereGeometry args={[size * 0.2, 16, 16]} />
                <meshStandardMaterial color="#cccccc" />
            </mesh>
            <mesh ref={moonRef2}>
                <sphereGeometry args={[size * 0.15, 16, 16]} />
                <meshStandardMaterial color="#aaaaaa" />
            </mesh>
        </>
    );
}

// オーロラエフェクト
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
