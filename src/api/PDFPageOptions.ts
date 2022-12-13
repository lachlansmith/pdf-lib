import { Color } from 'src/api/colors';
import PDFFont from 'src/api/PDFFont';
import { Rotation } from 'src/api/rotations';
import { LineCapStyle, LineJoinStyle } from 'src/api/operators';
import { PDFOperator } from '..';

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

export interface PDFPageDrawLineOptions {
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  rotate?: Rotation | [Rotation, [number, number]];
  scale?: number | [number, number];
  translate?: number | [number, number];
  skew?: number | [number, number];
  matrix?: [number, number, number, number, number, number];
  transform?: string;
  clipPath?: PDFOperator[];
  clipRule?: 'nonzero' | 'evenodd';
  stroke?: Color;
  strokeWidth?: number;
  strokeLineJoin?: LineJoinStyle;
  strokeMiterLimit?: number;
  strokeDashArray?: number[];
  strokeDashOffset?: number;
  strokeLineCap?: LineCapStyle;
  strokeOpacity?: number;
  opacity?: number;
  mixBlendMode?: BlendMode;
}

export interface PDFPageDrawRectOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rx?: number;
  ry?: number;
  rotate?: Rotation | [Rotation, [number, number]];
  scale?: number | [number, number];
  translate?: number | [number, number];
  skew?: number | [number, number];
  matrix?: [number, number, number, number, number, number];
  transform?: string;
  clipPath?: PDFOperator[];
  clipRule?: 'nonzero' | 'evenodd';
  fill?: Color;
  fillRule?: 'nonzero' | 'evenodd';
  stroke?: Color;
  strokeWidth?: number;
  strokeLineJoin?: LineJoinStyle;
  strokeMiterLimit?: number;
  strokeDashArray?: number[];
  strokeDashOffset?: number;
  strokeLineCap?: LineCapStyle;
  strokeOpacity?: number;
  fillOpacity?: number;
  opacity?: number;
  mixBlendMode?: BlendMode;
}

export interface PDFPageDrawArcOptions {
  x?: number; // start at x
  y?: number; // start at y
  rx?: number;
  ry?: number;
  rot?: number;
  large?: number;
  sweep?: number;
  ex?: number; // end at ex
  ey?: number; // end at ey
  rotate?: Rotation | [Rotation, [number, number]];
  scale?: number | [number, number];
  translate?: number | [number, number];
  skew?: number | [number, number];
  matrix?: [number, number, number, number, number, number];
  transform?: string;
  clipPath?: PDFOperator[];
  clipRule?: 'nonzero' | 'evenodd';
  fill?: Color;
  fillRule?: 'nonzero' | 'evenodd';
  stroke?: Color;
  strokeWidth?: number;
  strokeLineJoin?: LineJoinStyle;
  strokeMiterLimit?: number;
  strokeDashArray?: number[];
  strokeDashOffset?: number;
  strokeLineCap?: LineCapStyle;
  strokeOpacity?: number;
  fillOpacity?: number;
  opacity?: number;
  mixBlendMode?: BlendMode;
}

export interface PDFPageDrawEllipseOptions {
  cx?: number;
  cy?: number;
  rx?: number;
  ry?: number;
  rotate?: Rotation | [Rotation, [number, number]];
  scale?: number | [number, number];
  translate?: number | [number, number];
  skew?: number | [number, number];
  matrix?: [number, number, number, number, number, number];
  transform?: string;
  clipPath?: PDFOperator[];
  clipRule?: 'nonzero' | 'evenodd';
  fill?: Color;
  fillRule?: 'nonzero' | 'evenodd';
  stroke?: Color;
  strokeWidth?: number;
  strokeLineJoin?: LineJoinStyle;
  strokeMiterLimit?: number;
  strokeDashArray?: number[];
  strokeDashOffset?: number;
  strokeLineCap?: LineCapStyle;
  strokeOpacity?: number;
  fillOpacity?: number;
  opacity?: number;
  mixBlendMode?: BlendMode;
}

