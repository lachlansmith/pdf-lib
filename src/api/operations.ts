import {
  beginText,
  closePath,
  drawObject,
  endText,
  fill,
  fillAndStroke,
  lineTo,
  moveTo,
  nextLine,
  popGraphicsState,
  pushGraphicsState,
  rotateAndSkewTextRadiansAndTranslate,
  rotateRadians,
  setFontAndSize,
  setLineHeight,
  setLineWidth,
  setLineJoin,
  setLineMiterLimit,
  showText,
  skewRadians,
  stroke,
  LineCapStyle,
  setLineCap,
  rotateDegrees,
  setGraphicsState,
  setDashPattern,
  beginMarkedContent,
  endMarkedContent,
  clip,
  endPath,
  LineJoinStyle,
} from 'src/api/operators';
import { Color, setFillingColor, setStrokingColor } from 'src/api/colors';
import { Rotation, degrees, toRadians } from 'src/api/rotations';
import {
  line,
  polyline,
  arc,
  circle,
  ellipse,
  rect,
  path,
  polygon,
} from 'src/api/shape';
import { PDFHexString, PDFName, PDFNumber, PDFOperator } from 'src/core';
import { asNumber } from 'src/api/objects';
import { translate, scale, skew, matrix, transform } from 'src/api/transform';
import { Shape, Text, Image, Group } from 'src/api/JSXParser';
import PDFPage from 'src/api/PDFPage';
// import { breakTextIntoLines, cleanText, lineSplit } from 'src/utils';

export interface DrawTextOptions {
  color: Color;
  font: string | PDFName;
  size: number | PDFNumber;
  rotate: Rotation;
  xSkew: Rotation;
  ySkew: Rotation;
  x: number | PDFNumber;
  y: number | PDFNumber;
  graphicsState?: string | PDFName;
}

export const drawText = (
  text: PDFHexString,
  options: DrawTextOptions,
): PDFOperator[] =>
  [
    pushGraphicsState(),
    options.graphicsState && setGraphicsState(options.graphicsState),
    beginText(),
    setFillingColor(options.color),
    setFontAndSize(options.font, options.size),
    rotateAndSkewTextRadiansAndTranslate(
      toRadians(options.rotate),
      toRadians(options.xSkew),
      toRadians(options.ySkew),
      options.x,
      options.y,
    ),
    showText(text),
    endText(),
    popGraphicsState(),
  ].filter(Boolean) as PDFOperator[];

export interface DrawLinesOfTextOptions extends DrawTextOptions {
  lineHeight: number | PDFNumber;
}

export const drawLinesOfText = (
  lines: PDFHexString[],
  options: DrawLinesOfTextOptions,
): PDFOperator[] => {
  const ops = [
    pushGraphicsState(),
    options.graphicsState && setGraphicsState(options.graphicsState),
    beginText(),
    setFillingColor(options.color),
    setFontAndSize(options.font, options.size),
    setLineHeight(options.lineHeight),
    rotateAndSkewTextRadiansAndTranslate(
      toRadians(options.rotate),
      toRadians(options.xSkew),
      toRadians(options.ySkew),
      options.x,
      options.y,
    ),
  ].filter(Boolean) as PDFOperator[];

  for (let idx = 0, len = lines.length; idx < len; idx++) {
    ops.push(showText(lines[idx]), nextLine());
  }

  ops.push(endText(), popGraphicsState());
  return ops;
};

export const drawImage = (
  name: string | PDFName,
  options: {
    x: number | PDFNumber;
    y: number | PDFNumber;
    width: number | PDFNumber;
    height: number | PDFNumber;
    rotate: Rotation;
    xSkew: Rotation;
    ySkew: Rotation;
    graphicsState?: string | PDFName;
  },
): PDFOperator[] =>
  [
    pushGraphicsState(),
    options.graphicsState && setGraphicsState(options.graphicsState),

    translate(options.x, options.y),
    rotateRadians(toRadians(options.rotate)),
    scale(options.width, options.height),
    skewRadians(toRadians(options.xSkew), toRadians(options.ySkew)),

    drawObject(name),

    popGraphicsState(),
  ].filter(Boolean) as PDFOperator[];

export const drawPage = (
  name: string | PDFName,
  options: {
    x: number | PDFNumber;
    y: number | PDFNumber;
    xScale: number | PDFNumber;
    yScale: number | PDFNumber;
    rotate: Rotation;
    xSkew: Rotation;
    ySkew: Rotation;
    graphicsState?: string | PDFName;
  },
): PDFOperator[] =>
  [
    pushGraphicsState(),

    options.graphicsState && setGraphicsState(options.graphicsState),
    translate(options.x, options.y),
    rotateRadians(toRadians(options.rotate)),
    scale(options.xScale, options.yScale),
    skewRadians(toRadians(options.xSkew), toRadians(options.ySkew)),

    drawObject(name),

    popGraphicsState(),
  ].filter(Boolean) as PDFOperator[];

