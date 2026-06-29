import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Field, MetricTile, Panel, PrimaryButton, SecondaryButton, SectionLabel, ui } from '@/components/ui';
import WorkoutSummary from '@/components/WorkoutSummary';
import { useWorkoutStore, type WorkoutSet } from '@/stores/workout';

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
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

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
  const updateWorkoutName = useWorkoutStore((s) => s.updateWorkoutName);

  const [exerciseName, setExerciseName] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [workoutStoreHydrated, setWorkoutStoreHydrated] = useState(() =>
    useWorkoutStore.persist.hasHydrated(),
  );

  useEffect(() => {
    const unsub = useWorkoutStore.persist.onFinishHydration(() =>
      setWorkoutStoreHydrated(true),
    );
    if (useWorkoutStore.persist.hasHydrated()) setWorkoutStoreHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (!workoutStoreHydrated) return;
    if (!workout) router.back();
  }, [workoutStoreHydrated, workout, router]);

  if (!workoutStoreHydrated || !workout) {
    return null;
  }

  const sets = workout.sets;
  const totalVolume = sets.reduce(
    (sum, s) => sum + (s.weightKg ?? 0) * (s.reps ?? 0),
    0,
  );

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
      completed: true,
    });

    setWeight('');
    setReps('');
  }

  async function handleFinish() {
    try {
      await finish();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      Alert.alert('Could not finish workout', err.message);
    }
  }

  function handleDiscard() {
    Alert.alert(
      'Discard workout',
      'This will permanently delete this session.',
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
    <View className="flex-1 bg-uber-white" style={{ paddingTop: insets.top }}>
      <View className="items-center pt-2 pb-1">
        <Pressable onPress={minimize} hitSlop={16} accessibilityRole="button" accessibilityLabel="Minimize workout">
          <View className="w-10 h-1 rounded-full bg-uber-gray200" />
        </Pressable>
      </View>

      <View className="px-5 pb-4 border-b border-uber-gray200">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={minimize} hitSlop={8}>
            <Text className="text-uber-gray700 text-base font-semibold">Minimize</Text>
          </Pressable>
          <View className="bg-uber-black rounded-[10px] px-4 py-2">
            <Text className="font-mono text-uber-white text-lg">{formatTime(elapsed)}</Text>
          </View>
          <Pressable onPress={isPaused ? resume : pause} hitSlop={8}>
            <Text className="text-uber-black text-base font-semibold">
              {isPaused ? 'Resume' : 'Pause'}
            </Text>
          </Pressable>
        </View>

        <Text className="text-uber-gray700 text-xs font-semibold uppercase tracking-widest mb-1">
          Session name
        </Text>
        <TextInput
          className="text-uber-black font-bold py-1 min-h-[44px]"
          style={{ fontSize: 32, lineHeight: 36, letterSpacing: -0.3 }}
          value={workout.name}
          onChangeText={updateWorkoutName}
          placeholder="Workout"
          placeholderTextColor={ui.gray700}
          autoCapitalize="sentences"
          returnKeyType="done"
          maxLength={80}
        />
      </View>

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={24}
        extraKeyboardSpace={insets.bottom + 20}
      >
        <View className="self-center w-full" style={{ maxWidth: 1120 }}>
          <View className="flex-row gap-3 mb-5">
            <MetricTile label="Sets" value={sets.length} />
            <MetricTile
              label="Volume"
              value={totalVolume > 0 ? Math.round(totalVolume) : '—'}
              suffix={totalVolume > 0 ? 'kg' : undefined}
            />
            <MetricTile label="Moves" value={exerciseGroups.length} />
          </View>

          {workout.localDbId ? (
            <View className="mb-5">
              <WorkoutSummary workoutId={workout.localDbId} />
            </View>
          ) : null}

          <View className={isWide ? 'flex-row gap-5 items-start' : ''}>
            <View className={isWide ? 'flex-1' : ''}>
              {exerciseGroups.length === 0 ? (
                <Panel className="p-6 items-center mb-5">
                  <Text className="text-uber-black text-lg font-semibold mb-2">
                    Add your first set
                  </Text>
                  <Text className="text-uber-gray700 text-sm text-center leading-5">
                    Enter an exercise, weight, and reps. Plates will keep the session grouped automatically.
                  </Text>
                </Panel>
              ) : null}

              {exerciseGroups.map((group, gi) => (
                <View key={`${group.name}-${gi}`} className="mb-5">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-uber-black text-xl font-semibold">{group.name}</Text>
                    <Text className="text-uber-gray700 text-sm">
                      {group.sets.length} {group.sets.length === 1 ? 'set' : 'sets'}
                    </Text>
                  </View>
                  <Panel className="overflow-hidden">
                    <View className="flex-row px-4 py-3 bg-uber-gray050 border-b border-uber-gray200">
                      <Text className="text-uber-gray700 text-xs font-semibold w-12">SET</Text>
                      <Text className="text-uber-gray700 text-xs font-semibold flex-1 text-center">KG</Text>
                      <Text className="text-uber-gray700 text-xs font-semibold flex-1 text-center">REPS</Text>
                      <Text className="text-uber-gray700 text-xs font-semibold w-14 text-right">SYNC</Text>
                    </View>
                    {group.sets.map((s) => (
                      <Pressable
                        key={s.localId}
                        onLongPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                          removeSet(s.localId);
                        }}
                        className="flex-row items-center px-4 py-4 border-b border-uber-gray200 active:bg-uber-gray050"
                      >
                        <Text className="text-uber-gray700 text-sm w-12">{s.setNumber}</Text>
                        <Text className="text-uber-black text-base flex-1 text-center font-mono">
                          {s.weightKg ?? '—'}
                        </Text>
                        <Text className="text-uber-black text-base flex-1 text-center font-mono">
                          {s.reps ?? '—'}
                        </Text>
                        <View className="w-14 items-end">
                          <View className={s.syncedAt ? 'bg-uber-successSoft rounded-full px-2 py-1' : 'bg-amber-50 rounded-full px-2 py-1'}>
                            <Text className={s.syncedAt ? 'text-uber-success text-xs font-semibold' : 'text-warning text-xs font-semibold'}>
                              {s.syncedAt ? 'OK' : 'UP'}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    ))}
                  </Panel>
                </View>
              ))}
            </View>

            <View className={isWide ? 'w-[380px]' : ''}>
              <Panel className="p-5 mb-5">
                <SectionLabel>Log a set</SectionLabel>
                <Field
                  label="Exercise"
                  placeholder="Barbell bench press"
                  value={exerciseName}
                  onChangeText={setExerciseName}
                  autoCapitalize="words"
                />
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Field
                      label="Weight"
                      placeholder="kg"
                      keyboardType="decimal-pad"
                      value={weight}
                      onChangeText={setWeight}
                      className="text-center"
                    />
                  </View>
                  <View className="flex-1">
                    <Field
                      label="Reps"
                      placeholder="reps"
                      keyboardType="number-pad"
                      value={reps}
                      onChangeText={setReps}
                      className="text-center"
                    />
                  </View>
                </View>
                <PrimaryButton
                  className="mt-2"
                  onPress={handleAddSet}
                  disabled={!exerciseName.trim()}
                >
                  Add set
                </PrimaryButton>
              </Panel>

              <Panel className="p-5 mb-5">
                <SectionLabel>Notes</SectionLabel>
                <TextInput
                  className="bg-uber-gray050 border border-transparent rounded-[10px] px-4 py-3 text-uber-ink text-sm min-h-[110px]"
                  placeholder="How is the session going?"
                  placeholderTextColor={ui.gray700}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={workout.notes}
                  onChangeText={updateNotes}
                />
              </Panel>

              <PrimaryButton className="mb-3" onPress={handleFinish}>
                Finish workout
              </PrimaryButton>
              <SecondaryButton className="mb-3" onPress={isPaused ? resume : pause}>
                {isPaused ? 'Resume timer' : 'Pause timer'}
              </SecondaryButton>
              <Pressable
                className="py-4 items-center mb-8 active:opacity-70"
                onPress={handleDiscard}
                accessibilityRole="button"
              >
                <Text className="text-danger text-sm font-semibold">Discard workout</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
