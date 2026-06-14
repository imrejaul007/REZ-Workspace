// Type declarations for packages without bundled types

declare module 'react-native-qrcode-svg' {
  import { ComponentProps } from 'react';
  import { ViewStyle } from 'react-native';

  interface QRCodeProps {
    value: string;
    size?: number;
    color?: string;
    backgroundColor?: string;
    logo?;
    logoSize?: number;
    logoBackgroundColor?: string;
    logoMargin?: number;
    logoBorderRadius?: number;
    quietZone?: number;
    enableLinearGradient?: boolean;
    linearGradient?: string[];
    gradientDirection?: string[];
    ecl?: 'L' | 'M' | 'Q' | 'H';
    getRef?: (ref) => void;
    onError?: (error) => void;
    style?: ViewStyle;
  }

  const QRCode: React.FC<QRCodeProps>;
  export default QRCode;
}

declare module 'victory-native' {
  import { ComponentProps, ReactNode } from 'react';
  import { ViewStyle } from 'react-native';

  interface VictoryThemeDefinition {
    [key: string];
  }

  interface VictoryTheme {
    material: VictoryThemeDefinition;
    grayscale: VictoryThemeDefinition;
  }

  export const VictoryTheme: VictoryTheme;

  interface CommonProps {
    style?: { [key: string]: unknown };
    width?: number;
    height?: number;
    padding?: number | { top?: number; bottom?: number; left?: number; right?: number };
    theme?: VictoryThemeDefinition;
    animate?: boolean | { [key: string]: unknown };
  }

  interface VictoryChartProps extends CommonProps {
    children?: ReactNode;
    domain?: { x?: [number, number]; y?: [number, number] };
    domainPadding?: number | { x?: number | [number, number]; y?: number | [number, number] };
    scale?: { x?: string; y?: string };
  }

  interface VictoryBarProps extends CommonProps {
    data?: Array<{ x?; y?; [key: string]: unknown }>;
    x?: string | ((datum) => unknown);
    y?: string | ((datum) => unknown);
    barWidth?: number;
    cornerRadius?: number | { top?: number; bottom?: number };
    alignment?: 'start' | 'middle' | 'end';
    labels?: ((datum) => string) | string[];
    labelComponent?: ReactNode;
    events?: unknown[];
  }

  interface VictoryLineProps extends CommonProps {
    data?: Array<{ x?; y?; [key: string]: unknown }>;
    x?: string | ((datum) => unknown);
    y?: string | ((datum) => unknown);
    interpolation?: string;
    labels?: ((datum) => string) | string[];
    labelComponent?: ReactNode;
  }

  interface VictoryAxisProps extends CommonProps {
    dependentAxis?: boolean;
    tickFormat?: ((tick, index: number, ticks: unknown[]) => string) | string[];
    tickValues?: unknown[];
    tickCount?: number;
    label?: string;
    crossAxis?: boolean;
    orientation?: 'top' | 'bottom' | 'left' | 'right';
  }

  interface VictoryPieProps extends CommonProps {
    data?: Array<{ x?; y?; [key: string]: unknown }>;
    x?: string | ((datum) => unknown);
    y?: string | ((datum) => unknown);
    colorScale?: string[] | string;
    innerRadius?: number;
    padAngle?: number;
    labels?: ((datum) => string) | string[];
    labelComponent?: ReactNode;
  }

  interface VictoryTooltipProps {
    [key: string];
  }

  interface VictoryLabelProps {
    text?: string | ((datum) => string);
    style?: { [key: string]: unknown };
    [key: string];
  }

  interface VictoryGroupProps extends CommonProps {
    children?: ReactNode;
    offset?: number;
    colorScale?: string[] | string;
  }

  export const VictoryGroup: React.FC<VictoryGroupProps>;
  export const VictoryChart: React.FC<VictoryChartProps>;
  export const VictoryBar: React.FC<VictoryBarProps>;
  export const VictoryLine: React.FC<VictoryLineProps>;
  export const VictoryAxis: React.FC<VictoryAxisProps>;
  export const VictoryPie: React.FC<VictoryPieProps>;
  export const VictoryTooltip: React.FC<VictoryTooltipProps>;
  export const VictoryLabel: React.FC<VictoryLabelProps>;
}

declare module '@env' {
  export const EXPO_PUBLIC_API_URL: string;
  export const EXPO_PUBLIC_SOCKET_URL: string;
  export const EXPO_PUBLIC_MERCHANT_APP_VERSION: string;
  export const EXPO_PUBLIC_DEPLOY_ENV: string;
  export const __DEV__: boolean;
}
