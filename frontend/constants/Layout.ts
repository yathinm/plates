import { Platform } from 'react-native';

export const TAB_BAR_CONTENT_HEIGHT = 56;
export const TAB_BAR_BOTTOM_INSET = Platform.OS === 'ios' ? 24 : 8;
export const TAB_BAR_HEIGHT = TAB_BAR_CONTENT_HEIGHT + TAB_BAR_BOTTOM_INSET;

export const OVERLAY_HEIGHT = 64;
