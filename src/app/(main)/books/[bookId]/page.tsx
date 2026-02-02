import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BookDetailClient } from "./BookDetailClient";

export default async function BookDetailPage({
    params
}: {
    params: Promise<{ bookId: string }>;
}) {
    const { bookId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // 本の情報を取得
    const { data: book } = await supabase
        .from("books")
        .select(`
            *,
            book_tags (
                tags (
                    id,
                    name,
                    color
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

    // 登場人物を取得
    const { data: bookCharacters } = await supabase
        .from("book_characters")
        .select(`
            role,
            characters (
                *,
                character_attribute_tags (
                    character_attributes (*)
                )
            )
        `)
        .eq("book_id", bookId);

    // 人物間の関係を取得
    const characterIds = bookCharacters?.map(
        (bc: any) => bc.characters?.id
    ).filter(Boolean) || [];

    let relationships: any[] = [];
    if (characterIds.length > 0) {
        const { data: rels } = await supabase
            .from("character_relationships")
            .select(`
                *,
                fromCharacter:characters!character_relationships_from_character_id_fkey (*),
                toCharacter:characters!character_relationships_to_character_id_fkey (*)
            `)
            .in("from_character_id", characterIds)
            .in("to_character_id", characterIds);
        relationships = rels || [];
    }

    // ユーザーの全人物データを取得（既存人物の追加用）
    const { data: allCharacters } = await supabase
        .from("characters")
        .select(`
            *,
            character_attribute_tags (
                character_attributes (*)
            )
        `)
        .eq("user_id", user.id)
        .order("name");

    // 属性一覧を取得
    const { data: attributes } = await supabase
        .from("character_attributes")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

    // データを整形
    const tags = book.book_tags
        ?.map((bt: any) => bt.tags)
        .filter(Boolean) || [];

    const emotions = book.emotion_tags
        ?.map((et: any) => et.emotion)
        .filter(Boolean) || [];

    const characters = bookCharacters?.map((bc: any) => ({
        ...bc.characters,
        role: bc.role,
        attributes: bc.characters?.character_attribute_tags?.map(
            (cat: any) => cat.character_attributes
        ) || []
    })) || [];

    const allCharsWithAttributes = allCharacters?.map((char: any) => ({
        ...char,
        attributes: char.character_attribute_tags?.map(
            (cat: any) => cat.character_attributes
        ) || []
    })) || [];

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
            <main className="pt-24 px-6 max-w-4xl mx-auto pb-12">
                <div className="mb-6">
                    <Link
                        href="/books"
                        className="text-white/60 hover:text-white text-sm inline-block"
                    >
                        ← 本の一覧に戻る
                    </Link>
                </div>

                <BookDetailClient
                    book={book}
                    tags={tags}
                    emotions={emotions}
                    characters={characters}
                    allCharacters={allCharsWithAttributes}
                    attributes={attributes || []}
                    relationships={relationships}
                    userId={user.id}
                />
            </main>
        </div>
    );
}
