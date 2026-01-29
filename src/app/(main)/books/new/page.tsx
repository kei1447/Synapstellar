"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBook } from "@/lib/actions/books";
import { FirstBookCelebration } from "@/components/galaxy/BigBangAnimation";
import { BookSearch } from "@/components/books/BookSearch";
import { ColorEmotionPicker } from "@/components/books/ColorEmotionPicker";

interface BookFormData {
    title: string;
    author: string;
    tags: string;
    coverImageUrl: string | null;
    googleBooksId: string | null;
    pageCount: number | null;
    publishedDate: string | null;
    description: string | null;
}

export default function NewBookPage() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showBigBang, setShowBigBang] = useState(false);
    const [firstBookTitle, setFirstBookTitle] = useState("");
    const router = useRouter();

    // フォームデータ
    const [formData, setFormData] = useState<BookFormData>({
        title: "",
        author: "",
        tags: "",
        coverImageUrl: null,
        googleBooksId: null,
        pageCount: null,
        publishedDate: null,
        description: null,
    });

    // ハイブリッド評価
    const [imageColor, setImageColor] = useState("#fbbf24"); // デフォルト: 黄
    const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);

    // Google Books検索結果から自動入力
    const handleBookSelect = (book: {
        title: string;
        author: string;
        categories: string[];
        coverUrl: string | null;
        googleBooksId: string;
        pageCount?: number;
        publishedDate?: string;
        description?: string;
    }) => {
        setFormData({
            title: book.title,
            author: book.author,
            tags: book.categories.join(", "),
            coverImageUrl: book.coverUrl,
            googleBooksId: book.googleBooksId,
            pageCount: book.pageCount || null,
            publishedDate: book.publishedDate || null,
            description: book.description || null,
        });
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const submitData = new FormData();
        submitData.set("title", formData.title);
        submitData.set("author", formData.author);
        submitData.set("tags", formData.tags);
        submitData.set("imageColor", imageColor);
        submitData.set("emotions", selectedEmotions.join(","));

        // Google Books由来のデータ
        if (formData.coverImageUrl) submitData.set("coverImageUrl", formData.coverImageUrl);
        if (formData.googleBooksId) submitData.set("googleBooksId", formData.googleBooksId);
        if (formData.pageCount) submitData.set("pageCount", formData.pageCount.toString());
        if (formData.publishedDate) submitData.set("publishedDate", formData.publishedDate);
        if (formData.description) submitData.set("description", formData.description);

        // フォームから取得
        const form = e.currentTarget;
        const readDate = (form.elements.namedItem("readDate") as HTMLInputElement)?.value;
        const rating = (form.elements.namedItem("rating") as HTMLSelectElement)?.value;
        const memo = (form.elements.namedItem("memo") as HTMLTextAreaElement)?.value;

        if (readDate) submitData.set("readDate", readDate);
        if (rating) submitData.set("rating", rating);
        if (memo) submitData.set("memo", memo);

        const result = await createBook(submitData);

        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
            return;
        }

        if (result?.success) {
            if (result.isFirstBook && result.bookTitle) {
                setFirstBookTitle(result.bookTitle);
                setShowBigBang(true);
            } else {
                router.push("/galaxy");
            }
        }
    }

    function handleBigBangComplete() {
        router.push("/galaxy");
    }

    if (showBigBang) {
        return (
            <FirstBookCelebration
                bookTitle={firstBookTitle}
                onComplete={handleBigBangComplete}
            />
        );
    }

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
                </div>
            </header>

            {/* メインコンテンツ */}
            <main className="pt-24 px-6 max-w-3xl mx-auto pb-12">
                <div className="mb-8">
                    <Link href="/books" className="text-white/60 hover:text-white text-sm mb-4 inline-block">
                        ← 本の一覧に戻る
                    </Link>
                    <h2 className="text-3xl font-bold text-white">新しい星を生み出す</h2>
                    <p className="text-white/60 mt-2">
                        本を検索して追加するか、直接情報を入力してください ✨
                    </p>
                </div>

                <div className="space-y-6">
                    {/* ステップ1: 本を検索 */}
                    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-sm">1</span>
                            本を検索
                        </h3>
                        <BookSearch onSelectBook={handleBookSelect} />
                    </div>

                    {/* ステップ2: 詳細情報 */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-sm">2</span>
                                本の情報
                            </h3>

                            {error && (
                                <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* 左側: 基本情報 */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-white/80 mb-2">
                                            タイトル <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                                            placeholder="本のタイトル"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-white/80 mb-2">著者</label>
                                        <input
                                            type="text"
                                            value={formData.author}
                                            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                                            placeholder="著者名"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-white/80 mb-2">
                                            タグ（カンマ区切り）
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.tags}
                                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                                            placeholder="小説, SF, 哲学..."
                                        />
                                        <p className="mt-1 text-xs text-white/40">
                                            検索から選択すると自動入力されます
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-white/80 mb-2">読了日</label>
                                            <input
                                                type="date"
                                                name="readDate"
                                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-white/80 mb-2">評価（任意）</label>
                                            <select
                                                name="rating"
                                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                                            >
                                                <option value="">未評価</option>
                                                <option value="5">★★★★★</option>
                                                <option value="4">★★★★☆</option>
                                                <option value="3">★★★☆☆</option>
                                                <option value="2">★★☆☆☆</option>
                                                <option value="1">★☆☆☆☆</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* 右側: 表紙プレビュー */}
                                <div className="flex flex-col items-center justify-center">
                                    {formData.coverImageUrl ? (
                                        <div className="text-center">
                                            <img
                                                src={formData.coverImageUrl}
                                                alt="表紙"
                                                className="w-32 h-48 object-cover rounded-lg shadow-lg mb-2"
                                            />
                                            <p className="text-xs text-white/40">表紙プレビュー</p>
                                        </div>
                                    ) : (
                                        <div className="w-32 h-48 bg-white/10 rounded-lg flex items-center justify-center">
                                            <span className="text-4xl text-white/30">📖</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm text-white/80 mb-2">メモ・感想</label>
                                <textarea
                                    name="memo"
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                                    placeholder="この本から得た気づきや感想..."
                                />
                            </div>
                        </div>

                        {/* ステップ3: イメージ設定 */}
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-sm">3</span>
                                星のイメージを設定
                            </h3>

                            <ColorEmotionPicker
                                selectedColor={imageColor}
                                selectedEmotions={selectedEmotions}
                                onColorChange={setImageColor}
                                onEmotionsChange={setSelectedEmotions}
                            />

                            {/* プレビュー */}
                            <div className="mt-6 p-4 bg-black/30 rounded-lg">
                                <p className="text-sm text-white/60 mb-3">プレビュー</p>
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-12 h-12 rounded-full"
                                        style={{
                                            backgroundColor: imageColor,
                                            boxShadow: `0 0 20px ${imageColor}80, 0 0 40px ${imageColor}40`,
                                        }}
                                    />
                                    <div>
                                        <p className="text-white font-medium">
                                            {formData.title || "タイトル未入力"}
                                        </p>
                                        <p className="text-white/60 text-sm">
                                            {formData.author || "著者未入力"}
                                        </p>
                                        {selectedEmotions.length > 0 && (
                                            <p className="text-xs text-purple-300 mt-1">
                                                エフェクト: {selectedEmotions.length}個
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 送信ボタン */}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={isLoading || !formData.title}
                                className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl font-semibold text-white text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {isLoading ? "宇宙を創造中..." : "🌟 星を生み出す"}
                            </button>
                            <Link
                                href="/books"
                                className="px-8 py-4 border border-white/20 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
                            >
                                キャンセル
                            </Link>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
