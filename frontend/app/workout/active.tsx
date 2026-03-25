import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWorkoutStore, type WorkoutSet } from '@/stores/workout';
import WorkoutSummary from '@/components/WorkoutSummary';

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function ActiveWorkoutModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const workout = useWorkoutStore((s) => s.activeWorkout);
  const elapsed = useWorkoutStore((s) => s.elapsedSeconds);
  const isPaused = useWorkoutStore((s) => s.isPaused);

  const pause = useWorkoutStore((s) => s.pauseWorkout);
  const resume = useWorkoutStore((s) => s.resumeWorkout);
  const addSet = useWorkoutStore((s) => s.addSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);
  const finish = useWorkoutStore((s) => s.finishWorkout);
  const discard = useWorkoutStore((s) => s.discardWorkout);
  const updateNotes = useWorkoutStore((s) => s.updateNotes);

  // Quick-add set form state
  const [exerciseName, setExerciseName] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');

  if (!workout) {
    router.back();
    return null;
  }

  const sets = workout.sets;
  const totalVolume = sets.reduce(
    (sum, s) => sum + (s.weightKg ?? 0) * (s.reps ?? 0),
    0,
  );

  // Group sets by exercise for display
  const exerciseGroups: { name: string; sets: WorkoutSet[] }[] = [];
  for (const s of sets) {
    const last = exerciseGroups[exerciseGroups.length - 1];
    if (last && last.name === s.exerciseName) {
      last.sets.push(s);
    } else {
      exerciseGroups.push({ name: s.exerciseName, sets: [s] });
    }
  }

  async function handleAddSet() {
    if (!exerciseName.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const setsForExercise = sets.filter(
      (s) => s.exerciseName === exerciseName.trim(),
    ).length;

    await addSet({
      exerciseId: '',
      exerciseName: exerciseName.trim(),
      setNumber: setsForExercise + 1,
      weightKg: weight ? parseFloat(weight) : null,
      reps: reps ? parseInt(reps, 10) : null,
      rpe: rpe ? parseFloat(rpe) : null,
      completed: true,
    });

    setWeight('');
    setReps('');
    setRpe('');
  }

  async function handleFinish() {
    try {
      await finish();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  function handleDiscard() {
    Alert.alert(
      'Discard Workout',
      'This will permanently delete this session. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            discard();
            router.back();
          },
        },
      ],
    );
  }

  function minimize() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }

  return (
    <View className="flex-1 bg-gym-black" style={{ paddingTop: insets.top }}>
      {/* Drag handle + minimize */}
      <View className="items-center pt-2 pb-1">
        <Pressable onPress={minimize} hitSlop={16}>
          <View className="w-10 h-1 rounded-full bg-gym-muted" />
        </Pressable>
      </View>

      {/* Header row */}
      <View className="flex-row items-center justify-between px-5 pb-3">
        <Pressable onPress={minimize}>
          <Text className="text-brand-electric text-base">Minimize</Text>
        </Pressable>
        <Text
          className="font-mono text-lg"
          style={{ color: isPaused ? '#F59E0B' : '#F4F4F5' }}
        >
          {formatTime(elapsed)}
        </Text>
        <Pressable onPress={isPaused ? resume : pause}>
          <Text className={isPaused ? 'text-brand-electric text-base' : 'text-warning text-base'}>
            {isPaused ? 'Resume' : 'Pause'}
          </Text>
        </Pressable>
      </View>

      {/* Workout title */}
      <View className="px-5 mb-2">
        <Text className="text-2xl font-bold text-zinc-100">{workout.name}</Text>
        {isPaused && (
          <Text className="text-warning text-xs font-semibold mt-1">PAUSED</Text>
        )}
      </View>

      {/* Stats bar */}
      <View className="flex-row px-5 mb-4">
        <View className="flex-1 bg-gym-dark rounded-lg p-3 mr-2 border border-gym-border">
          <Text className="text-gym-muted text-xs">Sets</Text>
          <Text className="text-zinc-100 text-xl font-bold">{sets.length}</Text>
        </View>
        <View className="flex-1 bg-gym-dark rounded-lg p-3 mx-1 border border-gym-border">
          <Text className="text-gym-muted text-xs">Volume</Text>
          <Text className="text-zinc-100 text-xl font-bold">
            {totalVolume > 0 ? `${Math.round(totalVolume)}` : '—'}
            {totalVolume > 0 && <Text className="text-gym-muted text-xs"> kg</Text>}
          </Text>
        </View>
        <View className="flex-1 bg-gym-dark rounded-lg p-3 ml-2 border border-gym-border">
          <Text className="text-gym-muted text-xs">Exercises</Text>
          <Text className="text-zinc-100 text-xl font-bold">{exerciseGroups.length}</Text>
        </View>
      </View>

      {workout.localDbId ? (
        <View className="px-5 mb-3">
          <WorkoutSummary workoutId={workout.localDbId} />
        </View>
      ) : null}

      <KeyboardAwareScrollView
        className="flex-1 px-5"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={24}
        extraKeyboardSpace={insets.bottom + 20}
      >
        {/* Exercise groups */}
        {exerciseGroups.map((group, gi) => (
          <View key={`${group.name}-${gi}`} className="mb-4">
            <Text className="text-zinc-300 text-sm font-semibold mb-2">
              {group.name}
            </Text>
            <View className="bg-gym-dark rounded-xl border border-gym-border overflow-hidden">
              {/* Header row */}
              <View className="flex-row px-4 py-2 border-b border-gym-border">
                <Text className="text-gym-muted text-xs w-10">SET</Text>
                <Text className="text-gym-muted text-xs flex-1 text-center">KG</Text>
                <Text className="text-gym-muted text-xs flex-1 text-center">REPS</Text>
                <Text className="text-gym-muted text-xs w-12 text-center">RPE</Text>
                <Text className="text-gym-muted text-xs w-8 text-right">✓</Text>
              </View>
              {group.sets.map((s) => (
                <Pressable
                  key={s.localId}
                  onLongPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    removeSet(s.localId);
                  }}
                  className="flex-row items-center px-4 py-3 border-b border-gym-border/50"
                >
                  <Text className="text-zinc-400 text-sm w-10">{s.setNumber}</Text>
                  <Text className="text-zinc-100 text-sm flex-1 text-center font-mono">
                    {s.weightKg ?? '—'}
                  </Text>
                  <Text className="text-zinc-100 text-sm flex-1 text-center font-mono">
                    {s.reps ?? '—'}
                  </Text>
                  <Text className="text-zinc-400 text-sm w-12 text-center">
                    {s.rpe ?? '—'}
                  </Text>
                  <View className="w-8 items-end">
                    {s.syncedAt ? (
                      <Text className="text-success text-xs">✓</Text>
                    ) : (
                      <Text className="text-warning text-xs">↑</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {/* Empty state */}
        {sets.length === 0 && (
          <View className="bg-gym-dark rounded-xl p-6 border border-gym-border items-center mb-4">
            <Text className="text-zinc-500 text-sm">
              Add your first set below to start tracking.
            </Text>
          </View>
        )}

        {/* Quick-add set form */}
        <View className="bg-gym-slate rounded-xl border border-gym-border p-4 mb-4">
          <Text className="text-zinc-300 text-xs uppercase tracking-widest mb-3">
            Log a Set
          </Text>
          <TextInput
            className="bg-gym-dark border border-gym-border rounded-lg px-3 py-2.5 text-zinc-100 text-sm mb-2"
            placeholder="Exercise name"
            placeholderTextColor="#71717A"
            value={exerciseName}
            onChangeText={setExerciseName}
            autoCapitalize="words"
          />
          <View className="flex-row mb-3">
            <TextInput
              className="flex-1 bg-gym-dark border border-gym-border rounded-lg px-3 py-2.5 text-zinc-100 text-sm mr-2 text-center"
              placeholder="kg"
              placeholderTextColor="#71717A"
              keyboardType="decimal-pad"
              value={weight}
              onChangeText={setWeight}
            />
            <TextInput
              className="flex-1 bg-gym-dark border border-gym-border rounded-lg px-3 py-2.5 text-zinc-100 text-sm mx-1 text-center"
              placeholder="reps"
              placeholderTextColor="#71717A"
              keyboardType="number-pad"
              value={reps}
              onChangeText={setReps}
            />
            <TextInput
              className="flex-1 bg-gym-dark border border-gym-border rounded-lg px-3 py-2.5 text-zinc-100 text-sm ml-2 text-center"
              placeholder="RPE"
              placeholderTextColor="#71717A"
              keyboardType="decimal-pad"
              value={rpe}
              onChangeText={setRpe}
            />
          </View>
          <Pressable
            className="bg-brand-electric rounded-lg py-3 items-center active:opacity-80"
            onPress={handleAddSet}
          >
            <Text className="text-white font-semibold">Add Set</Text>
          </Pressable>
        </View>

        {/* Notes */}
        <View className="mb-4">
          <Text className="text-zinc-400 text-xs uppercase tracking-widest mb-2">
            Notes
          </Text>
          <TextInput
            className="bg-gym-dark border border-gym-border rounded-xl px-4 py-3 text-zinc-100 text-sm"
            placeholder="How's the session going?"
            placeholderTextColor="#71717A"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            value={workout.notes}
            onChangeText={updateNotes}
          />
        </View>

        {/* Action buttons */}
        <Pressable
          className="bg-success/20 border border-success/40 rounded-xl py-4 items-center mb-3 active:opacity-80"
          onPress={handleFinish}
        >
          <Text className="text-success text-base font-semibold">Finish Workout</Text>
        </Pressable>

        <Pressable
          className="py-3 items-center mb-8 active:opacity-80"
          onPress={handleDiscard}
        >
          <Text className="text-danger/60 text-sm">Discard Workout</Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}
