"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { askDocument } from "@/lib/chat";
import UploadModal from "@/components/upload/UploadModal";
import {
  MessageSquare,
  Plus,
  Upload,
  LogOut,
  FileText,
  Menu,
  X,
  Send,
  Loader2,
} from "lucide-react";

export default function Dashboard({ user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  async function loadDocuments() {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setDocuments(data || []);
      if (!selectedDocument && data?.length > 0) {
        setSelectedDocument(data[0]);
      }
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  function handleUploaded(document) {
    setDocuments((prev) => [document, ...prev]);
    setSelectedDocument(document);
  }

  function startNewChat() {
    setMessages([]);
    setSessionId(null);
    setInput("");
  }

  async function handleSend() {
    if (!selectedDocument) {
      alert("Please upload or select a document first.");
      return;
    }

    if (selectedDocument.status !== "ready") {
      alert("Document is not ready yet.");
      return;
    }

    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const result = await askDocument({
        documentId: selectedDocument.id,
        sessionId,
        message: input,
      });

      setSessionId(result.sessionId);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.answer,
          citations: result.citations || [],
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: error.message || "Something went wrong.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-[#f7f7f8] text-gray-900">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed z-30 h-full w-72 bg-[#202123] text-white transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col p-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">RAG Chat</h2>

            <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
              <X size={22} />
            </button>
          </div>

          <button
            onClick={startNewChat}
            className="mb-4 flex items-center gap-3 rounded-lg border border-white/20 p-3 text-sm hover:bg-white/10"
          >
            <Plus size={18} />
            New Chat
          </button>

          <div className="mb-4">
            <p className="mb-2 px-2 text-xs uppercase text-gray-400">
              Documents
            </p>

            <div className="space-y-1">
              {documents.length === 0 ? (
                <button className="flex w-full items-center gap-3 rounded-lg p-3 text-sm text-gray-400">
                  <FileText size={18} />
                  No document uploaded
                </button>
              ) : (
                documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      setSelectedDocument(doc);
                      startNewChat();
                      setSidebarOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm hover:bg-white/10 ${
                      selectedDocument?.id === doc.id ? "bg-white/10" : ""
                    }`}
                  >
                    <FileText size={18} />

                    <div className="min-w-0">
                      <p className="truncate">{doc.title}</p>
                      <p className="text-xs text-gray-400">{doc.status}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <p className="mb-2 px-2 text-xs uppercase text-gray-400">Chats</p>

            <button className="flex w-full items-center gap-3 rounded-lg p-3 text-sm text-gray-400">
              <MessageSquare size={18} />
              Current chat
            </button>
          </div>

          <div className="border-t border-white/10 pt-3">
            <p className="mb-2 truncate px-2 text-xs text-gray-400">
              {user.email}
            </p>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg p-3 text-sm hover:bg-white/10"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-white px-4">
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>

            <div>
              <h1 className="font-semibold">Document Chat</h1>
              <p className="text-xs text-gray-500">
                {selectedDocument
                  ? selectedDocument.title
                  : "No document selected"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            <Upload size={16} />
            Upload
          </button>
        </header>

        <section className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-3xl space-y-5">
            {messages.length === 0 ? (
              <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                <h2 className="mb-3 text-4xl font-bold">
                  Chat with your documents
                </h2>

                <p className="mb-8 text-gray-600">
                  Upload a TXT or Markdown file, select it, then ask questions
                  based on that document.
                </p>

                <button
                  onClick={() => setUploadOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3 text-white hover:bg-gray-800"
                >
                  <Upload size={18} />
                  Upload your first document
                </button>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`rounded-2xl p-4 ${
                    message.role === "user"
                      ? "ml-auto max-w-[80%] bg-black text-white"
                      : "mr-auto max-w-[90%] bg-white shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {message.content}
                  </p>

                  {message.citations?.length > 0 && (
                    <div className="mt-4 border-t pt-3">
                      <p className="mb-2 text-xs font-semibold text-gray-500">
                        Sources
                      </p>

                      <div className="space-y-2">
                        {message.citations.map((citation, i) => (
                          <div
                            key={i}
                            className="rounded-lg bg-gray-50 p-2 text-xs text-gray-600"
                          >
                            <p className="font-medium">{citation.label}</p>
                            <p className="line-clamp-2">{citation.preview}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="mr-auto flex max-w-[90%] items-center gap-2 rounded-2xl bg-white p-4 text-sm shadow-sm">
                <Loader2 className="animate-spin" size={16} />
                Thinking...
              </div>
            )}
          </div>
        </section>

        <footer className="border-t bg-white p-4">
          <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-xl border bg-white p-3 shadow-sm">
            <input
              value={input}
              disabled={!selectedDocument || loading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder={
                selectedDocument
                  ? "Ask something from this document..."
                  : "Upload or select a document first..."
              }
              className="flex-1 outline-none disabled:bg-white"
            />

            <button
              onClick={handleSend}
              disabled={!selectedDocument || loading || !input.trim()}
              className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:bg-gray-300"
            >
              <Send size={16} />
            </button>
          </div>
        </footer>
      </main>

      <UploadModal
        user={user}
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleUploaded}
      />
    </div>
  );
}