export const drawLine = (options: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
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
  graphicsState?: string | PDFName;
}) => {
  const ops = [
    pushGraphicsState(),
    options.graphicsState ? setGraphicsState(options.graphicsState) : undefined,

    options.translate
      ? options.translate instanceof Array
        ? translate(options.translate[0], options.translate[1])
        : translate(options.translate, 0)
      : undefined,

    ...(options.rotate
      ? options.rotate instanceof Array
        ? [
            translate(options.rotate[1][0], options.rotate[1][1]),
            rotateRadians(toRadians(options.rotate[0])),
            translate(-options.rotate[1][0], -options.rotate[1][1]),
          ]
        : [rotateRadians(toRadians(options.rotate))]
      : []),

    options.skew
      ? options.skew instanceof Array
        ? skew(options.skew[0], options.skew[1])
        : skew(options.skew, options.skew)
      : undefined,

    options.scale
      ? options.scale instanceof Array
        ? scale(options.scale[0], options.scale[1])
        : scale(options.scale, options.scale)
      : undefined,

    options.matrix ? matrix(...options.matrix) : undefined,
    ...(options.transform ? transform(options.transform) : []),

    options.stroke ? setStrokingColor(options.stroke as Color) : undefined,
    options.strokeWidth ? setLineWidth(options.strokeWidth) : undefined,
    options.strokeLineJoin ? setLineJoin(options.strokeLineJoin) : undefined,
    options.strokeMiterLimit
      ? setLineMiterLimit(options.strokeMiterLimit)
      : undefined,
    options.strokeLineCap ? setLineCap(options.strokeLineCap) : undefined,
    options.strokeDashArray || options.strokeDashOffset
      ? setDashPattern(
          options.strokeDashArray ?? [],
          options.strokeDashOffset ?? 0,
        )
      : undefined,
  ];

  if (options.clipPath) {
    options.clipPath.forEach((op) => ops.push(op));
    ops.push(clip(options.clipRule), endPath());
  }

  line(options.x1, options.y1, options.x2, options.y2).forEach((op) =>
    ops.push(op),
  );

  ops.push(options.stroke ? stroke() : undefined, popGraphicsState());

  return ops.filter(Boolean) as PDFOperator[];
};

export const drawRect = (options: {
  x: number;
  y: number;
  width: number;
  height: number;
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
  graphicsState?: string | PDFName;
}) => {
  const ops = [
    pushGraphicsState(),
    options.graphicsState ? setGraphicsState(options.graphicsState) : undefined,

    options.translate
      ? options.translate instanceof Array
        ? translate(options.translate[0], options.translate[1])
        : translate(options.translate, 0)
      : undefined,

    ...(options.rotate
      ? options.rotate instanceof Array
        ? [
            translate(options.rotate[1][0], options.rotate[1][1]),
            rotateRadians(toRadians(options.rotate[0])),
            translate(-options.rotate[1][0], -options.rotate[1][1]),
          ]
        : [rotateRadians(toRadians(options.rotate))]
      : []),

    options.skew
      ? options.skew instanceof Array
        ? skew(options.skew[0], options.skew[1])
        : skew(options.skew, options.skew)
      : undefined,

    options.scale
      ? options.scale instanceof Array
        ? scale(options.scale[0], options.scale[1])
        : scale(options.scale, options.scale)
      : undefined,

    options.matrix ? matrix(...options.matrix) : undefined,
    ...(options.transform ? transform(options.transform) : []),

    options.fill ? setFillingColor(options.fill) : undefined,
    options.stroke ? setStrokingColor(options.stroke as Color) : undefined,
    options.strokeWidth ? setLineWidth(options.strokeWidth) : undefined,
    options.strokeLineJoin ? setLineJoin(options.strokeLineJoin) : undefined,
    options.strokeMiterLimit
      ? setLineMiterLimit(options.strokeMiterLimit)
      : undefined,
    options.strokeLineCap ? setLineCap(options.strokeLineCap) : undefined,
    options.strokeDashArray || options.strokeDashOffset
      ? setDashPattern(
          options.strokeDashArray ?? [],
          options.strokeDashOffset ?? 0,
        )
      : undefined,
  ];

  if (options.clipPath) {
    options.clipPath.forEach((op) => ops.push(op));
    ops.push(clip(options.clipRule), endPath());
  }

  rect(
    options.x,
    options.y,
    options.width,
    options.height,
    options.rx ? options.rx : undefined,
    options.ry ? options.ry : undefined,
  ).forEach((op) => ops.push(op));

  ops.push(
    // prettier-ignore
    options.fill && options.stroke ? fillAndStroke(options.fillRule)
      : options.fill               ? fill(options.fillRule)
      : options.stroke             ? stroke()
      : undefined,

    popGraphicsState(),
  );

  return ops.filter(Boolean) as PDFOperator[];
};

