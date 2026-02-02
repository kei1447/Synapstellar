import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBooks, deleteBook } from "@/lib/actions/books";
import { DeleteBookButton } from "@/components/books/DeleteBookButton";

export default async function BooksPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { books } = await getBooks();

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
                        <Link href="/dashboard" className="text-white/70 hover:text-white transition-colors">
                            ダッシュボード
                        </Link>
                        <Link href="/books" className="text-white transition-colors">
                            本の管理
                        </Link>
                        <Link href="/galaxy" className="text-white/70 hover:text-white transition-colors">
                            星空を見る
                        </Link>
                    </nav>
                </div>
            </header>

            {/* メインコンテンツ */}
            <main className="pt-24 px-6 max-w-7xl mx-auto pb-12">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">本の管理</h2>
                        <p className="text-white/60">登録した本の一覧</p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/books/search"
                            className="px-6 py-3 border border-white/20 rounded-lg font-semibold text-white hover:bg-white/10 transition-all flex items-center gap-2"
                        >
                            🔍 検索
                        </Link>
                        <Link
                            href="/books/new"
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
                        >
                            + 本を追加
                        </Link>
                    </div>
                </div>

                {books.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">📚</div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            まだ本が登録されていません
                        </h3>
                        <p className="text-white/60 mb-6">
                            最初の本を追加して、あなたの読書宇宙を始めましょう
                        </p>
                        <Link
                            href="/books/new"
                            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
                        >
                            ✨ 最初の本を追加
                        </Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {books.map((book) => (
                            <BookCard key={book.id} book={book} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function BookCard({ book }: { book: any }) {
    const tags = book.book_tags?.map((bt: any) => bt.tags).filter(Boolean) || [];

    return (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-2">
                    {book.title}
                </h3>
                {book.rating && (
                    <div className="flex gap-0.5">
                        {Array.from({ length: book.rating }).map((_, i) => (
                            <span key={i} className="text-yellow-400 text-sm">★</span>
                        ))}
                    </div>
                )}
            </div>

            {book.author && (
                <p className="text-white/60 text-sm mb-3">{book.author}</p>
            )}

            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {tags.map((tag: any) => (
                        <span
                            key={tag.id}
                            className="px-2 py-1 text-xs rounded-full font-medium"
                            style={{ backgroundColor: tag.color + "30", color: tag.color }}
                        >
                            #{tag.name}
                        </span>
                    ))}
                </div>
            )}

            {book.memo && (
                <p className="text-white/50 text-sm mb-4 line-clamp-2">{book.memo}</p>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-white/10">
                {book.read_date && (
                    <span className="text-white/40 text-xs">
                        {new Date(book.read_date).toLocaleDateString("ja-JP")}
                    </span>
                )}
                <div className="flex gap-2 ml-auto">
                    <Link
                        href={`/books/${book.id}/edit`}
                        className="px-3 py-1 text-sm text-white/60 hover:text-white border border-white/20 rounded hover:bg-white/10 transition-all"
                    >
                        編集
                    </Link>
                    <DeleteBookButton bookId={book.id} />
                </div>
            </div>
        </div>
    );
}
