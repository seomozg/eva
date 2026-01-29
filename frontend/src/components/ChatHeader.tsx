import { Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getImageUrl } from "@/lib/api";
import avatarAlina from "@/assets/avatar-alina.jpg";

interface ChatHeaderProps {
  name: string;
  status: string;
  avatarUrl?: string;
  onAvatarClick: () => void;
}

const ChatHeader = ({ name, status, avatarUrl, onAvatarClick }: ChatHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
      <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">

        <button
          onClick={onAvatarClick}
          className="relative group"
          aria-label="View profile"
        >
          <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-primary/30 ring-offset-2 ring-offset-background transition-all group-hover:ring-primary/60">
            <img
              src={avatarUrl ? getImageUrl(avatarUrl) : avatarAlina}
              alt={name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = avatarAlina;
              }}
            />
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-background" />
        </button>

        <div className="flex flex-col min-w-0 flex-1">
          <h1 className="font-display text-lg font-medium text-foreground truncate">
            {name}
          </h1>
          <p className="text-xs text-primary animate-pulse-soft truncate">
            {status}
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
          aria-label="Go to dashboard"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
