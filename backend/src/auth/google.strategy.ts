import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, StrategyOptions } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { APP_CONFIG } from '../config/app.config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const clientID = APP_CONFIG.API_KEYS.GOOGLE_CLIENT_ID;
    const clientSecret = APP_CONFIG.API_KEYS.GOOGLE_CLIENT_SECRET;
    const callbackURL = APP_CONFIG.OAUTH.GOOGLE_CALLBACK_URL;

    console.log('Google OAuth callbackURL:', callbackURL);

    if (!clientID || !clientSecret) {
      // Skip Google OAuth if credentials are not provided
      super({
        clientID: 'dummy',
        clientSecret: 'dummy',
        callbackURL,
        scope: ['email', 'profile'],
      });
      return;
    }

    const options: StrategyOptions = {
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    };
    super(options);
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { name, emails, photos } = profile;

    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      avatar: photos[0].value,
      googleId: profile.id,
      accessToken,
    };

    done(null, user);
  }
}
