// Google Books API Types

export interface GoogleBookVolume {
    id: string;
    volumeInfo: {
        title: string;
        subtitle?: string;
        authors?: string[];
        publisher?: string;
        publishedDate?: string;
        description?: string;
        industryIdentifiers?: Array<{
            type: string;
            identifier: string;
        }>;
        pageCount?: number;
        categories?: string[];
        mainCategory?: string;
        averageRating?: number;
        ratingsCount?: number;
        imageLinks?: {
            smallThumbnail?: string;
            thumbnail?: string;
            small?: string;
            medium?: string;
            large?: string;
            extraLarge?: string;
        };
        language?: string;
        previewLink?: string;
        infoLink?: string;
    };
}

export interface GoogleBooksSearchResult {
    kind: string;
    totalItems: number;
    items?: GoogleBookVolume[];
}

// 検索関数
export async function searchGoogleBooks(query: string): Promise<GoogleBookVolume[]> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;

    if (!apiKey) {
        console.error("Google Books API key not found");
        return [];
    }

    // キャッシュキーの生成
    const cacheKey = `google_books_cache_${query}`;
    const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24時間

    // クライアントサイドの場合、キャッシュを確認
    if (typeof window !== "undefined") {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const { timestamp, data } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_EXPIRY) {
                    // console.log("Serving from cache:", query);
                    return data;
                } else {
                    localStorage.removeItem(cacheKey);
                }
            } catch (e) {
                localStorage.removeItem(cacheKey);
            }
        }
    }

    try {
        const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&key=${apiKey}`
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data: GoogleBooksSearchResult = await response.json();
        const items = data.items || [];

        // キャッシュに保存
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem(cacheKey, JSON.stringify({
                    timestamp: Date.now(),
                    data: items
                }));
            } catch (e) {
                console.warn("Failed to cache Google Books result:", e);
                // 容量オーバーなどで保存できない場合は無視
            }
        }

        return items;
    } catch (error) {
        console.error("Error searching Google Books:", error);
        // エラー時は可能なら古いキャッシュを返すなどのフォールバックも考えられるが、今回は空配列
        return [];
    }
}

// ISBNで検索
export async function searchByISBN(isbn: string): Promise<GoogleBookVolume | null> {
    const results = await searchGoogleBooks(`isbn:${isbn}`);
    return results[0] || null;
}

// カテゴリをタグ形式に変換
export function categoriesToTags(categories?: string[]): string[] {
    if (!categories) return [];

    // カテゴリは "Fiction / Science Fiction" のような形式なので分割
    const tags: string[] = [];
    categories.forEach(category => {
        const parts = category.split("/").map(p => p.trim());
        tags.push(...parts);
    });

    // 重複を除去
    return [...new Set(tags)];
}

// 表紙画像URLを取得（HTTPSに変換）
export function getCoverImageUrl(imageLinks?: GoogleBookVolume["volumeInfo"]["imageLinks"]): string | null {
    if (!imageLinks) return null;

    const url = imageLinks.thumbnail || imageLinks.smallThumbnail || imageLinks.small;
    if (!url) return null;

    // HTTPをHTTPSに変換
    return url.replace("http://", "https://");
}

/**
 * ISBNから書影URLのみを取得（OpenBDのフォールバック用）
 */
export async function getCoverByISBN(isbn: string): Promise<string | null> {
    try {
        const book = await searchByISBN(isbn);
        if (book) {
            return getCoverImageUrl(book.volumeInfo.imageLinks);
        }
        return null;
    } catch (error) {
        console.error("Error fetching cover by ISBN:", error);
        return null;
    }
}
