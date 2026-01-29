import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

describe('ChatController', () => {
  let controller: ChatController;
  let chatService: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: {
            sendMessage: jest.fn(),
            generateImage: jest.fn(),
            generateVideo: jest.fn(),
            createGirl: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    chatService = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should send message and return response', async () => {
    const mockResponse = 'Hello from AI';
    jest.spyOn(chatService, 'sendMessage').mockResolvedValue(mockResponse);

    const result = await controller.sendMessage('Hello');

    expect(chatService.sendMessage).toHaveBeenCalledWith('Hello');
    expect(result).toEqual({ response: mockResponse });
  });

  it('should generate image and return URL', async () => {
    const mockUrl = 'https://example.com/image.jpg';
    jest.spyOn(chatService, 'generateImage').mockResolvedValue(mockUrl);

    const result = await controller.generateImage('A landscape');

    expect(chatService.generateImage).toHaveBeenCalledWith('A landscape');
    expect(result).toEqual({ imageUrl: mockUrl });
  });

  it('should generate video and return URL', async () => {
    const mockUrl = 'https://example.com/video.mp4';
    jest.spyOn(chatService, 'generateVideo').mockResolvedValue(mockUrl);

    const result = await controller.generateVideo('A cat playing');

    expect(chatService.generateVideo).toHaveBeenCalledWith('A cat playing');
    expect(result).toEqual({ videoUrl: mockUrl });
  });

  it('should create a new girl', async () => {
    const mockGirl = {
      appearance: 'Blonde hair, blue eyes',
      personality: 'Shy, smart',
      firstMessage: 'Hi there!',
    };
    jest.spyOn(chatService, 'createGirl').mockResolvedValue(mockGirl);

    const result = await controller.createGirl();

    expect(chatService.createGirl).toHaveBeenCalled();
    expect(result).toEqual(mockGirl);
  });
});
