import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Terminal as TerminalIcon,
  Maximize2,
  Minimize2,
} from "lucide-react";

let commands: Promise<typeof import("./terminalCommands")> | undefined;
function loadCommands() {
  return commands ??= import("./terminalCommands").catch(error => {
    commands = undefined;
    throw error;
  });
}
const prefetchCommands = () => { void loadCommands().catch(() => {}); };

interface CommandOutput {
  id: number;
  type: "command" | "response" | "error";
  content: React.ReactNode;
}

const Terminal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<CommandOutput[]>([
    {
      id: 0,
      type: "response",
      content: (
        <div className="mb-2">
          <p>Welcome to Abdelrahman's Portfolio Terminal v1.0.0</p>
          <p>
            I am a conversational AI. Type{" "}
            <span className="text-green-400">help</span> for commands, or just
            chat with me.
          </p>
        </div>
      ),
    },
  ]);
  const nextId = useRef(1);
  const historyRevision = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (isOpen) prefetchCommands();
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    const command = trimmed.toLowerCase();
    if (command === "clear") {
      historyRevision.current++;
      setHistory([]);
      return;
    }
    if (command === "exit") {
      setIsOpen(false);
      return;
    }

    const revision = historyRevision.current;
    const id = nextId.current;
    nextId.current += 2;
    const append = (response: React.ReactNode) => {
      if (revision !== historyRevision.current) return;
      setHistory(previous => [
        ...previous,
        { id, type: "command", content: `guest@portfolio:~$ ${cmd}` },
        { id: id + 1, type: "response", content: response },
      ]);
    };
    void loadCommands().then(
      ({ respondToCommand }) => append(respondToCommand(trimmed)),
      () => append(<span className="text-red-400">Terminal commands could not load. Try again.</span>),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleCommand(input);
    setInput("");
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 group">
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Ctrl + K
        </div>
        <button
          onClick={() => setIsOpen(true)}
          onPointerEnter={prefetchCommands}
          onPointerDown={prefetchCommands}
          onFocus={prefetchCommands}
          className="p-3 bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-all duration-300"
          aria-label="Open Terminal"
        >
          <TerminalIcon className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        className={`bg-[#0c0c0c] border border-white/20 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] w-full transition-all duration-300 flex flex-col font-mono text-sm md:text-base ${
          isMaximized ? "h-[95vh] w-[95vw]" : "max-w-2xl h-[600px]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 cursor-pointer"
              onClick={() => setIsOpen(false)}
            />
            <div
              className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 cursor-pointer"
              onClick={() => setIsMaximized(!isMaximized)}
            />
            <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 cursor-pointer" />
            <span className="ml-2 text-white/60 text-xs">
              guest@abozena-portfolio:~
            </span>
          </div>
          <div className="flex items-center gap-3 text-white/40">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="hover:text-white"
            >
              {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto p-4 text-white/90 selection:bg-white/20"
          ref={scrollRef}
          onClick={handleTerminalClick}
        >
          {history.map((entry) => (
            <div key={entry.id} className="mb-2 break-words">
              {entry.content}
            </div>
          ))}

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <span className="text-green-400 shrink-0">guest@portfolio:~$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-white focus:ring-0 p-0"
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default Terminal;
