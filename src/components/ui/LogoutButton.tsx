"use client";

import { logout } from "@/lib/actions/auth";

export function LogoutButton() {
    return (
        <button
            onClick={() => logout()}
            className="px-4 py-2 text-sm text-white/60 hover:text-white border border-white/20 rounded-lg hover:bg-white/10 transition-all"
        >
            ログアウト
        </button>
    );
}
