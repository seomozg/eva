// Application configuration constants
export const APP_CONFIG = {
  // Pricing
  PRICING: {
    IMAGE_GENERATION: 1,
    VIDEO_GENERATION: 10,
    INITIAL_BALANCE: 100, // Starting balance for new users
  },

  // API Keys (environment variables)
  API_KEYS: {
    DEEPSEEK: process.env.DEEPSEEK_API_KEY || 'your_deepseek_api_key_here',
    FAL_AI: process.env.FAL_API_KEY || 'your_fal_api_key_here',
    KIE_AI: process.env.KIE_API_KEY || 'your_kie_api_key_here',
    RUNPOD: process.env.RUNPOD_API_KEY || 'your_runpod_api_key_here',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  },

  // OAuth
  OAUTH: {
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'https://eva.test-domain.ru/auth/google/callback',
  },

  // Prompts
  PROMPTS: {
    INTENT_DETECTION: `Analyze this user message and determine the intent. Respond with ONLY ONE word: text, image, or video.

Message: "{message}"

Intent:`,

    VIDEO_SPEECH: `Generate a short, flirtatious message (max 15 words, about 4 seconds speaking time) that a girl would say to her boyfriend named {userName}. The message MUST include the boyfriend's name "{userName}" at least once. Make it romantic and playful. Base it on this user message: "{contextMessage}"

Response format: Just the message text, no quotes or explanations.`,
  },

  // Female names for random generation
  FEMALE_NAMES: [
    'Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Charlotte', 'Mia', 'Amelia', 'Harper', 'Evelyn',
    'Abigail', 'Emily', 'Elizabeth', 'Sofia', 'Grace', 'Avery', 'Scarlett', 'Victoria', 'Aria', 'Lily',
    'Chloe', 'Zoey', 'Penelope', 'Hannah', 'Nora', 'Lillian', 'Addison', 'Aubrey', 'Ellie', 'Stella',
    'Natalie', 'Leah', 'Zoe', 'Brooklyn', 'Savannah', 'Audrey', 'Claire', 'Bella', 'Skylar', 'Lucy',
    'Anna', 'Samantha', 'Caroline', 'Genesis', 'Aaliyah', 'Kennedy', 'Allison', 'Gabriella', 'Madelyn', 'Maya'
  ],

  // Random girl generation parameters
  GIRL_GENERATION_PARAMS: {
    HAIR_LENGTH: ['long', 'short', 'bob', 'shoulder-length', 'pixie', 'braided', 'curly long'],
    HAIR_COLOR: ['blonde', 'brunette', 'redhead', 'black', 'platinum blonde', 'ash brown', 'chestnut', 'jet black', 'strawberry blonde'],
    ETHNICITY: ['European', 'Asian', 'African', 'mixed-race (mulatto)', 'Latina', 'Middle Eastern', 'Scandinavian', 'Mediterranean', 'Slavic', 'Nordic', 'Pacific Islander', 'Native American'],
    BODY_TYPE: ['slim', 'athletic', 'petite', 'curvy', 'hourglass', 'toned', 'fit'],
    BREAST_SIZE: ['small', 'medium', 'large', 'petite', 'full'],
    SKIN_TONE: ['fair', 'medium', 'olive', 'tan', 'dark'],
    PERSONALITY_TRAITS: ['shy', 'confident', 'witty', 'sarcastic', 'sweet', 'adventurous', 'intellectual', 'artistic', 'athletic', 'mysterious', 'bubbly', 'reserved', 'passionate', 'gentle', 'fierce', 'playful', 'ambitious', 'compassionate', 'bold', 'delicate', 'energetic', 'calm', 'charismatic', 'thoughtful', 'spontaneous'],
    FIRST_MESSAGES: [
      "Hi there! I've been waiting to meet someone special like you 💕",
      "Hello! You look like someone I could really connect with 😊",
      "Hey! I hope you're having a great day. Want to chat? 🌟",
      "Hi! I'm so excited to get to know you better! 💫",
      "Hello there! You seem really interesting. Tell me about yourself! ✨",
      "Hey! I've been thinking about finding someone to talk to. Glad it's you! 💕",
      "Hi! You have such a warm smile. What's your story? 😊",
      "Hello! I'm really looking forward to our conversation! 🌸",
      "Hey there! You caught my eye. Let's get to know each other! 💫",
      "Hi! I'm so glad we matched. You seem amazing! ✨"
    ]
  },

  // API timeouts and limits
  API: {
    IMAGE_GENERATION_TIMEOUT: 300000, // 5 minutes
    VIDEO_GENERATION_TIMEOUT: 900000, // 15 minutes
    POLL_INTERVAL: 10000, // 10 seconds
    MAX_POLLS: 30,
  },

  // Video generation settings
  VIDEO: {
    DURATION: "5",
    RESOLUTION: "720p",
    MULTI_SHOTS: false,
  },

  // Image generation settings
  IMAGE: {
    ASPECT_RATIO: '1:1',
    SIZE: '2048*2048',
  },
};