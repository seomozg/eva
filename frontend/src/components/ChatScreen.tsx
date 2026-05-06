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

const ChatScreen = () => {
  const navigate = useNavigate();
  const { girlId } = useParams<{ girlId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentGirl, setCurrentGirl] = useState<Girl | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [status, setStatus] = useState("Онлайн");
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

      try {
        await usersAPI.getProfile();
      } catch (error: any) {
        localStorage.removeItem('token');
        localStorage.removeItem('userProfile');
        localStorage.removeItem('currentGirl');
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
            document.title = `Чат с ${girl.name}`;

            try {
              const dbMessages = await usersAPI.getMessages(girl.id);
              if (dbMessages && dbMessages.length > 0) {
                const messages: Message[] = dbMessages.map((msg: any) => ({
                  id: msg.id,
                  type: msg.mediaType === 'image' ? 'image' : msg.mediaType === 'video' ? 'video' : 'text',
                  sender: msg.role === 'user' ? 'user' : 'her',
                  content: msg.content,
                  mediaUrl: msg.mediaUrl,
                  mediaType: msg.mediaType,
                  thumbnailUrl: msg.thumbnailUrl ? (msg.thumbnailUrl.startsWith('http') ? msg.thumbnailUrl : getImageUrl(msg.thumbnailUrl)) : undefined,
                  timestamp: new Date(msg.createdAt),
                  originalMediaUrl: msg.originalMediaUrl,
                }));
                setMessages(messages);
              } else {
                const initialMessages: Message[] = [];
                if (girl.avatarUrl) {
                  initialMessages.push({
                    id: `avatar_${Date.now()}`,
                    type: "image",
                    sender: "her",
                    content: "Вот моё фото! Как тебе? 😊",
                    mediaUrl: girl.avatarUrl,
                    timestamp: new Date(Date.now() - 1000),
                  });
                  await usersAPI.saveMessage(girl.id, {
                    role: 'assistant',
                    content: "Вот моё фото! Как тебе? 😊",
                    mediaUrl: girl.avatarUrl,
                    originalMediaUrl: girl.originalAvatarUrl,
                    mediaType: 'image'
                  });
                }
                const messageContent = girl.firstMessage || "Привет! Я так рада познакомиться с тобой! 💕";
                initialMessages.push({
                  id: `first_${Date.now()}`,
                  type: "text",
                  sender: "her",
                  content: messageContent,
                  timestamp: new Date(),
                });
                await usersAPI.saveMessage(girl.id, {
                  role: 'assistant',
                  content: messageContent
                });
                setMessages(initialMessages);
              }
            } catch (error) {
              console.error('Error loading messages from database:', error);
              setMessages([]);
            }
          } catch (error) {
            console.error('Error loading saved girl:', error);
            localStorage.removeItem('currentGirl');
          }
        }
      };

      if (!currentGirl) {
        const savedGirl = localStorage.getItem('currentGirl');
        if (savedGirl) {
          let girlData = JSON.parse(savedGirl);
          if (girlData.avatarUrl && girlData.avatarUrl.startsWith('/uploads/')) {
            try {
              const freshGirls = await usersAPI.getGirls();
              const freshGirl = freshGirls.find(g => g.id === girlData.id);
              if (freshGirl) {
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
          const welcomeMessage: Message = {
            id: Date.now().toString(),
            type: "text",
            sender: "her",
            content: "Добро пожаловать! Сначала создайте виртуальную спутницу в Панели управления. 💕",
            timestamp: new Date(),
          };
          setMessages([welcomeMessage]);
          setStatus("Ожидание спутницы...");
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
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('photo') || lowerContent.includes('image') || lowerContent.includes('picture') || lowerContent.includes('send me a') ||
          lowerContent.includes('фото') || lowerContent.includes('снимок') || lowerContent.includes('картинк') || lowerContent.includes('изображение') || lowerContent.includes('пришли')) {
        return 'image';
      }
      if (lowerContent.includes('video') || lowerContent.includes('record') || lowerContent.includes('видео') || lowerContent.includes('запиши')) {
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
    setStatus("Печатает...");
    setIsTyping(true);

    setTimeout(() => {
      setStatus("Думает...");
    }, 1000);

    let updatedMessages = messages;

    try {
      const intent = await detectIntent(content);

      const userMessage: Message = {
        id: Date.now().toString(),
        type: "text",
        sender: "user",
        content,
        timestamp: new Date(),
      };

      updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      if (currentGirl?.id) {
        await saveMessageToDatabase(currentGirl.id, userMessage);
      }

      let herMessage: Message;
      let originalImageUrl: string | undefined;
      let originalVideoUrl: string | undefined;

      if (intent === 'image') {
        let baseImageUrl = currentGirl?.originalAvatarUrl || currentGirl?.avatarUrl;
        if (!baseImageUrl) {
          const recentImageMessage = [...messages].reverse().find(msg =>
            msg.sender === 'her' && msg.type === 'image'
          );
          if (recentImageMessage) {
            baseImageUrl = recentImageMessage.originalMediaUrl || recentImageMessage.mediaUrl;
          }
        }

        const result = await chatAPI.generateImage(content, baseImageUrl);
        const { imageUrl } = result;
        originalImageUrl = result.originalImageUrl;
        if (imageUrl) {
          herMessage = {
            id: (Date.now() + 1).toString(),
            type: "image",
            sender: "her",
            content: "Вот фото, которое ты просил! ✨",
            mediaUrl: imageUrl,
            timestamp: new Date(),
          };
        } else {
          herMessage = {
            id: (Date.now() + 1).toString(),
            type: "text",
            sender: "her",
            content: "Упс, не получилось создать изображение 😔",
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
          content: "Вот видео, которое ты хотел! 💋",
          mediaUrl: videoUrl,
          thumbnailUrl: currentGirl?.avatarUrl,
          timestamp: new Date(),
        };
      } else {
        let userName = 'дорогой';
        try {
          const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
          if (userProfile.firstName) {
            userName = userProfile.firstName;
          }
        } catch (error) {}

        const systemPrompt = currentGirl ? {
          role: 'system' as const,
          content: `Ты — виртуальная девушка по имени ${currentGirl.name || 'Алина'}. Твоя внешность: ${currentGirl.appearance}. Твой характер: ${currentGirl.personality}. Ты общаешься со своим парнем по имени ${userName}. Обращайся к нему по имени "${userName}" в своих ответах. Отвечай естественно, ласково и оставайся в образе. Ответы должны быть краткими и увлекательными. Общайся на русском языке.`
        } : {
          role: 'system' as const,
          content: 'Ты — дружелюбный AI-ассистент. Отвечай полезно и кратко на русском языке.'
        };

        const conversationHistory = messages
          .filter(msg => msg.type === 'text')
          .map(msg => ({
            role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.content
          }));

        herMessage = {
          id: (Date.now() + 1).toString(),
          type: "text",
          sender: "her",
          content: "",
          timestamp: new Date(),
        };

        const apiMessages = [systemPrompt, ...conversationHistory, { role: 'user' as const, content }];
        const eventSource = new EventSource(`/chat/send-stream?messages=${encodeURIComponent(JSON.stringify(apiMessages))}`);
        let lastChunkTime = Date.now();

        const timeout = setTimeout(() => {
          eventSource.close();
        }, 30000);

        eventSource.onmessage = (event) => {
          const chunk = event.data;
          if (chunk) {
            herMessage.content += chunk;
            const tempMessages = [...updatedMessages, { ...herMessage }];
            setMessages(tempMessages);
            lastChunkTime = Date.now();
          }
        };

        eventSource.onerror = () => {
          clearTimeout(timeout);
          eventSource.close();
          if (herMessage.content.trim() && currentGirl?.id) {
            const finalMessages = [...updatedMessages, herMessage];
            setMessages(finalMessages);
            saveMessageToDatabase(currentGirl.id, herMessage);
          }
        };

        const checkComplete = () => {
          if (Date.now() - lastChunkTime > 3000) {
            clearTimeout(timeout);
            eventSource.close();
            setStatus("Онлайн");
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
        return;
      }

      const finalMessages = [...updatedMessages, herMessage];
      setMessages(finalMessages);

      if (currentGirl?.id) {
        await saveMessageToDatabase(currentGirl.id, herMessage, intent === 'image' ? originalImageUrl : intent === 'video' ? originalVideoUrl : undefined);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorContent = error.response?.data?.message || error.message || "Извини, что-то пошло не так... 😔";
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "text",
        sender: "her",
        content: errorContent,
        timestamp: new Date(),
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      if (currentGirl?.id) {
        await saveMessageToDatabase(currentGirl.id, errorMessage);
      }
    } finally {
      setIsTyping(false);
      setStatus("Онлайн");
    }
  };

  const handleCreateVideo = async (imageUrl: string) => {
    setStatus("Создание видео...");
    setIsTyping(true);

    try {
      const userProfile = await usersAPI.getProfile();
      const userName = userProfile.firstName || 'дорогой';

      const imageIndex = messages.findIndex(msg => msg.mediaUrl === imageUrl && msg.type === 'image');
      let contextMessage = '';
      if (imageIndex > 0) {
        for (let i = imageIndex - 1; i >= 0; i--) {
          if (messages[i].sender === 'user' && messages[i].type === 'text') {
            contextMessage = messages[i].content;
            break;
          }
        }
      }

      const prompt = `Сгенерируй короткое кокетливое сообщение (не более 15 слов, примерно 4 секунды речи), которое девушка сказала бы своему парню по имени ${userName}. Сообщение ОБЯЗАТЕЛЬНО должно содержать имя парня "${userName}" хотя бы один раз. Сделай его романтичным и игривым. Основывайся на этом сообщении: "${contextMessage}"\n\nФормат ответа: Только текст сообщения, без кавычек и пояснений.`;

      const textResponse = await chatAPI.sendMessage([{ role: 'user', content: prompt }]);
      const flirtText = textResponse.response.trim();

      const imageMessage = messages.find(msg => msg.mediaUrl === imageUrl && msg.type === 'image');
      const originalImageUrl = imageMessage?.originalMediaUrl || imageUrl;

      const { videoUrl } = await chatAPI.generateVideoFromImage(originalImageUrl, flirtText);

      if (videoUrl) {
        const videoMessage: Message = {
          id: Date.now().toString(),
          type: "video",
          sender: "her",
          content: "Это особенное видео для тебя! 💋",
          mediaUrl: videoUrl,
          thumbnailUrl: imageUrl,
          timestamp: new Date(),
        };
        const updatedMessages = [...messages, videoMessage];
        setMessages(updatedMessages);
        if (currentGirl?.id) {
          await saveMessageToDatabase(currentGirl.id, videoMessage, undefined, videoMessage.thumbnailUrl);
        }
      } else {
        throw new Error('Не удалось создать видео');
      }
    } catch (error: any) {
      console.error('Error creating video:', error);
      const errorContent = error.response?.data?.message || error.message || "Извини, не получилось создать видео прямо сейчас... 😔";
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: "text",
        sender: "her",
        content: errorContent,
        timestamp: new Date(),
      };
      const updatedMessages = [...messages, errorMessage];
      setMessages(updatedMessages);
      if (currentGirl?.id) {
        await saveMessageToDatabase(currentGirl.id, errorMessage);
      }
    } finally {
      setIsTyping(false);
      setStatus("Онлайн");
    }
  };

  const handleMediaClick = (mediaUrl: string, type: MessageType) => {
    if (type === "image" || type === "video") {
      setMediaViewer({ isOpen: true, mediaUrl, type });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-40 right-0 w-60 h-60 rounded-full bg-lavender-mist/5 blur-3xl" />
      </div>

      <ChatHeader
        name={currentGirl?.name || "Алина"}
        status={status}
        avatarUrl={currentGirl?.avatarUrl}
        onAvatarClick={() => setShowProfile(true)}
      />

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
        name={currentGirl?.name || "Алина"}
        personality={currentGirl ? currentGirl.personality : "Застенчивая, умная, ласковая"}
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