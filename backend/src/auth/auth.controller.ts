import { Controller, Post, Body, UseGuards, Request, Get, UseFilters, Response } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Response as ExpressResponse } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Get('google')
  @UseGuards() // No guard for OAuth initiation
  async googleAuth(@Request() req) {
    // This will be handled by Passport
  }

  @Get('google/callback')
  @UseGuards() // No guard for OAuth callback
  async googleAuthRedirect(@Request() req, @Response() res) {
    try {
      const result = await this.authService.googleLogin(req.user);

      // Return HTML page that saves token and redirects
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Login Success</title>
          <script>
            window.onload = function() {
              localStorage.setItem('token', '${result.access_token}');
              window.location.href = 'http://eva.test-domain.ru/chat';
            }
          </script>
        </head>
        <body>
          <p>Login successful! Redirecting...</p>
        </body>
        </html>
      `);
    } catch (error) {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Login Failed</title>
          <script>
            window.onload = function() {
              alert('Login failed');
              window.location.href = 'http://eva.test-domain.ru/login';
            }
          </script>
        </head>
        <body>
          <p>Login failed! Redirecting...</p>
        </body>
        </html>
      `);
    }
  }
}
