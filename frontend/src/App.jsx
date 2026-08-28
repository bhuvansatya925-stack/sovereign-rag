import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import RightArtifactSidebar from './components/layout/RightArtifactSidebar';
import BottomChatBar from './components/main/BottomChatBar';
import AgentMessageThread from './components/main/AgentMessageThread';
import EmptyChatState from './components/main/EmptyChatState';
import OcrWorkspace from './components/views/OcrWorkspace';
import SheetsWorkspace from './components/views/SheetsWorkspace';
import SandboxWorkspace from './components/views/SandboxWorkspace';
import { AVAILABLE_MODELS, generateChatTitle } from './data/mockData';

const API_BASE_URL = 'http://127.0.0.1:8000';

export default function App() {
  const [activeView, setActiveView] = useState('home');
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  const [sessions, setSessions] = useState([
    { id: 'session-1', title: 'New Conversation', messages: [], isPinned: false }
  ]);
  const [currentSessionId, setCurrentSessionId] = useState('session-1');

  const currentSession =
    sessions.find((s) => s.id === currentSessionId) || sessions[0];

  const updateCurrentSessionMessages = (newMessages) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? { ...s, messages: newMessages }
          : s
      )
    );
  };

  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    const newSession = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      isPinned: false
    };

    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setActiveView('home');
    setSelectedArtifact(null);
    setPrompt('');
  };

  const handleSelectSession = (id) => {
    setCurrentSessionId(id);
    setActiveView('home');
    setSelectedArtifact(null);
  };

  const handleDeleteSession = (id) => {
    const remaining = sessions.filter((s) => s.id !== id);

    if (remaining.length > 0) {
      setSessions(remaining);

      if (currentSessionId === id) {
        setCurrentSessionId(remaining[0].id);
      }
    } else {
      const fallbackId = `session-${Date.now()}`;

      setSessions([
        {
          id: fallbackId,
          title: 'New Conversation',
          messages: [],
          isPinned: false
        }
      ]);

      setCurrentSessionId(fallbackId);
    }
  };

  const handleTogglePin = (id) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, isPinned: !s.isPinned }
          : s
      )
    );
  };

  const handleSendMessage = async (
    userText,
    attachedFiles = []
  ) => {
    if (!userText.trim() && attachedFiles.length === 0) {
      return;
    }

    const q =
      userText.trim() ||
      `Uploaded ${attachedFiles[0].name}`;

    if (currentSession.messages.length === 0) {
      const contextTitle = generateChatTitle(
        q,
        attachedFiles
      );

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, title: contextTitle }
            : s
        )
      );
    }

    const updatedMessages = [
      ...currentSession.messages,
      {
        role: 'user',
        text: q
      },
      {
        role: 'assistant',
        isCreating: true,
        statusText: attachedFiles.length > 0
          ? 'Reading your document...'
          : 'Thinking...'
      }
    ];

    updateCurrentSessionMessages(updatedMessages);
    setLoading(true);

    try {
      /*
       * Upload files first.
       *
       * The backend indexes the document into the RAG
       * vector store. We preserve the actual browser File
       * object so the backend receives the file contents.
       */
      for (const file of attachedFiles) {
        const formData = new FormData();
        formData.append('file', file.file);

        const uploadResponse = await fetch(
          `${API_BASE_URL}/api/documents/upload`,
          {
            method: 'POST',
            body: formData
          }
        );

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse
            .json()
            .catch(() => ({}));

          throw new Error(
            errorData.detail ||
            `Upload failed with status ${uploadResponse.status}`
          );
        }
      }

      /*
       * Ask the real RAG backend.
       */
      const chatResponse = await fetch(
        `${API_BASE_URL}/api/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            question: q,
            n_results: 3,
            source: attachedFiles.length > 0
              ? attachedFiles[0].name
              : null
          })
        }
      );

      if (!chatResponse.ok) {
        const errorData = await chatResponse
          .json()
          .catch(() => ({}));

        throw new Error(
          errorData.detail ||
          `Chat failed with status ${chatResponse.status}`
        );
      }

      const result = await chatResponse.json();

      updateCurrentSessionMessages([
        ...currentSession.messages,
        {
          role: 'user',
          text: q
        },
        {
          role: 'assistant',
          text: result.answer,
          sources: result.sources || [],
          artifacts: []
        }
      ]);
    } catch (error) {
      updateCurrentSessionMessages([
        ...currentSession.messages,
        {
          role: 'user',
          text: q
        },
        {
          role: 'assistant',
          text: `Backend error: ${error.message}`,
          artifacts: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackgroundClick = (e) => {
    if (
      e.target.dataset.collapseZone === 'true' &&
      isSidebarOpen
    ) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="h-screen w-screen flex bg-[#171717] text-[#e5e5e5] font-sans overflow-hidden">
      <Sidebar
        activeView={activeView}
        setActiveView={(view) => setActiveView(view)}
        onNewChat={handleNewChat}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onTogglePin={handleTogglePin}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main
        onClick={handleBackgroundClick}
        data-collapse-zone="true"
        className="flex-1 flex flex-col justify-between relative overflow-hidden"
      >
        {activeView === 'home' && (
          <>
            {currentSession.messages.length === 0 ? (
              <EmptyChatState
                onSelectSuggestion={(text) =>
                  handleSendMessage(text)
                }
              />
            ) : (
              <AgentMessageThread
                messages={currentSession.messages}
                onOpenArtifact={(art) =>
                  setSelectedArtifact(art)
                }
              />
            )}

            <div
              className="pb-6 pt-2"
              onClick={(e) => e.stopPropagation()}
            >
              <BottomChatBar
                prompt={prompt}
                setPrompt={setPrompt}
                onSendMessage={handleSendMessage}
                loading={loading}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                isSpecializedView={false}
              />
            </div>
          </>
        )}

        {activeView === 'ocr' && (
          <OcrWorkspace
            onOpenArtifact={(art) =>
              setSelectedArtifact(art)
            }
          />
        )}

        {activeView === 'sheets' && (
          <SheetsWorkspace
            onOpenArtifact={(art) =>
              setSelectedArtifact(art)
            }
          />
        )}

        {activeView === 'sandbox' && (
          <SandboxWorkspace
            onOpenArtifact={(art) =>
              setSelectedArtifact(art)
            }
          />
        )}
      </main>

      {selectedArtifact && (
        <RightArtifactSidebar
          selectedArtifact={selectedArtifact}
          onClose={() => setSelectedArtifact(null)}
        />
      )}
    </div>
  );
}
