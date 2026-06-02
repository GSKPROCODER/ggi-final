'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Bot, Send, User, Loader2 } from 'lucide-react';
import { agentApi, type AgentMessage } from '@/lib/api';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    try {
      const res = await agentApi.chat(newContext);
      const assistantMsg: AgentMessage = { role: 'assistant', content: res.message };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: AgentMessage = { role: 'assistant', content: "Something went wrong processing your request. Please try again." };
      setMessages(prev => [...prev, errorMsg]);
      toast.error(err instanceof Error ? err.message : 'Agent request failed.');
    } finally {
      setIsTyping(false);
    }
  };

  const suggestions = [
    'What is the overall sentiment?',
    'Show top 5 highest risk records',
    'What emotions appear most often?',
    'Summarize negative feedback trends',
  ];

  return (
    <div
      className="flex flex-col w-full"
      style={{ height: 'calc(100svh - 3.5rem - 3.5rem)', maxHeight: 'calc(100svh - 3.5rem - 3.5rem)' }}
    >
      {/* Chat Area — fills all available space, edge-to-edge like Gemini/Claude */}
      <div className="flex-1 bg-card/30 overflow-hidden flex flex-col relative min-h-0">

        {messages.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pb-24 pointer-events-none">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 flex items-center justify-center mb-4">
              <Bot size={28} className="text-indigo-400" />
            </div>
            <h3 className="text-xl md:text-2xl font-semibold mb-2">How can I help?</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              I have live SQL access to your dataset. Ask me anything about your records.
            </p>
            <div className="flex flex-wrap gap-2 justify-center pointer-events-auto">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); }}
                  className="px-3 py-1.5 rounded-full border border-border/60 bg-secondary/50 hover:bg-secondary hover:border-primary/40 text-sm text-muted-foreground hover:text-foreground transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-3 py-4 md:px-6 md:py-6 space-y-4 md:space-y-6 scroll-smooth scroll-touch">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={cn('flex gap-2 md:gap-4 max-w-[90%] md:max-w-[85%]', m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto')}
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
                        <ReactMarkdown skipHtml>
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>

                </div>
              </div>
            ))}

          {isTyping && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0">
                <Loader2 size={15} className="text-muted-foreground animate-spin" />
              </div>
              <div className="glass-card border border-border/50 px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-muted-foreground">
                Thinking…
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="px-3 py-3 md:px-6 md:py-4 border-t border-border/30 bg-card/60 backdrop-blur-xl shrink-0">
          <form onSubmit={handleSubmit} className="flex items-end gap-2 md:gap-3 max-w-3xl mx-auto">
             <div className="flex-1 bg-secondary/50 border border-border/60 hover:border-primary/40 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all rounded-2xl overflow-hidden shadow-inner">
               <textarea
                 value={input}
                 onChange={e => setInput(e.target.value)}
                 onKeyDown={e => {
                   if (e.key === 'Enter' && !e.shiftKey && !isTyping) {
                     e.preventDefault();
                     handleSubmit(e);
                   }
                 }}
                 placeholder="Ask the agent to query your dataset..."
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
          <p className="text-center mt-2 text-[10px] text-muted-foreground/50 uppercase tracking-widest">
            Powered by Gemini 2.5 Flash
          </p>
        </div>
      </div>
    </div>
  );
}
