"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import styles from "./BarcodeScanner.module.css";

interface BarcodeScannerProps {
    onDetected: (isbn: string) => void;
    onClose: () => void;
}

export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(true);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);

    useEffect(() => {
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        const startScanning = async () => {
            try {
                // カメラ一覧を取得
                const devices = await BrowserMultiFormatReader.listVideoInputDevices();

                if (devices.length === 0) {
                    setError("カメラが見つかりません");
                    setIsStarting(false);
                    return;
                }

                // バックカメラを優先（モバイル用）
                const backCamera = devices.find(
                    (d) => d.label.toLowerCase().includes("back") ||
                        d.label.toLowerCase().includes("rear")
                );
                const deviceId = backCamera?.deviceId || devices[0].deviceId;

                if (!videoRef.current) return;

                // スキャン開始
                await reader.decodeFromVideoDevice(
                    deviceId,
                    videoRef.current,
                    (result, err) => {
                        if (result) {
                            const text = result.getText();
                            // ISBN形式かチェック（978または979で始まる13桁）
                            if (/^97[89]\d{10}$/.test(text)) {
                                onDetected(text);
                            }
                        }
                    }
                );

                setIsStarting(false);
            } catch (err: any) {
                console.error("Camera error:", err);
                if (err.name === "NotAllowedError") {
                    setError("カメラへのアクセスが拒否されました。設定から許可してください。");
                } else if (err.name === "NotFoundError") {
                    setError("カメラが見つかりません。");
                } else {
                    setError("カメラの起動に失敗しました。");
                }
                setIsStarting(false);
            }
        };

        startScanning();

        return () => {
            // クリーンアップ: ビデオストリームを停止
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [onDetected]);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3 className={styles.title}>📷 バーコードをスキャン</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className={styles.closeButton}
                    >
                        ✕
                    </button>
                </div>

                <div className={styles.videoWrapper}>
                    {isStarting && (
                        <div className={styles.loading}>
                            <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full" />
                            <p>カメラを起動中...</p>
                        </div>
                    )}

                    {error && (
                        <div className={styles.error}>
                            <p>⚠️ {error}</p>
                        </div>
                    )}

                    <video
                        ref={videoRef}
                        className={styles.video}
                        playsInline
                        muted
                    />

                    {!isStarting && !error && (
                        <div className={styles.scanLine} />
                    )}
                </div>

                <div className={styles.instructions}>
                    <p>本の裏表紙にあるISBNバーコードをカメラに向けてください</p>
                    <p className={styles.hint}>
                        978または979で始まるバーコードが対象です
                    </p>
                </div>
            </div>
        </div>
    );
}
