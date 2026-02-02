"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { GalaxyCanvas, BookStar } from "@/components/galaxy/GalaxyCanvas";
import { GalaxyView2D } from "@/components/galaxy/GalaxyView2D";

interface GalaxyViewProps {
    books: BookStar[];
}

// フィルター設定の型
interface FilterSettings {
    connectionStrength: "all" | "medium" | "strong";
    showTagConnections: boolean;
    showAuthorConnections: boolean;
    selectedTags: Set<string>;
    selectedEmotions: Set<string>;
    yearRange: [number, number];
    timelineEnabled: boolean;
}

// 感情タグのラベル
const emotionLabels: Record<string, string> = {
    "moved": "感動した",
    "thought-provoking": "考えさせられた",
    "funny": "笑えた",
    "tearful": "泣けた",
    "educational": "勉強になった",
    "life-changing": "人生観が変わった",
    "want-to-reread": "また読みたい",
};

export function GalaxyView({ books }: GalaxyViewProps) {
    const [selectedBook, setSelectedBook] = useState<BookStar | null>(null);
    const [hoveredBookId, setHoveredBookId] = useState<string | null>(null);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [viewMode, setViewMode] = useState<"2d" | "3d">("2d"); // 2Dがデフォルト

    // 年の範囲を計算
    const yearBounds = useMemo(() => {
        const years = books
            .map(b => (b as any).read_date)
            .filter(Boolean)
            .map(d => new Date(d).getFullYear())
            .filter(y => !isNaN(y));
        if (years.length === 0) return [2020, 2026];
        return [Math.min(...years), Math.max(...years)];
    }, [books]);

    // フィルター設定
    const [filters, setFilters] = useState<FilterSettings>({
        connectionStrength: "strong",
        showTagConnections: true,
        showAuthorConnections: true,
        selectedTags: new Set<string>(),
        selectedEmotions: new Set<string>(),
        yearRange: yearBounds as [number, number],
        timelineEnabled: false,
    });

    // 利用可能なタグ一覧
    const availableTags = useMemo(() => {
        const tagMap = new Map<string, { id: string; name: string; color: string; count: number }>();
        books.forEach(book => {
            book.tags.forEach(tag => {
                if (!tagMap.has(tag.id)) {
                    tagMap.set(tag.id, { ...tag, count: 0 });
                }
                tagMap.get(tag.id)!.count++;
            });
        });
        return Array.from(tagMap.values()).sort((a, b) => b.count - a.count);
    }, [books]);

    // 利用可能な感情タグ一覧
    const availableEmotions = useMemo(() => {
        const emotionCounts = new Map<string, number>();
        books.forEach(book => {
            (book.emotion_tags || []).forEach(emotion => {
                emotionCounts.set(emotion, (emotionCounts.get(emotion) || 0) + 1);
            });
        });
        return Array.from(emotionCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([emotion, count]) => ({ emotion, count }));
    }, [books]);

    // フィルタリングされた本
    const filteredBooks = useMemo(() => {
        return books.filter(book => {
            // タグフィルター
            if (filters.selectedTags.size > 0) {
                const bookTagIds = new Set(book.tags.map(t => t.id));
                const hasMatchingTag = Array.from(filters.selectedTags).some(tagId => bookTagIds.has(tagId));
                if (!hasMatchingTag) return false;
            }

            // 感情フィルター
            if (filters.selectedEmotions.size > 0) {
                const hasMatchingEmotion = (book.emotion_tags || []).some(e => filters.selectedEmotions.has(e));
                if (!hasMatchingEmotion) return false;
            }

            // 年フィルター（タイムラインが有効な場合）
            if (filters.timelineEnabled && book.read_date) {
                const bookYear = new Date(book.read_date).getFullYear();
                if (bookYear < filters.yearRange[0] || bookYear > filters.yearRange[1]) {
                    return false;
                }
            }

            return true;
        });
    }, [books, filters]);

    // タグ選択の切り替え
    const toggleTag = useCallback((tagId: string) => {
        setFilters(prev => {
            const newSelected = new Set(prev.selectedTags);
            if (newSelected.has(tagId)) {
                newSelected.delete(tagId);
            } else {
                newSelected.add(tagId);
            }
            return { ...prev, selectedTags: newSelected };
        });
    }, []);

    // 感情選択の切り替え
    const toggleEmotion = useCallback((emotion: string) => {
        setFilters(prev => {
            const newSelected = new Set(prev.selectedEmotions);
            if (newSelected.has(emotion)) {
                newSelected.delete(emotion);
            } else {
                newSelected.add(emotion);
            }
            return { ...prev, selectedEmotions: newSelected };
        });
    }, []);

    // フィルターリセット
    const resetFilters = useCallback(() => {
        setFilters({
            connectionStrength: "strong",
            showTagConnections: true,
            showAuthorConnections: true,
            selectedTags: new Set(),
            selectedEmotions: new Set(),
            yearRange: yearBounds as [number, number],
            timelineEnabled: false,
        });
    }, [yearBounds]);

    return (
        <div className="relative w-full h-screen">
            {/* 2D/3D 切り替えボタン */}
            <div className="absolute top-24 right-6 z-10 flex gap-2 bg-black/60 backdrop-blur-lg border border-white/10 rounded-xl p-1">
                <button
                    onClick={() => setViewMode("2d")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === "2d"
                        ? "bg-purple-600 text-white"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                        }`}
                >
                    📊 2D
                </button>
                <button
                    onClick={() => setViewMode("3d")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === "3d"
                        ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                        }`}
                >
                    ✨ 3D星空
                </button>
            </div>

            {/* 2Dビュー */}
            {viewMode === "2d" && (
                <GalaxyView2D
                    books={filteredBooks.map(book => ({
                        ...book,
                        cover_image_url: (book as any).cover_image_url || null,
                    }))}
                />
            )}

            {/* 3D星空 */}
            {viewMode === "3d" && (
                <>
                    <GalaxyCanvas
                        books={filteredBooks}
                        onBookClick={(book) => setSelectedBook(book)}
                        onBookHover={(bookId) => setHoveredBookId(bookId)}
                        hoveredBookId={hoveredBookId}
                        connectionStrength={filters.connectionStrength}
                        showTagConnections={filters.showTagConnections}
                        showAuthorConnections={filters.showAuthorConnections}
                    />

                    {/* 操作説明 */}
                    <div className="absolute bottom-6 left-6 text-white/50 text-sm">
                        <p>🖱️ ドラッグ: 回転 | スクロール: ズーム | 右クリック+ドラッグ: 移動</p>
                    </div>

                    {/* フィルターボタン */}
                    <button
                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                        className={`absolute top-24 left-6 px-4 py-2 rounded-lg backdrop-blur-lg border transition-all ${showFilterPanel
                            ? "bg-purple-600/80 border-purple-400/50 text-white"
                            : "bg-black/60 border-white/10 text-white/70 hover:text-white hover:border-white/30"
                            }`}
                    >
                        🎛️ フィルター
                        {(filters.selectedTags.size > 0 || filters.selectedEmotions.size > 0) && (
                            <span className="ml-2 px-2 py-0.5 bg-purple-500 text-xs rounded-full">
                                {filters.selectedTags.size + filters.selectedEmotions.size}
                            </span>
                        )}
                    </button>

                    {/* フィルターパネル */}
                    {showFilterPanel && (
                        <div className="absolute top-36 left-6 w-80 max-h-[70vh] overflow-y-auto bg-black/80 backdrop-blur-lg border border-white/20 rounded-2xl p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white font-semibold">フィルター設定</h3>
                                <button
                                    onClick={resetFilters}
                                    className="text-xs text-purple-400 hover:text-purple-300"
                                >
                                    リセット
                                </button>
                            </div>

                            {/* 接続線の強度 */}
                            <div className="mb-4">
                                <label className="text-white/70 text-sm block mb-2">接続線の表示</label>
                                <div className="flex gap-2">
                                    {(["strong", "medium", "all"] as const).map((strength) => (
                                        <button
                                            key={strength}
                                            onClick={() => setFilters(prev => ({ ...prev, connectionStrength: strength }))}
                                            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${filters.connectionStrength === strength
                                                ? "bg-purple-600 text-white"
                                                : "bg-white/10 text-white/60 hover:bg-white/20"
                                                }`}
                                        >
                                            {strength === "strong" ? "強のみ" : strength === "medium" ? "中以上" : "すべて"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 接続タイプ */}
                            <div className="mb-4">
                                <label className="text-white/70 text-sm block mb-2">接続タイプ</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-white/80 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.showTagConnections}
                                            onChange={(e) => setFilters(prev => ({ ...prev, showTagConnections: e.target.checked }))}
                                            className="rounded border-white/30 bg-white/10"
                                        />
                                        タグ接続を表示
                                    </label>
                                    <label className="flex items-center gap-2 text-white/80 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.showAuthorConnections}
                                            onChange={(e) => setFilters(prev => ({ ...prev, showAuthorConnections: e.target.checked }))}
                                            className="rounded border-white/30 bg-white/10"
                                        />
                                        著者接続を表示
                                    </label>
                                </div>
                            </div>

                            {/* タグフィルター */}
                            <div className="mb-4">
                                <label className="text-white/70 text-sm block mb-2">
                                    タグで絞り込み
                                    {filters.selectedTags.size > 0 && (
                                        <span className="ml-2 text-purple-400">({filters.selectedTags.size})</span>
                                    )}
                                </label>
                                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                                    {availableTags.slice(0, 20).map((tag) => (
                                        <button
                                            key={tag.id}
                                            onClick={() => toggleTag(tag.id)}
                                            className={`px-2 py-1 text-xs rounded-full transition-all ${filters.selectedTags.has(tag.id)
                                                ? "ring-2 ring-white"
                                                : "opacity-70 hover:opacity-100"
                                                }`}
                                            style={{
                                                backgroundColor: tag.color + "40",
                                                color: tag.color,
                                            }}
                                        >
                                            {tag.name} ({tag.count})
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 感情フィルター */}
                            {availableEmotions.length > 0 && (
                                <div className="mb-4">
                                    <label className="text-white/70 text-sm block mb-2">
                                        感情で絞り込み
                                        {filters.selectedEmotions.size > 0 && (
                                            <span className="ml-2 text-purple-400">({filters.selectedEmotions.size})</span>
                                        )}
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {availableEmotions.map(({ emotion, count }) => (
                                            <button
                                                key={emotion}
                                                onClick={() => toggleEmotion(emotion)}
                                                className={`px-2 py-1 text-xs rounded-full transition-all ${filters.selectedEmotions.has(emotion)
                                                    ? "bg-cyan-600 text-white ring-2 ring-white"
                                                    : "bg-cyan-600/30 text-cyan-300 hover:bg-cyan-600/50"
                                                    }`}
                                            >
                                                {emotionLabels[emotion] || emotion} ({count})
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 時間軸スライダー */}
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[600px] max-w-[90vw] bg-black/70 backdrop-blur-lg border border-white/20 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-white/70 text-sm flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={filters.timelineEnabled}
                                    onChange={(e) => setFilters(prev => ({ ...prev, timelineEnabled: e.target.checked }))}
                                    className="rounded border-white/30 bg-white/10"
                                />
                                📅 時間軸フィルター
                            </label>
                            {filters.timelineEnabled && (
                                <span className="text-cyan-400 text-sm">
                                    {filters.yearRange[0]}年 - {filters.yearRange[1]}年
                                </span>
                            )}
                        </div>
                        {filters.timelineEnabled && (
                            <div className="flex items-center gap-4">
                                <span className="text-white/50 text-xs">{yearBounds[0]}</span>
                                <div className="flex-1 relative">
                                    <input
                                        type="range"
                                        min={yearBounds[0]}
                                        max={yearBounds[1]}
                                        value={filters.yearRange[0]}
                                        onChange={(e) => setFilters(prev => ({
                                            ...prev,
                                            yearRange: [parseInt(e.target.value), Math.max(parseInt(e.target.value), prev.yearRange[1])]
                                        }))}
                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                    />
                                    <input
                                        type="range"
                                        min={yearBounds[0]}
                                        max={yearBounds[1]}
                                        value={filters.yearRange[1]}
                                        onChange={(e) => setFilters(prev => ({
                                            ...prev,
                                            yearRange: [Math.min(prev.yearRange[0], parseInt(e.target.value)), parseInt(e.target.value)]
                                        }))}
                                        className="w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer accent-cyan-500 absolute top-0 left-0"
                                        style={{ pointerEvents: 'auto' }}
                                    />
                                </div>
                                <span className="text-white/50 text-xs">{yearBounds[1]}</span>
                            </div>
                        )}
                    </div>

                    {/* 選択された本の詳細パネル */}
                    {selectedBook && (
                        <div className="absolute top-24 right-6 w-80 bg-black/80 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                            <button
                                onClick={() => setSelectedBook(null)}
                                className="absolute top-4 right-4 text-white/60 hover:text-white"
                            >
                                ✕
                            </button>

                            <h3 className="text-xl font-semibold text-white mb-2 pr-8">
                                {selectedBook.title}
                            </h3>

                            {selectedBook.author && (
                                <p className="text-white/60 mb-4">{selectedBook.author}</p>
                            )}

                            {selectedBook.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {selectedBook.tags.map((tag) => (
                                        <span
                                            key={tag.id}
                                            className="px-2 py-1 text-xs rounded-full"
                                            style={{ backgroundColor: tag.color + "30", color: tag.color }}
                                        >
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {selectedBook.emotion_tags && selectedBook.emotion_tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {selectedBook.emotion_tags.map((emotion) => (
                                        <span
                                            key={emotion}
                                            className="px-2 py-1 text-xs rounded-full bg-cyan-600/30 text-cyan-300"
                                        >
                                            {emotionLabels[emotion] || emotion}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <Link
                                href={`/books/${selectedBook.id}/edit`}
                                className="block text-center py-2 text-sm text-purple-400 hover:text-purple-300 border border-purple-400/30 rounded-lg hover:bg-purple-400/10 transition-all"
                            >
                                編集する
                            </Link>
                        </div>
                    )}

                    {/* 統計情報 */}
                    <div className="absolute top-24 left-44 bg-black/60 backdrop-blur-lg border border-white/10 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-4 text-sm">
                            <div>
                                <span className="text-white/50">表示中: </span>
                                <span className="text-white font-semibold">{filteredBooks.length}冊</span>
                                {filteredBooks.length !== books.length && (
                                    <span className="text-white/40 ml-1">/ {books.length}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
