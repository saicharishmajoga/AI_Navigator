import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { LS_KEYS, readLS, writeLS } from "@/lib/storage";
import { useApp } from "./app-context";

const API_BASE = 
  (typeof window !== "undefined" ? (window as any).__API_BASE__ : undefined) ??
  import.meta.env.VITE_API_BASE ?? 
  import.meta.env.VITE_API_URL ?? 
  "http://localhost:8000";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export interface ChatThread {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
}

interface ChatContextValue {
  threads: ChatThread[];
  activeThreadId: string | null;
  activeThread: ChatThread | null;
  open: boolean;
  setOpen: (v: boolean) => void;
  newThread: () => string;
  selectThread: (id: string) => void;
  deleteThread: (id: string) => void;
  sendMessage: (text: string) => Promise<void>;
  regenerate: () => Promise<void>;
  isStreaming: boolean;
  pageContext: string | null;
  setPageContext: (v: string | null) => void;
}

const Ctx = createContext<ChatContextValue | null>(null);

// Mock streamed response based on the user prompt (no backend).
function buildMockReply(prompt: string, ctx: string | null): string {
  const p = prompt.toLowerCase();
  if (p.includes("langchain")) {
    return `**LangChain** is a framework for building applications powered by large language models. It provides:

- **Chains & Runnables** — composable LLM workflows
- **Agents** — let LLMs decide which tools to call
- **Memory** — preserve conversation state
- **200+ integrations** — vector stores, model providers, tools

A minimal example:

\`\`\`python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_template("Translate to French: {text}")
chain = prompt | ChatOpenAI()
print(chain.invoke({"text": "Hello world"}))
\`\`\`

Want me to compare it with LlamaIndex?`;
  }
  if (p.includes("compare") && p.includes("llamaindex")) {
    return `**LangChain vs LlamaIndex** — quick comparison:

| Aspect | LangChain | LlamaIndex |
| --- | --- | --- |
| Focus | General LLM apps | RAG & retrieval |
| Ecosystem | Vast | Focused |
| Learning curve | Steeper | Gentler for RAG |
| Best for | Agents, chains, integrations | Document Q&A, search |

**Rule of thumb:** start with LlamaIndex for pure RAG, reach for LangChain when you need agents or many integrations.`;
  }
  if (p.includes("rag")) {
    return `For **RAG**, the typical stack is:

1. **Embeddings** — OpenAI \`text-embedding-3-large\` or open-source (BGE, E5)
2. **Vector DB** — Pinecone (managed), Chroma (local), Qdrant (self-host)
3. **Retrieval layer** — LlamaIndex or LangChain
4. **LLM** — GPT-4, Claude, or local via Ollama

Start small: Chroma + LlamaIndex + any LLM is a great prototype.`;
  }
  if (p.includes("ollama")) {
    return `**Ollama** runs LLMs locally via a single binary.

\`\`\`bash
ollama pull llama3
ollama run llama3
\`\`\`

It exposes an **OpenAI-compatible API** at \`http://localhost:11434\`, so any SDK targeting OpenAI can be pointed at it. Great for privacy-first or offline development.`;
  }
  return `Great question${ctx ? ` about **${ctx}**` : ""}!

Here's a focused answer based on what's most useful:

- The AI tooling space changes weekly — focus on the **primitives** (embeddings, retrieval, agents) over specific libraries.
- For most RAG use cases, **LlamaIndex + Chroma** is the fastest path.
- For agents and rich integrations, **LangChain** + **LangSmith** for observability.
- For local-first development, **Ollama** is the easiest entry point.

Ask me to dive deeper on any of these.`;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, authToken } = useApp();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pageContext, setPageContext] = useState<string | null>(null);

  // Hydrate threads and handle guest-to-user migration on login
  useEffect(() => {
    const guestKey = `${LS_KEYS.threads}.guest`;
    const guestThreads = readLS<ChatThread[]>(guestKey, []);

    if (user) {
      const userKey = `${LS_KEYS.threads}.${user.id}`;
      const userThreads = readLS<ChatThread[]>(userKey, []);

      if (guestThreads.length > 0) {
        // Migrate guest threads to user account on login
        const merged = [...guestThreads, ...userThreads];
        
        // Save merged threads under user
        writeLS(userKey, merged);
        setThreads(merged);
        setActiveThreadId(guestThreads[0]?.id || userThreads[0]?.id || null);

        // Clear guest threads so they are not migrated repeatedly
        writeLS(guestKey, []);
      } else {
        setThreads(userThreads);
        setActiveThreadId(userThreads[0]?.id ?? null);
      }
    } else {
      // Ephemeral / Guest threads load
      setThreads(guestThreads);
      setActiveThreadId(guestThreads[0]?.id ?? null);
    }
  }, [user]);

  // Persist threads dynamically based on current user session
  useEffect(() => {
    const key = user ? `${LS_KEYS.threads}.${user.id}` : `${LS_KEYS.threads}.guest`;
    writeLS(key, threads);
  }, [threads, user]);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) ?? null,
    [threads, activeThreadId],
  );

  const newThread = useCallback(() => {
    const id = crypto.randomUUID();
    const thread: ChatThread = {
      id,
      title: "New conversation",
      updatedAt: Date.now(),
      messages: [],
    };
    if (user) {
      setThreads((ts) => [thread, ...ts]);
    } else {
      // anonymous → keep only one ephemeral thread
      setThreads([thread]);
    }
    setActiveThreadId(id);
    return id;
  }, [user]);

  const selectThread = useCallback((id: string) => setActiveThreadId(id), []);

  const deleteThread = useCallback(
    (id: string) => {
      setThreads((ts) => {
        const next = ts.filter((t) => t.id !== id);
        if (id === activeThreadId) setActiveThreadId(next[0]?.id ?? null);
        return next;
      });
    },
    [activeThreadId],
  );

  const streamReply = useCallback(
    async (threadId: string, prompt: string) => {
      setIsStreaming(true);
      const assistantId = crypto.randomUUID();
      
      // insert empty assistant message
      setThreads((ts) =>
        ts.map((t) =>
          t.id === threadId
            ? {
                ...t,
                messages: [
                  ...t.messages,
                  { id: assistantId, role: "assistant", content: "", createdAt: Date.now() },
                ],
              }
            : t,
        ),
      );

      try {
        const response = await fetch(`${API_BASE}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({
            query: prompt,
            history: [],
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to stream answer from AI Navigator server.");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) {
          throw new Error("Response body is not readable.");
        }

        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          acc += chunk;
          
          setThreads((ts) =>
            ts.map((t) =>
              t.id === threadId
                ? {
                    ...t,
                    messages: t.messages.map((m) =>
                      m.id === assistantId ? { ...m, content: acc } : m,
                    ),
                  }
                : t,
            ),
          );
        }
      } catch (error: any) {
        console.error("Chat streaming error:", error);
        setThreads((ts) =>
          ts.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          content: `\n\n*Error: Could not connect to AI Navigator assistant server. Please verify the backend is running.*`,
                        }
                      : m,
                  ),
                }
              : t,
          ),
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [authToken],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;
      let id = activeThreadId;
      if (!id) id = newThread();

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
        createdAt: Date.now(),
      };
      setThreads((ts) =>
        ts.map((t) =>
          t.id === id
            ? {
                ...t,
                title: t.messages.length === 0 ? text.trim().slice(0, 48) : t.title,
                updatedAt: Date.now(),
                messages: [...t.messages, userMsg],
              }
            : t,
        ),
      );
      await streamReply(id, text.trim());
    },
    [activeThreadId, isStreaming, newThread, streamReply],
  );

  const regenerate = useCallback(async () => {
    if (!activeThread || isStreaming) return;
    const lastUser = [...activeThread.messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    // drop trailing assistant message
    setThreads((ts) =>
      ts.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              messages:
                t.messages[t.messages.length - 1]?.role === "assistant"
                  ? t.messages.slice(0, -1)
                  : t.messages,
            }
          : t,
      ),
    );
    await streamReply(activeThread.id, lastUser.content);
  }, [activeThread, isStreaming, streamReply]);

  const value: ChatContextValue = {
    threads,
    activeThreadId,
    activeThread,
    open,
    setOpen,
    newThread,
    selectThread,
    deleteThread,
    sendMessage,
    regenerate,
    isStreaming,
    pageContext,
    setPageContext,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useChat() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useChat must be used inside ChatProvider");
  return ctx;
}
