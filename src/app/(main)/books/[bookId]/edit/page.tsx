import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EditBookForm } from "@/components/books/EditBookForm";

export default async function EditBookPage({ params }: { params: Promise<{ bookId: string }> }) {
    const { bookId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: book } = await supabase
        .from("books")
        .select(`
      *,
      book_tags (
        tags (
          name
        )
      ),
      emotion_tags (
        emotion
      )
    `)
        .eq("id", bookId)
        .eq("user_id", user.id)
        .single();

    if (!book) {
        notFound();
    }

    // データを整形
    const tags = book.book_tags
        ?.map((bt: any) => bt.tags?.name)
        .filter(Boolean)
        .join(", ") || "";

    const emotions = book.emotion_tags
        ?.map((et: any) => et.emotion)
        .filter(Boolean) || [];

    const initialData = {
        title: book.title,
        author: book.author || "",
        tags,
        coverImageUrl: book.cover_image_url,
        googleBooksId: book.google_books_id,
        pageCount: book.page_count,
        publishedDate: book.published_date,
        description: book.description,
        readDate: book.read_date || "",
        rating: book.rating ? book.rating.toString() : "",
        memo: book.memo || "",
        imageColor: book.image_color || "#fbbf24",
        emotions,
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
                </div>
            </header>

            {/* メインコンテンツ */}
            <main className="pt-24 px-6 max-w-3xl mx-auto pb-12">
                <div className="mb-8">
                    <Link href="/books" className="text-white/60 hover:text-white text-sm mb-4 inline-block">
                        ← 本の一覧に戻る
                    </Link>
                    <h2 className="text-3xl font-bold text-white">本の情報を編集</h2>
                    <p className="text-white/60 mt-2">
                        星の輝きや軌道を調整します ✨
                    </p>
                </div>

                <EditBookForm bookId={book.id} initialData={initialData} />
            </main>
        </div>
    );
}
