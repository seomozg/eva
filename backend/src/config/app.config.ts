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
    GIRL_GENERATION: `Generate a COMPLETELY RANDOM and UNIQUE girl description. Use this random seed: ${Date.now()}-${Math.random()}.

CRITICALLY IMPORTANT: You MUST randomly select EXACTLY ONE option from each category below. Do NOT favor any ethnicity or type - make truly random choices:

1. Hair length: [long, short, bob, shoulder-length, pixie, braided, curly long]
2. Hair color: [blonde, brunette, redhead, black, platinum blonde, ash brown, chestnut, jet black, strawberry blonde]
3. Ethnicity/appearance type: [European, Asian, African, mixed-race (mulatto), Latina, Middle Eastern, Scandinavian, Mediterranean, Slavic, Nordic, Pacific Islander, Native American]
4. Body type: [slim, athletic, petite, curvy, hourglass, toned, fit]
5. Breast size: [small, medium, large, petite, full]
6. Eye color: [blue, brown, green, hazel, gray, amber, violet]
7. Skin tone: [fair, medium, olive, tan, dark]

2. Personality traits: Choose 3-5 COMPLETELY RANDOM adjectives from: [shy, confident, witty, sarcastic, sweet, adventurous, intellectual, artistic, athletic, mysterious, bubbly, reserved, passionate, gentle, fierce, playful, ambitious, compassionate, bold, delicate, energetic, calm, charismatic, thoughtful, spontaneous]

3. First chat message: Create a unique, personalized introduction message (1-2 sentences)

Format as VALID JSON:
{
  "appearance": "Detailed physical description using random selections above",
  "personality": "comma-separated personality traits",
  "firstMessage": "unique introduction message"
}

Remember: Each generation must be completely unique and random!`,

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