import Model, { type Associations } from '@nozbe/watermelondb/Model';
import { field, relation } from '@nozbe/watermelondb/decorators';
import type Relation from '@nozbe/watermelondb/Relation';

import type Exercise from './exercise';

export default class Set extends Model {
  static table = 'sets';

  static associations: Associations = {
    exercises: { type: 'belongs_to', key: 'exercise_id' },
  };

  @field('weight') weight!: number;
  @field('reps') reps!: number;
  @field('rpe') rpe!: number;
  @field('is_completed') isCompleted!: boolean;

  @relation('exercises', 'exercise_id') exercise!: Relation<Exercise>;
}
