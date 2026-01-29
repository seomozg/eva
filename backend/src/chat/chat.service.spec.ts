import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('ChatService', () => {
  let service: ChatService;
  let httpService: HttpService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
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

    const result = await service.sendMessage('Hello');

    expect(configService.get).toHaveBeenCalledWith('DEEPSEEK_API_KEY');
    expect(httpService.post).toHaveBeenCalledWith(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Hello' }],
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

  it('should generate image and return URL', async () => {
    const mockResponse = {
      data: { imageUrl: 'https://example.com/image.jpg' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;
    jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));
    jest.spyOn(configService, 'get').mockReturnValue('kie-api-key');

    const result = await service.generateImage('A beautiful landscape');

    expect(configService.get).toHaveBeenCalledWith('KIE_API_KEY');
    expect(httpService.post).toHaveBeenCalledWith(
      'https://api.kie.ai/v1/images/generate',
      { prompt: 'A beautiful landscape' },
      {
        headers: {
          Authorization: 'Bearer kie-api-key',
          'Content-Type': 'application/json',
        },
      },
    );
    expect(result).toBe('https://example.com/image.jpg');
  });

  it('should generate video and return URL', async () => {
    const mockResponse = {
      data: { videoUrl: 'https://example.com/video.mp4' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;
    jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));
    jest.spyOn(configService, 'get').mockReturnValue('kie-api-key');

    const result = await service.generateVideo('A cat playing');

    expect(configService.get).toHaveBeenCalledWith('KIE_API_KEY');
    expect(httpService.post).toHaveBeenCalledWith(
      'https://api.kie.ai/v1/videos/generate',
      { prompt: 'A cat playing' },
      {
        headers: {
          Authorization: 'Bearer kie-api-key',
          'Content-Type': 'application/json',
        },
      },
    );
    expect(result).toBe('https://example.com/video.mp4');
  });

  it('should create a new girl with appearance, personality, and first message', async () => {
    const mockResponse = {
      data: {
        choices: [{
          message: {
            content: JSON.stringify({
              appearance: 'Blonde hair, blue eyes, slim figure',
              personality: 'Shy, intelligent, caring',
              firstMessage: 'Hello! I\'m so excited to meet you 💕'
            })
          }
        }],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;
    jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));
    jest.spyOn(configService, 'get').mockReturnValue('test-api-key');

    const result = await service.createGirl();

    expect(configService.get).toHaveBeenCalledWith('DEEPSEEK_API_KEY');
    expect(httpService.post).toHaveBeenCalledWith(
      'https://api.deepseek.com/v1/chat/completions',
      expect.objectContaining({
        model: 'deepseek-chat',
        messages: expect.any(Array),
      }),
      expect.any(Object),
    );
    expect(result).toEqual({
      appearance: 'Blonde hair, blue eyes, slim figure',
      personality: 'Shy, intelligent, caring',
      firstMessage: 'Hello! I\'m so excited to meet you 💕',
    });
  });
});
