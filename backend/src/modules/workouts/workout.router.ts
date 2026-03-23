import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../common/middleware';
import { startWorkout, logSet, finishWorkout } from './workout.service';

export const workoutRouter = Router();

workoutRouter.use(requireAuth);

workoutRouter.post('/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workout = await startWorkout(req.user!.userId, req.body);
    res.status(201).json(workout);
  } catch (err) {
    next(err);
  }
});

workoutRouter.post('/:id/sets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await logSet(req.user!.userId, req.params.id as string, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

workoutRouter.patch('/:id/finish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await finishWorkout(req.user!.userId, req.params.id as string, req.body.notes);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
