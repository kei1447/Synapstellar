"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";

interface BigBangAnimationProps {
    onComplete: () => void;
    bookTitle: string;
}

export function BigBangAnimation({ onComplete, bookTitle }: BigBangAnimationProps) {
    const [phase, setPhase] = useState<"darkness" | "explosion" | "expansion" | "complete">("darkness");

    useEffect(() => {
        // フェーズの進行
        const timers = [
            setTimeout(() => setPhase("explosion"), 1000),
            setTimeout(() => setPhase("expansion"), 2500),
            setTimeout(() => setPhase("complete"), 5000),
            setTimeout(() => onComplete(), 6000),
        ];

        return () => timers.forEach(clearTimeout);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-50 bg-black">
            <Canvas camera={{ position: [0, 0, 50], fov: 75 }}>
                <BigBangScene phase={phase} />
            </Canvas>

            {/* テキストオーバーレイ */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {phase === "darkness" && (
                    <div className="text-white/50 text-xl animate-pulse">
                        宇宙の始まり...
                    </div>
                )}
                {phase === "expansion" && (
                    <div className="text-center animate-fade-in">
                        <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                            あなたの宇宙が誕生しました
                        </div>
                        <div className="text-white/70 text-lg">
                            「{bookTitle}」が最初の星となりました ✨
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
      `}</style>
        </div>
    );
}

function BigBangScene({ phase }: { phase: string }) {
    return (
        <>
            <ambientLight intensity={0.1} />

            {phase === "explosion" && <ExplosionEffect />}
            {(phase === "expansion" || phase === "complete") && <ExpansionEffect />}
            {(phase === "expansion" || phase === "complete") && <ParticleField />}
        </>
    );
}

// 爆発エフェクト
function ExplosionEffect() {
    const meshRef = useRef<THREE.Mesh>(null);
    const [scale, setScale] = useState(0.1);

    useFrame((_, delta) => {
        setScale((prev) => Math.min(prev + delta * 15, 30));
        if (meshRef.current) {
            meshRef.current.scale.setScalar(scale);
        }
    });

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial
                color="#ffffff"
                transparent
                opacity={Math.max(0, 1 - scale / 30)}
            />
        </mesh>
    );
}

// 拡張エフェクト（リング）
function ExpansionEffect() {
    const rings = [
        { color: "#7c3aed", delay: 0 },
        { color: "#06b6d4", delay: 0.3 },
        { color: "#ec4899", delay: 0.6 },
    ];

    return (
        <>
            {rings.map((ring, i) => (
                <ExpandingRing key={i} color={ring.color} delay={ring.delay} />
            ))}
        </>
    );
}

function ExpandingRing({ color, delay }: { color: string; delay: number }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [started, setStarted] = useState(false);
    const [scale, setScale] = useState(0.1);

    useEffect(() => {
        const timer = setTimeout(() => setStarted(true), delay * 1000);
        return () => clearTimeout(timer);
    }, [delay]);

    useFrame((_, delta) => {
        if (!started) return;
        setScale((prev) => prev + delta * 8);
        if (meshRef.current) {
            meshRef.current.scale.setScalar(scale);
            (meshRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - scale / 80);
        }
    });

    if (!started) return null;

    return (
        <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.9, 1, 64]} />
            <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} />
        </mesh>
    );
}

// パーティクルフィールド（新生した星々）
function ParticleField() {
    const pointsRef = useRef<THREE.Points>(null);
    const [opacity, setOpacity] = useState(0);

    const particles = useRef<Float32Array>(
        new Float32Array(
            Array.from({ length: 500 * 3 }, () => (Math.random() - 0.5) * 200)
        )
    );

    useFrame((state, delta) => {
        setOpacity((prev) => Math.min(prev + delta * 0.5, 1));
        if (pointsRef.current) {
            pointsRef.current.rotation.y += delta * 0.05;
            pointsRef.current.rotation.x += delta * 0.02;
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[particles.current, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.5}
                color="#ffffff"
                transparent
                opacity={opacity}
                sizeAttenuation
            />
        </points>
    );
}

// 最初の本登録時に使用するラッパーコンポーネント
export function FirstBookCelebration({
    bookTitle,
    onComplete,
}: {
    bookTitle: string;
    onComplete: () => void;
}) {
    return <BigBangAnimation bookTitle={bookTitle} onComplete={onComplete} />;
}
