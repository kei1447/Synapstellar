"use client";

import { deleteBook } from "@/lib/actions/books";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteBookButton({ bookId }: { bookId: string }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    async function handleDelete() {
        if (!confirm("この本を削除しますか？この操作は取り消せません。")) {
            return;
        }

        setIsDeleting(true);
        await deleteBook(bookId);
        router.refresh();
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3 py-1 text-sm text-red-400 hover:text-red-300 border border-red-400/30 rounded hover:bg-red-400/10 transition-all disabled:opacity-50"
        >
            {isDeleting ? "..." : "削除"}
        </button>
    );
}
