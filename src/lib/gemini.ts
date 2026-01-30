import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_STUDIO_API_KEY;

if (!apiKey) {
    console.warn("NEXT_PUBLIC_GOOGLE_AI_STUDIO_API_KEY is not set");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface TagAndCategorySuggestion {
    tags: string[];
    categories: string[];
}

/**
 * 本の情報からタグとカテゴリを提案する
 * @returns tags: ユーザー向けの自由なタグ（10個）, categories: 正規化されたカテゴリ（3個）
 */
export async function suggestTagsAndCategories(
    title: string,
    author?: string,
    description?: string
): Promise<TagAndCategorySuggestion> {
    if (!genAI) {
        console.error("Gemini API is not configured");
        return { tags: [], categories: [] };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `以下の本に適したタグとカテゴリを提案してください。

タイトル: ${title}
${author ? `著者: ${author}` : ""}
${description ? `内容: ${description.substring(0, 500)}` : ""}

## 出力形式（必ずこの形式で）:
TAGS: タグ1, タグ2, タグ3, タグ4, タグ5, タグ6, タグ7, タグ8, タグ9, タグ10
CATEGORIES: カテゴリ1, カテゴリ2, カテゴリ3

## ルール:
- TAGS: ユーザーが本を思い出すための自由なキーワード（例: 積読, 感動, 夏休み, おすすめ, 泣ける）。10個提案。
- CATEGORIES: 本のジャンル分類。以下の候補から最大3つ選択:
  小説, ミステリー, SF, ファンタジー, ホラー, 恋愛, 歴史, 時代小説, エッセイ, 詩集, 
  ビジネス, 自己啓発, 経済, 投資, マーケティング, リーダーシップ,
  科学, 数学, 物理, 化学, 生物, 医学, 心理学, 哲学, 宗教,
  コンピュータ, プログラミング, AI, データサイエンス,
  料理, 健康, スポーツ, 旅行, 趣味, アート, 音楽, 映画,
  児童書, 絵本, ライトノベル, コミック, 漫画,
  政治, 社会, 教育, 語学, 辞典, 学術, ノンフィクション`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // パース
        const tagsMatch = text.match(/TAGS:\s*(.+)/i);
        const categoriesMatch = text.match(/CATEGORIES:\s*(.+)/i);

        const tags = tagsMatch
            ? tagsMatch[1].split(/[,、]/).map(t => t.trim()).filter(t => t.length > 0 && t.length < 20)
            : [];

        const categories = categoriesMatch
            ? categoriesMatch[1].split(/[,、]/).map(c => c.trim()).filter(c => c.length > 0 && c.length < 15)
            : [];

        return {
            tags: tags.slice(0, 10),
            categories: categories.slice(0, 3),
        };
    } catch (error: any) {
        console.error("Gemini API error:", error);
        if (error?.message?.includes("429") || error?.message?.includes("quota")) {
            throw new Error("APIの使用制限に達しました。少し時間をおいてから再度お試しください。");
        }
        return { tags: [], categories: [] };
    }
}

// 後方互換性のため
export async function suggestTags(
    title: string,
    author?: string,
    description?: string
): Promise<string[]> {
    const result = await suggestTagsAndCategories(title, author, description);
    return result.tags;
}

