"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Auth() {
  const [signup, setSignup] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMode(mode) {
    if (animating) return;
    setAnimating(true);
    setSignup(mode);
    setTimeout(() => setAnimating(false), 850);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const { error } = signup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) alert(error.message);
    else if (signup) alert("Account created. Check email if confirmation is enabled.");

    setLoading(false);
  }

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#0b1410] font-sans">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-[scrollDown_18s_linear_infinite]">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={`select-none whitespace-nowrap py-1 text-[112px] font-black leading-none tracking-[-3px] text-[#1a3325] ${
                i % 2 === 0 ? "-translate-x-8" : "translate-x-10"
              }`}
            >
              Contextify
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes scrollDown {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
      `}</style>

      <div className="relative z-10 h-[460px] w-[88%] max-w-[820px] overflow-hidden rounded-[20px] shadow-[0_40px_100px_rgba(0,0,0,0.85)] ring-1 ring-white/5">
        <div
          className={`absolute bottom-0 top-0 z-20 flex w-[42%] flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#22c55e] via-[#16a34a] to-[#052e16] px-7 text-center transition-transform duration-700 ease-in-out ${
            signup ? "translate-x-[138.1%]" : "translate-x-0"
          }`}
        >
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-black/25 text-xl">
            {signup ? "✨" : "📄"}
          </div>

          <h1 className="mb-2 text-[22px] font-extrabold text-white">
            {signup ? "Join Contextify" : "Contextify"}
          </h1>

          <p className="mb-7 text-xs leading-6 text-white/80">
            {signup
              ? "Start reading smarter. Upload your first document and let AI do the heavy lifting for you."
              : "Your AI-powered document companion. Upload any document and get precise, context-aware answers instantly."}
          </p>

          <div className="flex w-full flex-col gap-3">
            {(signup
              ? [
                  ["🚀", "Get started in seconds, no setup needed"],
                  ["🔒", "Your documents stay private and secure"],
                  ["⚡", "Instant answers powered by advanced AI"],
                ]
              : [
                  ["🔍", "RAG-based intelligent search across your documents"],
                  ["💬", "Ask questions in plain language, get accurate answers"],
                  ["📚", "Supports PDFs, Word docs, and more"],
                ]
            ).map(([icon, text]) => (
              <div
                key={text}
                className="flex items-center gap-3 rounded-xl bg-black/20 px-4 py-3 text-left"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/15 text-sm">
                  {icon}
                </span>
                <p className="text-[11.5px] font-medium text-white/90">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`absolute bottom-0 right-0 top-0 z-10 flex w-[58%] flex-col justify-center bg-[#111111] px-11 transition-transform duration-700 ease-in-out ${
            signup ? "-translate-x-[72.4%]" : "translate-x-0"
          }`}
        >
          <form onSubmit={handleSubmit}>
            <h2 className="mb-1 text-[21px] font-bold text-white">
              {signup ? "Create your account" : "Sign in to Contextify"}
            </h2>

            <p className="mb-6 text-xs text-white/40">
              {signup
                ? "Start chatting with your documents today."
                : "Welcome back — your documents are waiting."}
            </p>

            <div className="mb-4">
              <label className="mb-1 block text-[11.5px] font-medium text-white/50">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-white/10 bg-[#1c1c1c] px-3 py-2.5 text-sm text-white outline-none focus:border-[#22c55e]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-[11.5px] font-medium text-white/50">
                Password
              </label>
              <input
                type="password"
                placeholder={signup ? "Create a strong password" : "••••••••"}
                className="w-full rounded-lg border border-white/10 bg-[#1c1c1c] px-3 py-2.5 text-sm text-white outline-none focus:border-[#22c55e]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {!signup && (
              <div className="mb-5 flex items-center justify-between text-[11.5px] text-white/40">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-[#22c55e]" />
                  Remember me
                </label>
                <span className="cursor-pointer hover:text-[#22c55e]">
                  Forgot password?
                </span>
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-lg bg-[#16a34a] py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#22c55e] disabled:bg-gray-600"
            >
              {loading ? "Please wait..." : signup ? "Sign up" : "Sign in"}
            </button>

            <div className="mt-4 text-center text-[11.5px] text-white/35">
              {signup ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => switchMode(!signup)}
                className="font-semibold text-[#22c55e] hover:opacity-75"
              >
                {signup ? "Sign in" : "Create account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}