import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../common/middleware';
import { createRoutine, listUserRoutines, getRoutineWithExercises } from './routine.service';

export const routineRouter = Router();

routineRouter.use(requireAuth);

routineRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const routine = await createRoutine(req.user!.userId, req.body);
    res.status(201).json(routine);
  } catch (err) {
    next(err);
  }
});

routineRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await listUserRoutines(req.user!.userId);
    res.json({ count: data.length, routines: data });
  } catch (err) {
    next(err);
  }
});

routineRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const routine = await getRoutineWithExercises(req.params.id as string);
    res.json(routine);
  } catch (err) {
    next(err);
  }
});
