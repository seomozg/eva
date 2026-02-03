import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Girl } from '../entities/girl.entity';
import { Transaction } from '../entities/transaction.entity';

describe('ChatService', () => {
  let service: ChatService;
  let httpService: HttpService;
  let configService: ConfigService;

  let testingModule: TestingModule;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
            get: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Girl),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = testingModule.get<ChatService>(ChatService);
    httpService = testingModule.get<HttpService>(HttpService);
    configService = testingModule.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send message and return response', async () => {
    const mockResponse = {
      data: {
        choices: [{ message: { content: 'Hello from AI' } }],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;
    jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));
    jest.spyOn(configService, 'get').mockReturnValue('test-api-key');

    const result = await service.sendMessage([{ role: 'user', content: 'Hello' }]);

    expect(configService.get).toHaveBeenCalledWith('DEEPSEEK_API_KEY');
    expect(httpService.post).toHaveBeenCalledWith(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 1000,
      },
      {
        headers: {
          Authorization: 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
      },
    );
    expect(result).toBe('Hello from AI');
  });

  it('should generate image via fal.ai and return local URL', async () => {
    const mockResponse = {
      data: {
        images: [{ url: 'https://example.com/image.jpg' }],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;
    jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));
    jest.spyOn(configService, 'get').mockReturnValue('fal-api-key');
    jest.spyOn(service as any, 'downloadAndSaveFile').mockResolvedValue('/uploads/images/test.jpg');

    const result = await service.generateImage('A beautiful landscape');

    expect(configService.get).toHaveBeenCalledWith('FAL_API_KEY');
    expect(httpService.post).toHaveBeenCalledWith(
      'https://fal.run/fal-ai/z-image/turbo',
      {
        prompt: 'A beautiful landscape',
        image_size: {
          width: 720,
          height: 1280,
        },
        num_images: 1,
        enable_safety_checker: false,
      },
      {
        headers: {
          Authorization: 'Key fal-api-key',
          'Content-Type': 'application/json',
        },
      },
    );
    expect(result).toBe('/uploads/images/test.jpg');
  });

  it('should create a new girl and include avatar URL and id', async () => {
    jest.spyOn(service as any, 'generateImage').mockResolvedValue('/uploads/images/test.jpg');
    const girlRepository = testingModule.get(getRepositoryToken(Girl));
    jest.spyOn(girlRepository, 'create').mockReturnValue({ id: 'girl-id' });
    jest.spyOn(girlRepository, 'save').mockResolvedValue({ id: 'girl-id' });

    const result = await service.createGirl('user-id');

    expect(service.generateImage).toHaveBeenCalled();
    expect(result.avatarUrl).toBe('/uploads/images/test.jpg');
    expect(result.id).toBe('girl-id');
    expect(result).toEqual(expect.objectContaining({
      name: expect.any(String),
      appearance: expect.any(String),
      personality: expect.any(String),
      firstMessage: expect.any(String),
    }));
  });
});
