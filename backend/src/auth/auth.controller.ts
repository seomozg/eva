import { Controller, Post, Body, UseGuards, Request, Get, UseFilters, Response } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
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
    console.log('Profile request - user:', req.user);
    return req.user;
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Request() req) {
    // Passport will handle the redirect
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Request() req, @Response() res) {
    try {
      const result = await this.authService.googleLogin(req.user);

      // Return HTML page that saves token and redirects
      const redirectUrl = process.env.NODE_ENV === 'production'
        ? 'https://eva.test-domain.ru/chat'
        : 'http://localhost:5173/chat';

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Login Success</title>
          <script>
            window.onload = function() {
              localStorage.setItem('token', '${result.access_token}');
              window.location.href = '${redirectUrl}';
            }
          </script>
        </head>
        <body>
          <p>Login successful! Redirecting...</p>
        </body>
        </html>
      `);
    } catch (error) {
      const loginUrl = process.env.NODE_ENV === 'production'
        ? 'https://eva.test-domain.ru/login'
        : 'http://localhost:5173/login';

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Login Failed</title>
          <script>
            window.onload = function() {
              alert('Login failed');
              window.location.href = '${loginUrl}';
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
