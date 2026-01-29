import { X, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import avatarAlina from "@/assets/avatar-alina.jpg";

interface MiniProfileProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  personality: string;
  appearance?: string;
  avatarUrl?: string;
  onCreateNew?: () => void;
}

const MiniProfile = ({ isOpen, onClose, name, personality, appearance, avatarUrl, onCreateNew }: MiniProfileProps) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  // Personality is already formatted as string
  const formatPersonality = (personality: string) => {
    return personality;
  };

  const handleCreateNew = () => {
    onClose();
    navigate('/dashboard');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-24 -translate-x-1/2 z-50 w-[90%] max-w-[380px] max-h-[80vh] overflow-y-auto animate-scale-in">
        <div className="bg-gradient-to-b from-card to-popover rounded-3xl border border-border/30 shadow-soft overflow-hidden">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full hover:bg-secondary/50 transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-primary/20 blur-3xl" />

          <div className="relative px-6 pt-8 pb-6 flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-primary/20 ring-offset-4 ring-offset-card mb-4 shadow-glow">
              <img
                src={avatarUrl ? avatarUrl : avatarAlina}
                alt={name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = avatarAlina;
                }}
              />
            </div>

            {/* Name */}
            <h2 className="font-display text-2xl font-medium text-foreground mb-1">
              {name}
            </h2>

            {/* Appearance */}
            {appearance && (
              <div className="mb-4">
                <h3 className="text-xs font-medium text-primary/80 uppercase tracking-wide mb-1">Appearance</h3>
                <p className="text-sm text-muted-foreground leading-relaxed break-words">
                  {appearance}
                </p>
              </div>
            )}

            {/* Personality */}
            <div className="mb-6">
              <h3 className="text-xs font-medium text-primary/80 uppercase tracking-wide mb-1">Personality</h3>
              <p className="text-sm text-muted-foreground capitalize break-words">
                {formatPersonality(personality)}
              </p>
            </div>

            {/* Stats or extra info could go here */}
            <div className="flex items-center gap-2 text-xs text-primary/80 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Your special someone</span>
            </div>


          </div>
        </div>
      </div>
    </>
  );
};

export default MiniProfile;
