import { Suspense } from "react";
import NewBookPageClient from "./NewBookPageClient";

function LoadingFallback() {
    return (
        <div className="galaxy-bg min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-white/60">読み込み中...</p>
            </div>
        </div>
    );
}

export default function NewBookPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <NewBookPageClient />
        </Suspense>
    );
}
