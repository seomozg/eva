import { X, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageType } from "@/components/MessageBubble";
import { getImageUrl } from "@/lib/api";
import { useEffect, useCallback } from "react";

interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  type: MessageType;
}

const MediaViewer = ({ isOpen, onClose, mediaUrl, type }: MediaViewerProps) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/95 backdrop-blur-sm",
        "flex items-center justify-center",
        "animate-fade-in"
      )}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        aria-label="Close"
      >
        <X className="w-6 h-6 text-white" />
      </button>
      
      {/* Media content */}
      <div
        className="max-w-[90vw] max-h-[90vh] relative flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {type === "image" && (
        <img
          src={mediaUrl.startsWith('http') ? mediaUrl : getImageUrl(mediaUrl)}
          alt="Media content"
          className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl"
          style={{ maxWidth: '90vw', maxHeight: '90vh' }}
        />
        )}

        {type === "video" && (
          <div className="relative group">
            <video
              src={getImageUrl(mediaUrl)}
              controls
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-slide-up"
              poster="" // Optional: can add thumbnail later
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaViewer;
