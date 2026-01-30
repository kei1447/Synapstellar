import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBooksWithTags } from "@/lib/actions/books";
import { GalaxyView } from "@/components/galaxy/GalaxyView";

export default async function GalaxyPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { books } = await getBooksWithTags();

    // 型を変換
    const bookStars = books.map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        pos_x: book.pos_x ?? 50,
        pos_y: book.pos_y ?? 50,
        pos_z: book.pos_z ?? 50,
        brightness: book.brightness ?? 1,
        rating: book.rating,
        image_color: book.image_color,
        emotion_tags: book.emotion_tags || [],
        read_date: book.read_date,
        tags: book.tags || [],
    }));

    return (
        <div className="relative min-h-screen bg-black">
            {/* ヘッダー */}
            <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/30 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/dashboard">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                            Synapstellar
                        </h1>
                    </Link>
                    <nav className="flex gap-4">
                        <Link href="/dashboard" className="text-white/70 hover:text-white transition-colors">
                            ダッシュボード
                        </Link>
                        <Link href="/books" className="text-white/70 hover:text-white transition-colors">
                            本の管理
                        </Link>
                        <Link href="/galaxy" className="text-white transition-colors">
                            星空を見る
                        </Link>
                    </nav>
                </div>
            </header>

            {/* 3D Galaxy View */}
            {books.length === 0 ? (
                <div className="galaxy-bg min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🌌</div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            まだ星がありません
                        </h2>
                        <p className="text-white/60 mb-6">
                            本を登録して、あなたの読書宇宙を創造しましょう
                        </p>
                        <Link
                            href="/books/new"
                            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
                        >
                            ✨ 最初の星を追加
                        </Link>
                    </div>
                </div>
            ) : (
                <GalaxyView books={bookStars} />
            )}
        </div>
    );
}
