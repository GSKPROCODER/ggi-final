'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Bot, Send, User, ChevronDown, ChevronRight, Sparkles, Loader2, KeySquare } from 'lucide-react';
import { agentApi, type AgentMessage, type AgentLog } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// react-markdown is ~25KB+ — only loaded for assistant messages, never for the
// initial empty-state render.
const ReactMarkdown = dynamic(() => import('react-markdown'), {
  ssr: false,
  loading: () => <span className="text-muted-foreground text-sm">Rendering…</span>,
});

export default function AgentChat() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeLogs, setActiveLogs] = useState<AgentLog[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: AgentMessage = { role: 'user', content: input.trim() };
    const newContext = [...messages, userMsg];
    
    setMessages(newContext);
    setInput('');
    setIsTyping(true);
    setActiveLogs([]);

    try {
      const res = await agentApi.chat(newContext);
      
      const assistantMsg: AgentMessage = { role: 'assistant', content: res.message };
      setMessages(prev => [...prev, assistantMsg]);
      setActiveLogs(res.thought_process);
    } catch (err) {
      const errorMsg: AgentMessage = { role: 'assistant', content: "⚠️ Critical Error: The Nexus Agent failed to process the request. Please verify the backend LangGraph connection." };
      setMessages(prev => [...prev, errorMsg]);
      toast.error(err instanceof Error ? err.message : 'Agent request failed.');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] w-full py-6 px-5 md:px-6 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header */}
      <div className="flex flex-col gap-1 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              Nexus Agent
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase tracking-widest">DeepMind RAG</span>
            </h1>
            <p className="text-muted-foreground text-sm font-medium">Autonomous Database Researcher & Self-Critical Synthesizer</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 glass-card rounded-2xl border border-border/40 overflow-hidden flex flex-col relative shadow-2xl">
        
        {messages.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none">
            <Bot size={48} className="text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">How can I assist your analysis?</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              I have direct SQL read-access to your dataset records. Ask me to find trends, summarize negative feedback, or discover the correlation between risk levels and emotion.
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
          <AnimatePresence>
            {messages.map((m, idx) => (
              <motion.div
                key={idx}
                initial={reduce ? false : { opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex gap-4 max-w-[85%]', m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto')}
              >
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center shrink-0 border relative z-10',
                  m.role === 'user' ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-secondary border-border shadow-lg shadow-black/20'
                )}>
                  {m.role === 'user' ? <User size={18} /> : <Bot size={18} className="text-indigo-400" />}
                </div>

                <div className="group relative">
                  <div className={cn(
                    'p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
                    m.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-xl shadow-primary/20'
                      : 'glass-card border border-border/50 text-foreground/90 rounded-tl-sm'
                  )}>
                    {m.role === 'assistant' ? (
                      <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-border/50">
                        <ReactMarkdown>
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>

                  {m.role === 'assistant' && activeLogs.length > 0 && idx === messages.length - 1 && (
                     <div className="mt-3">
                        <ThoughtProcess logs={activeLogs} />
                     </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 max-w-[85%] mr-auto">
                <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 shadow-lg shadow-black/20">
                  <Loader2 size={18} className="text-indigo-400 animate-spin" />
                </div>
                <div className="glass-card border border-border/50 p-4 rounded-2xl rounded-tl-sm text-sm text-muted-foreground flex items-center gap-3">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 animate-bounce delay-100" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 animate-bounce delay-200" />
                  </span>
                  Synthesizing & running self-critique...
                </div>
             </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-4 bg-background/50 border-t border-border/40 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="flex items-end gap-3 max-w-4xl mx-auto">
             <div className="flex-1 bg-secondary/50 border border-border/60 hover:border-primary/40 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all rounded-2xl overflow-hidden shadow-inner">
               <textarea
                 value={input}
                 onChange={e => setInput(e.target.value)}
                 onKeyDown={e => {
                   if (e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     handleSubmit(e);
                   }
                 }}
                 placeholder="Ask the DeepMind agent to query your dataset..."
                 className="w-full bg-transparent p-4 min-h-[56px] max-h-[200px] outline-none resize-none text-sm placeholder:text-muted-foreground/60"
                 rows={1}
               />
             </div>
             <button
               type="submit"
               disabled={!input.trim() || isTyping}
               className="w-14 h-14 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary/20 active:scale-95"
             >
               <Send size={20} className="mr-0.5 ml-0.5" />
             </button>
          </form>
          <div className="text-center mt-3">
             <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest flex items-center justify-center gap-1.5 opacity-60">
                <KeySquare size={12} /> Powered by LangGraph & Gemini 2.5 Flash
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Collapsible Thought Process Component to show the exact SQL Run and Critic evaluations
function ThoughtProcess({ logs }: { logs: AgentLog[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2 text-xs w-full max-w-sm">
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-1 px-2 rounded-lg hover:bg-secondary/50 font-medium"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        View Agent Thought Process ({logs.length} steps)
      </button>

      <AnimatePresence>
        {open && (
           <motion.div
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: 'auto', opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             className="overflow-hidden mt-2"
           >
             <div className="bg-black/50 border border-border/50 rounded-xl p-3 space-y-2.5 font-mono">
               {logs.map((log, i) => (
                 <div key={i} className="flex flex-col gap-1 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                   <span className={cn(
                     "text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded w-max",
                     log.type === "thought" ? "bg-blue-500/20 text-blue-400" :
                     log.type === "tool_result" ? "bg-emerald-500/20 text-emerald-400" :
                     log.type === "critique" ? "bg-amber-500/20 text-amber-400" :
                     "bg-white/10 text-white/70"
                   )}>
                     {log.type.replace('_', ' ')}
                   </span>
                   <span className="text-white/80 whitespace-pre-wrap leading-relaxed">{log.content}</span>
                 </div>
               ))}
             </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
