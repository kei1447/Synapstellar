// テストデータ挿入スクリプト
// 実行: npx tsx scripts/seed-books.ts

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// .env.localを手動で読み込む
const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
envContent.split("\n").forEach(line => {
    const [key, ...values] = line.split("=");
    if (key && values.length) {
        envVars[key.trim()] = values.join("=").trim();
    }
});

const supabase = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL!,
    envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 様々なジャンルの実在する本（50冊）
const books = [
    // 日本文学
    { title: "吾輩は猫である", author: "夏目漱石", tags: ["小説", "日本文学", "古典"], color: "#8B4513" },
    { title: "こころ", author: "夏目漱石", tags: ["小説", "日本文学", "古典"], color: "#654321" },
    { title: "人間失格", author: "太宰治", tags: ["小説", "日本文学"], color: "#2F4F4F" },
    { title: "羅生門", author: "芥川龍之介", tags: ["短編", "日本文学"], color: "#4A4A4A" },
    { title: "雪国", author: "川端康成", tags: ["小説", "日本文学", "純文学"], color: "#E0E0E0" },
    { title: "ノルウェイの森", author: "村上春樹", tags: ["小説", "恋愛"], color: "#228B22" },
    { title: "海辺のカフカ", author: "村上春樹", tags: ["小説", "ファンタジー"], color: "#4169E1" },
    { title: "1Q84", author: "村上春樹", tags: ["小説", "SF"], color: "#9370DB" },
    { title: "コンビニ人間", author: "村田沙耶香", tags: ["小説", "芥川賞"], color: "#FFD700" },
    { title: "火花", author: "又吉直樹", tags: ["小説", "芥川賞", "お笑い"], color: "#FF4500" },

    // ミステリー
    { title: "容疑者Xの献身", author: "東野圭吾", tags: ["ミステリー", "小説"], color: "#DC143C" },
    { title: "白夜行", author: "東野圭吾", tags: ["ミステリー", "サスペンス"], color: "#191970" },
    { title: "マスカレード・ホテル", author: "東野圭吾", tags: ["ミステリー", "小説"], color: "#4682B4" },
    { title: "64", author: "横山秀夫", tags: ["ミステリー", "警察小説"], color: "#2E8B57" },
    { title: "ソロモンの偽証", author: "宮部みゆき", tags: ["ミステリー", "社会派"], color: "#8B0000" },

    // SF・ファンタジー
    { title: "銀河鉄道の夜", author: "宮沢賢治", tags: ["SF", "童話", "日本文学"], color: "#000080" },
    { title: "新世界より", author: "貴志祐介", tags: ["SF", "ディストピア"], color: "#00CED1" },
    { title: "ペンギン・ハイウェイ", author: "森見登美彦", tags: ["SF", "青春"], color: "#00BFFF" },
    { title: "四畳半神話大系", author: "森見登美彦", tags: ["小説", "青春", "京都"], color: "#DAA520" },
    { title: "すべてがFになる", author: "森博嗣", tags: ["ミステリー", "SF"], color: "#708090" },

    // ビジネス・自己啓発
    { title: "嫌われる勇気", author: "岸見一郎", tags: ["自己啓発", "心理学"], color: "#FF6347" },
    { title: "7つの習慣", author: "スティーブン・R・コヴィー", tags: ["ビジネス", "自己啓発"], color: "#32CD32" },
    { title: "金持ち父さん貧乏父さん", author: "ロバート・キヨサキ", tags: ["ビジネス", "投資"], color: "#FFD700" },
    { title: "思考は現実化する", author: "ナポレオン・ヒル", tags: ["自己啓発", "成功哲学"], color: "#FF8C00" },
    { title: "超訳ニーチェの言葉", author: "白取春彦", tags: ["哲学", "名言"], color: "#800080" },

    // 海外文学
    { title: "アルジャーノンに花束を", author: "ダニエル・キイス", tags: ["SF", "海外文学"], color: "#DB7093" },
    { title: "1984年", author: "ジョージ・オーウェル", tags: ["SF", "ディストピア"], color: "#696969" },
    { title: "グレート・ギャツビー", author: "F・スコット・フィッツジェラルド", tags: ["小説", "アメリカ文学"], color: "#FAFAD2" },
    { title: "異邦人", author: "アルベール・カミュ", tags: ["小説", "フランス文学", "哲学"], color: "#F5DEB3" },
    { title: "老人と海", author: "アーネスト・ヘミングウェイ", tags: ["小説", "アメリカ文学"], color: "#4682B4" },
    { title: "罪と罰", author: "ドストエフスキー", tags: ["小説", "ロシア文学"], color: "#8B0000" },
    { title: "カラマーゾフの兄弟", author: "ドストエフスキー", tags: ["小説", "ロシア文学"], color: "#A52A2A" },
    { title: "変身", author: "フランツ・カフカ", tags: ["小説", "不条理文学"], color: "#556B2F" },

    // プログラミング・技術書
    { title: "リーダブルコード", author: "Dustin Boswell", tags: ["プログラミング", "技術書"], color: "#7CFC00" },
    { title: "Clean Code", author: "Robert C. Martin", tags: ["プログラミング", "技術書"], color: "#00FF7F" },
    { title: "達人プログラマー", author: "David Thomas", tags: ["プログラミング", "技術書"], color: "#20B2AA" },
    { title: "Webを支える技術", author: "山本陽平", tags: ["技術書", "Web"], color: "#6495ED" },
    { title: "プログラムはなぜ動くのか", author: "矢沢久雄", tags: ["技術書", "入門"], color: "#87CEEB" },

    // 科学・サイエンス
    { title: "サピエンス全史", author: "ユヴァル・ノア・ハラリ", tags: ["歴史", "科学"], color: "#DEB887" },
    { title: "ホモ・デウス", author: "ユヴァル・ノア・ハラリ", tags: ["未来学", "科学"], color: "#00CED1" },
    { title: "銃・病原菌・鉄", author: "ジャレド・ダイアモンド", tags: ["歴史", "科学"], color: "#CD853F" },
    { title: "利己的な遺伝子", author: "リチャード・ドーキンス", tags: ["生物学", "科学"], color: "#00FA9A" },
    { title: "ファクトフルネス", author: "ハンス・ロスリング", tags: ["科学", "データ"], color: "#40E0D0" },

    // エッセイ・ノンフィクション
    { title: "火の鳥", author: "手塚治虫", tags: ["漫画", "SF"], color: "#FF4500" },
    { title: "鬼滅の刃", author: "吾峠呼世晴", tags: ["漫画", "少年漫画"], color: "#2E8B57" },
    { title: "呪術廻戦", author: "芥見下々", tags: ["漫画", "少年漫画"], color: "#4B0082" },
    { title: "SPY×FAMILY", author: "遠藤達哉", tags: ["漫画", "コメディ"], color: "#FF69B4" },
    { title: "葬送のフリーレン", author: "山田鐘人", tags: ["漫画", "ファンタジー"], color: "#9ACD32" },
    { title: "チェンソーマン", author: "藤本タツキ", tags: ["漫画", "ダーク"], color: "#B22222" },
    { title: "ブルーロック", author: "金城宗幸", tags: ["漫画", "スポーツ"], color: "#1E90FF" },
];

