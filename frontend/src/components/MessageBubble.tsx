import { Play, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/api";
import videoThumbnail from "@/assets/video-thumbnail.jpg";

export type MessageType = "text" | "image" | "video";
export type MessageSender = "user" | "her";

export interface Message {
  id: string;
  type: MessageType;
  sender: 'user' | 'her';
  content: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  timestamp?: Date;
}

interface MessageBubbleProps {
  message: Message;
  onMediaClick?: (mediaUrl: string, type: MessageType) => void;
  onCreateVideo?: (imageUrl: string, contextMessage?: string) => void;
}

const MessageBubble = ({ message, onMediaClick, onCreateVideo }: MessageBubbleProps) => {
  const isUser = message.sender === "user";
  
  return (
    <div
      className={cn(
        "flex w-full animate-fade-in",
        isUser ? "justify-end" : "justify-start"
      )}
      style={{ animationDelay: "0.1s" }}
    >
      <div
        className={cn(
          message.type === "video" ? "max-w-[90%]" : "max-w-[80%]",
          "relative",
          message.type === "text" ? "px-4 py-2.5" : "p-1",
          message.type === "text" && (
            isUser
              ? "bg-gradient-to-br from-primary to-blush text-primary-foreground rounded-bubble rounded-br-md shadow-bubble"
              : "bg-gradient-to-br from-card to-secondary text-foreground rounded-bubble rounded-bl-md shadow-bubble border border-border/30"
          ),
          (message.type === "image" || message.type === "video") && (
            "rounded-2xl overflow-hidden shadow-bubble"
          )
        )}
      >
        {message.type === "text" && (
          <p className="text-[15px] leading-relaxed font-body">
            {message.content}
          </p>
        )}
        
        {message.type === "image" && (
          <div className="relative group">
            <button
              onClick={() => onMediaClick?.(message.mediaUrl!, "image")}
              className="block"
            >
              <img
                src={message.mediaUrl ? getImageUrl(message.mediaUrl) : undefined}
                alt="Shared photo"
                className="w-full max-w-[240px] rounded-xl object-cover transition-transform group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            {/* Create Video Button - only for images from "her" */}
            {!isUser && onCreateVideo && (
              <button
                onClick={() => onCreateVideo(message.mediaUrl!)}
                className="absolute bottom-2 right-2 w-8 h-8 bg-primary/90 hover:bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
                title="Create video from this image"
              >
                <Video className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        
        {message.type === "video" && (
          <button
            onClick={() => onMediaClick?.(message.mediaUrl!, "video")}
            className="block relative group"
          >
            <img
              src={message.thumbnailUrl ? getImageUrl(message.thumbnailUrl) : videoThumbnail}
              alt="Video thumbnail"
              className="w-[240px] h-[240px] rounded-xl object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 text-white fill-white ml-1" />
              </div>
            </div>
          </button>
        )}
        
        {message.timestamp && (
          <span
            className={cn(
              "text-[10px] mt-1 block",
              isUser ? "text-primary-foreground/70 text-right" : "text-muted-foreground"
            )}
          >
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
