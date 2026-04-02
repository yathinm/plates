import { useLocalSearchParams } from 'expo-router';

import PastWorkoutDetail from '@/components/PastWorkoutDetail';

export default function PastWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = Array.isArray(id) ? id[0] : id;
  if (!workoutId) return null;
  return <PastWorkoutDetail workoutId={workoutId} />;
}
