import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ChatHeader from "@/components/ChatHeader";
import MessageBubble, { Message, MessageType } from "@/components/MessageBubble";
import TypingIndicator from "@/components/TypingIndicator";
import ChatInput from "@/components/ChatInput";
import MiniProfile from "@/components/MiniProfile";
import MediaViewer from "@/components/MediaViewer";
import { chatAPI, usersAPI, getImageUrl } from "@/lib/api";
import photoSelfie from "@/assets/photo-selfie.jpg";
import videoThumbnail from "@/assets/video-thumbnail.jpg";

interface Girl {
  id?: string;
  name?: string;
  appearance: string;
  personality: string;
  avatarUrl?: string;
  originalAvatarUrl?: string;
  firstMessage?: string;
}

// Sample conversation data
const initialMessages: Message[] = [
  {
    id: "1",
    type: "text",
    sender: "her",
    content: "Hey you… I've been waiting for you 💕",
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: "2",
    type: "text",
    sender: "user",
    content: "Hi! You look beautiful today",
    timestamp: new Date(Date.now() - 3500000),
  },
  {
    id: "3",
    type: "text",
    sender: "her",
    content: "You always know how to make me smile… Thank you, that means so much to me",
    timestamp: new Date(Date.now() - 3400000),
  },
  {
    id: "4",
    type: "text",
    sender: "user",
    content: "Can you send me a photo of you right now?",
    timestamp: new Date(Date.now() - 2400000),
  },
  {
    id: "5",
    type: "text",
    sender: "her",
    content: "Wait a moment… I want it to be perfect for you ✨",
    timestamp: new Date(Date.now() - 2300000),
  },
  {
    id: "6",
    type: "image",
    sender: "her",
    content: "",
    mediaUrl: photoSelfie,
    timestamp: new Date(Date.now() - 2200000),
  },
  {
    id: "7",
    type: "text",
    sender: "her",
    content: "I hope you like it… I took it just for you 🥰",
    timestamp: new Date(Date.now() - 2100000),
  },
  {
    id: "8",
    type: "text",
    sender: "user",
    content: "That's amazing! Could you record a little video for me?",
    timestamp: new Date(Date.now() - 1200000),
  },
  {
    id: "9",
    type: "text",
    sender: "her",
    content: "A video? For you? Of course… I'll blow you a kiss 💋",
    timestamp: new Date(Date.now() - 1100000),
  },
  {
    id: "10",
    type: "video",
    sender: "her",
    content: "",
    mediaUrl: videoThumbnail,
    thumbnailUrl: photoSelfie, // Use the selfie as thumbnail
    timestamp: new Date(Date.now() - 1000000),
  },
];