export const drawArc = (options: {
  x: number; // start at x
  y: number; // start at y
  rx: number;
  ry: number;
  rot: number;
  large: number;
  sweep: number;
  ex: number; // end at ex
  ey: number; // end at ey
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
  graphicsState?: string | PDFName;
}) => {
  const ops = [
    pushGraphicsState(),
    options.graphicsState ? setGraphicsState(options.graphicsState) : undefined,

    options.translate
      ? options.translate instanceof Array
        ? translate(options.translate[0], options.translate[1])
        : translate(options.translate, 0)
      : undefined,

    ...(options.rotate
      ? options.rotate instanceof Array
        ? [
            translate(options.rotate[1][0], options.rotate[1][1]),
            rotateRadians(toRadians(options.rotate[0])),
            translate(-options.rotate[1][0], -options.rotate[1][1]),
          ]
        : [rotateRadians(toRadians(options.rotate))]
      : []),

    options.skew
      ? options.skew instanceof Array
        ? skew(options.skew[0], options.skew[1])
        : skew(options.skew, options.skew)
      : undefined,

    options.scale
      ? options.scale instanceof Array
        ? scale(options.scale[0], options.scale[1])
        : scale(options.scale, options.scale)
      : undefined,

    options.matrix ? matrix(...options.matrix) : undefined,
    ...(options.transform ? transform(options.transform) : []),

    options.fill ? setFillingColor(options.fill) : undefined,
    options.stroke ? setStrokingColor(options.stroke as Color) : undefined,
    options.strokeWidth ? setLineWidth(options.strokeWidth) : undefined,
    options.strokeLineJoin ? setLineJoin(options.strokeLineJoin) : undefined,
    options.strokeMiterLimit
      ? setLineMiterLimit(options.strokeMiterLimit)
      : undefined,
    options.strokeLineCap ? setLineCap(options.strokeLineCap) : undefined,
    options.strokeDashArray || options.strokeDashOffset
      ? setDashPattern(
          options.strokeDashArray ?? [],
          options.strokeDashOffset ?? 0,
        )
      : undefined,
  ];

  if (options.clipPath) {
    options.clipPath.forEach((op) => ops.push(op));
    ops.push(clip(options.clipRule), endPath());
  }

  arc(
    options.x, // start at x
    options.y, // start at y
    options.rx,
    options.ry,
    options.rot,
    options.large,
    options.sweep,
    options.ex, // end at ex
    options.ey, // end at ey
  ).forEach((op) => ops.push(op));

  ops.push(
    // prettier-ignore
    options.fill && options.stroke ? fillAndStroke(options.fillRule)
        : options.fill               ? fill(options.fillRule)
        : options.stroke             ? stroke()
        : closePath(),

    popGraphicsState(),
  );
  return ops.filter(Boolean) as PDFOperator[];
};

export const drawEllipse = (options: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
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
  graphicsState?: string | PDFName;
}) => {
  const ops = [
    pushGraphicsState(),
    options.graphicsState ? setGraphicsState(options.graphicsState) : undefined,

    options.translate
      ? options.translate instanceof Array
        ? translate(options.translate[0], options.translate[1])
        : translate(options.translate, 0)
      : undefined,

    ...(options.rotate
      ? options.rotate instanceof Array
        ? [
            translate(options.rotate[1][0], options.rotate[1][1]),
            rotateRadians(toRadians(options.rotate[0])),
            translate(-options.rotate[1][0], -options.rotate[1][1]),
          ]
        : [rotateRadians(toRadians(options.rotate))]
      : []),

    options.skew
      ? options.skew instanceof Array
        ? skew(options.skew[0], options.skew[1])
        : skew(options.skew, options.skew)
      : undefined,

    options.scale
      ? options.scale instanceof Array
        ? scale(options.scale[0], options.scale[1])
        : scale(options.scale, options.scale)
      : undefined,

    options.matrix ? matrix(...options.matrix) : undefined,
    ...(options.transform ? transform(options.transform) : []),

    options.fill ? setFillingColor(options.fill) : undefined,
    options.stroke ? setStrokingColor(options.stroke as Color) : undefined,
    options.strokeWidth ? setLineWidth(options.strokeWidth) : undefined,
    options.strokeLineJoin ? setLineJoin(options.strokeLineJoin) : undefined,
    options.strokeMiterLimit
      ? setLineMiterLimit(options.strokeMiterLimit)
      : undefined,
    options.strokeLineCap ? setLineCap(options.strokeLineCap) : undefined,
    options.strokeDashArray || options.strokeDashOffset
      ? setDashPattern(
          options.strokeDashArray ?? [],
          options.strokeDashOffset ?? 0,
        )
      : undefined,
  ];

  if (options.clipPath) {
    options.clipPath.forEach((op) => ops.push(op));
    ops.push(clip(options.clipRule), endPath());
  }

  ellipse(options.cx, options.cy, options.rx, options.ry).forEach((op) =>
    ops.push(op),
  );

  ops.push(
    // prettier-ignore
    options.fill && options.stroke ? fillAndStroke(options.fillRule)
      : options.fill               ? fill(options.fillRule)
      : options.stroke             ? stroke()
      : closePath(),

    popGraphicsState(),
  );
  return ops.filter(Boolean) as PDFOperator[];
};

export const drawCircle = (options: {
  cx: number;
  cy: number;
  r: number;
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
  graphicsState?: string | PDFName;
}) => {
  const ops = [
    pushGraphicsState(),
    options.graphicsState ? setGraphicsState(options.graphicsState) : undefined,

    options.translate
      ? options.translate instanceof Array
        ? translate(options.translate[0], options.translate[1])
        : translate(options.translate, 0)
      : undefined,

    ...(options.rotate
      ? options.rotate instanceof Array
        ? [
            translate(options.rotate[1][0], options.rotate[1][1]),
            rotateRadians(toRadians(options.rotate[0])),
            translate(-options.rotate[1][0], -options.rotate[1][1]),
          ]
        : [rotateRadians(toRadians(options.rotate))]
      : []),

    options.skew
      ? options.skew instanceof Array
        ? skew(options.skew[0], options.skew[1])
        : skew(options.skew, options.skew)
      : undefined,

    options.scale
      ? options.scale instanceof Array
        ? scale(options.scale[0], options.scale[1])
        : scale(options.scale, options.scale)
      : undefined,

    options.matrix ? matrix(...options.matrix) : undefined,
    ...(options.transform ? transform(options.transform) : []),

    options.fill ? setFillingColor(options.fill) : undefined,
    options.stroke ? setStrokingColor(options.stroke as Color) : undefined,
    options.strokeWidth ? setLineWidth(options.strokeWidth) : undefined,
    options.strokeLineJoin ? setLineJoin(options.strokeLineJoin) : undefined,
    options.strokeMiterLimit
      ? setLineMiterLimit(options.strokeMiterLimit)
      : undefined,
    options.strokeLineCap ? setLineCap(options.strokeLineCap) : undefined,
    options.strokeDashArray || options.strokeDashOffset
      ? setDashPattern(
          options.strokeDashArray ?? [],
          options.strokeDashOffset ?? 0,
        )
      : undefined,
  ];

  if (options.clipPath) {
    options.clipPath.forEach((op) => ops.push(op));
    ops.push(clip(options.clipRule), endPath());
  }

  circle(options.cx, options.cy, options.r).forEach((op) => ops.push(op));

  ops.push(
    // prettier-ignore
    options.fill && options.stroke ? fillAndStroke(options.fillRule)
      : options.fill               ? fill(options.fillRule)
      : options.stroke             ? stroke()
      : undefined,

    popGraphicsState(),
  );

  return ops.filter(Boolean) as PDFOperator[];
};

