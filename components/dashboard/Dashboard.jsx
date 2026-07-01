"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { askDocument } from "@/lib/chat";
import { deleteDocument } from "@/lib/upload";
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
  Trash2,
} from "lucide-react";

export default function Dashboard({ user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [chatSessions, setChatSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  async function loadDocuments() {
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .neq("status", "failed")
      .order("created_at", { ascending: false });

    setDocuments(data || []);
    if (!selectedDocument && data?.length > 0) setSelectedDocument(data[0]);
  }

  async function loadChatSessions() {
    const { data } = await supabase
      .from("chat_sessions")
      .select("id,title,document_id,updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    setChatSessions(data || []);
  }

  async function loadChatMessages(chatId) {
    const { data } = await supabase
      .from("chat_messages")
      .select("role,content,citations,created_at")
      .eq("session_id", chatId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    setMessages(
      (data || []).map((msg) => ({
        role: msg.role,
        content: msg.content,
        citations: msg.citations || [],
      }))
    );
  }

  useEffect(() => {
    loadDocuments();
    loadChatSessions();
  }, []);

  function startNewChat() {
    setMessages([]);
    setSessionId(null);
    setInput("");
  }

  function handleUploaded(document) {
    setDocuments((prev) => [document, ...prev]);
    setSelectedDocument(document);
    startNewChat();
  }

  async function openChat(session) {
    setSessionId(session.id);
    const doc = documents.find((item) => item.id === session.document_id);
    if (doc) setSelectedDocument(doc);
    await loadChatMessages(session.id);
    setSidebarOpen(false);
  }

  async function handleDeleteDocument(doc) {
    if (!confirm(`Delete "${doc.title}"?`)) return;

    await deleteDocument(doc);
    const updatedDocs = documents.filter((item) => item.id !== doc.id);
    setDocuments(updatedDocs);

    if (selectedDocument?.id === doc.id) {
      setSelectedDocument(updatedDocs[0] || null);
      startNewChat();
    }

    await loadChatSessions();
  }

  async function handleSend() {
    if (!selectedDocument) return alert("Please upload or select a document first.");
    if (selectedDocument.status !== "ready") return alert("Document is not ready yet.");
    if (!input.trim()) return;

    const currentInput = input;
    setMessages((prev) => [...prev, { role: "user", content: currentInput }]);
    setInput("");
    setLoading(true);

    try {
      const result = await askDocument({
        documentId: selectedDocument.id,
        sessionId,
        message: currentInput,
      });

      setSessionId(result.sessionId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.answer },
      ]);
      await loadChatSessions();
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: error.message || "Something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-[#0b1410] text-white">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed z-30 h-full w-72 bg-[#111111] text-white transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col p-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#22c55e]">Contextify</h2>
            <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
              <X size={22} />
            </button>
          </div>

          <button
            onClick={startNewChat}
            className="mb-4 flex items-center gap-3 rounded-lg border border-white/10 p-3 text-sm hover:bg-white/10"
          >
            <Plus size={18} />
            New Chat
          </button>

          <div className="mb-4">
            <p className="mb-2 px-2 text-xs uppercase text-white/35">Documents</p>

            <div className="space-y-1">
              {documents.length === 0 ? (
                <div className="flex items-center gap-3 rounded-lg p-3 text-sm text-white/35">
                  <FileText size={18} />
                  No document uploaded
                </div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`group flex items-center gap-2 rounded-lg pr-2 hover:bg-white/10 ${
                      selectedDocument?.id === doc.id ? "bg-[#16a34a]/20" : ""
                    }`}
                  >
                    <button
                      onClick={() => {
                        setSelectedDocument(doc);
                        startNewChat();
                        setSidebarOpen(false);
                      }}
                      className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left text-sm"
                    >
                      <FileText size={18} className="text-[#22c55e]" />
                      <div className="min-w-0">
                        <p className="truncate">{doc.title}</p>
                        <span className="mt-1 inline-block rounded-full bg-[#22c55e]/15 px-2 py-0.5 text-[10px] text-[#86efac]">
                          {doc.status}
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleDeleteDocument(doc)}
                      className="hidden rounded p-1 text-white/35 hover:bg-red-500/20 hover:text-red-300 group-hover:block"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <p className="mb-2 px-2 text-xs uppercase text-white/35">Chats</p>

            <div className="space-y-1">
              {chatSessions.length === 0 ? (
                <div className="flex items-center gap-3 rounded-lg p-3 text-sm text-white/35">
                  <MessageSquare size={18} />
                  No chats yet
                </div>
              ) : (
                chatSessions.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => openChat(chat)}
                    className={`flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm hover:bg-white/10 ${
                      sessionId === chat.id ? "bg-[#16a34a]/20" : ""
                    }`}
                  >
                    <MessageSquare size={18} className="text-[#22c55e]" />
                    <span className="truncate">{chat.title}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-white/10 pt-3">
            <p className="mb-2 truncate px-2 text-xs text-white/40">{user.email}</p>
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

      <main className="flex flex-1 flex-col bg-[#0b1410]">
        <header className="flex h-14 items-center justify-between border-b border-white/10 bg-[#111111] px-4">
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div>
              <h1 className="font-semibold">Document Chat</h1>
              <p className="text-xs text-white/40">
                {selectedDocument ? selectedDocument.title : "No document selected"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-[#16a34a] px-4 py-2 text-sm text-white hover:bg-[#22c55e]"
          >
            <Upload size={16} />
            Upload
          </button>
        </header>

        <section className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-3xl space-y-5">
            {messages.length === 0 ? (
              <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                <h2 className="mb-3 text-4xl font-black text-white">
                  Chat with your documents
                </h2>
                <p className="mb-8 max-w-xl text-white/55">
                  Upload PDFs, DOCX files, notes, or lectures and ask clear study questions from them.
                </p>
                <button
                  onClick={() => setUploadOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#16a34a] px-6 py-3 text-white hover:bg-[#22c55e]"
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
                      ? "ml-auto max-w-[80%] bg-[#16a34a] text-white"
                      : "mr-auto max-w-[90%] border border-white/10 bg-[#111111] text-white shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {message.content}
                  </p>
                </div>
              ))
            )}

            {loading && (
              <div className="mr-auto flex max-w-[90%] items-center gap-2 rounded-2xl border border-white/10 bg-[#111111] p-4 text-sm text-white">
                <Loader2 className="animate-spin text-[#22c55e]" size={16} />
                Thinking...
              </div>
            )}
          </div>
        </section>

        <footer className="border-t border-white/10 bg-[#111111] p-4">
          <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-xl border border-white/10 bg-[#1c1c1c] p-3 shadow-sm">
            <input
              value={input}
              disabled={!selectedDocument || loading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                selectedDocument
                  ? "Ask something from this document..."
                  : "Upload or select a document first..."
              }
              className="flex-1 bg-transparent text-white outline-none placeholder:text-white/30 disabled:bg-transparent"
            />

            <button
              onClick={handleSend}
              disabled={!selectedDocument || loading || !input.trim()}
              className="rounded-lg bg-[#16a34a] px-4 py-2 text-sm text-white hover:bg-[#22c55e] disabled:bg-gray-600"
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