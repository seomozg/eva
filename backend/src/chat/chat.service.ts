import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Girl } from '../entities/girl.entity';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { firstValueFrom, Observable, map } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { APP_CONFIG } from '../config/app.config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Girl)
    private girlRepository: Repository<Girl>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async sendMessage(messages: { role: 'user' | 'assistant' | 'system', content: string }[]): Promise<string> {
    const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    const response = await firstValueFrom(
      this.httpService.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages,
          max_tokens: 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );
    return response.data.choices[0].message.content;
  }

  sendMessageStream(messages: { role: 'user' | 'assistant' | 'system', content: string }[]): Observable<MessageEvent> {
    this.logger.log(`Starting stream for messages: ${JSON.stringify(messages)}`);
    const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    return new Observable<MessageEvent>(observer => {
      this.httpService.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages,
          stream: true,
          max_tokens: 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
        },
      ).subscribe({
        next: (response) => {
          this.logger.log('Stream response received');
          const stream = response.data;
          let buffer = '';

          stream.on('data', (chunk: Buffer) => {
            const chunkStr = chunk.toString();
            this.logger.log(`Received chunk: ${chunkStr.substring(0, 100)}...`);
            buffer += chunkStr;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  this.logger.log('Stream completed');
                  observer.complete();
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    this.logger.log(`Sending chunk: ${content}`);
                    observer.next({ data: content } as MessageEvent);
                  }
                } catch (e) {
                  this.logger.log(`Parse error for data: ${data}`);
                }
              }
            }
          });

          stream.on('end', () => {
            this.logger.log('Stream ended');
            observer.complete();
          });

          stream.on('error', (error) => {
            this.logger.error('Stream error', error);
            observer.error(error);
          });
        },
        error: (error) => {
          this.logger.error('HTTP error', error);
          observer.error(error);
        }
      });
    });
  }

  async detectIntent(message: string): Promise<'text' | 'image' | 'video'> {
    const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    if (!apiKey || apiKey === 'your_deepseek_api_key_here') {
      // Fallback to keyword detection
      const lowerContent = message.toLowerCase();
      if (lowerContent.includes('photo') || lowerContent.includes('image') || lowerContent.includes('picture') || lowerContent.includes('send me a')) {
        return 'image';
      }
      if (lowerContent.includes('video') || lowerContent.includes('record')) {
        return 'video';
      }
      return 'text';
    }

    const prompt = APP_CONFIG.PROMPTS.INTENT_DETECTION.replace('{message}', message);

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.deepseek.com/v1/chat/completions',
          {
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 10,
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const intent = response.data.choices[0].message.content.trim().toLowerCase();
      if (intent === 'image' || intent === 'video') {
        return intent;
      }
      return 'text';
    } catch (error) {
      this.logger.error('Error detecting intent with DeepSeek, using fallback', error);
      // Fallback to keyword detection
      const lowerContent = message.toLowerCase();
      if (lowerContent.includes('photo') || lowerContent.includes('image') || lowerContent.includes('picture') || lowerContent.includes('send me a')) {
        return 'image';
      }
      if (lowerContent.includes('video') || lowerContent.includes('record')) {
        return 'video';
      }
      return 'text';
    }
  }

  async generateImage(prompt: string, baseImageUrl?: string, userId?: string, skipBalanceCheck: boolean = false): Promise<string> {
    // Check balance if userId provided and balance check is not skipped
    if (userId && !skipBalanceCheck) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user has sufficient balance
      if (user.balance < APP_CONFIG.PRICING.IMAGE_GENERATION) {
        throw new HttpException('Insufficient balance for image generation', HttpStatus.BAD_REQUEST);
      }

      // Deduct balance
      user.balance -= APP_CONFIG.PRICING.IMAGE_GENERATION;
      await this.userRepository.save(user);

      // Create transaction record
      const transaction = this.transactionRepository.create({
        userId,
        type: TransactionType.IMAGE_GENERATION,
        amount: -APP_CONFIG.PRICING.IMAGE_GENERATION,
        description: 'Image generation',
      });
      await this.transactionRepository.save(transaction);
    }

    // If baseImageUrl is provided and not empty, use Fal.ai for editing
    if (baseImageUrl && baseImageUrl.trim() !== '') {
      // Use Fal.ai direct API for image editing
      this.logger.log('Generating image using Fal.ai direct API (editing)...');
      const apiKey = this.configService.get<string>('FAL_API_KEY');
      if (!apiKey || apiKey === 'your_fal_api_key_here') {
        this.logger.warn('Fal.ai API key not set, skipping image generation');
        return '';
      }

      try {
        this.logger.log(`Base image URL received: ${baseImageUrl}`);
        const fullImageUrl = baseImageUrl;

        // Direct API call to Fal.ai
        const response = await firstValueFrom(
          this.httpService.post(
            'https://fal.run/xai/grok-imagine-image/edit',
            {
              prompt,
              image_url: fullImageUrl,
              num_images: 1,
              output_format: 'jpeg',
            },
            {
              headers: {
                'Authorization': `Key ${apiKey}`,
                'Content-Type': 'application/json',
              },
            },
          ),
        );

        this.logger.log(`Fal.ai response: ${JSON.stringify(response.data)}`);
        const imageUrl = response.data?.images?.[0]?.url;
        if (!imageUrl) {
          this.logger.error('No image URL found in Fal.ai response');
          return '';
        }

        const localUrl = await this.downloadAndSaveFile(imageUrl, 'image');
        return localUrl;
      } catch (error) {
        this.logger.error('Error calling Fal.ai API', error);
        return '';
      }
    } else {
      // Use fal.ai for new image generation
      this.logger.log('Generating new image using fal.ai...');
      const apiKey = this.configService.get<string>('FAL_API_KEY');
      if (!apiKey || apiKey === 'your_fal_api_key_here') {
        this.logger.warn('fal.ai API key not set, skipping image generation');
        return '';
      }

      try {
        this.logger.log('Sending request to fal.ai API');
        const requestData = {
          prompt,
          image_size: {
            width: 1280,
            height: 1280,
          },
          num_images: 1,
          enable_safety_checker: false,
        };

        const createResponse = await firstValueFrom(
          this.httpService.post(
            'https://fal.run/fal-ai/z-image/turbo',
            requestData,
            {
              headers: {
                'Authorization': `Key ${apiKey}`,
                'Content-Type': 'application/json',
              },
            },
          ),
        );

        const responseData = createResponse.data;
        this.logger.log(`fal.ai response: ${JSON.stringify(responseData)}`);
        const imageUrl = responseData?.images?.[0]?.url;
        if (!imageUrl) {
          this.logger.error(`No image URL found in fal.ai response. Expected response.images[0].url. Payload: ${JSON.stringify(responseData)}`);
          return '';
        }

        const localUrl = await this.downloadAndSaveFile(imageUrl, 'image');
        return localUrl;
      } catch (error) {
        this.logger.error('Error calling fal.ai API', error);
        return '';
      }
    }
  }

  async generateVideo(prompt: string, baseImageUrl?: string, userId?: string): Promise<string> {
    // Check balance if userId provided
    if (userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      if (user.balance < APP_CONFIG.PRICING.VIDEO_GENERATION) {
        throw new HttpException('Insufficient balance for video generation', HttpStatus.BAD_REQUEST);
      }

      // Deduct balance
      user.balance -= APP_CONFIG.PRICING.VIDEO_GENERATION;
      await this.userRepository.save(user);

      // Create transaction record
      const transaction = this.transactionRepository.create({
        userId,
        type: TransactionType.VIDEO_GENERATION,
        amount: -APP_CONFIG.PRICING.VIDEO_GENERATION,
        description: 'Video generation',
      });
      await this.transactionRepository.save(transaction);
    }

    this.logger.log('Generating video using Fal.ai direct API...');
    const apiKey = this.configService.get<string>('FAL_API_KEY');
    if (!apiKey || apiKey === 'your_fal_api_key_here') {
      this.logger.warn('Fal.ai API key not set, skipping video generation');
      return '';
    }

    try {
      // Use provided image or generate one
      let imageUrl = baseImageUrl || await this.generateImage(prompt);
      if (!imageUrl) {
        this.logger.error('No image available for video generation');
        return '';
      }

      this.logger.log('Sending request to Fal.ai direct API for video generation');
      const response = await firstValueFrom(
        this.httpService.post(
          'https://fal.run/fal-ai/ltx-2-19b/distilled/image-to-video',
          {
            prompt,
            image_url: imageUrl,
            num_frames: 121,
            fps: 25,
            enable_safety_checker: false,
          },
          {
            headers: {
              'Authorization': `Key ${apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.log(`Fal.ai video response: ${JSON.stringify(response.data)}`);
      const videoUrl = response.data?.video?.url;
      if (!videoUrl) {
        this.logger.error('No video URL found in Fal.ai response');
        return '';
      }

      const localUrl = await this.downloadAndSaveFile(videoUrl, 'video');
      return localUrl;
    } catch (error) {
      this.logger.error('Error calling Fal.ai API for video', error);
      return '';
    }
  }

  async generateVideoFromImage(imageUrl: string, text: string, userId?: string): Promise<string> {
    // Check balance if userId provided
    if (userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      if (user.balance < APP_CONFIG.PRICING.VIDEO_GENERATION) {
        throw new HttpException('Insufficient balance for video generation', HttpStatus.BAD_REQUEST);
      }

      // Deduct balance
      user.balance -= APP_CONFIG.PRICING.VIDEO_GENERATION;
      await this.userRepository.save(user);

      // Create transaction record
      const transaction = this.transactionRepository.create({
        userId,
        type: TransactionType.VIDEO_GENERATION,
        amount: -APP_CONFIG.PRICING.VIDEO_GENERATION,
        description: 'Video generation from image',
      });
      await this.transactionRepository.save(transaction);
    }

    this.logger.log('Generating video from image using Fal.ai direct API...');
    const apiKey = this.configService.get<string>('FAL_API_KEY');
    if (!apiKey || apiKey === 'your_fal_api_key_here') {
      this.logger.warn('Fal.ai API key not set, skipping video generation');
      return '';
    }

    try {
      const fullImageUrl = imageUrl;

      this.logger.log('Sending request to Fal.ai direct API for video from image');
      const response = await firstValueFrom(
        this.httpService.post(
          'https://fal.run/fal-ai/ltx-2-19b/distilled/image-to-video',
          {
            prompt: `girl says: "${text}"`,
            image_url: fullImageUrl,
            num_frames: 121,
            fps: 25,
            enable_safety_checker: false,
          },
          {
            headers: {
              'Authorization': `Key ${apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.log(`Fal.ai video from image response: ${JSON.stringify(response.data)}`);
      const videoUrl = response.data?.video?.url;
      if (!videoUrl) {
        this.logger.error('No video URL found in Fal.ai response');
        return '';
      }

      const localUrl = await this.downloadAndSaveFile(videoUrl, 'video');
      return localUrl;
    } catch (error) {
      this.logger.error('Error calling Fal.ai API for video from image', error);
      return '';
    }
  }

  async createGirl(userId: string): Promise<{ id: string; name: string; appearance: string; personality: string; firstMessage: string; avatarUrl: string }> {
    this.logger.log('Creating a new girl using local random generation...');

    // Generate random girl data locally
    const girlData = this.generateRandomGirl();
    const name = this.generateRandomFemaleName();

    this.logger.log(`Generated girl: ${name} with appearance: ${girlData.appearance}`);

    // Generate avatar using external API
    let avatarUrl = '';
    try {
      avatarUrl = await this.generateImage(`${girlData.appearance}, beautiful girl, portrait, high quality, in bikini`, undefined, userId, true);
      this.logger.log(`Generated avatar for ${name}: ${avatarUrl}`);
    } catch (imageError) {
      this.logger.warn(`Could not generate avatar for ${name}, saving without avatar`, imageError);
    }

    // Save girl to database
    const girl = this.girlRepository.create({
      userId,
      name,
      appearance: girlData.appearance,
      personality: girlData.personality,
      avatarUrl,
    });
    const savedGirl = await this.girlRepository.save(girl);

    return {
      id: savedGirl.id,
      name,
      appearance: girlData.appearance,
      personality: girlData.personality,
      firstMessage: girlData.firstMessage,
      avatarUrl,
    };
  }

  private async downloadAndSaveFile(url: string, type: 'image' | 'video'): Promise<string> {
    try {
      this.logger.log(`Downloading ${type} from: ${url}`);
      const response = await firstValueFrom(
        this.httpService.get(url, { responseType: 'arraybuffer' })
      );

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${type === 'image' ? 'jpg' : 'mp4'}`;
      // Use absolute path from project root for consistency
      const projectRoot = path.join(__dirname, '..', '..');
      const filePath = path.join(projectRoot, 'uploads', type === 'image' ? 'images' : 'videos', fileName);

      this.logger.log(`Saving ${type} to: ${filePath}`);

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.logger.log(`Created directory: ${dir}`);
      }

      // Save file
      fs.writeFileSync(filePath, Buffer.from(response.data));
      this.logger.log(`Successfully saved ${type} file: ${fileName}`);

      // Return server URL where images are accessible
      const baseUrl = 'https://eva.test-domain.ru'; // Server URL where images are stored
      const fullUrl = `${baseUrl}/uploads/${type === 'image' ? 'images' : 'videos'}/${fileName}`;
      this.logger.log(`Returning server URL: ${fullUrl}`);
      return fullUrl;
    } catch (error) {
      this.logger.error(`Error downloading and saving ${type}:`, error);
      this.logger.error(`Failed URL: ${url}`);
      return url; // Return original URL if download fails
    }
  }

  private generateRandomGirl(): { appearance: string; personality: string; firstMessage: string } {
    const params = APP_CONFIG.GIRL_GENERATION_PARAMS;

    // Randomly select traits
    const hairLength = params.HAIR_LENGTH[Math.floor(Math.random() * params.HAIR_LENGTH.length)];
    const hairColor = params.HAIR_COLOR[Math.floor(Math.random() * params.HAIR_COLOR.length)];
    const ethnicity = params.ETHNICITY[Math.floor(Math.random() * params.ETHNICITY.length)];
    const bodyType = params.BODY_TYPE[Math.floor(Math.random() * params.BODY_TYPE.length)];
    const breastSize = params.BREAST_SIZE[Math.floor(Math.random() * params.BREAST_SIZE.length)];
    const skinTone = params.SKIN_TONE[Math.floor(Math.random() * params.SKIN_TONE.length)];

    // Select 3-5 random personality traits
    const personalityCount = Math.floor(Math.random() * 3) + 3; // 3-5 traits
    const shuffledTraits = [...params.PERSONALITY_TRAITS].sort(() => 0.5 - Math.random());
    const personality = shuffledTraits.slice(0, personalityCount).join(', ');

    // Random first message
    const firstMessage = params.FIRST_MESSAGES[Math.floor(Math.random() * params.FIRST_MESSAGES.length)];

    // Build appearance description
    const appearance = `A beautiful ${ethnicity} girl with ${hairLength} ${hairColor} hair and ${skinTone} skin. She has a ${bodyType} build with ${breastSize} breasts.`;

    return {
      appearance,
      personality,
      firstMessage
    };
  }

  private generateRandomFemaleName(): string {
    return APP_CONFIG.FEMALE_NAMES[Math.floor(Math.random() * APP_CONFIG.FEMALE_NAMES.length)];
  }
}
