import Model, { type Associations } from '@nozbe/watermelondb/Model';
import { children, field, relation } from '@nozbe/watermelondb/decorators';
import type Query from '@nozbe/watermelondb/Query';
import type Relation from '@nozbe/watermelondb/Relation';

import type Workout from './workout';
import type Set from './set';
import type ExerciseDefinition from './exerciseDefinition';

export default class Exercise extends Model {
  static table = 'exercises';

  static associations: Associations = {
    workouts: { type: 'belongs_to', key: 'workout_id' },
    sets: { type: 'has_many', foreignKey: 'exercise_id' },
    exercise_definitions: { type: 'belongs_to', key: 'exercise_definition_id' },
  };

  @field('note') note!: string;

  @relation('workouts', 'workout_id') workout!: Relation<Workout>;
  @relation('exercise_definitions', 'exercise_definition_id')
  exerciseDefinition!: Relation<ExerciseDefinition>;
  @children('sets') sets!: Query<Set>;
}
