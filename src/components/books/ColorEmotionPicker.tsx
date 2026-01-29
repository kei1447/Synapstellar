"use client";

import { useState } from "react";

// イメージカラーの選択肢
const COLOR_OPTIONS = [
    { value: "#ef4444", label: "赤", emoji: "🔴", description: "情熱・エネルギー" },
    { value: "#f97316", label: "橙", emoji: "🟠", description: "温かみ・創造性" },
    { value: "#eab308", label: "黄", emoji: "🟡", description: "知性・希望" },
    { value: "#22c55e", label: "緑", emoji: "🟢", description: "成長・自然" },
    { value: "#3b82f6", label: "青", emoji: "🔵", description: "知識・冷静" },
    { value: "#8b5cf6", label: "紫", emoji: "🟣", description: "神秘・哲学" },
    { value: "#f5f5f5", label: "白", emoji: "⚪", description: "純粋・シンプル" },
    { value: "#1f2937", label: "黒", emoji: "⚫", description: "深淵・未知" },
];

// 感情タグの選択肢
const EMOTION_OPTIONS = [
    { value: "moved", label: "感動した", emoji: "😢" },
    { value: "thought-provoking", label: "考えさせられた", emoji: "🤔" },
    { value: "funny", label: "笑えた", emoji: "😂" },
    { value: "tearful", label: "泣けた", emoji: "😭" },
    { value: "educational", label: "勉強になった", emoji: "📚" },
    { value: "life-changing", label: "人生観が変わった", emoji: "✨" },
    { value: "want-to-reread", label: "また読みたい", emoji: "🔄" },
    { value: "shocking", label: "衝撃的", emoji: "🌪️" },
    { value: "healed", label: "癒やされた", emoji: "🌿" },
    { value: "complex", label: "難解だった", emoji: "🌫️" },
    { value: "passionate", label: "情熱的", emoji: "🔥" },
    { value: "dark", label: "暗い・重い", emoji: "🌑" },
];

interface ColorEmotionPickerProps {
    selectedColors: string[];
    selectedEmotions: string[];
    onColorsChange: (colors: string[]) => void;
    onEmotionsChange: (emotions: string[]) => void;
}

export function ColorEmotionPicker({
    selectedColors,
    selectedEmotions,
    onColorsChange,
    onEmotionsChange,
}: ColorEmotionPickerProps) {
    const toggleColor = (color: string) => {
        if (selectedColors.includes(color)) {
            // 少なくとも1色は選択状態にする
            if (selectedColors.length > 1) {
                onColorsChange(selectedColors.filter((c) => c !== color));
            }
        } else {
            // 最大3色まで
            if (selectedColors.length < 3) {
                onColorsChange([...selectedColors, color]);
            } else {
                // 押し出し式（一番古いものを削除して追加）
                onColorsChange([...selectedColors.slice(1), color]);
            }
        }
    };

    const toggleEmotion = (emotion: string) => {
        if (selectedEmotions.includes(emotion)) {
            onEmotionsChange(selectedEmotions.filter((e) => e !== emotion));
        } else {
            onEmotionsChange([...selectedEmotions, emotion]);
        }
    };

    return (
        <div className="space-y-6">
            {/* イメージカラー選択 */}
            <div>
                <label className="block text-sm text-white/80 mb-3">
                    🎨 この本のイメージカラー（最大3色）
                </label>
                <div className="grid grid-cols-4 gap-3">
                    {COLOR_OPTIONS.map((color) => (
                        <button
                            key={color.value}
                            type="button"
                            onClick={() => toggleColor(color.value)}
                            className={`p-3 rounded-lg border-2 transition-all relative ${selectedColors.includes(color.value)
                                ? "border-white scale-105"
                                : "border-transparent hover:border-white/30 truncate"
                                }`}
                            style={{ backgroundColor: color.value + "30" }}
                        >
                            <div className="text-2xl mb-1">{color.emoji}</div>
                            <div className="text-xs text-white/70">{color.description}</div>
                            {selectedColors.includes(color.value) && (
                                <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full shadow-lg" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* 感情タグ選択 */}
            <div>
                <label className="block text-sm text-white/80 mb-3">
                    💭 読んだ感想（複数選択可）
                </label>
                <div className="flex flex-wrap gap-2">
                    {EMOTION_OPTIONS.map((emotion) => (
                        <button
                            key={emotion.value}
                            type="button"
                            onClick={() => toggleEmotion(emotion.value)}
                            className={`px-4 py-2 rounded-full border transition-all flex items-center gap-2 ${selectedEmotions.includes(emotion.value)
                                ? "bg-purple-500/30 border-purple-500 text-white"
                                : "bg-white/5 border-white/20 text-white/70 hover:border-white/40"
                                }`}
                        >
                            <span>{emotion.emoji}</span>
                            <span className="text-sm">{emotion.label}</span>
                        </button>
                    ))}
                </div>
                <p className="mt-2 text-xs text-white/40">
                    選択した感情タグは天体のエフェクトに反映されます
                </p>
            </div>
        </div>
    );
}

export { COLOR_OPTIONS, EMOTION_OPTIONS };