export const drawPath = (options: {
  d: string;
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
  graphicsState?: string | PDFName;
}) => {
  const ops = [
    pushGraphicsState(),
    options.graphicsState ? setGraphicsState(options.graphicsState) : undefined,

    options.translate
      ? options.translate instanceof Array
        ? translate(options.translate[0], options.translate[1])
        : translate(options.translate, 0)
      : undefined,

    ...(options.rotate
      ? options.rotate instanceof Array
        ? [
            translate(options.rotate[1][0], options.rotate[1][1]),
            rotateRadians(toRadians(options.rotate[0])),
            translate(-options.rotate[1][0], -options.rotate[1][1]),
          ]
        : [rotateRadians(toRadians(options.rotate))]
      : []),

    options.skew
      ? options.skew instanceof Array
        ? skew(options.skew[0], options.skew[1])
        : skew(options.skew, options.skew)
      : undefined,

    options.scale
      ? options.scale instanceof Array
        ? scale(options.scale[0], options.scale[1])
        : scale(options.scale, options.scale)
      : undefined,

    options.matrix ? matrix(...options.matrix) : undefined,
    ...(options.transform ? transform(options.transform) : []),

    options.fill ? setFillingColor(options.fill) : undefined,
    options.stroke ? setStrokingColor(options.stroke as Color) : undefined,
    options.strokeWidth ? setLineWidth(options.strokeWidth) : undefined,
    options.strokeLineJoin ? setLineJoin(options.strokeLineJoin) : undefined,
    options.strokeMiterLimit
      ? setLineMiterLimit(options.strokeMiterLimit)
      : undefined,
    options.strokeLineCap ? setLineCap(options.strokeLineCap) : undefined,
    options.strokeDashArray || options.strokeDashOffset
      ? setDashPattern(
          options.strokeDashArray ?? [],
          options.strokeDashOffset ?? 0,
        )
      : undefined,
  ];

  if (options.clipPath) {
    options.clipPath.forEach((op) => ops.push(op));
    ops.push(clip(options.clipRule), endPath());
  }

  path(options.d).forEach((op) => ops.push(op));

  ops.push(
    // prettier-ignore
    options.fill && options.stroke ? fillAndStroke(options.fillRule)
      : options.fill               ? fill(options.fillRule)
      : options.stroke             ? stroke()
      : undefined,

    popGraphicsState(),
  );

  return ops.filter(Boolean) as PDFOperator[];
};

export const drawPolygon = (options: {
  points: string | [number, number][];
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
  graphicsState?: string | PDFName;
}) => {
  const ops = [
    pushGraphicsState(),
    options.graphicsState ? setGraphicsState(options.graphicsState) : undefined,

    options.translate
      ? options.translate instanceof Array
        ? translate(options.translate[0], options.translate[1])
        : translate(options.translate, 0)
      : undefined,

    ...(options.rotate
      ? options.rotate instanceof Array
        ? [
            translate(options.rotate[1][0], options.rotate[1][1]),
            rotateRadians(toRadians(options.rotate[0])),
            translate(-options.rotate[1][0], -options.rotate[1][1]),
          ]
        : [rotateRadians(toRadians(options.rotate))]
      : []),

    options.skew
      ? options.skew instanceof Array
        ? skew(options.skew[0], options.skew[1])
        : skew(options.skew, options.skew)
      : undefined,

    options.scale
      ? options.scale instanceof Array
        ? scale(options.scale[0], options.scale[1])
        : scale(options.scale, options.scale)
      : undefined,

    options.matrix ? matrix(...options.matrix) : undefined,
    ...(options.transform ? transform(options.transform) : []),

    options.fill ? setFillingColor(options.fill) : undefined,
    options.stroke ? setStrokingColor(options.stroke as Color) : undefined,
    options.strokeWidth ? setLineWidth(options.strokeWidth) : undefined,
    options.strokeLineJoin ? setLineJoin(options.strokeLineJoin) : undefined,
    options.strokeMiterLimit
      ? setLineMiterLimit(options.strokeMiterLimit)
      : undefined,
    options.strokeLineCap ? setLineCap(options.strokeLineCap) : undefined,
    options.strokeDashArray || options.strokeDashOffset
      ? setDashPattern(
          options.strokeDashArray ?? [],
          options.strokeDashOffset ?? 0,
        )
      : undefined,
  ];

  if (options.clipPath) {
    options.clipPath.forEach((op) => ops.push(op));
    ops.push(clip(options.clipRule), endPath());
  }

  polygon(options.points).forEach((op) => ops.push(op));

  ops.push(
    // prettier-ignore
    options.fill && options.stroke ? fillAndStroke(options.fillRule)
        : options.fill             ? fill(options.fillRule)
        : options.stroke           ? stroke()
        : undefined,

    popGraphicsState(),
  );

  return ops.filter(Boolean) as PDFOperator[];
};

