"use client";

import Image from "next/image";
import styles from "./SearchResultCard.module.css";

interface BookInfo {
    id: string;
    source: "openbd" | "google";
    volumeInfo: {
        title: string;
        authors?: string[];
        categories?: string[];
        imageLinks?: { smallThumbnail?: string; thumbnail?: string };
        pageCount?: number;
        publishedDate?: string;
        description?: string;
    };
}

interface SearchResultCardProps {
    book: BookInfo;
    onSelect: () => void;
}

export function SearchResultCard({ book, onSelect }: SearchResultCardProps) {
    const info = book.volumeInfo;
    const coverUrl = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;

    return (
        <div className={styles.card}>
            <div className={styles.coverWrapper}>
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={info.title}
                        className={styles.cover}
                    />
                ) : (
                    <div className={styles.noCover}>
                        <span>📖</span>
                    </div>
                )}
                <span className={styles.source}>
                    {book.source === "openbd" ? "🇯🇵 OpenBD" : "🌐 Google"}
                </span>
            </div>

            <div className={styles.info}>
                <h3 className={styles.title}>{info.title}</h3>

                {info.authors && info.authors.length > 0 && (
                    <p className={styles.authors}>{info.authors.join(", ")}</p>
                )}

                {info.categories && info.categories.length > 0 && (
                    <div className={styles.categories}>
                        {info.categories.slice(0, 3).map((cat, i) => (
                            <span key={i} className={styles.category}>
                                {cat.split("/")[0].trim()}
                            </span>
                        ))}
                    </div>
                )}

                {info.publishedDate && (
                    <p className={styles.date}>
                        {info.publishedDate.slice(0, 4)}年
                    </p>
                )}

                <button
                    type="button"
                    onClick={onSelect}
                    className={styles.selectButton}
                >
                    この本を登録 →
                </button>
            </div>
        </div>
    );
}
