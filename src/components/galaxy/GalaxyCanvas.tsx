"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Text, Line, PointMaterial, Points } from "@react-three/drei";
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
    tags: Array<{ id: string; name: string; color: string }>;
}

interface GalaxyCanvasProps {
    books: BookStar[];
    onBookClick?: (book: BookStar) => void;
}

// 接続の種類
type ConnectionType = "tag" | "author";

interface Connection {
    from: [number, number, number];
    to: [number, number, number];
    color: string;
    type: ConnectionType;
}

export function GalaxyCanvas({ books, onBookClick }: GalaxyCanvasProps) {
    // タグと著者による接続を計算
    const connections = useMemo(() => {
        const lines: Connection[] = [];
        const connectionSet = new Set<string>();

        // 接続を追加するヘルパー関数
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

        // 1. タグによる接続
        const tagToBooks = new Map<string, BookStar[]>();
        books.forEach((book) => {
            book.tags.forEach((tag) => {
                if (!tagToBooks.has(tag.id)) {
                    tagToBooks.set(tag.id, []);
                }
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

        // 2. 著者による接続（ゴールド色）
        const authorToBooks = new Map<string, BookStar[]>();
        books.forEach((book) => {
            if (book.author) {
                const authorKey = book.author.toLowerCase().trim();
                if (!authorToBooks.has(authorKey)) {
                    authorToBooks.set(authorKey, []);
                }
                authorToBooks.get(authorKey)!.push(book);
            }
        });

        authorToBooks.forEach((booksWithAuthor) => {
            if (booksWithAuthor.length < 2) return;
            const authorColor = "#fbbf24"; // ゴールド

            for (let i = 0; i < booksWithAuthor.length; i++) {
                for (let j = i + 1; j < booksWithAuthor.length; j++) {
                    addConnection(booksWithAuthor[i], booksWithAuthor[j], authorColor, "author");
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
                    {/* 背景の星 */}
                    <Stars
                        radius={300}
                        depth={100}
                        count={8000}
                        factor={4}
                        saturation={0.3}
                        fade
                        speed={0.3}
                    />

                    {/* 光源 */}
                    <ambientLight intensity={0.2} />
                    <pointLight position={[100, 100, 100]} intensity={0.8} color="#ffffff" />
                    <pointLight position={[-100, -100, -100]} intensity={0.3} color="#7c3aed" />

                    {/* 本を表す星 */}
                    {books.map((book) => (
                        <EnhancedBookStar
                            key={book.id}
                            book={book}
                            onClick={() => onBookClick?.(book)}
                        />
                    ))}

                    {/* 接続線 */}
                    {connections.map((conn, index) => (
                        <AnimatedConnectionLine
                            key={index}
                            start={conn.from}
                            end={conn.to}
                            color={conn.color}
                            type={conn.type}
                        />
                    ))}

                    {/* カメラコントロール */}
                    <OrbitControls
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                        minDistance={20}
                        maxDistance={300}
                        autoRotate
                        autoRotateSpeed={0.3}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}

// 強化された星のコンポーネント
function EnhancedBookStar({
    book,
    onClick,
}: {
    book: BookStar;
    onClick: () => void;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    // 位置を0-100から-100〜100の範囲に変換
    const position: [number, number, number] = [
        (book.pos_x - 50) * 2,
        (book.pos_y - 50) * 2,
        (book.pos_z - 50) * 2,
    ];

    // タグの色を使用（なければデフォルト）
    const baseColor = book.tags[0]?.color || "#fbbf24";

    // 評価による明るさとサイズの調整
    const ratingFactor = book.rating ? (book.rating / 5) * 0.5 + 0.75 : 1;
    const starSize = 1.5 * book.brightness * ratingFactor;

    // アニメーション
    useFrame((state) => {
        if (glowRef.current) {
            // きらめきエフェクト
            const pulse = Math.sin(state.clock.elapsedTime * 2 + book.pos_x) * 0.1 + 0.9;
            glowRef.current.scale.setScalar(pulse);
        }
        if (groupRef.current && hovered) {
            groupRef.current.scale.setScalar(1.2);
        } else if (groupRef.current) {
            groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        }
    });

    return (
        <group ref={groupRef} position={position}>
            {/* 外側のグロー（大） */}
            <mesh>
                <sphereGeometry args={[starSize * 3, 16, 16]} />
                <meshBasicMaterial
                    color={baseColor}
                    transparent
                    opacity={0.05}
                />
            </mesh>

            {/* 中間のグロー */}
            <mesh ref={glowRef}>
                <sphereGeometry args={[starSize * 2, 16, 16]} />
                <meshBasicMaterial
                    color={baseColor}
                    transparent
                    opacity={0.15}
                />
            </mesh>

            {/* 星本体 */}
            <mesh
                onClick={onClick}
                onPointerEnter={() => setHovered(true)}
                onPointerLeave={() => setHovered(false)}
            >
                <sphereGeometry args={[starSize, 32, 32]} />
                <meshStandardMaterial
                    color={baseColor}
                    emissive={baseColor}
                    emissiveIntensity={0.8}
                    roughness={0.2}
                    metalness={0.3}
                />
            </mesh>

            {/* 中心の輝き */}
            <mesh>
                <sphereGeometry args={[starSize * 0.5, 16, 16]} />
                <meshBasicMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.9}
                />
            </mesh>

            {/* スパークルエフェクト */}
            <Sparkles position={[0, 0, 0]} size={starSize} color={baseColor} />

            {/* 本のタイトル */}
            <Text
                position={[0, starSize * 2 + 2, 0]}
                fontSize={1.2}
                color="white"
                anchorX="center"
                anchorY="middle"
                maxWidth={25}
                outlineWidth={0.05}
                outlineColor="#000000"
            >
                {book.title.length > 20 ? book.title.substring(0, 20) + "..." : book.title}
            </Text>

            {/* 著者名（ホバー時のみ表示） */}
            {hovered && book.author && (
                <Text
                    position={[0, starSize * 2 + 4, 0]}
                    fontSize={0.8}
                    color="#aaaaaa"
                    anchorX="center"
                    anchorY="middle"
                >
                    {book.author}
                </Text>
            )}
        </group>
    );
}

// スパークルエフェクト
function Sparkles({ position, size, color }: { position: [number, number, number]; size: number; color: string }) {
    const count = 20;
    const pointsRef = useRef<THREE.Points>(null);

    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const radius = size * 1.5 + Math.random() * size;
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = (Math.random() - 0.5) * size * 2;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
        }
        return positions;
    }, [size, count]);

    useFrame((state) => {
        if (pointsRef.current) {
            pointsRef.current.rotation.y = state.clock.elapsedTime * 0.2;
        }
    });

    return (
        <Points ref={pointsRef} positions={particles}>
            <PointMaterial
                size={0.15}
                color={color}
                transparent
                opacity={0.6}
                sizeAttenuation
            />
        </Points>
    );
}

// アニメーション付き接続線
function AnimatedConnectionLine({
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
    const points = useMemo(
        () => [new THREE.Vector3(...start), new THREE.Vector3(...end)],
        [start, end]
    );

    // 著者接続は太め、タグ接続は細め
    const lineWidth = type === "author" ? 1.5 : 1;
    const opacity = type === "author" ? 0.6 : 0.4;

    return (
        <Line
            points={points}
            color={color}
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
            dashed={type === "author"}
            dashScale={10}
            dashSize={3}
            gapSize={1}
        />
    );
}