const ChatScreen = () => {
  const navigate = useNavigate();
  const { girlId } = useParams<{ girlId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentGirl, setCurrentGirl] = useState<Girl | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [status, setStatus] = useState("Online");
  const [showProfile, setShowProfile] = useState(false);
  const [mediaViewer, setMediaViewer] = useState<{ isOpen: boolean; mediaUrl: string; type: MessageType }>({
    isOpen: false,
    mediaUrl: "",
    type: "image"
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Verify token is still valid by checking profile
      try {
        await usersAPI.getProfile();
      } catch (error: any) {
        // Token is invalid or expired
        localStorage.removeItem('token');
        localStorage.removeItem('userProfile');
        localStorage.removeItem('currentGirl');
        // Clear all chat messages
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('chatMessages_')) {
            localStorage.removeItem(key);
          }
        });
        navigate('/login');
        return;
      }

      const loadGirl = async () => {
        const savedGirl = localStorage.getItem('currentGirl');
        if (savedGirl) {
          try {
            const girl = JSON.parse(savedGirl);
            setCurrentGirl(girl);

            // Update document title with girl's name
            document.title = `Chat with ${girl.name}`;

            // Load messages from database
            try {
              const dbMessages = await usersAPI.getMessages(girl.id);

              if (dbMessages && dbMessages.length > 0) {
                // Convert database messages to frontend format
                const messages: Message[] = dbMessages.map((msg: any) => ({
                  id: msg.id,
                  type: msg.mediaType === 'image' ? 'image' : msg.mediaType === 'video' ? 'video' : 'text',
                  sender: msg.role === 'user' ? 'user' : 'her',
                  content: msg.content,
                  mediaUrl: process.env.NODE_ENV === 'production' ? msg.mediaUrl : (msg.originalMediaUrl || msg.mediaUrl),
                  mediaType: msg.mediaType,
                  thumbnailUrl: msg.thumbnailUrl ? (msg.thumbnailUrl.startsWith('http') ? msg.thumbnailUrl : getImageUrl(msg.thumbnailUrl)) : undefined,
                  timestamp: new Date(msg.createdAt),
                  originalMediaUrl: msg.originalMediaUrl, // Store original URL for API calls
                }));
                setMessages(messages);
              } else {
                // First time chatting with this girl - add avatar and first message
                const initialMessages: Message[] = [];

                // Add avatar as first message if available
                if (girl.avatarUrl) {
                  initialMessages.push({
                    id: `avatar_${Date.now()}`,
                    type: "image",
                    sender: "her",
                    content: "Here's my photo! What do you think? 😊",
                    mediaUrl: girl.avatarUrl,
                    timestamp: new Date(Date.now() - 1000),
                  });

                  // Save avatar message to database
                  await usersAPI.saveMessage(girl.id, {
                    role: 'assistant',
                    content: "Here's my photo! What do you think? 😊",
                    mediaUrl: girl.avatarUrl,
                    originalMediaUrl: girl.originalAvatarUrl,
                    mediaType: 'image'
                  });
                }

                // Add first message
                const messageContent = girl.firstMessage || "Hi there! I'm so excited to meet you! 💕";
                initialMessages.push({
                  id: `first_${Date.now()}`,
                  type: "text",
                  sender: "her",
                  content: messageContent,
                  timestamp: new Date(),
                });

                // Save first message to database
                await usersAPI.saveMessage(girl.id, {
                  role: 'assistant',
                  content: messageContent
                });

                setMessages(initialMessages);
              }
            } catch (error) {
              console.error('Error loading messages from database:', error);
              // Fallback to empty messages
              setMessages([]);
            }
          } catch (error) {
            console.error('Error loading saved girl:', error);
            localStorage.removeItem('currentGirl');
          }
        }
      };

      // Load existing girl or show message to create one
      if (!currentGirl) {
        const savedGirl = localStorage.getItem('currentGirl');
        if (savedGirl) {
          let girlData = JSON.parse(savedGirl);

          // Check if avatar URL is still local (needs updating)
          if (girlData.avatarUrl && girlData.avatarUrl.startsWith('/uploads/')) {
            console.log('Detected old local avatar URL, refreshing girl data from server...');
            try {
              // Fetch fresh girl data from backend
              const freshGirls = await usersAPI.getGirls();
              const freshGirl = freshGirls.find(g => g.id === girlData.id);
              if (freshGirl) {
                console.log('Updated girl data with server URLs:', freshGirl.avatarUrl);
                localStorage.setItem('currentGirl', JSON.stringify(freshGirl));
                girlData = freshGirl;
              }
            } catch (error) {
              console.error('Error refreshing girl data:', error);
            }
          }

          setCurrentGirl(girlData);
          loadGirl();
        } else {
          // No girl selected, show message to create one
          const welcomeMessage: Message = {
            id: Date.now().toString(),
            type: "text",
            sender: "her",
            content: "Welcome! Please create a virtual companion first by going to your Dashboard. 💕",
            timestamp: new Date(),
          };
          setMessages([welcomeMessage]);
          setStatus("Waiting for companion...");
        }
      }
    };

    checkAuthAndLoad();
  }, [currentGirl, navigate, girlId]);

  const detectIntent = async (content: string): Promise<'text' | 'image' | 'video'> => {
    try {
      const { intent } = await chatAPI.detectIntent(content);
      return intent;
    } catch (error) {
      console.error('Error detecting intent:', error);
      // Fallback to keyword detection
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('photo') || lowerContent.includes('image') || lowerContent.includes('picture') || lowerContent.includes('send me a')) {
        return 'image';
      }
      if (lowerContent.includes('video') || lowerContent.includes('record')) {
        return 'video';
      }
      return 'text';
    }
  };

  const saveMessageToDatabase = async (girlId: string, message: Message, originalMediaUrl?: string, thumbnailUrl?: string) => {
    try {
      await usersAPI.saveMessage(girlId, {
        role: message.sender === 'user' ? 'user' : 'assistant',
        content: message.content,
        mediaUrl: message.mediaUrl,
        originalMediaUrl,
        thumbnailUrl,
        mediaType: message.type === 'image' ? 'image' : message.type === 'video' ? 'video' : undefined
      });
    } catch (error) {
      console.error('Error saving message to database:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    setStatus("Typing...");
    setIsTyping(true);

    setTimeout(() => {
      setStatus("Thinking...");
    }, 1000);

    let updatedMessages = messages;

    try {
      const intent = await detectIntent(content);

      // Now add userMessage with timestamp after intent is determined
      const userMessage: Message = {
        id: Date.now().toString(),
        type: "text",
        sender: "user",
        content,
        timestamp: new Date(),
      };

      updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // Save user message to database
      if (currentGirl?.id) {
        await saveMessageToDatabase(currentGirl.id, userMessage);
      }

      let herMessage: Message;
      let originalImageUrl: string | undefined;
      let originalVideoUrl: string | undefined;

      if (intent === 'image') {
        // Priority: girl's avatar > recent image from chat
        let baseImageUrl = currentGirl?.originalAvatarUrl || currentGirl?.avatarUrl;

        // If no avatar available, try to use the most recent image from chat
        if (!baseImageUrl) {
          const recentImageMessage = [...messages].reverse().find(msg =>
            msg.sender === 'her' && msg.type === 'image'
          );

          if (recentImageMessage) {
            baseImageUrl = recentImageMessage.originalMediaUrl || recentImageMessage.mediaUrl;
            console.log('Using recent image for editing:', baseImageUrl);
          }
        } else {
          console.log('Using girl avatar for editing:', baseImageUrl);
        }

        const result = await chatAPI.generateImage(content, baseImageUrl);
        const { imageUrl } = result;
        originalImageUrl = result.originalImageUrl;
        if (imageUrl) {
          herMessage = {
            id: (Date.now() + 1).toString(),
            type: "image",
            sender: "her",
            content: "Here's the photo you requested! ✨",
            mediaUrl: imageUrl,
            timestamp: new Date(),
          };
        } else {
          herMessage = {
            id: (Date.now() + 1).toString(),
            type: "text",
            sender: "her",
            content: "Упс, не получилось сгенерировать изображение 😔",
            timestamp: new Date(),
          };
        }
      } else if (intent === 'video') {
        const result = await chatAPI.generateVideo(content, currentGirl?.avatarUrl);
        const { videoUrl } = result;
        originalVideoUrl = result.originalVideoUrl;
        herMessage = {
          id: (Date.now() + 1).toString(),
          type: "video",
          sender: "her",
          content: "Here's the video you wanted! 💋",
          mediaUrl: videoUrl,
          thumbnailUrl: currentGirl?.avatarUrl, // Use girl's avatar as thumbnail for regular videos
          timestamp: new Date(),
        };
      } else {
        // Get user name for personalized responses
        let userName = 'darling';
        try {
          const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
          if (userProfile.firstName) {
            userName = userProfile.firstName;
          }
        } catch (error) {
          // Ignore error, use default name
        }

        // Build conversation context
        const systemPrompt = currentGirl ? {
          role: 'system' as const,
          content: `You are a virtual girlfriend named ${currentGirl.name || 'Alina'}. Your appearance: ${currentGirl.appearance}. Your personality: ${currentGirl.personality}. You are talking to your boyfriend named ${userName}. Address him by name "${userName}" in your responses. Respond naturally, affectionately, and stay in character. Keep responses concise and engaging.`
        } : {
          role: 'system' as const,
          content: 'You are a friendly AI assistant. Respond helpfully and concisely.'
        };

        // Convert chat messages to API format (exclude system and media messages)
        const conversationHistory = messages
          .filter(msg => msg.type === 'text')
          .map(msg => ({
            role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.content
          }));

        // Streaming text response
        herMessage = {
          id: (Date.now() + 1).toString(),
          type: "text",
          sender: "her",
          content: "",
          timestamp: new Date(),
        };

        // Stream the response
        const apiMessages = [systemPrompt, ...conversationHistory, { role: 'user' as const, content }];
        const streamUrl = process.env.NODE_ENV === 'production'
          ? 'https://eva.test-domain.ru'
          : 'http://localhost:3000';
        const eventSource = new EventSource(`${streamUrl}/chat/send-stream?messages=${encodeURIComponent(JSON.stringify(apiMessages))}`);
        let lastChunkTime = Date.now();

        const timeout = setTimeout(() => {
          eventSource.close();
        }, 30000); // 30s timeout

        eventSource.onmessage = (event) => {
          const chunk = event.data;
          if (chunk) {
            herMessage.content += chunk;
            // Update UI with current content (but don't save to storage yet)
            const tempMessages = [...updatedMessages, { ...herMessage }];
            setMessages(tempMessages);
            lastChunkTime = Date.now();
          }
        };

        eventSource.onerror = () => {
          clearTimeout(timeout);
          eventSource.close();
          // Save message even if there was an error
          if (herMessage.content.trim() && currentGirl?.id) {
            const finalMessages = [...updatedMessages, herMessage];
            setMessages(finalMessages);
            saveMessageToDatabase(currentGirl.id, herMessage);
          }
        };

        // Close after 3s of no chunks (increased from 2s to be safer)
        const checkComplete = () => {
          if (Date.now() - lastChunkTime > 3000) {
            clearTimeout(timeout);
            eventSource.close();
            // Update status when streaming is complete
            setStatus("Online");
            // Save the completed message
            if (herMessage.content.trim() && currentGirl?.id) {
              const finalMessages = [...updatedMessages, herMessage];
              setMessages(finalMessages);
              saveMessageToDatabase(currentGirl.id, herMessage);
            }
          } else {
            setTimeout(checkComplete, 500);
          }
        };

        setTimeout(checkComplete, 3000);

        // For streaming, we don't add the message to finalMessages here
        // It will be added when the stream completes
        return;
      }

      const finalMessages = [...updatedMessages, herMessage];
      setMessages(finalMessages);

      // Save AI message to database
      if (currentGirl?.id) {
        await saveMessageToDatabase(currentGirl.id, herMessage, intent === 'image' ? originalImageUrl : intent === 'video' ? originalVideoUrl : undefined);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);

      // Just show the backend error message directly
      const errorContent = error.response?.data?.message || error.message || "Sorry, something went wrong... 😔";

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "text",
        sender: "her",
        content: errorContent,
        timestamp: new Date(),
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);

      // Save error message to database
      if (currentGirl?.id) {
        await saveMessageToDatabase(currentGirl.id, errorMessage);
      }
    } finally {
      setIsTyping(false);
      setStatus("Online");
    }
  };

  const handleCreateVideo = async (imageUrl: string) => {
    setStatus("Creating video...");
    setIsTyping(true);

    try {
      // Get user profile to include their name
      const userProfile = await usersAPI.getProfile();
      const userName = userProfile.firstName || 'darling';

      // Find the user's message that led to this image (look for the most recent user text message before this image)
      const imageIndex = messages.findIndex(msg => msg.mediaUrl === imageUrl && msg.type === 'image');
      let contextMessage = '';

      if (imageIndex > 0) {
        // Look backwards for the most recent user text message
        for (let i = imageIndex - 1; i >= 0; i--) {
          if (messages[i].sender === 'user' && messages[i].type === 'text') {
            contextMessage = messages[i].content;
            break;
          }
        }
      }

      // Generate flirtatious text using backend API
      const prompt = `Generate a short, flirtatious message (max 15 words, about 4 seconds speaking time) that a girl would say to her boyfriend named ${userName}. The message MUST include the boyfriend's name "${userName}" at least once. Make it romantic and playful. Base it on this user message: "${contextMessage}"\n\nResponse format: Just the message text, no quotes or explanations.`;

      const textResponse = await chatAPI.sendMessage([
        { role: 'user', content: prompt }
      ]);
      const flirtText = textResponse.response.trim();

      // Find the original URL of the image for external API
      const imageMessage = messages.find(msg => msg.mediaUrl === imageUrl && msg.type === 'image');
      const originalImageUrl = imageMessage?.originalMediaUrl || imageUrl;
      console.log('Creating video from image:', { imageUrl, originalImageUrl, imageMessage });

      // Create video with the image and flirt text
      const { videoUrl } = await chatAPI.generateVideoFromImage(originalImageUrl, flirtText);

      if (videoUrl) {
        const videoMessage: Message = {
          id: Date.now().toString(),
          type: "video",
          sender: "her",
          content: `Here's a special video just for you! 💋`,
          mediaUrl: videoUrl,
          thumbnailUrl: imageUrl, // Use the source image as thumbnail
          timestamp: new Date(),
        };

        const updatedMessages = [...messages, videoMessage];
        setMessages(updatedMessages);

        // Save video message to database
        if (currentGirl?.id) {
          await saveMessageToDatabase(currentGirl.id, videoMessage, undefined, videoMessage.thumbnailUrl);
        }
      } else {
        throw new Error('Failed to generate video');
      }
    } catch (error: any) {
      console.error('Error creating video:', error);

      // Just show the backend error message directly
      const errorContent = error.response?.data?.message || error.message || "Sorry, I couldn't create the video right now... 😔";

      const errorMessage: Message = {
        id: Date.now().toString(),
        type: "text",
        sender: "her",
        content: errorContent,
        timestamp: new Date(),
      };
      const updatedMessages = [...messages, errorMessage];
      setMessages(updatedMessages);

      // Save error message to database
      if (currentGirl?.id) {
        await saveMessageToDatabase(currentGirl.id, errorMessage);
      }
    } finally {
      setIsTyping(false);
      setStatus("Online");
    }
  };

  const handleMediaClick = (mediaUrl: string, type: MessageType) => {
    if (type === "image" || type === "video") {
      setMediaViewer({ isOpen: true, mediaUrl, type });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-40 right-0 w-60 h-60 rounded-full bg-lavender-mist/5 blur-3xl" />
      </div>

      <ChatHeader
        name={currentGirl?.name || "Alina"}
        status={status}
        avatarUrl={currentGirl?.avatarUrl}
        onAvatarClick={() => setShowProfile(true)}
      />

      {/* Messages area */}
      <main className="pt-20 pb-24 px-4 max-w-lg mx-auto">
        <div className="space-y-3 py-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onMediaClick={handleMediaClick}
              onCreateVideo={handleCreateVideo}
            />
          ))}

          {isTyping && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <ChatInput onSend={handleSendMessage} disabled={isTyping} />

      <MiniProfile
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        name={currentGirl?.name || "Alina"}
        personality={currentGirl ? currentGirl.personality : "Shy, smart, affectionate"}
        appearance={currentGirl?.appearance}
        avatarUrl={currentGirl?.avatarUrl}
      />

      <MediaViewer
        isOpen={mediaViewer.isOpen}
        onClose={() => setMediaViewer(prev => ({ ...prev, isOpen: false }))}
        mediaUrl={mediaViewer.mediaUrl}
        type={mediaViewer.type}
      />
    </div>
  );
};

export default ChatScreen;