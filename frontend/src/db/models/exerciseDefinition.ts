import Model, { type Associations } from '@nozbe/watermelondb/Model';
import { children, field } from '@nozbe/watermelondb/decorators';
import type Query from '@nozbe/watermelondb/Query';

import type Exercise from './exercise';

export default class ExerciseDefinition extends Model {
  static table = 'exercise_definitions';

  static associations: Associations = {
    exercises: { type: 'has_many', foreignKey: 'exercise_definition_id' },
  };

  @field('name') name!: string;
  @field('primary_muscle') primaryMuscle!: string | null;
  @field('equipment') equipment!: string | null;

  @children('exercises') exercises!: Query<Exercise>;
}
