import { Router, Request, Response, NextFunction } from 'express';
import { signup, login } from './auth.service';
import { requireAuth } from '../../common/middleware';

export const authRouter = Router();

authRouter.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await signup(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({ user: req.user });
});
