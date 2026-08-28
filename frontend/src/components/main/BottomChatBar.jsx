import { useRef, useState, useEffect } from 'react';
import {
  Plus,
  ChevronDown,
  ArrowUp,
  FileText,
  X,
} from 'lucide-react';
import { AVAILABLE_MODELS } from '../../data/mockData';

export default function BottomChatBar({ 
  prompt, 
  setPrompt, 
  onSendMessage, 
  loading, 
  selectedModel, 
  setSelectedModel,
  placeholder = "Ask anything, or task a local agent..."
}) {
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  
  const modelMenuRef = useRef(null);
  const fileInputRef = useRef(null);

  // Global click-outside listener to close the model menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target)) {
        setShowModelMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    setAttachedFiles((prev) => [
      ...prev,
      ...files.map((file) => ({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        file,
      })),
    ]);

    e.target.value = '';
  };

  const removeFile = (index) => {
    setAttachedFiles(attachedFiles.filter((_, idx) => idx !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim() || attachedFiles.length > 0) {
        onSendMessage(prompt, attachedFiles);
        setPrompt('');
        setAttachedFiles([]);
        setShowModelMenu(false);
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 relative select-none">
      {/* Attached Files Badges */}
      {attachedFiles.length > 0 && (
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {attachedFiles.map((file, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-[#222] border border-[#333] px-2.5 py-1 rounded-lg text-xs text-neutral-200">
              <FileText size={13} className="text-blue-400" />
              <span className="truncate max-w-[140px]">{file.name}</span>
              <button onClick={() => removeFile(idx)} className="hover:text-red-400">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Input Box */}
      <div className="w-full bg-[#212121] rounded-2xl p-3.5 border border-[#2e2e2e] shadow-2xl flex flex-col gap-2.5">
        <textarea
          rows={2}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none resize-none leading-relaxed"
          placeholder={placeholder}
        />

        <div className="flex items-center justify-between pt-2 border-t border-[#2c2c2c] relative">
          <div className="flex items-center gap-2">
            {/* Plus File Upload Button */}
            <div className="relative">
              <button
                type="button"
                title="Upload files"
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 rounded-lg hover:bg-[#2c2c2c] text-neutral-400 hover:text-white flex items-center justify-center transition"
              >
                <Plus size={18} />
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                className="hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Multi-Model Selector Dropdown */}
            <div className="relative" ref={modelMenuRef}>
              <button
                onClick={() => {
                  setShowModelMenu(!showModelMenu);
                          }}
                className="flex items-center gap-1.5 text-xs text-neutral-300 bg-[#171717] hover:bg-[#1f1f1f] px-2.5 py-1.5 rounded-lg border border-[#2e2e2e] transition"
              >
                <span className="text-neutral-500 font-mono text-[11px]">Model:</span>
                <span className="font-medium max-w-[130px] truncate">{selectedModel?.name || 'DeepSeek / Qwen'}</span>
                <ChevronDown size={12} className="ml-0.5 text-neutral-400" />
              </button>

              {showModelMenu && (
                <div className="absolute bottom-10 right-0 bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl shadow-2xl p-1.5 w-64 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[11px] font-mono text-neutral-500 uppercase tracking-wider border-b border-[#262626]">
                    On-Premise Weight Router
                  </div>
                  {AVAILABLE_MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedModel(m);
                        setShowModelMenu(false);
                      }}
                      className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#252525] text-neutral-200 text-xs text-left transition"
                    >
                      <span className="truncate">{m.name}</span>
                      <span className="text-[10px] font-mono bg-[#282828] text-neutral-400 px-1.5 py-0.5 rounded ml-2">
                        {m.tag}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Send Button */}
            <button
              disabled={loading || (!prompt.trim() && attachedFiles.length === 0)}
              onClick={() => {
                onSendMessage(prompt, attachedFiles);
                setPrompt('');
                setAttachedFiles([]);
                        setShowModelMenu(false);
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                prompt.trim() || attachedFiles.length > 0
                  ? 'bg-neutral-200 hover:bg-white text-black cursor-pointer'
                  : 'bg-[#2a2a2a] text-neutral-600 cursor-not-allowed'
              }`}
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}