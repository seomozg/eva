import { useState } from "react";
import { Send } from "lucide-react";
import { t } from "@/lib/i18n";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/30">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 py-3 max-w-lg mx-auto"
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('chat_input_placeholder')}
          disabled={disabled}
          className="flex-1 bg-secondary/50 border border-border/30 rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 active:scale-95 transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </footer>
  );
};

export default ChatInput;