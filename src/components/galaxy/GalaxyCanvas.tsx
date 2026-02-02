"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Text, Line, Billboard } from "@react-three/drei";
import { Suspense, useMemo, useRef, useState, useCallback, useEffect } from "react";
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
    read_date?: string | null;
    tags: Array<{ id: string; name: string; color: string }>;
}

interface GalaxyCanvasProps {
    books: BookStar[];
    onBookClick?: (book: BookStar) => void;
    onBookHover?: (bookId: string | null) => void;
    hoveredBookId?: string | null;
    connectionStrength?: "all" | "medium" | "strong";
    showTagConnections?: boolean;
    showAuthorConnections?: boolean;
}

type ConnectionType = "tag" | "author";
type ConnectionStrength = "strong" | "medium" | "weak";

interface Connection {
    from: [number, number, number];
    to: [number, number, number];
    color: string;
    type: ConnectionType;
    strength: ConnectionStrength;
    fromId: string;
    toId: string;
}

export function GalaxyCanvas({
    books,
    onBookClick,
    onBookHover,
    hoveredBookId,
    connectionStrength = "strong",
    showTagConnections = true,
    showAuthorConnections = true,
}: GalaxyCanvasProps) {
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

    // 接続の強度を計算し、接続を生成
    const connections = useMemo(() => {
        const lines: Connection[] = [];
        const connectionSet = new Set<string>();

        // 本ごとの共有タグ数をカウント
        const bookPairTagCount = new Map<string, number>();

        const getPos = (bookId: string): [number, number, number] | null => {
            const pos = bookPositions.get(bookId);
            return pos ? [pos.pos_x, pos.pos_y, pos.pos_z] : null;
        };

        const addConnection = (
            bookA: BookStar,
            bookB: BookStar,
            color: string,
            type: ConnectionType,
            sharedCount: number = 1
        ) => {
            const key = [bookA.id, bookB.id].sort().join("-");
            if (connectionSet.has(key)) return;
            connectionSet.add(key);

            const posA = getPos(bookA.id);
            const posB = getPos(bookB.id);
            if (!posA || !posB) return;

            // 共有数に基づいて強度を決定
            let strength: ConnectionStrength;
            if (sharedCount >= 3) {
                strength = "strong";
            } else if (sharedCount >= 2) {
                strength = "medium";
            } else {
                strength = "weak";
            }

            lines.push({
                from: posA,
                to: posB,
                color,
                type,
                strength,
                fromId: bookA.id,
                toId: bookB.id,
            });
        };

        // タグ接続（有効時のみ）
        if (showTagConnections) {
            // 本ペアごとの共有タグ数をカウント
            const pairSharedTags = new Map<string, { bookA: BookStar; bookB: BookStar; count: number; color: string }>();

            books.forEach((bookA, i) => {
                books.slice(i + 1).forEach((bookB) => {
                    const key = [bookA.id, bookB.id].sort().join("-");
                    const sharedTags = bookA.tags.filter(tagA =>
                        bookB.tags.some(tagB => tagB.id === tagA.id)
                    );

                    if (sharedTags.length > 0) {
                        pairSharedTags.set(key, {
                            bookA,
                            bookB,
                            count: sharedTags.length,
                            color: sharedTags[0].color,
                        });
                    }
                });
            });

            pairSharedTags.forEach(({ bookA, bookB, count, color }) => {
                addConnection(bookA, bookB, color, "tag", count);
            });
        }

        // 著者接続（有効時のみ）
        if (showAuthorConnections) {
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
                        // 著者接続は中程度の強度
                        const key = [booksWithAuthor[i].id, booksWithAuthor[j].id].sort().join("-");
                        if (!connectionSet.has(key)) {
                            const posA = getPos(booksWithAuthor[i].id);
                            const posB = getPos(booksWithAuthor[j].id);
                            if (posA && posB) {
                                connectionSet.add(key);
                                lines.push({
                                    from: posA,
                                    to: posB,
                                    color: "#fbbf24",
                                    type: "author",
                                    strength: "medium",
                                    fromId: booksWithAuthor[i].id,
                                    toId: booksWithAuthor[j].id,
                                });
                            }
                        }
                    }
                }
            });
        }

        return lines;
    }, [books, bookPositions, showTagConnections, showAuthorConnections]);

    // 接続強度でフィルタリング
    const filteredConnections = useMemo(() => {
        return connections.filter(conn => {
            if (connectionStrength === "all") return true;
            if (connectionStrength === "medium") return conn.strength !== "weak";
            if (connectionStrength === "strong") return conn.strength === "strong";
            return true;
        });
    }, [connections, connectionStrength]);

    // ホバー中の本に接続している本のIDを計算
    const connectedBookIds = useMemo(() => {
        if (!hoveredBookId) return new Set<string>();

        const connected = new Set<string>();
        connected.add(hoveredBookId);

        connections.forEach(conn => {
            if (conn.fromId === hoveredBookId) {
                connected.add(conn.toId);
            } else if (conn.toId === hoveredBookId) {
                connected.add(conn.fromId);
            }
        });

        return connected;
    }, [hoveredBookId, connections]);

    return (
        <div className="w-full h-full bg-black">
            <Canvas
                camera={{ position: [0, 0, 150], fov: 60 }}
                style={{ background: "radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0a 100%)" }}
            >
                <Suspense fallback={null}>
                    <Stars radius={300} depth={100} count={5000} factor={4} saturation={0.3} fade speed={0.2} />
                    <ambientLight intensity={0.2} />
                    <pointLight position={[100, 100, 100]} intensity={0.8} color="#ffffff" />
                    <pointLight position={[-100, -100, -100]} intensity={0.3} color="#7c3aed" />

                    {books.map((book) => {
                        const pos = bookPositions.get(book.id);
                        if (!pos) return null;

                        // フォーカスモード: ホバー中は関連ノードのみハイライト
                        const isHighlighted = !hoveredBookId || connectedBookIds.has(book.id);
                        const isFocused = hoveredBookId === book.id;

                        return (
                            <CelestialBody
                                key={book.id}
                                book={book}
                                position={[pos.pos_x, pos.pos_y, pos.pos_z]}
                                onClick={() => onBookClick?.(book)}
                                onHover={(isHovered) => onBookHover?.(isHovered ? book.id : null)}
                                dimmed={hoveredBookId !== null && !isHighlighted}
                                isFocused={isFocused}
                            />
                        );
                    })}

                    {filteredConnections.map((conn, i) => {
                        // フォーカスモード: 関連する接続線のみ表示
                        const isConnectedToHovered =
                            !hoveredBookId ||
                            conn.fromId === hoveredBookId ||
                            conn.toId === hoveredBookId;

                        return (
                            <ConnectionLine
                                key={i}
                                start={conn.from}
                                end={conn.to}
                                color={conn.color}
                                type={conn.type}
                                strength={conn.strength}
                                highlighted={isConnectedToHovered && hoveredBookId !== null}
                                dimmed={hoveredBookId !== null && !isConnectedToHovered}
                            />
                        );
                    })}

                    <OrbitControls
                        enablePan enableZoom enableRotate
                        minDistance={20} maxDistance={300}
                        autoRotate autoRotateSpeed={0.15}
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
    onHover,
    dimmed = false,
    isFocused = false,
}: {
    book: BookStar;
    position: [number, number, number];
    onClick: () => void;
    onHover?: (isHovered: boolean) => void;
    dimmed?: boolean;
    isFocused?: boolean;
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

    // フォーカス時の透明度
    const targetOpacity = dimmed ? 0.15 : 1;

    // パフォーマンス最適化: Vector3の再利用
    const targetScaleVec = useMemo(() => new THREE.Vector3(1, 1, 1), []);

    // カメラ距離に応じたラベル表示制御
    const [showLabel, setShowLabel] = useState(true);

    useFrame(({ camera }) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.002;
            const targetScale = hovered || isFocused ? 1.3 : 1;
            targetScaleVec.set(targetScale, targetScale, targetScale);
            groupRef.current.scale.lerp(targetScaleVec, 0.1);

            // カメラとの距離を計算（パフォーマンス最適化のため10フレームごと）
            const cameraDistance = camera.position.length();
            const shouldShowLabel = cameraDistance < 120 || hovered || isFocused;
            if (shouldShowLabel !== showLabel) {
                setShowLabel(shouldShowLabel);
            }
        }
    });

    const handlePointerOver = useCallback(() => {
        setHovered(true);
        onHover?.(true);
    }, [onHover]);

    const handlePointerOut = useCallback(() => {
        setHovered(false);
        onHover?.(false);
    }, [onHover]);

    return (
        <group ref={groupRef} position={position}>
            <mesh
                onClick={onClick}
                onPointerOver={handlePointerOver}
                onPointerOut={handlePointerOut}
            >
                <sphereGeometry args={[baseSize, 24, 24]} />
                <meshStandardMaterial
                    color={colors.length === 1 ? baseColor : "#ffffff"}
                    map={marbleTexture}
                    emissive={baseColor}
                    emissiveIntensity={isHotStar ? 0.8 : 0.4}
                    roughness={isCoolStar ? 0.8 : 0.3}
                    metalness={0.2}
                    transparent
                    opacity={targetOpacity}
                />
            </mesh>

            {/* グロー */}
            <mesh>
                <sphereGeometry args={[baseSize * 1.3, 12, 12]} />
                <meshBasicMaterial color={baseColor} transparent opacity={0.15 * targetOpacity} />
            </mesh>
            <mesh>
                <sphereGeometry args={[baseSize * 1.6, 12, 12]} />
                <meshBasicMaterial color={baseColor} transparent opacity={0.08 * targetOpacity} />
            </mesh>

            {hasRing && !dimmed && <PlanetRing size={baseSize} color={baseColor} />}
            {hasMoons && !dimmed && <OrbitingMoons size={baseSize} />}
            {hasAurora && !dimmed && <AuroraEffect size={baseSize} />}
            {hasAsteroidBelt && !dimmed && <AsteroidBelt size={baseSize} />}

            {/* 新しいエフェクト */}
            {emotions.includes("shocking") && !dimmed && <StormEffect size={baseSize} />}
            {emotions.includes("healed") && !dimmed && <HealingAura size={baseSize} />}
            {emotions.includes("complex") && !dimmed && <NebulaCloud size={baseSize} />}
            {emotions.includes("passionate") && !dimmed && <CoronaFlare size={baseSize} color={baseColor} />}
            {emotions.includes("dark") && !dimmed && <DarkMatter size={baseSize} />}

            {/* タイトル（dimmed時またはズームアウト時は非表示） */}
            {!dimmed && showLabel && (
                <Billboard follow lockX={false} lockY={false} lockZ={false}>
                    <Text
                        position={[0, baseSize + 2, 0]}
                        fontSize={1.2}
                        color="white"
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.05}
                        outlineColor="#000000"
                        font="https://fonts.gstatic.com/s/notosansjp/v52/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEj75s.ttf"
                    >
                        {book.title}
                    </Text>
                </Billboard>
            )}

            {hovered && book.author && (
                <Billboard follow lockX={false} lockY={false} lockZ={false}>
                    <Text
                        position={[0, baseSize + 3.5, 0]}
                        fontSize={0.9}
                        color="#a0a0a0"
                        anchorX="center"
                        anchorY="middle"
                    >
                        {book.author}
                    </Text>
                </Billboard>
            )}
        </group>
    );
}

