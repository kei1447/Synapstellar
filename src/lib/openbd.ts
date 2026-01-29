/**
 * OpenBD API クライアント
 * 日本の書籍情報を無料で取得できるAPI
 * OpenBD API クライアント
 * 日本の書籍情報を無料で取得できるAPI
 * https://openbd.jp/
 */

export interface OpenBDBook {
    isbn: string;
    title: string;
    author: string;
    publisher: string;
    pubdate: string;
    coverUrl: string | null;
    description: string | null;
    pageCount: number | null;
    categories: string[];
}

interface OpenBDResponse {
    onix?: {
        DescriptiveDetail?: {
            TitleDetail?: {
                TitleElement?: {
                    TitleText?: { content?: string };
                };
            };
            Contributor?: Array<{
                PersonName?: { content?: string };
            }>;
            Extent?: Array<{
                ExtentValue?: string;
            }>;
            Subject?: Array<{
                SubjectHeadingText?: string;
            }>;
        };
        PublishingDetail?: {
            Imprint?: {
                ImprintName?: string;
            };
            PublishingDate?: Array<{
                Date?: string;
            }>;
        };
        CollateralDetail?: {
            TextContent?: Array<{
                Text?: string;
                TextType?: string;
            }>;
        };
    };
    summary?: {
        isbn?: string;
        title?: string;
        author?: string;
        publisher?: string;
        pubdate?: string;
        cover?: string;
    };
}

/**
 * ISBNで書籍情報を取得
 */
export async function searchByISBN(isbn: string): Promise<OpenBDBook | null> {
    // ISBNのハイフンを除去
    const cleanIsbn = isbn.replace(/-/g, "");

    try {
        const response = await fetch(
            `https://api.openbd.jp/v1/get?isbn=${cleanIsbn}`,
            { next: { revalidate: 86400 } } // 24時間キャッシュ
        );

        if (!response.ok) {
            return null;
        }

        const data: (OpenBDResponse | null)[] = await response.json();

        if (!data || !data[0]) {
            return null;
        }

        const book = data[0];
        const summary = book.summary;
        const onix = book.onix;

        // 内容紹介を取得
        let description: string | null = null;
        const textContents = onix?.CollateralDetail?.TextContent;
        if (textContents) {
            const introText = textContents.find(tc => tc.TextType === "03" || tc.TextType === "02");
            description = introText?.Text || textContents[0]?.Text || null;
        }

        // ページ数を取得
        let pageCount: number | null = null;
        const extents = onix?.DescriptiveDetail?.Extent;
        if (extents && extents[0]?.ExtentValue) {
            pageCount = parseInt(extents[0].ExtentValue, 10) || null;
        }

        // カテゴリを取得
        const categories: string[] = [];
        const subjects = onix?.DescriptiveDetail?.Subject;
        if (subjects) {
            subjects.forEach(s => {
                if (s.SubjectHeadingText) {
                    categories.push(s.SubjectHeadingText);
                }
            });
        }

        return {
            isbn: summary?.isbn || cleanIsbn,
            title: summary?.title || "",
            author: summary?.author || "",
            publisher: summary?.publisher || "",
            pubdate: summary?.pubdate || "",
            coverUrl: summary?.cover || null,
            description,
            pageCount,
            categories,
        };
    } catch (error) {
        console.error("OpenBD API error:", error);
        return null;
    }
}

/**
 * ISBNかどうかを判定
 */
export function isISBN(text: string): boolean {
    const cleaned = text.replace(/-/g, "");
    // ISBN-10 または ISBN-13
    return /^(97[89])?\d{9}[\dXx]$/.test(cleaned);
}

/**
 * ISBN-10のチェックディジットを計算
 */
function calculateISBN10CheckDigit(isbn9: string): string {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(isbn9[i], 10) * (10 - i);
    }
    const remainder = (11 - (sum % 11)) % 11;
    return remainder === 10 ? "X" : remainder.toString();
}

/**
 * ISBN-13のチェックディジットを計算
 */
function calculateISBN13CheckDigit(isbn12: string): string {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(isbn12[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    return ((10 - (sum % 10)) % 10).toString();
}

/**
 * ISBN-13 → ISBN-10 に変換
 * 978で始まるISBN-13のみ変換可能（979は不可）
 */
export function isbn13ToIsbn10(isbn13: string): string | null {
    const cleaned = isbn13.replace(/-/g, "");

    if (cleaned.length !== 13 || !cleaned.startsWith("978")) {
        return null; // 979で始まるISBN-13はISBN-10に変換不可
    }

    const isbn9 = cleaned.slice(3, 12);
    const checkDigit = calculateISBN10CheckDigit(isbn9);
    return isbn9 + checkDigit;
}

/**
 * ISBN-10 → ISBN-13 に変換
 */
export function isbn10ToIsbn13(isbn10: string): string {
    const cleaned = isbn10.replace(/-/g, "");
    const isbn12 = "978" + cleaned.slice(0, 9);
    const checkDigit = calculateISBN13CheckDigit(isbn12);
    return isbn12 + checkDigit;
}

/**
 * ASIN → ISBN-13 に変換
 * 本のASINはISBN-10と同じなので、ISBN-13に変換
 */
export function asinToIsbn13(asin: string): string | null {
    // ASINが10桁の英数字でない場合は変換不可
    if (!/^[\dX]{10}$/i.test(asin)) {
        return null;
    }
    return isbn10ToIsbn13(asin);
}

/**
 * ISBN-13 → ASIN に変換
 * ASINはISBN-10と同じなので、ISBN-10を返す
 */
export function isbn13ToAsin(isbn13: string): string | null {
    return isbn13ToIsbn10(isbn13);
}

/**
 * 入力をISBN-13に正規化（ISBN-10, ISBN-13, ASIN対応）
 */
export function normalizeToIsbn13(input: string): string | null {
    const cleaned = input.replace(/-/g, "");

    if (cleaned.length === 13 && /^97[89]\d{10}$/.test(cleaned)) {
        return cleaned; // すでにISBN-13
    }

    if (cleaned.length === 10 && /^\d{9}[\dXx]$/.test(cleaned)) {
        return isbn10ToIsbn13(cleaned); // ISBN-10 または ASIN
    }

    return null;
}
