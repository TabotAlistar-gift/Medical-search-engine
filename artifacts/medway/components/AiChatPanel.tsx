"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Brain, AlertCircle, RotateCcw, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AiChatPanelProps {
  query: string;
  onClose: () => void;
}

export default function AiChatPanel({ query, onClose }: AiChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hi! I'm MedAI, your medical information assistant. I can help you dive deeper into **${query}** or answer any other medical questions you have.\n\nWhat would you like to know?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    // Placeholder for streaming
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/mw/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          query,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("Request failed");
      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: accumulated,
          };
          return updated;
        });
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages([
      {
        role: "assistant",
        content: `Hi! I'm MedAI. Ask me anything about **${query}** or any other medical topic.`,
      },
    ]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-white animate-slide-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-primary-800 to-teal-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">MedAI</p>
            <p className="text-white/70 text-xs">Medical AI Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={reset}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="New conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Disclaimer banner */}
      <div className="flex items-start gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-100">
        <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700">
          For educational purposes only. Not a substitute for professional medical advice.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} isStreaming={isStreaming && i === messages.length - 1 && msg.role === "assistant"} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
        <div className="flex items-end gap-2 bg-white border border-slate-200 rounded-2xl p-2 focus-within:border-primary-400 transition-colors shadow-sm">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about symptoms, treatments, medications…"
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none outline-none text-sm text-slate-700 placeholder-slate-400 bg-transparent px-2 py-1 max-h-32 disabled:opacity-50"
            style={{ minHeight: "36px" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className={cn(
              "p-2 rounded-xl transition-all duration-200 shrink-0",
              input.trim() && !isStreaming
                ? "bg-primary-700 text-white hover:bg-primary-800 active:scale-95"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
            aria-label="Send message"
          >
            {isStreaming ? (
              <span className="flex gap-0.5 px-1">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </span>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function ChatBubble({
  message,
  isStreaming,
}: {
  message: Message;
  isStreaming: boolean;
}) {
  const isUser = message.role === "user";

  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      // Bold: **text**
      const formatted = line.replace(
        /\*\*(.+?)\*\*/g,
        '<strong>$1</strong>'
      );
      return (
        <p
          key={i}
          className={cn("text-sm leading-relaxed", i > 0 && "mt-2")}
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    });
  };

  return (
    <div
      className={cn(
        "flex gap-2 animate-fade-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
          isUser
            ? "bg-primary-700"
            : "bg-gradient-to-br from-primary-800 to-teal-700"
        )}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-white" />
        ) : (
          <Brain className="w-3.5 h-3.5 text-white" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[85%] px-4 py-3 rounded-2xl",
          isUser
            ? "bg-primary-700 text-white rounded-tr-sm"
            : "bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-sm"
        )}
      >
        {message.content ? (
          <div className={cn(isUser ? "text-white" : "text-slate-700")}>
            {renderContent(message.content)}
          </div>
        ) : isStreaming ? (
          <span className="flex gap-1 py-1">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </span>
        ) : null}
      </div>
    </div>
  );
}
