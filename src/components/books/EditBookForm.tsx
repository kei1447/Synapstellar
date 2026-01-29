"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateBook } from "@/lib/actions/books";
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
    readDate: string;
    rating: string;
    memo: string;
}

interface EditBookFormProps {
    bookId: string;
    initialData: BookFormData & {
        imageColor: string;
        emotions: string[];
    };
}

export function EditBookForm({ bookId, initialData }: EditBookFormProps) {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // フォームデータ
    const [formData, setFormData] = useState<BookFormData>({
        ...initialData,
        readDate: initialData.readDate || "",
        rating: initialData.rating || "",
        memo: initialData.memo || "",
    });

    // ハイブリッド評価
    const [imageColors, setImageColors] = useState<string[]>(
        initialData.imageColor ? initialData.imageColor.split(",") : ["#fbbf24"]
    );
    const [selectedEmotions, setSelectedEmotions] = useState<string[]>(initialData.emotions || []);

    // カスタムタグ（ユーザー独自）
    const [customTags, setCustomTags] = useState("");

    // Google Books検索結果から自動入力（上書き）
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
        if (confirm("検索結果の情報で上書きしますか？")) {
            setFormData({
                ...formData,
                title: book.title,
                author: book.author,
                tags: book.categories.join(", "),
                coverImageUrl: book.coverUrl,
                googleBooksId: book.googleBooksId,
                pageCount: book.pageCount || null,
                publishedDate: book.publishedDate || null,
                description: book.description || null,
            });
        }
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const submitData = new FormData();
        submitData.set("title", formData.title);
        submitData.set("author", formData.author);
        // カテゴリとカスタムタグを統合
        const allTags = [formData.tags, customTags].filter(Boolean).join(", ");
        submitData.set("tags", allTags);
        submitData.set("imageColor", imageColors.join(","));
        submitData.set("emotions", selectedEmotions.join(","));

        if (formData.coverImageUrl) submitData.set("coverImageUrl", formData.coverImageUrl);
        if (formData.googleBooksId) submitData.set("googleBooksId", formData.googleBooksId);
        if (formData.pageCount) submitData.set("pageCount", formData.pageCount.toString());
        if (formData.publishedDate) submitData.set("publishedDate", formData.publishedDate);
        if (formData.description) submitData.set("description", formData.description);

        if (formData.readDate) submitData.set("readDate", formData.readDate);
        if (formData.rating) submitData.set("rating", formData.rating);
        if (formData.memo) submitData.set("memo", formData.memo);

        const result = await updateBook(bookId, submitData);

        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
            return;
        }

        // updateBook内でリダイレクトされるが、念のため
        router.refresh();
    }

    return (
        <div className="space-y-6">
            {/* ステップ1: 本を検索（情報更新用） */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <details>
                    <summary className="cursor-pointer text-white/80 hover:text-white font-semibold mb-2">
                        Google Booksから情報を再検索して更新
                    </summary>
                    <div className="mt-4">
                        <BookSearch onSelectBook={handleBookSelect} />
                    </div>
                </details>
            </div>

            {/* ステップ2: 詳細情報 */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">本の情報</h3>

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
                                    📚 タグ（登録済み）
                                </label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                                    placeholder="小説, SF, 哲学..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-white/80 mb-2">
                                    🏷️ タグを追加（自由入力）
                                </label>
                                <input
                                    type="text"
                                    value={customTags}
                                    onChange={(e) => setCustomTags(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                                    placeholder="積読, 2024ベスト, おすすめ..."
                                />
                                <p className="mt-1 text-xs text-white/40">
                                    カンマ区切りで新しいタグを追加できます
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-white/80 mb-2">読了日</label>
                                    <input
                                        type="date"
                                        value={formData.readDate}
                                        onChange={(e) => setFormData({ ...formData, readDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-white/80 mb-2">評価（任意）</label>
                                    <select
                                        value={formData.rating}
                                        onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                                    >
                                        <option value="" className="text-black">未評価</option>
                                        <option value="5" className="text-black">★★★★★</option>
                                        <option value="4" className="text-black">★★★★☆</option>
                                        <option value="3" className="text-black">★★★☆☆</option>
                                        <option value="2" className="text-black">★★☆☆☆</option>
                                        <option value="1" className="text-black">★☆☆☆☆</option>
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
                            value={formData.memo}
                            onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                            placeholder="この本から得た気づきや感想..."
                        />
                    </div>
                </div>

                {/* ステップ3: イメージ設定 */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">星のイメージを設定</h3>

                    <ColorEmotionPicker
                        selectedColors={imageColors}
                        selectedEmotions={selectedEmotions}
                        onColorsChange={setImageColors}
                        onEmotionsChange={setSelectedEmotions}
                    />
                </div>

                {/* 送信ボタン */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={isLoading || !formData.title}
                        className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl font-semibold text-white text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {isLoading ? "保存中..." : "変更を保存"}
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
    );
}