export const drawPolyline = (options: {
  points: string | [number, number][];
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
  graphicsState?: string | PDFName;
}) => {
  const ops = [
    pushGraphicsState(),
    options.graphicsState ? setGraphicsState(options.graphicsState) : undefined,

    options.translate
      ? options.translate instanceof Array
        ? translate(options.translate[0], options.translate[1])
        : translate(options.translate, 0)
      : undefined,

    ...(options.rotate
      ? options.rotate instanceof Array
        ? [
            translate(options.rotate[1][0], options.rotate[1][1]),
            rotateRadians(toRadians(options.rotate[0])),
            translate(-options.rotate[1][0], -options.rotate[1][1]),
          ]
        : [rotateRadians(toRadians(options.rotate))]
      : []),

    options.skew
      ? options.skew instanceof Array
        ? skew(options.skew[0], options.skew[1])
        : skew(options.skew, options.skew)
      : undefined,

    options.scale
      ? options.scale instanceof Array
        ? scale(options.scale[0], options.scale[1])
        : scale(options.scale, options.scale)
      : undefined,

    options.matrix ? matrix(...options.matrix) : undefined,
    ...(options.transform ? transform(options.transform) : []),

    options.stroke ? setStrokingColor(options.stroke as Color) : undefined,
    options.strokeWidth ? setLineWidth(options.strokeWidth) : undefined,
    options.strokeLineJoin ? setLineJoin(options.strokeLineJoin) : undefined,
    options.strokeMiterLimit
      ? setLineMiterLimit(options.strokeMiterLimit)
      : undefined,
    options.strokeLineCap ? setLineCap(options.strokeLineCap) : undefined,
    options.strokeDashArray || options.strokeDashOffset
      ? setDashPattern(
          options.strokeDashArray ?? [],
          options.strokeDashOffset ?? 0,
        )
      : undefined,
  ];

  if (options.clipPath) {
    options.clipPath.forEach((op) => ops.push(op));
    ops.push(clip(options.clipRule), endPath());
  }

  polyline(options.points).forEach((op) => ops.push(op));

  ops.push(options.stroke ? stroke() : undefined, popGraphicsState());

  return ops.filter(Boolean) as PDFOperator[];
};

export const draw = (
  g: Shape | Text | Image | Group,
  page: PDFPage,
  options: {
    rotate?: Rotation | [Rotation, [number, number]];
    scale?: number | [number, number];
    translate?: number | [number, number];
    skew?: number | [number, number];
    matrix?: [number, number, number, number, number, number];
    transform?: string;
    clipPath?: PDFOperator[];
    clipRule?: 'nonzero' | 'evenodd';
    graphicsState?: string | PDFName;
  },
) => {
  const ops = [
    pushGraphicsState(),
    options.graphicsState ? setGraphicsState(options.graphicsState) : undefined,

    options.translate
      ? options.translate instanceof Array
        ? translate(options.translate[0], options.translate[1])
        : translate(options.translate, 0)
      : undefined,

    ...(options.rotate
      ? options.rotate instanceof Array
        ? [
            translate(options.rotate[1][0], options.rotate[1][1]),
            rotateRadians(toRadians(options.rotate[0])),
            translate(-options.rotate[1][0], -options.rotate[1][1]),
          ]
        : [rotateRadians(toRadians(options.rotate))]
      : []),

    options.skew
      ? options.skew instanceof Array
        ? skew(options.skew[0], options.skew[1])
        : skew(options.skew, options.skew)
      : undefined,

    options.scale
      ? options.scale instanceof Array
        ? scale(options.scale[0], options.scale[1])
        : scale(options.scale, options.scale)
      : undefined,

    options.matrix ? matrix(...options.matrix) : undefined,
    ...(options.transform ? transform(options.transform) : []),

    scale(1, -1), // make top left
  ];

  if (options.clipPath) {
    options.clipPath.forEach((op) => ops.push(op));
    ops.push(clip(options.clipRule), endPath());
  }

  graphic(g, page).forEach((o) => ops.push(o)); // can't use spread operator or will hit max call stack

  ops.push(popGraphicsState());

  return ops.filter(Boolean) as PDFOperator[];
};

