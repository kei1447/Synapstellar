"use client";

import { useState } from "react";
import Link from "next/link";
import { GalaxyCanvas, BookStar } from "@/components/galaxy/GalaxyCanvas";

interface GalaxyViewProps {
    books: BookStar[];
}

export function GalaxyView({ books }: GalaxyViewProps) {
    const [selectedBook, setSelectedBook] = useState<BookStar | null>(null);

    return (
        <div className="relative w-full h-screen">
            {/* 3D星空 */}
            <GalaxyCanvas
                books={books}
                onBookClick={(book) => setSelectedBook(book)}
            />

            {/* 操作説明 */}
            <div className="absolute bottom-6 left-6 text-white/50 text-sm">
                <p>🖱️ ドラッグ: 回転 | スクロール: ズーム | 右クリック+ドラッグ: 移動</p>
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

                    <Link
                        href={`/books/${selectedBook.id}/edit`}
                        className="block text-center py-2 text-sm text-purple-400 hover:text-purple-300 border border-purple-400/30 rounded-lg hover:bg-purple-400/10 transition-all"
                    >
                        編集する
                    </Link>
                </div>
            )}

            {/* 統計情報 */}
            <div className="absolute top-24 left-6 bg-black/60 backdrop-blur-lg border border-white/10 rounded-xl px-4 py-3">
                <div className="flex items-center gap-4 text-sm">
                    <div>
                        <span className="text-white/50">登録本: </span>
                        <span className="text-white font-semibold">{books.length}冊</span>
                    </div>
                    <div>
                        <span className="text-white/50">接続数: </span>
                        <span className="text-white font-semibold">
                            {countConnections(books)}本
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// タグによる接続数を計算
function countConnections(books: BookStar[]): number {
    const tagToBooks = new Map<string, number>();

    books.forEach((book) => {
        book.tags.forEach((tag) => {
            tagToBooks.set(tag.id, (tagToBooks.get(tag.id) || 0) + 1);
        });
    });

    let connections = 0;
    tagToBooks.forEach((count) => {
        if (count >= 2) {
            // n冊の本があるタグはn*(n-1)/2の接続を生成
            connections += (count * (count - 1)) / 2;
        }
    });

    return connections;
}
