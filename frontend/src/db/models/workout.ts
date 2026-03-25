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
  /** Server UUID after first successful sync; null until then. */
  @field('server_id') serverId!: string | null;
  /** Local-only: true = pending push; false = clean; null = legacy / treat as pending. */
  @field('dirty') dirty!: boolean | null;
  /** LWW clock (ms). `0` until first edit/sync; Watermelon requires non-optional `updated_at`. */
  @field('updated_at') updatedAt!: number;

  @children('exercises') exercises!: Query<Exercise>;
}
