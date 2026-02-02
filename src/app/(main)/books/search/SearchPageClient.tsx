"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchGoogleBooks } from "@/lib/google-books";
import { searchByISBN, normalizeToIsbn13 } from "@/lib/openbd";
import { SearchResultCard } from "@/components/books/SearchResultCard";
import { BarcodeScanner } from "@/components/books/BarcodeScanner";
import styles from "./SearchPage.module.css";

interface SearchResult {
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

export function SearchPageClient() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const router = useRouter();

    // 検索実行
    const performSearch = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        setHasSearched(true);

        // ISBN/ASIN の場合はOpenBDを優先
        const normalizedIsbn = normalizeToIsbn13(searchQuery);
        if (normalizedIsbn) {
            const openBDResult = await searchByISBN(normalizedIsbn);
            if (openBDResult) {
                const result: SearchResult = {
                    id: openBDResult.isbn,
                    source: "openbd",
                    volumeInfo: {
                        title: openBDResult.title,
                        authors: openBDResult.author ? [openBDResult.author] : undefined,
                        categories: openBDResult.categories,
                        imageLinks: openBDResult.coverUrl ? { thumbnail: openBDResult.coverUrl } : undefined,
                        pageCount: openBDResult.pageCount || undefined,
                        publishedDate: openBDResult.pubdate,
                        description: openBDResult.description || undefined,
                    },
                };
                setResults([result]);
                setIsSearching(false);
                return;
            }
        }

        // OpenBDで見つからない場合、またはタイトル検索の場合はGoogle Books
        const books = await searchGoogleBooks(searchQuery);
        const googleResults: SearchResult[] = books.map((book) => ({
            id: book.id,
            source: "google" as const,
            volumeInfo: book.volumeInfo,
        }));
        setResults(googleResults);
        setIsSearching(false);
    }, []);

    // 検索ボタン押下時
    const handleSearch = () => {
        if (query.length < 2) {
            return;
        }
        performSearch(query);
    };

    // Enterキーで検索
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // 本を選択して登録ページへ
    const handleSelectBook = (book: SearchResult) => {
        const info = book.volumeInfo;
        const params = new URLSearchParams({
            title: info.title,
            author: info.authors?.join(", ") || "",
            categories: info.categories?.join(",") || "",
            coverUrl: info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || "",
            googleBooksId: book.id,
            pageCount: info.pageCount?.toString() || "",
            publishedDate: info.publishedDate || "",
            description: info.description || "",
        });
        router.push(`/books/new?${params.toString()}`);
    };

    // バーコード検出時
    const handleBarcodeDetected = (isbn: string) => {
        setShowScanner(false);
        setQuery(isbn);
        performSearch(isbn);
    };

    return (
        <div className="galaxy-bg min-h-screen">
            {/* ヘッダー */}
            <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/30 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/dashboard">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                            Synapstellar
                        </h1>
                    </Link>
                    <nav className="flex gap-4">
                        <Link href="/books" className="text-white/70 hover:text-white transition-colors">
                            本の管理
                        </Link>
                    </nav>
                </div>
            </header>

            {/* メインコンテンツ */}
            <main className="pt-24 px-6 max-w-5xl mx-auto pb-12">
                <div className="mb-8">
                    <Link href="/books" className="text-white/60 hover:text-white text-sm mb-4 inline-block">
                        ← 本の一覧に戻る
                    </Link>
                    <h2 className="text-3xl font-bold text-white">本を検索</h2>
                    <p className="text-white/60 mt-2">
                        タイトルやISBNで検索して、本を登録しましょう
                    </p>
                </div>

                {/* 検索バー */}
                <div className={styles.searchBar}>
                    <div className={styles.inputWrapper}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className={styles.input}
                            placeholder="タイトル、著者、またはISBNを入力..."
                            autoFocus
                        />
                        {isSearching && (
                            <div className={styles.spinner}>
                                <div className="animate-spin h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full" />
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleSearch}
                        disabled={query.length < 2 || isSearching}
                        className={styles.searchButton}
                    >
                        {isSearching ? "検索中..." : "検索"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowScanner(true)}
                        className={styles.scanButton}
                    >
                        📷
                    </button>
                </div>

                {/* 検索のヒント */}
                {!hasSearched && (
                    <div className={styles.hints}>
                        <p className={styles.hintsTitle}>💡 検索のヒント</p>
                        <ul className={styles.hintsList}>
                            <li>本のタイトルの一部を入力</li>
                            <li>著者名で検索</li>
                            <li>ISBN（バーコード番号）を直接入力</li>
                            <li>📷ボタンでバーコードをスキャン</li>
                        </ul>
                    </div>
                )}

                {/* 検索結果 */}
                {hasSearched && (
                    <div className={styles.resultsSection}>
                        <p className={styles.resultsCount}>
                            {results.length > 0
                                ? `${results.length}件の本が見つかりました`
                                : "本が見つかりませんでした"}
                        </p>
                        <div className={styles.resultsGrid}>
                            {results.map((book) => (
                                <SearchResultCard
                                    key={book.id}
                                    book={book}
                                    onSelect={() => handleSelectBook(book)}
                                />
                            ))}
                        </div>

                        {results.length === 0 && (
                            <div className={styles.noResults}>
                                <p className={styles.noResultsText}>
                                    検索結果がありません
                                </p>
                                <Link href="/books/new" className={styles.manualLink}>
                                    手動で本を登録する →
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* 手動登録リンク */}
                <div className={styles.footer}>
                    <p className={styles.footerText}>見つからない本は</p>
                    <Link href="/books/new?manual=true" className={styles.manualButton}>
                        ✏️ 手動で登録
                    </Link>
                </div>
            </main>

            {/* バーコードスキャナーモーダル */}
            {showScanner && (
                <BarcodeScanner
                    onDetected={handleBarcodeDetected}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
}
