import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  X,
  Send,
  Plus,
  Sparkles,
  Copy,
  RefreshCw,
  History,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useChat } from "@/contexts/chat-context";
import { useApp } from "@/contexts/app-context";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const SUGGESTIONS_DEFAULT = [
  "What is LangChain used for?",
  "Compare LangChain and LlamaIndex",
  "Which AI tool is best for RAG?",
  "Explain Ollama architecture",
];

function contextualSuggestions(ctx: string | null): string[] {
  if (!ctx) return SUGGESTIONS_DEFAULT;
  return [
    `What is ${ctx} best used for?`,
    `Show me a ${ctx} code example`,
    `Compare ${ctx} with its alternatives`,
    `Common pitfalls when using ${ctx}`,
  ];
}

export function FloatingChatbot() {
  const {
    open,
    setOpen,
    activeThread,
    sendMessage,
    isStreaming,
    threads,
    newThread,
    selectThread,
    deleteThread,
    regenerate,
    pageContext,
  } = useChat();
  const { user, setAuthModalOpen } = useApp();
  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeThread?.messages, isStreaming]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open, activeThread?.id]);

  const handleSend = async (text?: string) => {
    const msg = text ?? input;
    if (!msg.trim() || isStreaming) return;
    setInput("");
    await sendMessage(msg);
  };

  const suggestions = contextualSuggestions(pageContext);
  const hasMessages = (activeThread?.messages.length ?? 0) > 0;

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 h-14 w-14 rounded-full bg-gradient-primary text-primary-foreground shadow-glow-lg flex items-center justify-center animate-pulse-glow"
            aria-label="Open AI assistant"
          >
            <MessageSquare className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent ring-2 ring-background" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="fixed z-50 glass-strong border border-border/60 shadow-glow-lg
              bottom-0 right-0 left-0 top-0
              sm:bottom-6 sm:right-6 sm:left-auto sm:top-auto
              sm:h-[640px] sm:max-h-[85vh] sm:w-[420px]
              sm:rounded-2xl
              flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
              <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-sm leading-tight">AI Navigator</h3>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  {pageContext ? `Context: ${pageContext}` : "Ready to help"}
                </p>
              </div>
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowHistory((v) => !v)}
                  aria-label="History"
                >
                  <History className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  newThread();
                  setShowHistory(false);
                }}
                aria-label="New chat"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* History sidebar */}
            <AnimatePresence>
              {showHistory && user && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-border/60 bg-surface/50 overflow-hidden"
                >
                  <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                    {threads.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-3">No conversations yet</p>
                    )}
                    {threads.map((t) => (
                      <div
                        key={t.id}
                        className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-xs cursor-pointer transition-colors ${
                          t.id === activeThread?.id ? "bg-secondary text-foreground" : "hover:bg-secondary/50 text-muted-foreground"
                        }`}
                        onClick={() => {
                          selectThread(t.id);
                          setShowHistory(false);
                        }}
                      >
                        <MessageSquare className="h-3 w-3 shrink-0" />
                        <span className="truncate flex-1">{t.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteThread(t.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {!hasMessages && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center text-center pt-6"
                >
                  <div className="h-14 w-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 shadow-glow animate-float">
                    <Sparkles className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h4 className="font-display font-semibold text-base">How can I help you?</h4>
                  {!user && (
                    <button
                      onClick={() => setAuthModalOpen(true)}
                      className="text-[11px] text-primary hover:underline mt-3"
                    >
                      Sign in to save your conversations →
                    </button>
                  )}
                </motion.div>
              )}

              {activeThread?.messages.map((m, i) => (
                <ChatBubble key={m.id} message={m} isLast={i === activeThread.messages.length - 1} onRegenerate={regenerate} isStreaming={isStreaming} />
              ))}

              {isStreaming && activeThread?.messages[activeThread.messages.length - 1]?.content === "" && (
                <TypingIndicator />
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border/60 p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="relative"
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                  placeholder="Ask AI Navigator anything…"
                  className="w-full resize-none bg-surface/60 border border-border rounded-xl pl-4 pr-12 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 max-h-32 min-h-[44px]"
                  disabled={isStreaming}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isStreaming}
                  className="absolute right-2 bottom-2 h-8 w-8 rounded-lg bg-gradient-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition hover:opacity-90"
                  aria-label="Send"
                >
                  {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </button>
              </form>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Mock streaming · No data sent externally
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm">
      <div className="h-7 w-7 rounded-md bg-gradient-primary flex items-center justify-center shrink-0">
        <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

function ChatBubble({
  message,
  isLast,
  onRegenerate,
  isStreaming,
}: {
  message: { id: string; role: "user" | "assistant"; content: string };
  isLast: boolean;
  onRegenerate: () => void;
  isStreaming: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-primary text-primary-foreground px-3.5 py-2 text-sm">
          {message.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2"
    >
      <div className="h-7 w-7 rounded-md bg-gradient-primary flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="prose-chat text-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {message.content || " "}
          </ReactMarkdown>
        </div>
        {message.content && (!isStreaming || !isLast) && (
          <div className="flex items-center gap-1 mt-2">
            <button
              onClick={copy}
              className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-secondary/60 transition"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
            {isLast && (
              <button
                onClick={onRegenerate}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-secondary/60 transition"
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
