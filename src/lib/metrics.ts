import type { BookStar } from "@/components/galaxy/GalaxyCanvas";

/**
 * 本のつながり数を計算する
 * @param books 本のリスト
 * @returns つながりの総数（重複なし）
 */
export function calculateConnectionCount(books: any[]): number {
    const connectionSet = new Set<string>();

    // 著者マップ作成
    const authorGroups = new Map<string, any[]>();
    books.forEach((book) => {
        if (book.author) {
            const key = book.author.toLowerCase().trim();
            if (!authorGroups.has(key)) {
                authorGroups.set(key, []);
            }
            authorGroups.get(key)!.push(book);
        }
    });

    // 著者接続をカウント
    authorGroups.forEach((group) => {
        if (group.length < 2) return;
        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                const key = [group[i].id, group[j].id].sort().join("-");
                connectionSet.add(key);
            }
        }
    });

    // タグ接続をカウント
    books.forEach((bookA, i) => {
        books.slice(i + 1).forEach((bookB) => {
            const key = [bookA.id, bookB.id].sort().join("-");
            if (connectionSet.has(key)) return; // 既に著者でつながっていればスキップ

            const hasSharedTag = bookA.tags?.some((tagA: any) =>
                bookB.tags?.some((tagB: any) => tagB.id === tagA.id || tagB.name === tagA.name)
            );

            if (hasSharedTag) {
                connectionSet.add(key);
            }
        });
    });

    return connectionSet.size;
}
