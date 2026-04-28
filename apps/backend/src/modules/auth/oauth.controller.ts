import { Controller, Get, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';

const SESSION_COOKIE_NAME = 'sp_session';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

@Controller('auth/oauth')
export class OAuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  googleAuth() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.FRONTEND_URL}/api/auth/oauth/google/callback`;
    
    const scope = encodeURIComponent('email profile');
    const state = Math.random().toString(36).substring(7);
    
    return { 
      url: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}` 
    };
  }

  @Get('google/callback')
  async googleCallback(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
    }

    try {
      const user = await this.authService.handleGoogleOAuth(code);
      const sessionToken = await this.authService.createSession(user.id);
      
      res.cookie(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
        path: '/',
      });
      
      return res.redirect(`${process.env.FRONTEND_URL}/?oauth=success`);
    } catch (error) {
      console.error('Google OAuth error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  }

  @Get('github')
  githubAuth() {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = `${process.env.FRONTEND_URL}/api/auth/oauth/github/callback`;
    
    const scope = 'user:email';
    const state = Math.random().toString(36).substring(7);
    
    return { 
      url: `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}` 
    };
  }

  @Get('github/callback')
  async githubCallback(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
    }

    try {
      const user = await this.authService.handleGithubOAuth(code);
      const sessionToken = await this.authService.createSession(user.id);
      
      res.cookie(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
        path: '/',
      });
      
      return res.redirect(`${process.env.FRONTEND_URL}/?oauth=success`);
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  }

  @Get('facebook')
  facebookAuth() {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const redirectUri = `${process.env.FRONTEND_URL}/api/auth/oauth/facebook/callback`;
    
    const scope = 'email';
    const state = Math.random().toString(36).substring(7);
    
    return { 
      url: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}` 
    };
  }

  @Get('facebook/callback')
  async facebookCallback(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
    }

    try {
      const user = await this.authService.handleFacebookOAuth(code);
      const sessionToken = await this.authService.createSession(user.id);
      
      res.cookie(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
        path: '/',
      });
      
      return res.redirect(`${process.env.FRONTEND_URL}/?oauth=success`);
    } catch (error) {
      console.error('Facebook OAuth error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  }

  @Get('linkedin')
  linkedinAuth() {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = `${process.env.FRONTEND_URL}/api/auth/oauth/linkedin/callback`;
    
    const scope = 'openid profile email';
    const state = Math.random().toString(36).substring(7);
    
    return { 
      url: `https://www.linkedin.com/oauth/v2/authorization?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}` 
    };
  }

  @Get('linkedin/callback')
  async linkedinCallback(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
    }

    try {
      const user = await this.authService.handleLinkedinOAuth(code);
      const sessionToken = await this.authService.createSession(user.id);
      
      res.cookie(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
        path: '/',
      });
      
      return res.redirect(`${process.env.FRONTEND_URL}/?oauth=success`);
    } catch (error) {
      console.error('LinkedIn OAuth error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  }

  @Get('twitter')
  twitterAuth() {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const redirectUri = `${process.env.FRONTEND_URL}/api/auth/oauth/twitter/callback`;
    
    const scope = 'users.read email';
    const state = Math.random().toString(36).substring(7);
    
    return { 
      url: `https://twitter.com/i/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}` 
    };
  }

  @Get('twitter/callback')
  async twitterCallback(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
    }

    try {
      const user = await this.authService.handleTwitterOAuth(code);
      const sessionToken = await this.authService.createSession(user.id);
      
      res.cookie(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
        path: '/',
      });
      
      return res.redirect(`${process.env.FRONTEND_URL}/?oauth=success`);
    } catch (error) {
      console.error('Twitter OAuth error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  }

  @Get('microsoft')
  microsoftAuth() {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const redirectUri = `${process.env.FRONTEND_URL}/api/auth/oauth/microsoft/callback`;
    
    const scope = 'openid email profile';
    const state = Math.random().toString(36).substring(7);
    
    return { 
      url: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}` 
    };
  }

  @Get('microsoft/callback')
  async microsoftCallback(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
    }

    try {
      const user = await this.authService.handleMicrosoftOAuth(code);
      const sessionToken = await this.authService.createSession(user.id);
      
      res.cookie(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
        path: '/',
      });
      
      return res.redirect(`${process.env.FRONTEND_URL}/?oauth=success`);
    } catch (error) {
      console.error('Microsoft OAuth error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  }
}