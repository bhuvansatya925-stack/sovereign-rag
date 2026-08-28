import React, { useState } from 'react';
import { ScanEye } from 'lucide-react';
import AgentMessageThread from '../main/AgentMessageThread';
import BottomChatBar from '../main/BottomChatBar';
import { AVAILABLE_MODELS } from '../../data/mockData';

export default function OcrWorkspace({ onOpenArtifact }) {
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[4]); // Qwen2-VL

  const handleSendMessage = (userText, attachedFiles) => {
    const query = userText.trim() || (attachedFiles.length > 0 ? `Inspect ${attachedFiles[0].name}` : 'Run P&ID Inspection');
    setMessages((prev) => [...prev, { role: 'user', text: query }]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          isCreating: true,
          creatingDocName: 'Extracted_PID_Inspection_Report.pdf'
        }
      ]);

      setTimeout(() => {
        setMessages((prev) => {
          const updated = [...prev];
          updated.pop();
          return [
            ...updated,
            {
              role: 'assistant',
              text: `### Extracted P&ID & Inspection Analysis\n\n* **Drawing Reference:** \`DWG-REF-HC-2026-088-Rev2\`\n* **Line Tag:** \`12"-HC-204-CS300\`\n* **Identified Critical Valves:**\n  * **NV-012:** 3" Class 300 Gate Valve — Gland seal weeping identified.\n  * **CV-041:** Pneumatic Control Valve — Nominal diaphragm tolerance.\n* **Standard Compliance:** Conforms strictly to **ASME B31.3 Section 304.1.2**.`,
              artifacts: [
                { id: `ocr-${Date.now()}`, title: 'Extracted_PID_Inspection_Report.pdf', type: 'pdf', pages: 2, date: 'Just now' }
              ]
            }
          ];
        });
      }, 1000);
    }, 400);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden justify-between py-4 select-none">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[#1f1f1f] border border-[#2a2a2a] flex items-center justify-center shadow-xl mb-3">
            <ScanEye size={34} className="text-amber-400" />
          </div>
          <span className="font-mono text-sm tracking-widest text-neutral-400 uppercase font-semibold">
            OCR & DRAWINGS
          </span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-y-auto">
          <AgentMessageThread messages={messages} onOpenArtifact={onOpenArtifact} />
        </div>
      )}

      <div className="pb-6">
        <BottomChatBar
          prompt={prompt}
          setPrompt={setPrompt}
          onSendMessage={handleSendMessage}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          isSpecializedView={true}
          placeholder="Attach drawing or type tag number to inspect..."
        />
      </div>
    </div>
  );
}