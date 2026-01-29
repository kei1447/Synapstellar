import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_STUDIO_API_KEY;

if (!apiKey) {
    console.warn("NEXT_PUBLIC_GOOGLE_AI_STUDIO_API_KEY is not set");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface TagSuggestion {
    tags: string[];
}

/**
 * 本の情報からタグを提案する
 */
export async function suggestTags(
    title: string,
    author?: string,
    description?: string
): Promise<string[]> {
    if (!genAI) {
        console.error("Gemini API is not configured");
        return [];
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        const prompt = `以下の本に適したタグを5つ提案してください。タグは短く簡潔に、日本語で出力してください。

タイトル: ${title}
${author ? `著者: ${author}` : ""}
${description ? `内容: ${description.substring(0, 500)}` : ""}

出力形式: タグをカンマ区切りで出力してください。例: SF, 冒険, 友情, 成長, ファンタジー`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // カンマ区切りでパース
        const tags = text
            .split(/[,、]/)
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0 && tag.length < 20);

        return tags.slice(0, 5);
    } catch (error) {
        console.error("Gemini API error:", error);
        return [];
    }
}
