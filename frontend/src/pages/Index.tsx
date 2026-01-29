import { Helmet } from "react-helmet-async";
import ChatScreen from "@/components/ChatScreen";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Chat with Alina | Your Virtual Companion</title>
        <meta name="description" content="Connect with your AI companion in an intimate, emotional chat experience. Natural conversations, photos, and videos - all through simple messages." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0f0e14" />
      </Helmet>
      <ChatScreen />
    </>
  );
};

export default Index;
