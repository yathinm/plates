/**
 * Hermes + RN DOM Event: phase constants must be writable for setEventPhase during dispatch.
 * Postinstall patches node_modules; this repeats the same descriptors at runtime so Metro cache
 * or missed postinstall cannot leave read-only constants.
 */
// @ts-expect-error Private RN module (same path family as Libraries/Network/XMLHttpRequest).
import Event from 'react-native/src/private/webapis/dom/events/Event';

const PHASES = ['NONE', 'CAPTURING_PHASE', 'AT_TARGET', 'BUBBLING_PHASE'] as const;

for (const key of PHASES) {
  for (const target of [Event, Event.prototype]) {
    const d = Object.getOwnPropertyDescriptor(target, key);
    if (!d || !('value' in d)) continue;
    Object.defineProperty(target, key, {
      enumerable: d.enumerable ?? true,
      value: d.value,
      writable: true,
      configurable: true,
    });
  }
}
