import Model, { type Associations } from '@nozbe/watermelondb/Model';
import { children, field } from '@nozbe/watermelondb/decorators';
import type Query from '@nozbe/watermelondb/Query';

import type Exercise from './exercise';

export default class Workout extends Model {
  static table = 'workouts';

  static associations: Associations = {
    exercises: { type: 'has_many', foreignKey: 'workout_id' },
  };

  @field('name') name!: string;
  @field('start_time') startTime!: number;
  @field('end_time') endTime!: number | null;
  @field('status') status!: string;

  @children('exercises') exercises!: Query<Exercise>;
}
