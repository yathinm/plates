import { addColumns, schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'workouts',
          columns: [
            { name: 'server_id', type: 'string', isOptional: true, isIndexed: true },
            { name: 'dirty', type: 'boolean', isOptional: true },
          ],
        }),
        addColumns({
          table: 'sets',
          columns: [
            { name: 'server_id', type: 'string', isOptional: true, isIndexed: true },
            { name: 'dirty', type: 'boolean', isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        addColumns({
          table: 'sets',
          columns: [
            { name: 'set_number', type: 'number', isOptional: true },
            { name: 'performed_at', type: 'number', isOptional: true },
          ],
        }),
      ],
    },
  ],
});
