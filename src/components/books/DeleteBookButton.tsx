"use client";

import { useTransition } from "react";
import { deleteBook } from "@/lib/actions/books";

export function DeleteBookButton({ bookId }: { bookId: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (typeof window !== "undefined" && window.confirm("この本を削除してもよろしいですか？\nこの操作は元に戻せません。")) {
            startTransition(async () => {
                const result = await deleteBook(bookId);
                if (result?.error) {
                    alert(`削除に失敗しました: ${result.error}`);
                }
            });
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="px-3 py-1 text-sm text-red-400 hover:text-red-300 border border-red-500/20 rounded hover:bg-red-500/10 transition-all disabled:opacity-50"
        >
            {isPending ? "削除中..." : "削除"}
        </button>
    );
}
