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
    KIE_AI: process.env.KIE_API_KEY || 'your_kie_api_key_here',
    RUNPOD: process.env.RUNPOD_API_KEY || 'your_runpod_api_key_here',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  },

  // OAuth
  OAUTH: {
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'http://eva.test-domain.ru/auth/google/callback',
  },

  // Prompts
  PROMPTS: {
    GIRL_GENERATION: `Generate a description of a girl's appearance. RANDOMLY select one option from each category below:
1. Appearance
Hair length: long, short, bob, shoulder-length
Hair color: blonde, brunette, redhead, black
Ethnicity/appearance type: European, Asian, mixed-race (mulatto), Latina
Body type: slim, athletic, petite
Breast size: small, medium, large
Add Personality
2. Personality traits (2-4 adjectives)
Add First Message
3. First chat message she would send to introduce herself

Format as JSON:
{
  "appearance": "description",
  "personality": "traits",
  "firstMessage": "message"
}`,

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