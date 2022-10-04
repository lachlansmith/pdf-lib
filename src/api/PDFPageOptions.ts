import { Color } from 'src/api/colors';
import PDFFont from 'src/api/PDFFont';
import { Rotation } from 'src/api/rotations';
import { LineCapStyle } from 'src/api/operators';

export enum BlendMode {
  Normal = 'Normal',
  Multiply = 'Multiply',
  Screen = 'Screen',
  Overlay = 'Overlay',
  Darken = 'Darken',
  Lighten = 'Lighten',
  ColorDodge = 'ColorDodge',
  ColorBurn = 'ColorBurn',
  HardLight = 'HardLight',
  SoftLight = 'SoftLight',
  Difference = 'Difference',
  Exclusion = 'Exclusion',
}

export interface PDFPageDrawTextOptions {
  color?: Color;
  opacity?: number;
  blendMode?: BlendMode;
  font?: PDFFont;
  size?: number;
  rotate?: Rotation;
  xSkew?: Rotation;
  ySkew?: Rotation;
  x?: number;
  y?: number;
  lineHeight?: number;
  maxWidth?: number;
  wordBreaks?: string[];
}

export interface PDFPageDrawImageOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotate?: Rotation;
  xSkew?: Rotation;
  ySkew?: Rotation;
  opacity?: number;
  blendMode?: BlendMode;
}

export interface PDFPageDrawPageOptions {
  x?: number;
  y?: number;
  xScale?: number;
  yScale?: number;
  width?: number;
  height?: number;
  rotate?: Rotation;
  xSkew?: Rotation;
  ySkew?: Rotation;
  opacity?: number;
  blendMode?: BlendMode;
}

export interface PDFPageDrawPathOptions {
  d?: string;
  rotate?: Rotation;
  scale?: number;
  fill?: Color;
  fillRule?: 'nonzero' | 'evenodd';
  stroke?: Color;
  strokeWidth?: number;
  strokeDashArray?: number[];
  strokeDashPhase?: number;
  strokeLineCap?: LineCapStyle;
  borderOpacity?: number;
  opacity?: number;
  blendMode?: BlendMode;
}

export interface PDFPageDrawLineOptions {
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  rotate?: Rotation;
  scale?: number;
  stroke?: Color;
  strokeWidth?: number;
  strokeLineCap?: LineCapStyle;
  strokeDashArray?: number[];
  strokeDashPhase?: number;
  opacity?: number;
  blendMode?: BlendMode;
}

export interface PDFPageDrawRectOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rx?: number;
  ry?: number;
  rotate?: Rotation;
  scale?: number;
  fill?: Color;
  fillRule?: 'nonzero' | 'evenodd';
  stroke?: Color;
  strokeWidth?: number;
  strokeDashArray?: number[];
  strokeDashPhase?: number;
  strokeLineCap?: LineCapStyle;
  borderOpacity?: number;
  opacity?: number;
  blendMode?: BlendMode;
}

export interface PDFPageDrawEllipseOptions {
  cx?: number;
  cy?: number;
  rx?: number;
  ry?: number;
  rotate?: Rotation;
  scale?: number;
  fill?: Color;
  fillRule?: 'nonzero' | 'evenodd';
  stroke?: Color;
  strokeWidth?: number;
  strokeDashArray?: number[];
  strokeDashPhase?: number;
  strokeLineCap?: LineCapStyle;
  borderOpacity?: number;
  opacity?: number;
  blendMode?: BlendMode;
}

export interface PDFPageDrawCircleOptions {
  cx?: number;
  cy?: number;
  r?: number;
  rotate?: Rotation;
  scale?: number;
  fill?: Color;
  fillRule?: 'nonzero' | 'evenodd';
  stroke?: Color;
  strokeWidth?: number;
  strokeDashArray?: number[];
  strokeDashPhase?: number;
  strokeLineCap?: LineCapStyle;
  borderOpacity?: number;
  opacity?: number;
  blendMode?: BlendMode;
}

export interface PDFPageDrawOptions {
  x?: number;
  y?: number;
  rotate?: Rotation;
  scale?: number;
}

export interface PDFPageApplyOptions {}

export interface PDFPageDrawGraphicOptions {}
