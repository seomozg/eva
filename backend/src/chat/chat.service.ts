import { Injectable, Logger } from '@nestjs/common';
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

    // If baseImageUrl is provided and not empty, use RunPod for editing
    if (baseImageUrl && baseImageUrl.trim() !== '') {
      // Use RunPod for image editing
      this.logger.log('Generating image using RunPod (editing)...');
      const apiKey = this.configService.get<string>('RUNPOD_API_KEY');
      if (!apiKey) {
        this.logger.warn('RunPod API key not set, skipping image generation');
        return '';
      }

      try {
        const createResponse = await firstValueFrom(
          this.httpService.post(
            'https://api.runpod.ai/v2/seedream-v4-edit/run',
            {
              input: {
                prompt,
                images: [baseImageUrl],
                size: '2048*2048',
                enable_safety_checker: false,
              },
            },
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
            },
          ),
        );

        this.logger.log(`RunPod create response: ${JSON.stringify(createResponse.data)}`);
        const jobId = createResponse.data.id;
        if (!jobId) {
          this.logger.error('No jobId found in RunPod response');
          return '';
        }
        this.logger.log(`RunPod job created: ${jobId}`);

        // Poll for completion
        const maxPolls = 20; // Max 5 minutes
        const pollInterval = 3000; // 10 seconds

        for (let i = 0; i < maxPolls; i++) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));

          try {
            const statusResponse = await firstValueFrom(
              this.httpService.get(`https://api.runpod.ai/v2/seedream-v4-edit/status/${jobId}`, {
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                },
              }),
            );

            this.logger.log(`RunPod status: ${JSON.stringify(statusResponse.data)}`);
            const status = statusResponse.data.status;

            if (status === 'COMPLETED') {
              const imageUrl = statusResponse.data.output?.result;
              this.logger.log(`Image edited: ${imageUrl}`);
              return imageUrl || '';
            } else if (status === 'FAILED') {
              this.logger.error('RunPod job failed');
              return '';
            }
          } catch (pollError) {
            this.logger.error('Error polling RunPod', pollError);
          }
        }

        this.logger.warn('RunPod timeout');
        return '';
      } catch (error) {
        this.logger.error('Error calling RunPod API', error);
        return '';
      }
    } else {
      // Use Kie.ai for new image generation
      this.logger.log('Generating new image using Kie.ai...');
      const apiKey = this.configService.get<string>('KIE_API_KEY');
      if (!apiKey || apiKey === 'your_kie_api_key_here') {
        this.logger.warn('Kie.ai API key not set, skipping image generation');
        return '';
      }

      try {
        this.logger.log('Sending request to Kie.ai API');
        const requestData = {
          model: 'z-image',
          input: {
            prompt,
            aspect_ratio: '1:1',
          },
        };

        const createResponse = await firstValueFrom(
          this.httpService.post(
            'https://api.kie.ai/api/v1/jobs/createTask',
            requestData,
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
            },
          ),
        );

        this.logger.log(`Create task response: ${JSON.stringify(createResponse.data)}`);
        const recordId = createResponse.data.data?.recordId;
        if (!recordId) {
          this.logger.error('No recordId found in create task response');
          return '';
        }
        this.logger.log(`Image generation task created with recordId: ${recordId}`);

        // Poll for completion using recordInfo
        const maxPolls = 20; // Max 5 minutes
        const pollInterval = 3000; // 10 seconds

        for (let i = 0; i < maxPolls; i++) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));

          try {
            const statusResponse = await firstValueFrom(
              this.httpService.get(`https://api.kie.ai/api/v1/jobs/recordInfo`, {
                params: { taskId: recordId },
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                },
              }),
            );

            this.logger.log(`Status response: ${JSON.stringify(statusResponse.data)}`);
            const taskState = statusResponse.data.data?.state;
            this.logger.log(`Task ${recordId} status: ${taskState}`);

            if (taskState === 'success') {
              const resultJson = statusResponse.data.data?.resultJson;
              if (resultJson) {
                try {
                  const result = JSON.parse(resultJson);
                  const imageUrl = result.resultUrls?.[0];
                  this.logger.log(`Image generated: ${imageUrl}`);
                  // Download and save locally
                  if (imageUrl) {
                    const localUrl = await this.downloadAndSaveFile(imageUrl, 'image');
                    return localUrl;
                  }
                  return '';
                } catch (parseError) {
                  this.logger.error('Failed to parse resultJson', parseError);
                  return '';
                }
              }
              return '';
            } else if (taskState === 'failed') {
              this.logger.error(`Image generation failed for task ${recordId}`);
              return '';
            }
          } catch (pollError) {
            this.logger.error(`Error polling task ${recordId}`, pollError);
          }
        }

        this.logger.warn(`Image generation timeout for task ${recordId}`);
        return '';
      } catch (error) {
        this.logger.error('Error calling Kie.ai API', error);
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
        throw new Error('Insufficient balance for video generation');
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

    this.logger.log('Generating video using Kie.ai with wan2...');
    const apiKey = this.configService.get<string>('KIE_API_KEY');
    if (!apiKey || apiKey === 'your_kie_api_key_here') {
      this.logger.warn('Kie.ai API key not set, skipping video generation');
      return '';
    }

    try {
      // Use provided image or generate one
      const imageUrl = baseImageUrl || await this.generateImage(prompt);
      if (!imageUrl) {
        this.logger.error('No image available for video generation');
        return '';
      }

      this.logger.log('Sending request to Kie.ai API for video with wan2');
      const inputData = {
        duration: APP_CONFIG.VIDEO.DURATION,
        image_urls: [imageUrl],
        multi_shots: APP_CONFIG.VIDEO.MULTI_SHOTS,
        prompt,
        resolution: APP_CONFIG.VIDEO.RESOLUTION
      };
      const requestData = {
        model: 'wan/2-6-image-to-video',
        input: JSON.stringify(inputData),
      };

      const createResponse = await firstValueFrom(
        this.httpService.post(
          'https://api.kie.ai/api/v1/jobs/createTask',
          requestData,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.log(`Create video task response: ${JSON.stringify(createResponse.data)}`);
      const recordId = createResponse.data.data?.recordId || createResponse.data.data?.taskId;
      if (!recordId) {
        this.logger.error('No recordId or taskId found in create video task response');
        return '';
      }
      this.logger.log(`Video generation task created with recordId: ${recordId}`);

      // Poll for completion using recordInfo
      const maxPolls = 30; // Max 5 minutes
      const pollInterval = 10000; // 10 seconds

      for (let i = 0; i < maxPolls; i++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        try {
          const statusResponse = await firstValueFrom(
            this.httpService.get(`https://api.kie.ai/api/v1/jobs/recordInfo`, {
              params: { taskId: recordId },
              headers: {
                'Authorization': `Bearer ${apiKey}`,
              },
            }),
          );

          this.logger.log(`Video status response: ${JSON.stringify(statusResponse.data)}`);
          const taskState = statusResponse.data.data?.state;
          this.logger.log(`Task ${recordId} status: ${taskState}`);

          if (taskState === 'success') {
            const resultJson = statusResponse.data.data?.resultJson;
            if (resultJson) {
              try {
                const result = JSON.parse(resultJson);
                const videoUrl = result.resultUrls?.[0];
                this.logger.log(`Video generated: ${videoUrl}`);
                // Download and save locally
                if (videoUrl) {
                  const localUrl = await this.downloadAndSaveFile(videoUrl, 'video');
                  return localUrl;
                }
                return '';
              } catch (parseError) {
                this.logger.error('Failed to parse video resultJson', parseError);
                return '';
              }
            }
            return '';
          } else if (taskState === 'fail') {
            this.logger.error(`Video generation failed for task ${recordId}`);
            return '';
          }
        } catch (pollError) {
          this.logger.error(`Error polling video task ${recordId}`, pollError);
        }
      }

      this.logger.warn(`Video generation timeout for task ${recordId}`);
      return '';
    } catch (error) {
      this.logger.error('Error calling Kie.ai API for video', error);
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
        throw new Error('Insufficient balance for video generation');
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

    this.logger.log('Generating video from image using Kie.ai with wan2...');
    const apiKey = this.configService.get<string>('KIE_API_KEY');
    if (!apiKey || apiKey === 'your_kie_api_key_here') {
      this.logger.warn('Kie.ai API key not set, skipping video generation');
      return '';
    }

    try {
      this.logger.log('Sending request to Kie.ai API for video from image with wan2');
      const inputData = {
        duration: APP_CONFIG.VIDEO.DURATION,
        image_urls: [imageUrl],
        multi_shots: APP_CONFIG.VIDEO.MULTI_SHOTS,
        prompt: `girl says: "${text}"`,
        resolution: APP_CONFIG.VIDEO.RESOLUTION
      };
      const requestData = {
        model: 'wan/2-6-image-to-video',
        input: JSON.stringify(inputData),
      };

      const createResponse = await firstValueFrom(
        this.httpService.post(
          'https://api.kie.ai/api/v1/jobs/createTask',
          requestData,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.log(`Create video from image task response: ${JSON.stringify(createResponse.data)}`);
      const recordId = createResponse.data.data?.recordId || createResponse.data.data?.taskId;
      if (!recordId) {
        this.logger.error('No recordId or taskId found in create video from image task response');
        return '';
      }
      this.logger.log(`Video from image generation task created with recordId: ${recordId}`);

      // Poll for completion using recordInfo
      const maxPolls = 30; // Max 5 minutes
      const pollInterval = 10000; // 10 seconds

      for (let i = 0; i < maxPolls; i++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        try {
          const statusResponse = await firstValueFrom(
            this.httpService.get(`https://api.kie.ai/api/v1/jobs/recordInfo`, {
              params: { taskId: recordId },
              headers: {
                'Authorization': `Bearer ${apiKey}`,
              },
            }),
          );

          this.logger.log(`Video from image status response: ${JSON.stringify(statusResponse.data)}`);
          const taskState = statusResponse.data.data?.state;
          this.logger.log(`Task ${recordId} status: ${taskState}`);

          if (taskState === 'success') {
            const resultJson = statusResponse.data.data?.resultJson;
            if (resultJson) {
              try {
                const result = JSON.parse(resultJson);
                const videoUrl = result.resultUrls?.[0];
                this.logger.log(`Video from image generated: ${videoUrl}`);
                // Download and save locally
                if (videoUrl) {
                  const localUrl = await this.downloadAndSaveFile(videoUrl, 'video');
                  return localUrl;
                }
                return '';
              } catch (parseError) {
                this.logger.error('Failed to parse video from image resultJson', parseError);
                return '';
              }
            }
            return '';
          } else if (taskState === 'fail') {
            this.logger.error(`Video from image generation failed for task ${recordId}`);
            return '';
          }
        } catch (pollError) {
          this.logger.error(`Error polling video from image task ${recordId}`, pollError);
        }
      }

      this.logger.warn(`Video from image generation timeout for task ${recordId}`);
      return '';
    } catch (error) {
      this.logger.error('Error calling Kie.ai API for video from image', error);
      return '';
    }
  }

  async createGirl(userId: string): Promise<{ name: string; appearance: string; personality: string; firstMessage: string; avatarUrl: string }> {
    this.logger.log('Creating a new girl...');
    const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    if (!apiKey || apiKey === 'your_deepseek_api_key_here') {
      this.logger.warn('DeepSeek API key not set, using fallback');
      const fallbackAppearance = 'Beautiful girl with long brown hair and blue eyes';
      const fallbackName = this.generateRandomFemaleName();
      const avatarUrl = await this.generateImage(`${fallbackAppearance}, in bikini`, undefined, userId);
      return {
        name: fallbackName,
        appearance: fallbackAppearance,
        personality: 'Shy, smart, affectionate',
        firstMessage: 'Hi there… I hope we can get to know each other better 💕',
        avatarUrl,
      };
    }

    const prompt = APP_CONFIG.PROMPTS.GIRL_GENERATION;

    try {
      this.logger.log('Sending request to DeepSeek API');
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.deepseek.com/v1/chat/completions',
          {
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const content = response.data.choices[0].message.content;
      this.logger.log(`DeepSeek response: ${content}`);

      // Extract JSON from response using regex to handle multiline strings properly
      const jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      let jsonString = '';

      if (jsonMatch) {
        jsonString = jsonMatch[1];
      } else {
        // Fallback: try to find JSON object directly
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          jsonString = content.substring(jsonStart, jsonEnd + 1);
        }
      }

      this.logger.log(`Extracted JSON: ${jsonString}`);

      // Parse JSON from response
      try {
        const parsed = JSON.parse(jsonString);
        this.logger.log('Successfully parsed girl data');
        const appearance = parsed.appearance;
        const name = this.generateRandomFemaleName();
        this.logger.log(`Generating avatar for girl: ${name} with appearance: ${appearance}`);
        const avatarUrl = await this.generateImage(`${appearance}, in bikini`, undefined, userId, true);
        this.logger.log(`Generated avatar URL: ${avatarUrl}`);

        // Save girl to database
        const girl = this.girlRepository.create({
          userId,
          name,
          appearance,
          personality: Array.isArray(parsed.personality) ? parsed.personality.join(', ') : parsed.personality,
          avatarUrl,
        });
        await this.girlRepository.save(girl);

        return {
          name,
          appearance,
          personality: Array.isArray(parsed.personality) ? parsed.personality.join(', ') : parsed.personality,
          firstMessage: parsed.firstMessage,
          avatarUrl,
        };
      } catch (parseError) {
        this.logger.error('Failed to parse JSON from DeepSeek response, using fallback', parseError);
        const fallbackAppearance = 'Beautiful girl with long brown hair and blue eyes';
        const fallbackName = this.generateRandomFemaleName();

        // Try to generate image, but don't fail if balance is insufficient
        let avatarUrl = '';
        try {
          avatarUrl = await this.generateImage(`${fallbackAppearance}, in bikini`, undefined, userId, true);
        } catch (imageError) {
          this.logger.warn('Could not generate image due to insufficient balance or API error, saving girl without avatar', imageError);
        }

        // Save fallback girl to database
        const girl = this.girlRepository.create({
          userId,
          name: fallbackName,
          appearance: fallbackAppearance,
          personality: 'Shy, smart, affectionate',
          avatarUrl,
        });
        await this.girlRepository.save(girl);

        return {
          name: fallbackName,
          appearance: fallbackAppearance,
          personality: 'Shy, smart, affectionate',
          firstMessage: 'Hi there… I hope we can get to know each other better 💕',
          avatarUrl,
        };
      }
    } catch (error) {
      this.logger.error('Error calling DeepSeek API, using fallback', error);
      const fallbackAppearance = 'Beautiful girl with long brown hair and blue eyes';
      const fallbackName = this.generateRandomFemaleName();
      const avatarUrl = await this.generateImage(`${fallbackAppearance}, in bikini`, undefined, userId, true);
      return {
        name: fallbackName,
        appearance: fallbackAppearance,
        personality: 'Shy, smart, affectionate',
        firstMessage: 'Hi there… I hope we can get to know each other better 💕',
        avatarUrl,
      };
    }
  }

  private async downloadAndSaveFile(url: string, type: 'image' | 'video'): Promise<string> {
    try {
      this.logger.log(`Downloading ${type} from: ${url}`);
      const response = await firstValueFrom(
        this.httpService.get(url, { responseType: 'arraybuffer' })
      );

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${type === 'image' ? 'jpg' : 'mp4'}`;
      const filePath = path.join(__dirname, '..', 'uploads', type === 'image' ? 'images' : 'videos', fileName);

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

      // Return local URL
      const localUrl = `/uploads/${type === 'image' ? 'images' : 'videos'}/${fileName}`;
      this.logger.log(`Returning local URL: ${localUrl}`);
      return localUrl;
    } catch (error) {
      this.logger.error(`Error downloading and saving ${type}:`, error);
      this.logger.error(`Failed URL: ${url}`);
      return url; // Return original URL if download fails
    }
  }

  private generateRandomFemaleName(): string {
    return APP_CONFIG.FEMALE_NAMES[Math.floor(Math.random() * APP_CONFIG.FEMALE_NAMES.length)];
  }
}
