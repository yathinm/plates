import { Text, View, useWindowDimensions } from 'react-native';

import { MetricTile, PageHeader, Panel, ResponsiveContent, Screen, SectionLabel } from '@/components/ui';

const bars = [0.34, 0.55, 0.82, 0.48, 0.92, 0.64, 0.28];

export default function AnalyticsScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 860;

  return (
    <Screen>
      <ResponsiveContent className="flex-1" maxWidth={1040}>
        <PageHeader
          eyebrow="Analytics"
          title="Signal over noise"
          subtitle="Volume, consistency, and PR surfaces designed for quick decisions after a session."
        />

        <View className="flex-row gap-3 mb-5">
          <MetricTile label="7d sets" value="—" />
          <MetricTile label="Volume" value="—" />
          <MetricTile label="PRs" value="—" />
        </View>

        <View className={isWide ? 'flex-row gap-5' : ''}>
          <Panel className={isWide ? 'flex-1 p-5' : 'p-5 mb-5'}>
            <SectionLabel>Weekly volume</SectionLabel>
            <View className="flex-row items-end justify-between h-40 px-1 pt-5">
              {bars.map((h, i) => (
                <View key={i} className="items-center flex-1">
                  <View
                    className="w-7 rounded-t-[6px] bg-uber-black"
                    style={{ height: `${h * 100}%`, opacity: 0.35 + h * 0.65 }}
                  />
                  <Text className="text-uber-gray700 text-xs mt-3">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                  </Text>
                </View>
              ))}
            </View>
          </Panel>

          <Panel className={isWide ? 'w-[360px] p-5' : 'p-5'}>
            <SectionLabel>Personal records</SectionLabel>
            <Text className="text-uber-black text-xl font-semibold mb-3">No PRs yet</Text>
            <Text className="text-uber-gray700 text-sm leading-5">
              Finish a few workouts and Plates will surface best sets, top volume days, and movement trends.
            </Text>
          </Panel>
        </View>
      </ResponsiveContent>
    </Screen>
  );
}
