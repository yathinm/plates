import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'workouts',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'start_time', type: 'number' },
        { name: 'end_time', type: 'number', isOptional: true },
        { name: 'status', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'exercises',
      columns: [
        { name: 'workout_id', type: 'string', isIndexed: true },
        { name: 'exercise_definition_id', type: 'string' },
        { name: 'note', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'sets',
      columns: [
        { name: 'exercise_id', type: 'string', isIndexed: true },
        { name: 'weight', type: 'number' },
        { name: 'reps', type: 'number' },
        { name: 'rpe', type: 'number' },
        { name: 'is_completed', type: 'boolean' },
      ],
    }),
  ],
});