export interface PDFPageDrawCircleOptions {
  cx?: number;
  cy?: number;
  r?: number;
  rotate?: Rotation | [Rotation, [number, number]];
  scale?: number | [number, number];
  translate?: number | [number, number];
  skew?: number | [number, number];
  matrix?: [number, number, number, number, number, number];
  transform?: string;
  clipPath?: PDFOperator[];
  clipRule?: 'nonzero' | 'evenodd';
  fill?: Color;
  fillRule?: 'nonzero' | 'evenodd';
  stroke?: Color;
  strokeWidth?: number;
  strokeLineJoin?: LineJoinStyle;
  strokeMiterLimit?: number;
  strokeDashArray?: number[];
  strokeDashOffset?: number;
  strokeLineCap?: LineCapStyle;
  strokeOpacity?: number;
  fillOpacity?: number;
  opacity?: number;
  mixBlendMode?: BlendMode;
}

export interface PDFPageDrawPolylineOptions {
  points?: string | [number, number][];
  rotate?: Rotation | [Rotation, [number, number]];
  scale?: number | [number, number];
  translate?: number | [number, number];
  skew?: number | [number, number];
  matrix?: [number, number, number, number, number, number];
  transform?: string;
  clipPath?: PDFOperator[];
  clipRule?: 'nonzero' | 'evenodd';
  stroke?: Color;
  strokeWidth?: number;
  strokeLineJoin?: LineJoinStyle;
  strokeMiterLimit?: number;
  strokeDashArray?: number[];
  strokeDashOffset?: number;
  strokeLineCap?: LineCapStyle;
  strokeOpacity?: number;
  fillOpacity?: number;
  opacity?: number;
  mixBlendMode?: BlendMode;
}

export interface PDFPageDrawPolygonOptions {
  points?: string | [number, number][];
  rotate?: Rotation | [Rotation, [number, number]];
  scale?: number | [number, number];
  translate?: number | [number, number];
  skew?: number | [number, number];
  matrix?: [number, number, number, number, number, number];
  transform?: string;
  clipPath?: PDFOperator[];
  clipRule?: 'nonzero' | 'evenodd';
  fill?: Color;
  fillRule?: 'nonzero' | 'evenodd';
  stroke?: Color;
  strokeWidth?: number;
  strokeLineJoin?: LineJoinStyle;
  strokeMiterLimit?: number;
  strokeDashArray?: number[];
  strokeDashOffset?: number;
  strokeLineCap?: LineCapStyle;
  strokeOpacity?: number;
  fillOpacity?: number;
  opacity?: number;
  mixBlendMode?: BlendMode;
}

export interface PDFPageDrawPathOptions {
  d?: string;
  rotate?: Rotation | [Rotation, [number, number]];
  scale?: number | [number, number];
  translate?: number | [number, number];
  skew?: number | [number, number];
  matrix?: [number, number, number, number, number, number];
  transform?: string;
  clipPath?: PDFOperator[];
  clipRule?: 'nonzero' | 'evenodd';
  fill?: Color;
  fillRule?: 'nonzero' | 'evenodd';
  stroke?: Color;
  strokeWidth?: number;
  strokeLineJoin?: LineJoinStyle;
  strokeMiterLimit?: number;
  strokeDashArray?: number[];
  strokeDashOffset?: number;
  strokeLineCap?: LineCapStyle;
  strokeOpacity?: number;
  fillOpacity?: number;
  opacity?: number;
  mixBlendMode?: BlendMode;
}

export interface PDFPageDrawOptions {
  rotate?: Rotation | [Rotation, [number, number]];
  scale?: number | [number, number];
  translate?: number | [number, number];
  skew?: number | [number, number];
  matrix?: [number, number, number, number, number, number];
  transform?: string;
  clipPath?: PDFOperator[];
  clipRule?: 'nonzero' | 'evenodd';
}