// 惑星リング
function PlanetRing({ size, color }: { size: number; color: string }) {
    return (
        <mesh rotation={[Math.PI / 2.5, 0, 0]}>
            <ringGeometry args={[size * 1.5, size * 2, 64]} />
            <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
    );
}

// 周回衛星
function OrbitingMoons({ size }: { size: number }) {
    const moonRefs = useRef<THREE.Mesh[]>([]);

    useFrame(({ clock }) => {
        moonRefs.current.forEach((moon, i) => {
            if (moon) {
                const angle = clock.elapsedTime * (0.5 + i * 0.2) + i * Math.PI * 0.66;
                const radius = size * 2.5 + i * 0.5;
                moon.position.x = Math.cos(angle) * radius;
                moon.position.z = Math.sin(angle) * radius;
                moon.position.y = Math.sin(angle * 0.5) * 0.5;
            }
        });
    });

    return (
        <>
            {[0, 1, 2].map((i) => (
                <mesh key={i} ref={(el) => { if (el) moonRefs.current[i] = el; }}>
                    <sphereGeometry args={[size * 0.15, 16, 16]} />
                    <meshStandardMaterial color="#888888" emissive="#444444" emissiveIntensity={0.3} />
                </mesh>
            ))}
        </>
    );
}

// 感動のオーラ（Moved）- ソフトなパルスグロー
function AuroraEffect({ size }: { size: number }) {
    const innerRef = useRef<THREE.Mesh>(null);
    const outerRef = useRef<THREE.Mesh>(null);
    const sparkleRef = useRef<THREE.Points>(null);

    // パーティクルの位置を生成
    const sparklePositions = useMemo(() => {
        const positions = new Float32Array(30 * 3);
        for (let i = 0; i < 30; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = size * 1.8 + Math.random() * size * 0.5;
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }
        return positions;
    }, [size]);

    useFrame(({ clock }) => {
        const t = clock.elapsedTime;
        // ソフトなパルスアニメーション
        if (innerRef.current) {
            const scale = 1 + Math.sin(t * 1.5) * 0.15;
            innerRef.current.scale.setScalar(scale);
            (innerRef.current.material as THREE.MeshBasicMaterial).opacity = 0.25 + Math.sin(t * 2) * 0.1;
        }
        if (outerRef.current) {
            const scale = 1 + Math.sin(t * 1.2 + 0.5) * 0.1;
            outerRef.current.scale.setScalar(scale);
            (outerRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(t * 1.8) * 0.08;
        }
        if (sparkleRef.current) {
            sparkleRef.current.rotation.y = t * 0.2;
            sparkleRef.current.rotation.x = Math.sin(t * 0.3) * 0.1;
        }
    });

    return (
        <group>
            {/* 内側のグロー */}
            <mesh ref={innerRef}>
                <sphereGeometry args={[size * 1.4, 16, 16]} />
                <meshBasicMaterial
                    color="#88ffcc"
                    transparent
                    opacity={0.25}
                    side={THREE.BackSide}
                />
            </mesh>
            {/* 外側のグロー */}
            <mesh ref={outerRef}>
                <sphereGeometry args={[size * 1.8, 16, 16]} />
                <meshBasicMaterial
                    color="#44ffaa"
                    transparent
                    opacity={0.12}
                    side={THREE.BackSide}
                />
            </mesh>
            {/* 輝くパーティクル */}
            <points ref={sparkleRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[sparklePositions, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    color="#aaffdd"
                    size={0.15}
                    transparent
                    opacity={0.7}
                    sizeAttenuation
                />
            </points>
        </group>
    );
}

// 小惑星帯
function AsteroidBelt({ size }: { size: number }) {
    const asteroids = useMemo(() => {
        return Array.from({ length: 30 }, (_, i) => ({
            angle: (i / 30) * Math.PI * 2,
            radius: size * 2.2 + Math.random() * 0.5,
            yOffset: (Math.random() - 0.5) * 0.5,
            size: 0.05 + Math.random() * 0.08,
        }));
    }, [size]);

    return (
        <>
            {asteroids.map((a, i) => (
                <mesh
                    key={i}
                    position={[
                        Math.cos(a.angle) * a.radius,
                        a.yOffset,
                        Math.sin(a.angle) * a.radius,
                    ]}
                >
                    <dodecahedronGeometry args={[a.size]} />
                    <meshStandardMaterial color="#666666" />
                </mesh>
            ))}
        </>
    );
}

// 台風/大赤斑 (Shocking)
function StormEffect({ size }: { size: number }) {
    const ref = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        if (ref.current) {
            ref.current.rotation.z = clock.elapsedTime * 2;
        }
    });

    return (
        <mesh ref={ref} position={[size * 0.6, 0, size * 0.3]}>
            <circleGeometry args={[size * 0.4, 32]} />
            <meshBasicMaterial color="#ff4444" transparent opacity={0.6} />
        </mesh>
    );
}

// 癒やしのオーラ (Healed)
function HealingAura({ size }: { size: number }) {
    const ref = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        if (ref.current) {
            const scale = 1 + Math.sin(clock.elapsedTime * 2) * 0.1;
            ref.current.scale.set(scale, scale, scale);
            (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(clock.elapsedTime * 3) * 0.05;
        }
    });

    return (
        <mesh ref={ref}>
            <sphereGeometry args={[size * 2, 32, 32]} />
            <meshBasicMaterial color="#88ff88" transparent opacity={0.15} />
        </mesh>
    );
}

