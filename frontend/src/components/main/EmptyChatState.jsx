import { Sparkles } from 'lucide-react';

export default function EmptyChatState() {
  return (
    <div className="flex-1 w-full max-w-3xl mx-auto flex flex-col items-center justify-center px-4 py-8 select-none">
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute w-40 h-40 rounded-full bg-gradient-to-tr from-neutral-500/20 via-neutral-300/10 to-transparent blur-2xl animate-pulse" />

        <div className="relative w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#333333] shadow-[0_0_30px_rgba(200,200,200,0.15)] flex items-center justify-center">
          <Sparkles
            size={28}
            className="text-neutral-200 animate-[spin_8s_linear_infinite] drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
          />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-200 to-neutral-500">
          How can VaultMind assist you today?
        </h2>

        <p className="text-xs md:text-sm text-neutral-400 max-w-md mx-auto">
          Upload a document and ask questions using your private RAG knowledge base.
        </p>
      </div>
    </div>
  );
}
