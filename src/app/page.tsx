import Link from "next/link";

export default function Home() {
    return (
        <div className="galaxy-bg min-h-screen flex flex-col">
            {/* ヘッダー */}
            <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/30 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                        Synapstellar
                    </h1>
                    <nav className="flex gap-4">
                        <Link
                            href="/login"
                            className="px-4 py-2 text-sm text-white/80 hover:text-white transition-colors"
                        >
                            ログイン
                        </Link>
                        <Link
                            href="/signup"
                            className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full hover:opacity-90 transition-opacity"
                        >
                            はじめる
                        </Link>
                    </nav>
                </div>
            </header>

            {/* ヒーローセクション */}
            <main className="flex-1 flex flex-col items-center justify-center px-6 pt-20">
                <div className="text-center max-w-3xl mx-auto">
                    {/* 星のデコレーション */}
                    <div className="relative mb-8">
                        <div className="absolute -top-10 left-1/4 w-2 h-2 bg-yellow-300 rounded-full star-twinkle opacity-60" />
                        <div className="absolute -top-5 right-1/3 w-1.5 h-1.5 bg-cyan-300 rounded-full star-twinkle opacity-80" style={{ animationDelay: "1s" }} />
                        <div className="absolute top-0 right-1/4 w-1 h-1 bg-purple-300 rounded-full star-twinkle opacity-70" style={{ animationDelay: "2s" }} />
                    </div>

                    <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                            あなたの読書体験を
                        </span>
                        <br />
                        <span className="text-white">
                            宇宙の星々に。
                        </span>
                    </h2>

                    <p className="text-lg md:text-xl text-white/70 mb-10 leading-relaxed">
                        読んできた本たちが、美しい星座のように繋がる。
                        <br />
                        知識のシナプスが輝く、あなただけの宇宙を創造しよう。
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/signup"
                            className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full hover:shadow-lg hover:shadow-purple-500/30 transition-all transform hover:scale-105"
                        >
                            ✨ 宇宙を始める
                        </Link>
                        <Link
                            href="#features"
                            className="px-8 py-4 text-lg font-semibold border border-white/30 rounded-full hover:bg-white/10 transition-all"
                        >
                            詳しく見る
                        </Link>
                    </div>
                </div>

                {/* 特徴セクション */}
                <section id="features" className="mt-32 w-full max-w-5xl mx-auto">
                    <h3 className="text-3xl font-bold text-center mb-12 text-white/90">
                        Synapstellarでできること
                    </h3>
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon="📚"
                            title="本を登録"
                            description="読んだ本を簡単に記録。タグやメモを添えて、あなたの読書の軌跡を残しましょう。"
                        />
                        <FeatureCard
                            icon="🌌"
                            title="星空で可視化"
                            description="登録した本が星となって輝く。3D空間であなただけの銀河が広がります。"
                        />
                        <FeatureCard
                            icon="🔗"
                            title="つながりを発見"
                            description="同じテーマ、同じ著者。本と本のつながりが星座のように浮かび上がります。"
                        />
                    </div>
                </section>
            </main>

            {/* フッター */}
            <footer className="mt-32 py-8 border-t border-white/10 text-center text-white/50 text-sm">
                <p>© 2026 Synapstellar. All rights reserved.</p>
            </footer>
        </div>
    );
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: string;
    title: string;
    description: string;
}) {
    return (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
            <div className="text-4xl mb-4">{icon}</div>
            <h4 className="text-xl font-semibold mb-2 text-white">{title}</h4>
            <p className="text-white/60 leading-relaxed">{description}</p>
        </div>
    );
}
