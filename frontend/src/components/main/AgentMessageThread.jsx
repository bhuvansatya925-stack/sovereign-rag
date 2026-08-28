import { FileText, Presentation, FileSpreadsheet, ExternalLink, Download, Sparkles } from 'lucide-react';
import ThinkingOrb from '../common/ThinkingOrb';

export default function AgentMessageThread({ messages, onOpenArtifact }) {
  return (
    <div className="flex-1 w-full max-w-3xl mx-auto overflow-y-auto px-4 py-6 space-y-6">
      {messages.map((msg, idx) => (
        <div key={idx} className="flex flex-col gap-3">
          {/* User Message */}
          {msg.role === 'user' && (
            <div className="flex justify-end">
              <div className="bg-[#262626] text-neutral-100 px-4 py-2.5 rounded-2xl rounded-tr-none text-sm max-w-[80%] leading-relaxed border border-[#333]">
                {msg.text}
              </div>
            </div>
          )}

          {/* Assistant Message */}
          {msg.role === 'assistant' && (
            <div className="flex flex-col gap-3">
              {/* Dynamic Action Orb State */}
              {msg.isCreating ? (
                <div className="py-2">
                  <ThinkingOrb label={msg.statusText || "Thinking..."} size={28} />
                </div>
              ) : (
                <div className="bg-[#1c1c1c] border border-[#282828] rounded-2xl p-5 shadow-lg flex flex-col gap-4">
                  {/* Dynamic Gemini-style Image Generation Canvas */}
                  {msg.imagePayload && (
                    <div 
                      onClick={() => onOpenArtifact({
                        id: `art-img-${idx}`,
                        title: msg.imagePayload.imageName || 'Generated Image',
                        type: 'image',
                        imageUrl: msg.imagePayload.imageUrl,
                        date: 'Just now'
                      })}
                      className="relative rounded-2xl overflow-hidden border border-[#333333] bg-[#121212] group cursor-pointer"
                    >
                      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[11px] text-neutral-200">
                        <Sparkles size={12} className="text-cyan-400" />
                        <span>{msg.imagePayload.imageName}</span>
                      </div>

                      <img
                        src={msg.imagePayload.imageUrl}
                        alt={msg.imagePayload.imageName}
                        className="w-full h-72 md:h-80 object-cover group-hover:scale-[1.01] transition-transform duration-500"
                      />

                      {/* Opens in Right Artifact Sidebar */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenArtifact({
                              id: `art-img-${idx}`,
                              title: msg.imagePayload.imageName || 'Generated Image',
                              type: 'image',
                              imageUrl: msg.imagePayload.imageUrl,
                              date: 'Just now'
                            });
                          }}
                          className="p-2 rounded-xl bg-black/75 hover:bg-black text-white text-xs backdrop-blur-md border border-white/15 flex items-center gap-1.5 cursor-pointer transition shadow-lg"
                        >
                          <Download size={13} />
                          <span>Full Res</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Standard Text Response */}
                  <div className="text-neutral-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.text}
                  </div>

                  {/* RAG Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-3 border-t border-[#262626]">
                      <div className="text-xs text-neutral-400 font-medium mb-2">
                        Sources
                      </div>

                      <div className="flex flex-col gap-1.5">
                        {msg.sources.map((source, sourceIdx) => (
                          <div
                            key={`${source.source}-${source.page}-${sourceIdx}`}
                            className="flex items-center justify-between bg-[#242424] border border-[#333] rounded-lg px-3 py-2 text-xs"
                          >
                            <span className="text-neutral-200 truncate">
                              {source.source}
                            </span>

                            <span className="text-neutral-500 ml-3 whitespace-nowrap">
                              Page {source.page || 1}
                              {source.ocr_used ? ' · OCR' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Generated Document Deliverables */}
                  {msg.artifacts && msg.artifacts.length > 0 && (
                    <div className="pt-3 border-t border-[#262626] flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-neutral-400 font-medium">Deliverables Created:</span>
                      {msg.artifacts.map((art) => (
                        <button
                          key={art.id}
                          onClick={() => onOpenArtifact(art)}
                          className="bg-[#242424] hover:bg-[#2c2c2c] hover:border-neutral-500 border border-[#383838] px-3 py-1.5 rounded-xl text-xs text-neutral-200 flex items-center gap-2 transition cursor-pointer"
                        >
                          {art.type === 'pdf' && <FileText size={13} className="text-red-400" />}
                          {art.type === 'ppt' && <Presentation size={13} className="text-orange-400" />}
                          {art.type === 'sheet' && <FileSpreadsheet size={13} className="text-emerald-400" />}
                          <span>{art.title}</span>
                          <ExternalLink size={11} className="text-neutral-500 ml-1" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}