export const drawCheckMark = (options: {
  x: number | PDFNumber;
  y: number | PDFNumber;
  size: number | PDFNumber;
  thickness: number | PDFNumber;
  color: Color | undefined;
}) => {
  const size = asNumber(options.size);

  /*********************** Define Check Mark Points ***************************/
  // A check mark is defined by three points in some coordinate space. Here, we
  // define these points in a unit coordinate system, where the range of the x
  // and y axis are both [-1, 1].
  //
  // Note that we do not hard code `p1y` in case we wish to change the
  // size/shape of the check mark in the future. We want the check mark to
  // always form a right angle. This means that the dot product between (p1-p2)
  // and (p3-p2) should be zero:
  //
  //   (p1x-p2x) * (p3x-p2x) + (p1y-p2y) * (p3y-p2y) = 0
  //
  // We can now rejigger this equation to solve for `p1y`:
  //
  //   (p1y-p2y) * (p3y-p2y) = -((p1x-p2x) * (p3x-p2x))
  //   (p1y-p2y) = -((p1x-p2x) * (p3x-p2x)) / (p3y-p2y)
  //   p1y = -((p1x-p2x) * (p3x-p2x)) / (p3y-p2y) + p2y
  //
  // Thanks to my friend Joel Walker (https://github.com/JWalker1995) for
  // devising the above equation and unit coordinate system approach!

  // (x, y) coords of the check mark's bottommost point
  const p2x = -1 + 0.75;
  const p2y = -1 + 0.51;

  // (x, y) coords of the check mark's topmost point
  const p3y = 1 - 0.525;
  const p3x = 1 - 0.31;

  // (x, y) coords of the check mark's center (vertically) point
  const p1x = -1 + 0.325;
  const p1y = -((p1x - p2x) * (p3x - p2x)) / (p3y - p2y) + p2y;
  /****************************************************************************/

  return [
    pushGraphicsState(),
    options.color && setStrokingColor(options.color),
    setLineWidth(options.thickness),

    translate(options.x, options.y),
    moveTo(p1x * size, p1y * size),
    lineTo(p2x * size, p2y * size),
    lineTo(p3x * size, p3y * size),

    stroke(),
    popGraphicsState(),
  ].filter(Boolean) as PDFOperator[];
};

// prettier-ignore
export const rotateInPlace = (options: {
  width: number | PDFNumber;
  height: number | PDFNumber;
  rotation: 0 | 90 | 180 | 270;
}) =>
    options.rotation === 0 ? [
      translate(0, 0),
      rotateDegrees(0)
    ]
  : options.rotation === 90 ? [
      translate(options.width, 0),
      rotateDegrees(90)
    ]
  : options.rotation === 180 ? [
      translate(options.width, options.height),
      rotateDegrees(180)
    ]
  : options.rotation === 270 ? [
      translate(0, options.height),
      rotateDegrees(270)
    ]
  : []; // Invalid rotation - noop

export const drawCheckBox = (options: {
  x: number | PDFNumber;
  y: number | PDFNumber;
  width: number | PDFNumber;
  height: number | PDFNumber;
  thickness: number | PDFNumber;
  borderWidth: number | PDFNumber;
  markColor: Color | undefined;
  color: Color | undefined;
  borderColor: Color | undefined;
  filled: boolean;
}) => {
  const outline = drawRect({
    x: asNumber(options.x),
    y: asNumber(options.y),
    width: asNumber(options.width),
    height: asNumber(options.height),
    strokeWidth: asNumber(options.borderWidth),
    fill: options.color,
    stroke: options.borderColor,
  });

  if (!options.filled) return outline;

  const width = asNumber(options.width);
  const height = asNumber(options.height);

  const checkMarkSize = Math.min(width, height) / 2;

  const checkMark = drawCheckMark({
    x: width / 2,
    y: height / 2,
    size: checkMarkSize,
    thickness: options.thickness,
    color: options.markColor,
  });

  return [pushGraphicsState(), ...outline, ...checkMark, popGraphicsState()];
};

export const drawRadioButton = (options: {
  x: number | PDFNumber;
  y: number | PDFNumber;
  width: number | PDFNumber;
  height: number | PDFNumber;
  borderWidth: number | PDFNumber;
  dotColor: Color | undefined;
  color: Color | undefined;
  borderColor: Color | undefined;
  filled: boolean;
}) => {
  const width = asNumber(options.width);
  const height = asNumber(options.height);

  const outlineScale = Math.min(width, height) / 2;

  const outline = drawEllipse({
    cx: asNumber(options.x),
    cy: asNumber(options.y),
    rx: outlineScale,
    ry: outlineScale,
    fill: options.color,
    stroke: options.borderColor,
    strokeWidth: asNumber(options.borderWidth),
  });

  if (!options.filled) return outline;

  const dot = drawEllipse({
    cx: asNumber(options.x),
    cy: asNumber(options.y),
    rx: outlineScale * 0.45,
    ry: outlineScale * 0.45,
    fill: options.dotColor,
    stroke: undefined,
    strokeWidth: 0,
  });

  return [pushGraphicsState(), ...outline, ...dot, popGraphicsState()];
};

export const drawButton = (options: {
  x: number | PDFNumber;
  y: number | PDFNumber;
  width: number | PDFNumber;
  height: number | PDFNumber;
  borderWidth: number | PDFNumber;
  color: Color | undefined;
  borderColor: Color | undefined;
  textLines: { encoded: PDFHexString; x: number; y: number }[];
  textColor: Color;
  font: string | PDFName;
  fontSize: number | PDFNumber;
}) => {
  const background = drawRect({
    x: asNumber(options.x),
    y: asNumber(options.y),
    width: asNumber(options.width),
    height: asNumber(options.height),
    strokeWidth: asNumber(options.borderWidth),
    fill: options.color,
    stroke: options.borderColor,
  });

  const lines = drawTextLines(options.textLines, {
    color: options.textColor,
    font: options.font,
    size: options.fontSize,
    rotate: degrees(0),
    xSkew: degrees(0),
    ySkew: degrees(0),
  });

  return [pushGraphicsState(), ...background, ...lines, popGraphicsState()];
};

export interface DrawTextLinesOptions {
  color: Color;
  font: string | PDFName;
  size: number | PDFNumber;
  rotate: Rotation;
  xSkew: Rotation;
  ySkew: Rotation;
}

