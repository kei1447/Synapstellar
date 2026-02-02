// 本の空間配置を計算するユーティリティ

interface BookForPositioning {
    id: string;
    author: string | null;
    tags: Array<{ id: string; name: string }>;
    pos_x?: number;
    pos_y?: number;
    pos_z?: number;
}

interface PositionedBook {
    id: string;
    pos_x: number;
    pos_y: number;
    pos_z: number;
}

// 文字列からハッシュ値を生成（一貫した位置のため）
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

// ハッシュから角度を計算
function hashToAngle(hash: number): number {
    return (hash % 360) * (Math.PI / 180);
}

// カテゴリ（タグ）に基づく銀河/星雲の中心位置を計算
function getCategoryCenter(category: string): { x: number; y: number; z: number } {
    const hash = hashString(category.toLowerCase());
    const radius = 60; // 銀河の配置半径
    const angle = hashToAngle(hash);
    const heightOffset = ((hash % 100) - 50) * 0.3;

    return {
        x: Math.cos(angle) * radius,
        y: heightOffset,
        z: Math.sin(angle) * radius,
    };
}

// 著者に基づく恒星系の中心位置を計算
function getAuthorSystemCenter(author: string): { x: number; y: number; z: number } {
    const hash = hashString(author.toLowerCase());
    const radius = 40; // 著者システムの配置半径
    const angle = hashToAngle(hash);
    const subAngle = hashToAngle(hash * 7);

    return {
        x: Math.cos(angle) * radius + Math.cos(subAngle) * 15,
        y: ((hash % 60) - 30) * 0.4,
        z: Math.sin(angle) * radius + Math.sin(subAngle) * 15,
    };
}

// 本の位置を計算
export function calculateBookPositions(books: BookForPositioning[]): Map<string, PositionedBook> {
    const positions = new Map<string, PositionedBook>();

    // 著者ごと、カテゴリごとにグループ化
    const authorGroups = new Map<string, BookForPositioning[]>();
    const categoryGroups = new Map<string, BookForPositioning[]>();

    books.forEach((book) => {
        // 著者でグループ化
        if (book.author) {
            const authorKey = book.author.toLowerCase().trim();
            if (!authorGroups.has(authorKey)) {
                authorGroups.set(authorKey, []);
            }
            authorGroups.get(authorKey)!.push(book);
        }

        // カテゴリ（最初のタグ）でグループ化
        if (book.tags.length > 0) {
            const categoryKey = book.tags[0].name.toLowerCase();
            if (!categoryGroups.has(categoryKey)) {
                categoryGroups.set(categoryKey, []);
            }
            categoryGroups.get(categoryKey)!.push(book);
        }
    });

    // 本の位置を計算
    books.forEach((book, index) => {
        let baseX = 0, baseY = 0, baseZ = 0;
        let hasSpecificPosition = false;

        // 優先度1: 著者による位置（同じ著者の本は近くに）
        if (book.author) {
            const authorKey = book.author.toLowerCase().trim();
            const authorBooks = authorGroups.get(authorKey) || [];

            if (authorBooks.length >= 2) {
                const center = getAuthorSystemCenter(book.author);
                const bookIndex = authorBooks.findIndex((b) => b.id === book.id);
                const orbitAngle = (bookIndex / authorBooks.length) * Math.PI * 2;
                const orbitRadius = 8 + (bookIndex * 3);

                baseX = center.x + Math.cos(orbitAngle) * orbitRadius;
                baseY = center.y + Math.sin(orbitAngle * 0.5) * 4;
                baseZ = center.z + Math.sin(orbitAngle) * orbitRadius;
                hasSpecificPosition = true;
            }
        }

        // 優先度2: カテゴリによる位置（同じカテゴリの本は同じ銀河に）
        if (!hasSpecificPosition && book.tags.length > 0) {
            const categoryKey = book.tags[0].name.toLowerCase();
            const categoryBooks = categoryGroups.get(categoryKey) || [];

            if (categoryBooks.length >= 2) {
                const center = getCategoryCenter(book.tags[0].name);
                const bookIndex = categoryBooks.findIndex((b) => b.id === book.id);
                const spiralAngle = (bookIndex / categoryBooks.length) * Math.PI * 4;
                const spiralRadius = 10 + (bookIndex * 2);

                baseX = center.x + Math.cos(spiralAngle) * spiralRadius;
                baseY = center.y + (bookIndex - categoryBooks.length / 2) * 3;
                baseZ = center.z + Math.sin(spiralAngle) * spiralRadius;
                hasSpecificPosition = true;
            }
        }

        // 優先度3: 既存の位置またはデフォルト位置
        if (!hasSpecificPosition) {
            if (book.pos_x !== undefined && book.pos_y !== undefined && book.pos_z !== undefined) {
                // 既存位置を変換
                baseX = (book.pos_x - 50) * 2;
                baseY = (book.pos_y - 50) * 2;
                baseZ = (book.pos_z - 50) * 2;
            } else {
                // ランダム配置（一貫性のためハッシュベース）
                const hash = hashString(book.id);
                const angle = hashToAngle(hash);
                const radius = 30 + (hash % 40);
                baseX = Math.cos(angle) * radius;
                baseY = ((hash % 60) - 30);
                baseZ = Math.sin(angle) * radius;
            }
        }

        positions.set(book.id, {
            id: book.id,
            pos_x: baseX,
            pos_y: baseY,
            pos_z: baseZ,
        });
    });

    // 衝突回避処理を実行
    resolveCollisions(positions);

    return positions;
}

/**
 * 星同士の衝突を回避する
 * Force-directed風の斥力シミュレーション
 */
function resolveCollisions(
    positions: Map<string, PositionedBook>,
    minDistance: number = 18,
    iterations: number = 50
): void {
    const books = Array.from(positions.values());

    if (books.length < 2) return;

    for (let iter = 0; iter < iterations; iter++) {
        let hasCollision = false;

        for (let i = 0; i < books.length; i++) {
            for (let j = i + 1; j < books.length; j++) {
                const a = books[i];
                const b = books[j];

                const dx = b.pos_x - a.pos_x;
                const dy = b.pos_y - a.pos_y;
                const dz = b.pos_z - a.pos_z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < minDistance && dist > 0.01) {
                    hasCollision = true;

                    // 押し出し量を計算
                    const overlap = (minDistance - dist) / 2;
                    const pushX = (dx / dist) * overlap;
                    const pushY = (dy / dist) * overlap;
                    const pushZ = (dz / dist) * overlap;

                    // 両方向に押し出す
                    a.pos_x -= pushX;
                    a.pos_y -= pushY;
                    a.pos_z -= pushZ;
                    b.pos_x += pushX;
                    b.pos_y += pushY;
                    b.pos_z += pushZ;
                } else if (dist < 0.01) {
                    // 完全に重なっている場合はランダムに離す
                    hasCollision = true;
                    const randomAngle = Math.random() * Math.PI * 2;
                    const randomPush = minDistance / 2;
                    b.pos_x += Math.cos(randomAngle) * randomPush;
                    b.pos_z += Math.sin(randomAngle) * randomPush;
                    b.pos_y += (Math.random() - 0.5) * randomPush;
                }
            }
        }

        // 衝突がなくなったら早期終了
        if (!hasCollision) break;
    }

    // 更新された位置をMapに反映
    books.forEach(book => {
        positions.set(book.id, book);
    });
}
