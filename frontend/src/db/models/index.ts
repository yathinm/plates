import Workout from './workout';
import Exercise from './exercise';
import Set from './set';
import ExerciseDefinition from './exerciseDefinition';

export { Workout, Exercise, Set, ExerciseDefinition };

// Central model registry used by Watermelon Database()
export const models = [Workout, Exercise, Set, ExerciseDefinition];
