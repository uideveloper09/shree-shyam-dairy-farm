"use client";

import { useState, useRef, useEffect } from "react";
import { HiX, HiPaperAirplane } from "react-icons/hi";
import { FaRobot } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteData } from "@/features/cart/context/SiteDataContext";

function formatReply(text) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i}>
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j}>{part.slice(2, -2)}</strong>
          ) : (
            part
          )
        )}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    );
  });
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
          isUser
            ? "rounded-br-md bg-[#082F63] text-white"
            : "rounded-bl-md border border-[#e8e4dc] bg-white text-gray-700 shadow-sm"
        }`}
      >
        {isUser ? message.content : formatReply(message.content)}
      </div>
    </div>
  );
}

export default function ChatAssistant() {
  const { site, chatAssistant } = useSiteData();
  const config = chatAssistant ?? {};

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const assistantName = config.name || "Shyam AI";
  const greeting =
    config.greeting ||
    `Namaste! Main ${site.name} ka AI assistant hoon. Products, orders, delivery — kuch bhi poochho!`;
  const placeholder = config.placeholder || "Apna sawaal likho...";
  const quickPrompts = config.quickPrompts ?? [
    "Products aur prices?",
    "Order kaise karun?",
    "Delivery Bihar mein?",
    "Contact details",
  ];

  const toggleOpen = () => {
    setIsOpen((open) => {
      const next = !open;
      if (next) {
        setMessages((prev) =>
          prev.length === 0 ? [{ role: "assistant", content: greeting }] : prev
        );
      }
      return next;
    });
  };

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = nextMessages.filter(
        (m, i) => !(i === 0 && m.role === "assistant" && m.content === greeting)
      );

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Maaf kijiye, abhi reply nahi de paaya. Kripya call karein: ${site.phone}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed-safe-bottom-high right-4 z-[55] flex h-[min(520px,calc(100dvh-8rem-env(safe-area-inset-bottom)))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#e8e4dc] bg-[#faf9f6] shadow-[0_20px_60px_rgba(8,47,99,0.18)] sm:right-6"
            role="dialog"
            aria-label="AI Chat Assistant"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[#e8e4dc] bg-gradient-to-r from-[#082F63] to-[#0B3D7A] px-4 py-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C89B3C]/20 ring-2 ring-[#C89B3C]/40">
                <FaRobot className="text-[#C89B3C]" size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-[15px] font-bold text-white">
                  {assistantName}
                </p>
                <p className="truncate text-[11px] text-white/60">
                  {config.title || "Farm Assistant"} · Online
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <HiX size={20} />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={listRef}
              className="flex-1 space-y-3 overflow-y-auto px-4 py-4 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1"
            >
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md border border-[#e8e4dc] bg-white px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C89B3C]"
                          style={{ animationDelay: `${d * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick prompts */}
            {messages.length <= 1 && !loading && (
              <div className="flex flex-wrap gap-2 border-t border-[#e8e4dc]/80 px-4 py-2.5">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="rounded-full border border-[#e8e4dc] bg-white px-3 py-1 text-[11px] text-gray-600 transition hover:border-[#C89B3C]/50 hover:text-[#082F63]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 border-t border-[#e8e4dc] bg-white px-3 py-3"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                disabled={loading}
                className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-[#fafafa] px-3.5 py-2.5 text-[14px] outline-none transition focus:border-[#082F63] focus:bg-white focus:ring-1 focus:ring-[#082F63] disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#082F63] text-white transition hover:bg-[#0B3D7A] disabled:opacity-40"
              >
                <HiPaperAirplane size={18} className="translate-x-0.5 -translate-y-0.5 rotate-90" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        type="button"
        onClick={toggleOpen}
        aria-label={isOpen ? "Close chat assistant" : "Open chat assistant"}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed-safe-bottom right-4 z-[55] flex h-14 w-14 items-center justify-center rounded-full shadow-[0_8px_30px_rgba(8,47,99,0.35)] transition sm:right-6 ${
          isOpen
            ? "bg-gray-700 text-white"
            : "bg-gradient-to-br from-[#082F63] to-[#0B3D7A] text-[#C89B3C]"
        }`}
      >
        {isOpen ? <HiX size={24} /> : <FaRobot size={24} />}
        {!isOpen && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#C89B3C] text-[9px] font-bold text-[#082F63]">
            AI
          </span>
        )}
      </motion.button>
    </>
  );
}