export const drawTextLines = (
  lines: { encoded: PDFHexString; x: number; y: number }[],
  options: DrawTextLinesOptions,
): PDFOperator[] => {
  const ops = [
    beginText(),
    setFillingColor(options.color),
    setFontAndSize(options.font, options.size),
  ];

  for (let idx = 0, len = lines.length; idx < len; idx++) {
    const { encoded, x, y } = lines[idx];
    ops.push(
      rotateAndSkewTextRadiansAndTranslate(
        toRadians(options.rotate),
        toRadians(options.xSkew),
        toRadians(options.ySkew),
        x,
        y,
      ),
      showText(encoded),
    );
  }

  ops.push(endText());

  return ops;
};

export const drawTextField = (options: {
  x: number | PDFNumber;
  y: number | PDFNumber;
  width: number | PDFNumber;
  height: number | PDFNumber;
  borderWidth: number | PDFNumber;
  color: Color | undefined;
  borderColor: Color | undefined;
  textLines: { encoded: PDFHexString; x: number; y: number }[];
  textColor: Color;
  font: string | PDFName;
  fontSize: number | PDFNumber;
  padding: number | PDFNumber;
}) => {
  const x = asNumber(options.x);
  const y = asNumber(options.y);
  const width = asNumber(options.width);
  const height = asNumber(options.height);
  const borderWidth = asNumber(options.borderWidth);
  const padding = asNumber(options.padding);

  const clipX = x + borderWidth / 2 + padding;
  const clipY = y + borderWidth / 2 + padding;
  const clipWidth = width - (borderWidth / 2 + padding) * 2;
  const clipHeight = height - (borderWidth / 2 + padding) * 2;

  const clippingArea = [
    moveTo(clipX, clipY),
    lineTo(clipX, clipY + clipHeight),
    lineTo(clipX + clipWidth, clipY + clipHeight),
    lineTo(clipX + clipWidth, clipY),
    closePath(),
    clip(),
    endPath(),
  ];

  const background = drawRect({
    x,
    y,
    width,
    height,
    strokeWidth: asNumber(options.borderWidth),
    fill: options.color,
    stroke: options.borderColor,
  });

  const lines = drawTextLines(options.textLines, {
    color: options.textColor,
    font: options.font,
    size: options.fontSize,
    rotate: degrees(0),
    xSkew: degrees(0),
    ySkew: degrees(0),
  });

  const markedContent = [
    beginMarkedContent('Tx'),
    pushGraphicsState(),
    ...lines,
    popGraphicsState(),
    endMarkedContent(),
  ];

  return [
    pushGraphicsState(),
    ...background,
    ...clippingArea,
    ...markedContent,
    popGraphicsState(),
  ];
};

export const drawOptionList = (options: {
  x: number | PDFNumber;
  y: number | PDFNumber;
  width: number | PDFNumber;
  height: number | PDFNumber;
  borderWidth: number | PDFNumber;
  color: Color | undefined;
  borderColor: Color | undefined;
  textLines: { encoded: PDFHexString; x: number; y: number; height: number }[];
  textColor: Color;
  font: string | PDFName;
  fontSize: number | PDFNumber;
  lineHeight: number | PDFNumber;
  selectedLines: number[];
  selectedColor: Color;
  padding: number | PDFNumber;
}) => {
  const x = asNumber(options.x);
  const y = asNumber(options.y);
  const width = asNumber(options.width);
  const height = asNumber(options.height);
  const lineHeight = asNumber(options.lineHeight);
  const borderWidth = asNumber(options.borderWidth);
  const padding = asNumber(options.padding);

  const clipX = x + borderWidth / 2 + padding;
  const clipY = y + borderWidth / 2 + padding;
  const clipWidth = width - (borderWidth / 2 + padding) * 2;
  const clipHeight = height - (borderWidth / 2 + padding) * 2;

  const clippingArea = [
    moveTo(clipX, clipY),
    lineTo(clipX, clipY + clipHeight),
    lineTo(clipX + clipWidth, clipY + clipHeight),
    lineTo(clipX + clipWidth, clipY),
    closePath(),
    clip(),
    endPath(),
  ];

  const background = drawRect({
    x,
    y,
    width,
    height,
    strokeWidth: asNumber(options.borderWidth),
    fill: options.color,
    stroke: options.borderColor,
  });

  const highlights: PDFOperator[] = [];
  for (let idx = 0, len = options.selectedLines.length; idx < len; idx++) {
    const text = options.textLines[options.selectedLines[idx]];
    highlights.push(
      ...drawRect({
        x: text.x - padding,
        y: text.y - (lineHeight - text.height) / 2,
        width: width - borderWidth,
        height: text.height + (lineHeight - text.height) / 2,
        strokeWidth: 0,
        fill: options.selectedColor,
        stroke: undefined,
      }),
    );
  }

  const lines = drawTextLines(options.textLines, {
    color: options.textColor,
    font: options.font,
    size: options.fontSize,
    rotate: degrees(0),
    xSkew: degrees(0),
    ySkew: degrees(0),
  });

  const markedContent = [
    beginMarkedContent('Tx'),
    pushGraphicsState(),
    ...lines,
    popGraphicsState(),
    endMarkedContent(),
  ];

  return [
    pushGraphicsState(),
    ...background,
    ...highlights,
    ...clippingArea,
    ...markedContent,
    popGraphicsState(),
  ];
};