// カラーからヘックスカラーのバリエーションを作成
function generateColorVariations(baseColor: string): string {
    // 単色の場合はそのまま返す
    return baseColor;
}

async function seedBooks() {
    // 現在のユーザーIDを取得（管理用にservice roleを使用）
    const { data: users, error: usersError } = await supabase
        .from("books")
        .select("user_id")
        .limit(1);

    if (usersError || !users || users.length === 0) {
        console.error("ユーザーIDを取得できません。先に1冊以上の本を登録してください。");
        process.exit(1);
    }

    const userId = users[0].user_id;
    console.log(`ユーザーID: ${userId}`);

    // 既存のタグを取得
    const { data: existingTags } = await supabase
        .from("tags")
        .select("id, name")
        .eq("user_id", userId);

    const tagMap = new Map<string, string>();
    existingTags?.forEach(t => tagMap.set(t.name, t.id));

    console.log(`既存タグ: ${tagMap.size}個`);

    let insertedCount = 0;

    for (const book of books) {
        // ランダムな位置と明るさ
        const posX = (Math.random() - 0.5) * 100;
        const posY = (Math.random() - 0.5) * 100;
        const posZ = (Math.random() - 0.5) * 100;
        const brightness = 0.5 + Math.random() * 0.5;
        const rating = Math.floor(Math.random() * 3) + 3; // 3-5

        // 本を挿入
        const { data: insertedBook, error: bookError } = await supabase
            .from("books")
            .insert({
                user_id: userId,
                title: book.title,
                author: book.author,
                image_color: book.color,
                pos_x: posX,
                pos_y: posY,
                pos_z: posZ,
                brightness: brightness,
                rating: rating,
                read_date: new Date(2020 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
            })
            .select()
            .single();

        if (bookError) {
            console.error(`本の挿入エラー: ${book.title}`, bookError.message);
            continue;
        }

        // タグを処理
        for (const tagName of book.tags) {
            let tagId = tagMap.get(tagName);

            if (!tagId) {
                // タグを作成
                const { data: newTag, error: tagError } = await supabase
                    .from("tags")
                    .insert({ user_id: userId, name: tagName })
                    .select()
                    .single();

                if (!tagError && newTag) {
                    tagId = newTag.id as string;
                    tagMap.set(tagName, newTag.id as string);
                }
            }

            if (tagId) {
                await supabase
                    .from("book_tags")
                    .insert({ book_id: insertedBook.id, tag_id: tagId });
            }
        }

        insertedCount++;
        if (insertedCount % 10 === 0) {
            console.log(`${insertedCount}冊登録完了...`);
        }
    }

    console.log(`\n✅ ${insertedCount}冊の本を登録しました！`);
}

seedBooks().catch(console.error);
