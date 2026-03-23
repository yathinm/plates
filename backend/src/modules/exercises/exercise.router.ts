import { Router, Request, Response, NextFunction } from 'express';
import { listExercises } from './exercise.service';

export const exerciseRouter = Router();

exerciseRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { muscle, category, search } = req.query;
    const data = await listExercises({
      muscle:   muscle   as string | undefined,
      category: category as string | undefined,
      search:   search   as string | undefined,
    });
    res.json({ count: data.length, exercises: data });
  } catch (err) {
    next(err);
  }
});