// 難解な霧 (Complex)
function NebulaCloud({ size }: { size: number }) {
    const ref = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        if (ref.current) {
            ref.current.rotation.y = clock.elapsedTime * 0.1;
            ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.2) * 0.1;
        }
    });

    return (
        <mesh ref={ref}>
            <icosahedronGeometry args={[size * 2.5, 1]} />
            <meshBasicMaterial color="#8844ff" transparent opacity={0.1} wireframe />
        </mesh>
    );
}

// 情熱のフレア (Passionate)
function CoronaFlare({ size, color }: { size: number, color: THREE.Color | string }) {
    const ref = useRef<THREE.Points>(null);

    useFrame(({ clock }) => {
        if (ref.current) {
            ref.current.rotation.y = clock.elapsedTime * 0.5;
        }
    });

    return (
        <points ref={ref}>
            <sphereGeometry args={[size * 1.8, 16, 16]} />
            <pointsMaterial color={color} size={0.1} transparent opacity={0.4} />
        </points>
    );
}

// 暗黒物質 (Dark)
function DarkMatter({ size }: { size: number }) {
    const ref = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        if (ref.current) {
            ref.current.rotation.x = clock.elapsedTime * 0.2;
            ref.current.rotation.y = clock.elapsedTime * 0.3;
        }
    });

    return (
        <mesh ref={ref}>
            <torusKnotGeometry args={[size * 1.5, size * 0.2, 64, 8, 2, 3]} />
            <meshBasicMaterial color="#220033" transparent opacity={0.3} />
        </mesh>
    );
}

// 接続線
function ConnectionLine({
    start,
    end,
    color,
    type,
    strength,
    highlighted = false,
    dimmed = false,
}: {
    start: [number, number, number];
    end: [number, number, number];
    color: string;
    type: ConnectionType;
    strength: ConnectionStrength;
    highlighted?: boolean;
    dimmed?: boolean;
}) {
    // 強度に応じた線の太さ
    const lineWidth = strength === "strong" ? 2 : strength === "medium" ? 1.5 : 1;

    // フォーカスモードでの透明度
    let opacity = 0.15; // デフォルトは薄く表示
    if (highlighted) {
        opacity = 0.6; // ハイライト時は明るく
    } else if (dimmed) {
        opacity = 0.05; // 非関連は極薄
    }

    return (
        <Line
            points={[start, end]}
            color={color}
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
            dashed={type === "author"}
            dashSize={type === "author" ? 2 : 0}
            gapSize={type === "author" ? 1 : 0}
        />
    );
}
