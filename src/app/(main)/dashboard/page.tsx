import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/ui/LogoutButton";

export default async function DashboardPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // プロファイル情報を取得
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    // 本とタグの情報を取得してつながりを計算
    const { getBooksWithTags } = await import("@/lib/actions/books");
    const { books } = await getBooksWithTags();
    const { calculateConnectionCount } = await import("@/lib/metrics");
    const connectionCount = calculateConnectionCount(books);

    // 本の数
    const bookCount = books.length;

    return (
        <div className="galaxy-bg min-h-screen">
            {/* ヘッダー */}
            <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/30 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/dashboard">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                            Synapstellar
                        </h1>
                    </Link>
                    <div className="flex items-center gap-6">
                        <nav className="flex gap-4">
                            <Link
                                href="/books"
                                className="text-white/70 hover:text-white transition-colors"
                            >
                                本の管理
                            </Link>
                            <Link
                                href="/galaxy"
                                className="text-white/70 hover:text-white transition-colors"
                            >
                                星空を見る
                            </Link>
                        </nav>
                        <div className="flex items-center gap-4">
                            <span className="text-white/60 text-sm">
                                {profile?.display_name || user.email}
                            </span>
                            <LogoutButton />
                        </div>
                    </div>
                </div>
            </header>

            {/* メインコンテンツ */}
            <main className="pt-24 px-6 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">
                        ようこそ、{profile?.display_name || "読書家"}さん
                    </h2>
                    <p className="text-white/60">あなたの読書宇宙を探索しましょう</p>
                </div>

                {/* ステータスカード */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <StatusCard
                        icon="📚"
                        title="登録した本"
                        value={bookCount || 0}
                        unit="冊"
                    />
                    <StatusCard
                        icon="🌟"
                        title="輝く星々"
                        value={bookCount || 0}
                        unit="個"
                    />
                    <StatusCard
                        icon="🔗"
                        title="つながり"
                        value={connectionCount}
                        unit="本"
                    />
                </div>

                {/* クイックアクション */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Link
                        href="/books/new"
                        className="group p-6 rounded-2xl bg-gradient-to-br from-purple-600/20 to-cyan-600/20 border border-white/10 hover:border-purple-500/50 transition-all"
                    >
                        <div className="text-4xl mb-4">✨</div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            本を登録する
                        </h3>
                        <p className="text-white/60">
                            新しい本を追加して、あなたの宇宙に星を増やしましょう
                        </p>
                    </Link>

                    <Link
                        href="/galaxy"
                        className="group p-6 rounded-2xl bg-gradient-to-br from-cyan-600/20 to-purple-600/20 border border-white/10 hover:border-cyan-500/50 transition-all"
                    >
                        <div className="text-4xl mb-4">🌌</div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            星空を見る
                        </h3>
                        <p className="text-white/60">
                            あなたの読書体験が星々となって輝く3D宇宙を探索
                        </p>
                    </Link>
                </div>
            </main>
        </div>
    );
}

function StatusCard({
    icon,
    title,
    value,
    unit,
}: {
    icon: string;
    title: string;
    value: number;
    unit: string;
}) {
    return (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-3xl mb-3">{icon}</div>
            <div className="text-white/60 text-sm mb-1">{title}</div>
            <div className="text-3xl font-bold text-white">
                {value}
                <span className="text-lg font-normal text-white/60 ml-1">{unit}</span>
            </div>
        </div>
    );
}
