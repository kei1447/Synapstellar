"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { searchGoogleBooks, GoogleBookVolume, categoriesToTags, getCoverImageUrl } from "@/lib/google-books";

interface BookSearchProps {
    onSelectBook: (book: {
        title: string;
        author: string;
        categories: string[];
        coverUrl: string | null;
        googleBooksId: string;
        pageCount?: number;
        publishedDate?: string;
        description?: string;
    }) => void;
}

export function BookSearch({ onSelectBook }: BookSearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<GoogleBookVolume[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 外部クリックでドロップダウンを閉じる
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // デバウンス検索
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            setShowResults(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            const books = await searchGoogleBooks(query);
            setResults(books);
            setShowResults(true);
            setIsSearching(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = useCallback((book: GoogleBookVolume) => {
        const info = book.volumeInfo;
        onSelectBook({
            title: info.title,
            author: info.authors?.join(", ") || "",
            categories: categoriesToTags(info.categories),
            coverUrl: getCoverImageUrl(info.imageLinks),
            googleBooksId: book.id,
            pageCount: info.pageCount,
            publishedDate: info.publishedDate,
            description: info.description,
        });
        setQuery(info.title);
        setShowResults(false);
    }, [onSelectBook]);

    return (
        <div ref={containerRef} className="relative" style={{ minHeight: showResults && results.length > 0 ? "350px" : "auto" }}>
            <label className="block text-sm text-white/80 mb-2">
                📚 本を検索（タイトルまたはISBN）
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setShowResults(true)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="タイトルを入力して検索..."
                />
                {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full" />
                    </div>
                )}
            </div>

            {/* 検索結果ドロップダウン - 固定位置で他の要素の上に表示 */}
            {showResults && results.length > 0 && (
                <div className="absolute left-0 right-0 z-[100] mt-2 bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-2xl max-h-72 overflow-y-auto">
                    {results.map((book) => (
                        <button
                            key={book.id}
                            type="button"
                            onClick={() => handleSelect(book)}
                            className="w-full px-4 py-3 flex gap-3 hover:bg-white/10 transition-colors text-left border-b border-white/10 last:border-b-0"
                        >
                            {book.volumeInfo.imageLinks?.smallThumbnail ? (
                                <img
                                    src={book.volumeInfo.imageLinks.smallThumbnail}
                                    alt=""
                                    className="w-10 h-14 object-cover rounded flex-shrink-0"
                                />
                            ) : (
                                <div className="w-10 h-14 bg-white/10 rounded flex items-center justify-center text-white/30 flex-shrink-0">
                                    📖
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="text-white font-medium truncate">{book.volumeInfo.title}</div>
                                <div className="text-white/60 text-sm truncate">
                                    {book.volumeInfo.authors?.join(", ") || "著者不明"}
                                </div>
                                {book.volumeInfo.categories && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {book.volumeInfo.categories.slice(0, 2).map((cat, i) => (
                                            <span key={i} className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                                                {cat.split("/")[0].trim()}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {showResults && results.length === 0 && query.length >= 2 && !isSearching && (
                <div className="absolute left-0 right-0 z-[100] mt-2 bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-white/60 text-center">
                    見つかりませんでした。下のフォームに直接入力してください。
                </div>
            )}

            <p className="mt-2 text-xs text-white/40">
                見つからない場合は下のフォームに直接入力できます
            </p>
        </div>
    );
}

