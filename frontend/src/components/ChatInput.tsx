import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  // Auto-focus when message is cleared (after sending)
  useEffect(() => {
    if (message === "" && !disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [message, disabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/30">
      <form 
        onSubmit={handleSubmit}
        className="flex items-end gap-3 px-4 py-3 max-w-lg mx-auto"
      >
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Say anything… describe how you want me to be"
            disabled={disabled}
            rows={1}
            className="w-full bg-secondary/50 border border-border/50 rounded-2xl px-4 py-3 pr-4 text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 resize-none transition-all font-body disabled:opacity-50 scrollbar-hide"
          />
        </div>
        
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-primary to-blush flex items-center justify-center shadow-glow transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          aria-label="Send message"
        >
          <Send className="w-5 h-5 text-primary-foreground" />
        </button>
      </form>
      
      {/* Safe area for mobile */}
      <div className="h-safe-area-inset-bottom bg-background" />
    </div>
  );
};

export default ChatInput;
