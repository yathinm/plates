import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 3,
  tables: [
    tableSchema({
      name: 'exercise_definitions',
      columns: [
        { name: 'name', type: 'string', isIndexed: true },
        { name: 'primary_muscle', type: 'string', isOptional: true },
        { name: 'equipment', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'workouts',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'start_time', type: 'number' },
        { name: 'end_time', type: 'number', isOptional: true },
        { name: 'status', type: 'string' },
        { name: 'server_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'dirty', type: 'boolean', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'exercises',
      columns: [
        { name: 'workout_id', type: 'string', isIndexed: true },
        { name: 'exercise_definition_id', type: 'string', isIndexed: true },
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
        { name: 'server_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'dirty', type: 'boolean', isOptional: true },
        { name: 'set_number', type: 'number', isOptional: true },
        { name: 'performed_at', type: 'number', isOptional: true },
      ],
    }),
  ],
});
