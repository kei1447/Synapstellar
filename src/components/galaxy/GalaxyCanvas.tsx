"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Text, Line } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import * as THREE from "three";

export interface BookStar {
    id: string;
    title: string;
    author: string | null;
    pos_x: number;
    pos_y: number;
    pos_z: number;
    brightness: number;
    tags: Array<{ id: string; name: string; color: string }>;
}

interface GalaxyCanvasProps {
    books: BookStar[];
    onBookClick?: (book: BookStar) => void;
}

export function GalaxyCanvas({ books, onBookClick }: GalaxyCanvasProps) {
    // 同じタグを持つ本同士の接続を計算
    const connections = useMemo(() => {
        const lines: Array<{
            from: [number, number, number];
            to: [number, number, number];
            color: string;
        }> = [];

        // 各タグIDに対して、そのタグを持つ本のペアを接続
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

            // タグの色を取得
            const tagColor = booksWithTag[0].tags.find((t) => t.id === tagId)?.color || "#7c3aed";

            // 同じタグを持つ本同士を接続
            for (let i = 0; i < booksWithTag.length; i++) {
                for (let j = i + 1; j < booksWithTag.length; j++) {
                    const bookA = booksWithTag[i];
                    const bookB = booksWithTag[j];

                    // 既に同じ接続があるかチェック（重複を避ける）
                    const exists = lines.some(
                        (l) =>
                            (l.from[0] === bookA.pos_x && l.to[0] === bookB.pos_x) ||
                            (l.from[0] === bookB.pos_x && l.to[0] === bookA.pos_x)
                    );

                    if (!exists) {
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
                            color: tagColor,
                        });
                    }
                }
            }
        });

        return lines;
    }, [books]);

    return (
        <div className="w-full h-full bg-black">
            <Canvas
                camera={{ position: [0, 0, 150], fov: 60 }}
                style={{ background: "linear-gradient(to bottom, #0a0a0a, #1a1a2e)" }}
            >
                <Suspense fallback={null}>
                    {/* 背景の星 */}
                    <Stars
                        radius={300}
                        depth={100}
                        count={5000}
                        factor={4}
                        saturation={0}
                        fade
                        speed={0.5}
                    />

                    {/* 光源 */}
                    <ambientLight intensity={0.3} />
                    <pointLight position={[100, 100, 100]} intensity={1} />

                    {/* 本を表す星 */}
                    {books.map((book) => (
                        <BookStarMesh
                            key={book.id}
                            book={book}
                            onClick={() => onBookClick?.(book)}
                        />
                    ))}

                    {/* タグによる接続線 */}
                    {connections.map((conn, index) => (
                        <ConnectionLine
                            key={index}
                            start={conn.from}
                            end={conn.to}
                            color={conn.color}
                        />
                    ))}

                    {/* カメラコントロール */}
                    <OrbitControls
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                        minDistance={20}
                        maxDistance={300}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}

function BookStarMesh({
    book,
    onClick,
}: {
    book: BookStar;
    onClick: () => void;
}) {
    // 位置を0-100から-100〜100の範囲に変換
    const position: [number, number, number] = [
        (book.pos_x - 50) * 2,
        (book.pos_y - 50) * 2,
        (book.pos_z - 50) * 2,
    ];

    // タグの色を使用（なければデフォルト）
    const color = book.tags[0]?.color || "#fbbf24";

    return (
        <group position={position}>
            {/* 星本体 */}
            <mesh onClick={onClick}>
                <sphereGeometry args={[1.5 * book.brightness, 16, 16]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.5}
                />
            </mesh>

            {/* グロー効果 */}
            <mesh>
                <sphereGeometry args={[2.5 * book.brightness, 16, 16]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.2}
                />
            </mesh>

            {/* 本のタイトル（ホバー時に表示するため非表示に設定可能） */}
            <Text
                position={[0, 3, 0]}
                fontSize={1.5}
                color="white"
                anchorX="center"
                anchorY="middle"
                maxWidth={20}
            >
                {book.title.length > 15 ? book.title.substring(0, 15) + "..." : book.title}
            </Text>
        </group>
    );
}

function ConnectionLine({
    start,
    end,
    color,
}: {
    start: [number, number, number];
    end: [number, number, number];
    color: string;
}) {
    const points = useMemo(
        () => [new THREE.Vector3(...start), new THREE.Vector3(...end)],
        [start, end]
    );

    return (
        <Line
            points={points}
            color={color}
            lineWidth={1}
            transparent
            opacity={0.4}
        />
    );
}
