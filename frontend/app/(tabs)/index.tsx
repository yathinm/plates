import { View, Text, Pressable } from 'react-native';

export default function WorkoutScreen() {
  return (
    <View className="flex-1 bg-gym-black px-5 pt-14">
      <Text className="text-3xl font-bold text-zinc-100 mb-2">Plates</Text>
      <Text className="text-gym-muted text-base mb-10">
        Ready to lift? Start a new session or pick a routine.
      </Text>

      <Pressable className="bg-brand-electric rounded-2xl py-4 px-6 items-center mb-4 active:opacity-80">
        <Text className="text-white text-lg font-semibold">Start Empty Workout</Text>
      </Pressable>

      <Pressable className="bg-gym-slate rounded-2xl py-4 px-6 items-center border border-gym-border active:opacity-80">
        <Text className="text-zinc-300 text-lg font-semibold">Choose a Routine</Text>
      </Pressable>

      <View className="mt-10">
        <Text className="text-zinc-400 text-xs uppercase tracking-widest mb-3">
          Recent Sessions
        </Text>
        <View className="bg-gym-dark rounded-xl p-4 border border-gym-border">
          <Text className="text-gym-muted text-sm text-center">
            No workouts yet — hit the button above!
          </Text>
        </View>
      </View>
    </View>
  );
}