export const graphic = (
  g: Shape | Text | Image | Group,
  page: PDFPage,
): PDFOperator[] => {
  const ops: (PDFOperator | undefined)[] = [];

  // push a new graphic state that only applies to this graphic (and children)
  ops.push(pushGraphicsState());

  // maybe apply transforms to graphic state
  if (g.transform) {
    g.transform.forEach((op) => ops.push(op));
  }

  // maybe apply clipping to graphic state
  if (g.clipPath) {
    g.clipPath.operators.forEach((op) => ops.push(op));
    ops.push(clip(g.clipRule));
    ops.push(endPath());
  }

  // draw shape, text or image to graphic state, or continue walking tree from group
  switch (g.type) {
    case 'group':
      // for each child recursively call graphic and push resultant operators
      g.children.forEach((child) => {
        const operators = graphic(child, page);
        operators.forEach((op) => ops.push(op)); // can't use spread operator or will hit max call stack
      });
      break;

    case 'shape':
      // maybe apply mix blend mode and opacity to graphic state
      if (g.mixBlendMode || g.fillOpacity || g.strokeOpacity) {
        const graphicsState = page.doc.context.obj({
          Type: 'ExtGState',
          ca: g.fillOpacity,
          CA: g.strokeOpacity,
          BM: g.mixBlendMode,
        });

        const GState = page.node.newExtGState('GS', graphicsState);
        ops.push(setGraphicsState(GState));
      }

      // apply all presentation attributes and later stripped those undefined
      ops.push(
        g.fill ? setFillingColor(g.fill as Color) : undefined,
        g.stroke ? setStrokingColor(g.stroke as Color) : undefined,
        g.strokeWidth ? setLineWidth(g.strokeWidth) : undefined,
        g.strokeLineJoin ? setLineJoin(g.strokeLineJoin) : undefined, //TODO: untested
        g.strokeMiterLimit ? setLineMiterLimit(g.strokeMiterLimit) : undefined, //TODO: untested
        g.strokeLineCap ? setLineCap(g.strokeLineCap) : undefined, //TODO: untested
        g.strokeDashArray || g.strokeDashOffset
          ? setDashPattern(g.strokeDashArray ?? [], g.strokeDashOffset ?? 0) //TODO: untested
          : undefined,
      );

      // apply operators, i.e. moveTo, lineTo
      g.operators.forEach((op) => ops.push(op));

      // apply fill and stroke, or separately
      ops.push(
        // prettier-ignore
        (g.fill && g.stroke) ? fillAndStroke(g.fillRule)
            : g.fill         ? fill(g.fillRule)
            : g.stroke       ? stroke()
            : undefined,
      );

      break;

    case 'text':
      // maybe apply mix blend mode and opacity to graphic state
      if (g.mixBlendMode || g.fillOpacity || g.strokeOpacity) {
        const graphicsState = page.doc.context.obj({
          Type: 'ExtGState',
          ca: g.fillOpacity,
          CA: g.strokeOpacity,
          BM: g.mixBlendMode,
        });

        const GState = page.node.newExtGState('GS', graphicsState);
        ops.push(setGraphicsState(GState));
      }

      g.segments.forEach((segment) => {
        if (typeof segment === 'string') {
          //   console.log(segment);
          const text = g.font.encodeText(segment);
          const font = page.node.newFontDictionary(g.font.name, g.font.ref);

          ops.push(
            beginText(),
            scale(1, -1), // y-flip (negative) corrects coordinate space back to pdf
            g.fill ? setFillingColor(g.fill as Color) : undefined,
            g.stroke ? setStrokingColor(g.stroke as Color) : undefined,
            g.strokeWidth ? setLineWidth(g.strokeWidth) : undefined,
            g.strokeLineJoin ? setLineJoin(g.strokeLineJoin) : undefined,
            g.strokeMiterLimit
              ? setLineMiterLimit(g.strokeMiterLimit)
              : undefined,
            g.strokeLineCap ? setLineCap(g.strokeLineCap) : undefined,
            g.strokeDashArray || g.strokeDashOffset
              ? setDashPattern(g.strokeDashArray ?? [], g.strokeDashOffset ?? 0)
              : undefined,
            g.lineHeight ? setLineHeight(g.lineHeight) : undefined,
            setFontAndSize(font, g.fontSize),
            // rotateAndSkewTextRadiansAndTranslate(
            //   toRadians(options.rotate),
            //   toRadians(options.xSkew),
            //   toRadians(options.ySkew),
            //   options.x,
            //   options.y,
            // ),
            showText(text),
            endText(),
          );
        } else {
          const operators = graphic(segment, page);
          operators.forEach((op) => ops.push(op));
        }
      });

      break;

    case 'image':
      // maybe apply mix blend mode and opacity to graphic state
      if (g.mixBlendMode || g.opacity) {
        const graphicsState = page.doc.context.obj({
          Type: 'ExtGState',
          ca: g.opacity,
          CA: g.opacity,
          BM: g.mixBlendMode,
        });

        const GState = page.node.newExtGState('GS', graphicsState);
        ops.push(setGraphicsState(GState));
      }

      const image = page.node.newXObject('Image', g.image.ref);
      ops.push(
        translate(0, g.height), // shift by height corrects flip
        scale(g.width, -g.height), // y-flip by height (negative) corrects coordinate space back to pdf
        drawObject(image),
      );
      break;
  }

  // pop current graphic state back to parents as this graphic is now complete
  ops.push(popGraphicsState());

  // only return defined operators
  return ops.filter(Boolean) as PDFOperator[];
};
