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

    try {
        const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&key=${apiKey}`
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data: GoogleBooksSearchResult = await response.json();
        return data.items || [];
    } catch (error) {
        console.error("Error searching Google Books:", error);
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
