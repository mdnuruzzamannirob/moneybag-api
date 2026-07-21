import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        impersonatedBy?: string;
      };
      cookies: Record<string, string>;
    }
  }
}
