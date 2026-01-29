"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Insertable, Updatable } from "@/types/database";

export async function createBook(formData: FormData) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "認証が必要です", success: false };
    }

    // 既存の本の数を確認（最初の本かどうか）
    const { count: existingCount } = await supabase
        .from("books")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

    const isFirstBook = existingCount === 0;

    const bookData: Insertable<"books"> = {
        user_id: user.id,
        title: formData.get("title") as string,
        author: (formData.get("author") as string) || null,
        read_date: (formData.get("readDate") as string) || null,
        memo: (formData.get("memo") as string) || null,
        rating: formData.get("rating") ? parseInt(formData.get("rating") as string) : null,
    };

    const { data: book, error } = await supabase
        .from("books")
        .insert(bookData)
        .select()
        .single();

    if (error) {
        return { error: error.message, success: false };
    }

    // タグを処理
    const tagsInput = formData.get("tags") as string;
    if (tagsInput) {
        const tagNames = tagsInput.split(",").map(t => t.trim()).filter(t => t);

        for (const tagName of tagNames) {
            // 既存タグを確認または新規作成
            let { data: existingTag } = await supabase
                .from("tags")
                .select("id")
                .eq("user_id", user.id)
                .eq("name", tagName)
                .single();

            if (!existingTag) {
                const { data: newTag } = await supabase
                    .from("tags")
                    .insert({ user_id: user.id, name: tagName })
                    .select("id")
                    .single();
                existingTag = newTag;
            }

            if (existingTag) {
                await supabase
                    .from("book_tags")
                    .insert({ book_id: book.id, tag_id: existingTag.id });
            }
        }
    }

    revalidatePath("/books");
    revalidatePath("/galaxy");

    return {
        success: true,
        isFirstBook,
        bookTitle: book.title,
        error: null
    };
}


export async function updateBook(bookId: string, formData: FormData) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "認証が必要です" };
    }

    const bookData: Updatable<"books"> = {
        title: formData.get("title") as string,
        author: (formData.get("author") as string) || null,
        read_date: (formData.get("readDate") as string) || null,
        memo: (formData.get("memo") as string) || null,
        rating: formData.get("rating") ? parseInt(formData.get("rating") as string) : null,
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
        .from("books")
        .update(bookData)
        .eq("id", bookId)
        .eq("user_id", user.id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/books");
    revalidatePath("/galaxy");
    redirect("/books");
}

export async function deleteBook(bookId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "認証が必要です" };
    }

    const { error } = await supabase
        .from("books")
        .delete()
        .eq("id", bookId)
        .eq("user_id", user.id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/books");
    revalidatePath("/galaxy");
}

export async function getBooks() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { books: [], error: "認証が必要です" };
    }

    const { data: books, error } = await supabase
        .from("books")
        .select(`
      *,
      book_tags (
        tag_id,
        tags (
          id,
          name,
          color
        )
      )
    `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        return { books: [], error: error.message };
    }

    return { books: books || [], error: null };
}

export async function getBooksWithTags() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { books: [], error: "認証が必要です" };
    }

    const { data: books, error } = await supabase
        .from("books")
        .select(`
      *,
      book_tags (
        tags (
          id,
          name,
          color
        )
      )
    `)
        .eq("user_id", user.id);

    if (error) {
        return { books: [], error: error.message };
    }

    // タグ情報をフラット化
    const booksWithTags = books?.map(book => ({
        ...book,
        tags: book.book_tags?.map((bt: { tags: { id: string; name: string; color: string } }) => bt.tags) || [],
    })) || [];

    return { books: booksWithTags, error: null };
}
