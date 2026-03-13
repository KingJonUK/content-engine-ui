"use client";

import { useEffect, useRef, useState } from "react";
import {
  getConversations,
  createConversation,
  getConversation,
  deleteConversation,
  sendChatMessage,
  type Conversation,
  type Message,
} from "@/lib/api";
import { Button, useToast } from "@/components/ui";
import { MessageSquare, Plus, Send, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamChunk, setStreamChunk] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { show, ToastEl } = useToast();

  useEffect(() => {
    getConversations().then((cs) => { setConversations(cs); if (cs.length) selectConversation(cs[0].id); })
      .finally(() => setLoadingConvs(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamChunk]);

  const selectConversation = async (id: number) => {
    setActiveId(id);
    setStreamChunk("");
    setLoadingMsgs(true);
    try {
      const conv = await getConversation(id);
      setMessages(conv.messages);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleNew = async () => {
    const title = `Chat ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`;
    const conv = await createConversation(title);
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    setMessages([]);
  };

  const handleDelete = async (id: number) => {
    await deleteConversation(id);
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    if (activeId === id) {
      if (updated.length) selectConversation(updated[0].id);
      else { setActiveId(null); setMessages([]); }
    }
    show("Conversation deleted");
  };

  const handleSend = () => {
    if (!input.trim() || !activeId || streaming) return;
    const userMsg: Message = { id: Date.now(), conversationId: activeId, role: "user", content: input, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);
    setStreamChunk("");

    sendChatMessage(
      activeId,
      input,
      (chunk) => setStreamChunk((prev) => prev + chunk),
      () => {
        setStreaming(false);
        getConversation(activeId).then((c) => {
          setMessages(c.messages);
          setStreamChunk("");
        });
      }
    );
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex h-full" style={{ background: "var(--ink)" }}>
      {/* Sidebar */}
      <div
        className="w-60 flex-shrink-0 flex flex-col"
        style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
      >
        <div className="p-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <Button onClick={handleNew} icon={<Plus size={13} />} size="sm" className="w-full justify-center">
            New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {loadingConvs
            ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer h-12 mx-3 mb-2 rounded-lg" />)
            : conversations.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between mx-2 px-3 py-2.5 rounded-lg cursor-pointer group transition-colors"
                  style={{
                    background: activeId === c.id ? "rgba(110,86,207,0.18)" : "transparent",
                    borderLeft: activeId === c.id ? "2px solid var(--accent)" : "2px solid transparent",
                  }}
                  onClick={() => selectConversation(c.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {c.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {!activeId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <MessageSquare size={36} style={{ color: "var(--text-muted)" }} />
            <p style={{ color: "var(--text-muted)" }}>Select a conversation or start a new chat</p>
            <Button onClick={handleNew} icon={<Plus size={14} />}>New Chat</Button>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingMsgs
                ? Array.from({ length: 3 }).map((_, i) => <div key={i} className={`shimmer h-16 rounded-xl ${i % 2 === 0 ? "ml-12" : "mr-12"}`} />)
                : messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className="max-w-[72%] rounded-2xl px-4 py-3 text-sm"
                        style={
                          msg.role === "user"
                            ? { background: "var(--accent)", color: "#fff", borderBottomRightRadius: 4 }
                            : { background: "var(--surface-raised)", color: "var(--text-primary)", border: "1px solid var(--border)", borderBottomLeftRadius: 4 }
                        }
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))}

              {/* Streaming chunk */}
              {streaming && (
                <div className="flex justify-start">
                  <div
                    className="max-w-[72%] rounded-2xl px-4 py-3 text-sm"
                    style={{ background: "var(--surface-raised)", color: "var(--text-primary)", border: "1px solid var(--border)", borderBottomLeftRadius: 4 }}
                  >
                    {streamChunk ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{streamChunk}
                        <span className="inline-block w-1.5 h-4 ml-0.5 align-middle rounded-sm" style={{ background: "var(--accent)", animation: "pulse 1s infinite" }} />
                      </p>
                    ) : (
                      <div className="flex items-center gap-1.5 py-0.5">
                        {[0, 150, 300].map((d) => (
                          <span key={d} className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--text-muted)", animation: `pulse 1.2s ${d}ms infinite` }} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4" style={{ borderTop: "1px solid var(--border)" }}>
              <div
                className="flex items-end gap-3 rounded-xl p-3"
                style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Message…"
                  rows={1}
                  className="flex-1 resize-none"
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: "2px 0",
                    maxHeight: 160,
                    minHeight: 24,
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || streaming}
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    background: input.trim() && !streaming ? "var(--accent)" : "var(--surface-overlay)",
                    color: input.trim() && !streaming ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {streaming ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
              <p className="text-xs text-center mt-2" style={{ color: "var(--text-muted)" }}>
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </>
        )}
      </div>

      {ToastEl}
    </div>
  );
}
