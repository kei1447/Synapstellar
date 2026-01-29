import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "Synapstellar - 読書の宇宙を描く",
    description: "あなたの読書体験を美しい星空として可視化。本と本の繋がりをニューラルネットワークのように表現します。",
    keywords: ["読書", "可視化", "本", "星空", "ビジュアライゼーション"],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja">
            <body className={`${inter.variable} antialiased`}>
                {children}
            </body>
        </html>
    );
}
