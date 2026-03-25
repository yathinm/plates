/**
 * Postinstall patches for Expo / Hermes:
 * - react-native-css-interop@0.2.3 (React 19 + NativeWind)
 * - react-native DOM Event: phase constants (NONE, CAPTURING_PHASE, …) must be writable — dispatch uses setEventPhase;
 *   Hermes throws "read-only property 'NONE'" (or another phase) if any stay non-writable
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const rnEventPath = path.join(
  root,
  'node_modules/react-native/src/private/webapis/dom/events/Event.js',
);
const pkgRoot = path.join(root, 'node_modules/react-native-css-interop');
const nativeInterop = path.join(pkgRoot, 'dist/runtime/native/native-interop.js');
const renderTarget = path.join(pkgRoot, 'dist/runtime/native/render-component.js');
const renderVendor = path.join(__dirname, 'react-native-css-interop/react19-render-component.js');
const apiPath = path.join(pkgRoot, 'dist/runtime/native/api.js');

function patchReactNativeDomEventPhaseConstants() {
  if (!fs.existsSync(rnEventPath)) return;
  let s = fs.readFileSync(rnEventPath, 'utf8');
  // Stock RN uses data descriptors with no writable/configurable (defaults to read-only).
  const re =
    /Object\.defineProperty\((Event(?:\.prototype)?), '(NONE|CAPTURING_PHASE|AT_TARGET|BUBBLING_PHASE)', \{\n  enumerable: true,\n  value: (\d+),\n\}\);/g;
  const out = s.replace(re, (match, target, name, num) => {
    return `Object.defineProperty(${target}, '${name}', {\n  enumerable: true,\n  value: ${Number(num)},\n  writable: true,\n  configurable: true,\n});`;
  });
  if (out !== s) {
    fs.writeFileSync(rnEventPath, out);
  }
}

function patchNativeInterop() {
  if (!fs.existsSync(nativeInterop)) return;
  let s = fs.readFileSync(nativeInterop, 'utf8');

  const useStateBlock = `    const sharedState = (0, react_1.useState)({
        initialRender: true,
        originalProps,
        props: {},
        canUpgradeWarn: false,
        animated: render_component_1.UpgradeState.NONE,
        containers: render_component_1.UpgradeState.NONE,
        variables: render_component_1.UpgradeState.NONE,
        pressable: render_component_1.UpgradeState.NONE,
    })[0];`;

  const useRefBlock = `    const sharedStateRef = (0, react_1.useRef)(null);
    if (sharedStateRef.current === null) {
        sharedStateRef.current = {
            initialRender: true,
            originalProps,
            props: {},
            canUpgradeWarn: false,
            animated: 0,
            containers: 0,
            variables: 0,
            pressable: 0,
        };
    }
    const sharedState = sharedStateRef.current;`;

  if (s.includes(useStateBlock)) {
    s = s.replace(useStateBlock, useRefBlock);
  }

  s = s.replace(
    /sharedState\.pressable \|\|= render_component_1\.UpgradeState\.SHOULD_UPGRADE/g,
    'sharedState.pressable ||= 1',
  );
  s = s.replace(
    /sharedState\.animated \|\|= render_component_1\.UpgradeState\.SHOULD_UPGRADE/g,
    'sharedState.animated ||= 1',
  );
  s = s.replace(
    /sharedState\.variables \|\|= render_component_1\.UpgradeState\.SHOULD_UPGRADE/g,
    'sharedState.variables ||= 1',
  );
  s = s.replace(
    /sharedState\.containers \|\|= render_component_1\.UpgradeState\.SHOULD_UPGRADE/g,
    'sharedState.containers ||= 1',
  );

  const oldReturn = `    sharedState.originalProps = originalProps;
    sharedState.initialRender = false;
    return (0, render_component_1.renderComponent)(component, sharedState, { ref, ...props, ...memoOutput.handlers }, memoOutput.possiblyAnimatedProps, variables, containers);
}`;

  const newReturn = `    sharedState.originalProps = originalProps;
    sharedState.initialRender = false;
    const upgradeRenderState = {
        initialRender: sharedState.initialRender,
        originalProps: sharedState.originalProps,
        props: sharedState.props,
        canUpgradeWarn: sharedState.canUpgradeWarn,
        animated: sharedState.animated,
        containers: sharedState.containers,
        variables: sharedState.variables,
        pressable: sharedState.pressable,
    };
    const out = (0, render_component_1.renderComponent)(component, upgradeRenderState, { ref, ...props, ...memoOutput.handlers }, memoOutput.possiblyAnimatedProps, variables, containers);
    sharedState.pressable = upgradeRenderState.pressable;
    sharedState.animated = upgradeRenderState.animated;
    sharedState.variables = upgradeRenderState.variables;
    sharedState.containers = upgradeRenderState.containers;
    sharedState.canUpgradeWarn = upgradeRenderState.canUpgradeWarn;
    return out;
}`;

  if (s.includes(oldReturn)) {
    s = s.replace(oldReturn, newReturn);
  }

  fs.writeFileSync(nativeInterop, s);
}

function copyRenderComponent() {
  if (!fs.existsSync(renderVendor) || !fs.existsSync(path.dirname(renderTarget))) return;
  fs.copyFileSync(renderVendor, renderTarget);
}

function patchApiJs() {
  if (!fs.existsSync(apiPath)) return;
  let s = fs.readFileSync(apiPath, 'utf8');
  if (s.includes('cssInteropEffectRefUseColorScheme')) return;

  const oldColor = `function useColorScheme() {
    const [effect, setEffect] = (0, react_1.useState)(() => ({
        run: () => setEffect((s) => ({ ...s })),
        dependencies: new Set(),
    }));
    (0, observable_1.cleanupEffect)(effect);`;

  const newColor = `function useColorScheme() {
    const [, setCssInteropBump] = (0, react_1.useState)(0);
    const cssInteropEffectRefUseColorScheme = (0, react_1.useRef)(null);
    if (cssInteropEffectRefUseColorScheme.current === null) {
        cssInteropEffectRefUseColorScheme.current = {
            run: () => setCssInteropBump((n) => n + 1),
            dependencies: new Set(),
        };
    }
    const effect = cssInteropEffectRefUseColorScheme.current;
    (0, observable_1.cleanupEffect)(effect);`;

  const oldVar = `const useUnstableNativeVariable = (name) => {
    const context = (0, react_1.useContext)(styles_1.VariableContext);
    const [effect, setState] = (0, react_1.useState)(() => ({
        run: () => setState((s) => ({ ...s })),
        dependencies: new Set(),
    }));
    let value = (0, styles_1.getVariable)(name, context, effect);`;

  const newVar = `const useUnstableNativeVariable = (name) => {
    const context = (0, react_1.useContext)(styles_1.VariableContext);
    const [, setCssInteropVarBump] = (0, react_1.useState)(0);
    const cssInteropEffectRefVariable = (0, react_1.useRef)(null);
    if (cssInteropEffectRefVariable.current === null) {
        cssInteropEffectRefVariable.current = {
            run: () => setCssInteropVarBump((n) => n + 1),
            dependencies: new Set(),
        };
    }
    const effect = cssInteropEffectRefVariable.current;
    let value = (0, styles_1.getVariable)(name, context, effect);`;

  if (!s.includes(oldColor) || !s.includes(oldVar)) return;
  s = s.replace(oldColor, newColor).replace(oldVar, newVar);
  fs.writeFileSync(apiPath, s);
}

try {
  patchReactNativeDomEventPhaseConstants();
  patchNativeInterop();
  copyRenderComponent();
  patchApiJs();
} catch (e) {
  console.error('[apply-css-interop-react19]', e);
  process.exit(1);
}
