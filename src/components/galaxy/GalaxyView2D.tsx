"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import styles from "./GalaxyView2D.module.css";

export interface BookStar2D {
    id: string;
    title: string;
    author: string | null;
    rating?: number | null;
    image_color?: string | null;
    cover_image_url?: string | null;
    read_date?: string | null;
    tags: Array<{ id: string; name: string; color: string }>;
}

interface GalaxyView2DProps {
    books: BookStar2D[];
}

export function GalaxyView2D({ books }: GalaxyView2DProps) {
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<"date" | "rating" | "title">("date");
    const [hoveredBookId, setHoveredBookId] = useState<string | null>(null);

    // すべてのタグを抽出
    const allTags = useMemo(() => {
        const tagMap = new Map<string, { id: string; name: string; color: string; count: number }>();
        books.forEach(book => {
            book.tags.forEach(tag => {
                const existing = tagMap.get(tag.id);
                if (existing) {
                    existing.count++;
                } else {
                    tagMap.set(tag.id, { ...tag, count: 1 });
                }
            });
        });
        return Array.from(tagMap.values()).sort((a, b) => b.count - a.count);
    }, [books]);

    // フィルター・ソートされた本
    const filteredBooks = useMemo(() => {
        let result = [...books];

        // タグフィルター
        if (selectedTagId) {
            result = result.filter(book =>
                book.tags.some(tag => tag.id === selectedTagId)
            );
        }

        // ソート
        result.sort((a, b) => {
            if (sortBy === "date") {
                const dateA = a.read_date ? new Date(a.read_date).getTime() : 0;
                const dateB = b.read_date ? new Date(b.read_date).getTime() : 0;
                return dateB - dateA;
            } else if (sortBy === "rating") {
                return (b.rating || 0) - (a.rating || 0);
            } else {
                return a.title.localeCompare(b.title, "ja");
            }
        });

        return result;
    }, [books, selectedTagId, sortBy]);

    // 本同士の接続（同じタグを持つ）
    const connections = useMemo(() => {
        if (!selectedTagId) return [];

        const result: { from: string; to: string; tagColor: string }[] = [];
        const booksWithTag = filteredBooks;

        for (let i = 0; i < booksWithTag.length; i++) {
            for (let j = i + 1; j < booksWithTag.length; j++) {
                const sharedTags = booksWithTag[i].tags.filter(tagA =>
                    booksWithTag[j].tags.some(tagB => tagB.id === tagA.id)
                );
                if (sharedTags.length > 0) {
                    result.push({
                        from: booksWithTag[i].id,
                        to: booksWithTag[j].id,
                        tagColor: sharedTags[0].color,
                    });
                }
            }
        }
        return result;
    }, [filteredBooks, selectedTagId]);

    return (
        <div className={styles.container}>
            {/* コントロールバー */}
            <div className={styles.controls}>
                <div className={styles.tagFilter}>
                    <button
                        className={`${styles.tagButton} ${!selectedTagId ? styles.tagButtonActive : ""}`}
                        onClick={() => setSelectedTagId(null)}
                    >
                        すべて ({books.length})
                    </button>
                    {allTags.slice(0, 8).map(tag => (
                        <button
                            key={tag.id}
                            className={`${styles.tagButton} ${selectedTagId === tag.id ? styles.tagButtonActive : ""}`}
                            onClick={() => setSelectedTagId(tag.id === selectedTagId ? null : tag.id)}
                            style={{
                                borderColor: tag.color,
                                backgroundColor: selectedTagId === tag.id ? `${tag.color}30` : undefined,
                            }}
                        >
                            #{tag.name} ({tag.count})
                        </button>
                    ))}
                </div>

                <div className={styles.sortControls}>
                    <span className={styles.sortLabel}>並び替え:</span>
                    <button
                        className={`${styles.sortButton} ${sortBy === "date" ? styles.sortButtonActive : ""}`}
                        onClick={() => setSortBy("date")}
                    >
                        📅 読了日
                    </button>
                    <button
                        className={`${styles.sortButton} ${sortBy === "rating" ? styles.sortButtonActive : ""}`}
                        onClick={() => setSortBy("rating")}
                    >
                        ⭐ 評価
                    </button>
                    <button
                        className={`${styles.sortButton} ${sortBy === "title" ? styles.sortButtonActive : ""}`}
                        onClick={() => setSortBy("title")}
                    >
                        📚 タイトル
                    </button>
                </div>
            </div>

            {/* 本のグリッド */}
            <div className={styles.bookGrid}>
                {filteredBooks.map(book => {
                    const bgColor = book.image_color?.split(",")[0] || book.tags[0]?.color || "#7c3aed";
                    const isConnected = connections.some(
                        c => c.from === book.id || c.to === book.id
                    );

                    return (
                        <Link
                            key={book.id}
                            href={`/books/${book.id}`}
                            className={`${styles.bookCard} ${hoveredBookId && hoveredBookId !== book.id && !isConnected ? styles.dimmed : ""}`}
                            style={{
                                "--star-color": bgColor,
                            } as React.CSSProperties}
                            onMouseEnter={() => setHoveredBookId(book.id)}
                            onMouseLeave={() => setHoveredBookId(null)}
                        >
                            {/* 星のグロー効果 */}
                            <div
                                className={styles.starGlow}
                                style={{ backgroundColor: bgColor }}
                            />

                            {/* 表紙または星アイコン */}
                            <div className={styles.coverWrapper}>
                                {book.cover_image_url ? (
                                    <img
                                        src={book.cover_image_url}
                                        alt={book.title}
                                        className={styles.cover}
                                    />
                                ) : (
                                    <div
                                        className={styles.starIcon}
                                        style={{ backgroundColor: bgColor }}
                                    >
                                        ✦
                                    </div>
                                )}
                            </div>

                            {/* 情報 */}
                            <div className={styles.info}>
                                <h3 className={styles.title}>{book.title}</h3>
                                {book.author && (
                                    <p className={styles.author}>{book.author}</p>
                                )}
                                <div className={styles.meta}>
                                    {book.rating && (
                                        <span className={styles.rating}>
                                            {"★".repeat(book.rating)}
                                            {"☆".repeat(5 - book.rating)}
                                        </span>
                                    )}
                                    {book.read_date && (
                                        <span className={styles.date}>
                                            {new Date(book.read_date).toLocaleDateString("ja-JP", {
                                                year: "numeric",
                                                month: "short",
                                            })}
                                        </span>
                                    )}
                                </div>
                                {book.tags.length > 0 && (
                                    <div className={styles.tags}>
                                        {book.tags.slice(0, 3).map(tag => (
                                            <span
                                                key={tag.id}
                                                className={styles.tag}
                                                style={{
                                                    backgroundColor: `${tag.color}30`,
                                                    color: tag.color,
                                                }}
                                            >
                                                #{tag.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* 空状態 */}
            {filteredBooks.length === 0 && (
                <div className={styles.empty}>
                    <p>📚 本が見つかりません</p>
                    <Link href="/books/search" className={styles.addButton}>
                        本を追加する
                    </Link>
                </div>
            )}
        </div>
    );
}
