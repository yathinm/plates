import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type PressableProps,
  type TextInputProps,
  type ViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ui = {
  black: '#000000',
  white: '#FFFFFF',
  gray050: '#F6F6F6',
  gray200: '#E2E2E2',
  gray700: '#545454',
  ink: '#111111',
  success: '#0A7F5A',
  successSoft: '#E8F5EF',
  warning: '#A85F00',
  danger: '#B42318',
  focus: 'rgba(0,0,0,0.14)',
  shadowSoft: 'rgba(0,0,0,0.08)',
  shadowPanel: 'rgba(0,0,0,0.10)',
} as const;

export function Screen({
  children,
  className = '',
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <SafeAreaView className={`flex-1 bg-uber-white ${className}`} edges={['top']}>
      <View className={`flex-1 ${padded ? 'px-5' : ''}`}>{children}</View>
    </SafeAreaView>
  );
}

export function ResponsiveContent({
  children,
  className = '',
  maxWidth = 1120,
}: {
  children: ReactNode;
  className?: string;
  maxWidth?: number;
}) {
  const { width } = useWindowDimensions();
  return (
    <View
      className={`w-full self-center ${className}`}
      style={{ maxWidth, width: width >= maxWidth ? maxWidth : '100%' }}
    >
      {children}
    </View>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View className="flex-row items-start justify-between gap-4 pt-3 pb-6">
      <View className="flex-1 min-w-0">
        {eyebrow ? <SectionLabel>{eyebrow}</SectionLabel> : null}
        <Text
          className="text-uber-black font-bold"
          style={{ fontSize: 44, lineHeight: 48, letterSpacing: -0.8 }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-uber-gray700 text-base leading-6 mt-2">{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Text className="text-uber-gray700 text-xs font-semibold uppercase tracking-widest mb-2">
      {children}
    </Text>
  );
}

export function Panel({ children, className = '', style }: ViewProps & { children: ReactNode }) {
  return (
    <View
      className={`bg-uber-white border border-uber-gray200 rounded-2xl ${className}`}
      style={[
        {
          shadowColor: ui.black,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.06,
          shadowRadius: 20,
          elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function PrimaryButton({
  children,
  loading,
  className = '',
  ...props
}: PressableProps & { children: ReactNode; loading?: boolean; className?: string }) {
  return (
    <Pressable
      {...props}
      className={`min-h-[48px] rounded-[10px] bg-uber-black px-5 items-center justify-center active:opacity-80 disabled:opacity-50 ${className}`}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={ui.white} />
      ) : (
        <Text className="text-uber-white text-base font-semibold">{children}</Text>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
  children,
  className = '',
  ...props
}: PressableProps & { children: ReactNode; className?: string }) {
  return (
    <Pressable
      {...props}
      className={`min-h-[48px] rounded-[10px] bg-uber-gray050 border border-uber-gray200 px-5 items-center justify-center active:opacity-80 disabled:opacity-50 ${className}`}
      accessibilityRole="button"
    >
      <Text className="text-uber-ink text-base font-semibold">{children}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  className = '',
  style,
  ...props
}: TextInputProps & { label?: string; className?: string }) {
  return (
    <View className="mb-3">
      {label ? <Text className="text-uber-gray700 text-xs font-semibold uppercase tracking-widest mb-2">{label}</Text> : null}
      <TextInput
        {...props}
        className={`min-h-[52px] rounded-[10px] bg-uber-gray050 border border-transparent px-4 py-3.5 text-uber-ink text-base ${className}`}
        placeholderTextColor={ui.gray700}
        style={style}
      />
    </View>
  );
}

export function MetricTile({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <View className="flex-1 bg-uber-gray050 rounded-[10px] border border-uber-gray200 px-4 py-3 min-h-[82px] justify-between">
      <Text className="text-uber-gray700 text-xs font-semibold uppercase tracking-widest">
        {label}
      </Text>
      <Text className="text-uber-black text-2xl font-bold" numberOfLines={1}>
        {value}
        {suffix ? <Text className="text-uber-gray700 text-sm font-normal"> {suffix}</Text> : null}
      </Text>
    </View>
  );
}
