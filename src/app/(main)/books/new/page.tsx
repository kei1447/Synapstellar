"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBook } from "@/lib/actions/books";
import { FirstBookCelebration } from "@/components/galaxy/BigBangAnimation";

export default function NewBookPage() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showBigBang, setShowBigBang] = useState(false);
    const [firstBookTitle, setFirstBookTitle] = useState("");
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setError(null);

        const result = await createBook(formData);

        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
            return;
        }

        if (result?.success) {
            if (result.isFirstBook && result.bookTitle) {
                // 最初の本の場合、ビッグバン演出を表示
                setFirstBookTitle(result.bookTitle);
                setShowBigBang(true);
            } else {
                // 2冊目以降は直接遷移
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
            <main className="pt-24 px-6 max-w-2xl mx-auto pb-12">
                <div className="mb-8">
                    <Link href="/books" className="text-white/60 hover:text-white text-sm mb-4 inline-block">
                        ← 本の一覧に戻る
                    </Link>
                    <h2 className="text-3xl font-bold text-white">新しい本を追加</h2>
                    <p className="text-white/60 mt-2">
                        本を登録すると、あなたの読書宇宙に新しい星が生まれます ✨
                    </p>
                </div>

                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
                    {error && (
                        <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <form action={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="title" className="block text-sm text-white/80 mb-2">
                                タイトル <span className="text-red-400">*</span>
                            </label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                                placeholder="本のタイトル"
                            />
                        </div>

                        <div>
                            <label htmlFor="author" className="block text-sm text-white/80 mb-2">
                                著者
                            </label>
                            <input
                                id="author"
                                name="author"
                                type="text"
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                                placeholder="著者名"
                            />
                            <p className="mt-1 text-xs text-white/40">
                                同じ著者の本は自動的に繋がります
                            </p>
                        </div>

                        <div>
                            <label htmlFor="tags" className="block text-sm text-white/80 mb-2">
                                タグ（カンマ区切り）
                            </label>
                            <input
                                id="tags"
                                name="tags"
                                type="text"
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                                placeholder="ビジネス, 自己啓発, テクノロジー"
                            />
                            <p className="mt-1 text-xs text-white/40">
                                同じタグを持つ本は自動的に繋がります
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="readDate" className="block text-sm text-white/80 mb-2">
                                    読了日
                                </label>
                                <input
                                    id="readDate"
                                    name="readDate"
                                    type="date"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label htmlFor="rating" className="block text-sm text-white/80 mb-2">
                                    評価
                                </label>
                                <select
                                    id="rating"
                                    name="rating"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                                >
                                    <option value="">未評価</option>
                                    <option value="5">★★★★★ (5)</option>
                                    <option value="4">★★★★☆ (4)</option>
                                    <option value="3">★★★☆☆ (3)</option>
                                    <option value="2">★★☆☆☆ (2)</option>
                                    <option value="1">★☆☆☆☆ (1)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="memo" className="block text-sm text-white/80 mb-2">
                                メモ・感想
                            </label>
                            <textarea
                                id="memo"
                                name="memo"
                                rows={4}
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                                placeholder="この本から得た気づきや感想..."
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {isLoading ? "宇宙を創造中..." : "✨ 星を生み出す"}
                            </button>
                            <Link
                                href="/books"
                                className="px-6 py-3 border border-white/20 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
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
