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
} from 'src/api/operators';
import { Color, setFillingColor, setStrokingColor } from 'src/api/colors';
import { Rotation, degrees, toRadians } from 'src/api/rotations';
import { path, line, circle, ellipse, rect } from 'src/api/shape';
import { PDFHexString, PDFName, PDFNumber, PDFOperator } from 'src/core';
import { asNumber } from 'src/api/objects';
import { translate, scale } from 'src/api/transform';
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
  x1: number | PDFNumber;
  y1: number | PDFNumber;
  x2: number | PDFNumber;
  y2: number | PDFNumber;
  stroke: Color | undefined;
  strokeWidth: number | PDFNumber;
  strokeDashArray?: (number | PDFNumber)[];
  strokeDashPhase?: number | PDFNumber;
  strokeLineCap?: LineCapStyle;
  graphicsState?: string | PDFName;
}) =>
  [
    pushGraphicsState(),
    options.graphicsState && setGraphicsState(options.graphicsState),

    options.stroke && setStrokingColor(options.stroke),
    options.strokeWidth && setLineWidth(options.strokeWidth),
    options.strokeLineCap && setLineCap(options.strokeLineCap),
    (options.strokeDashArray || options.strokeDashPhase) &&
      setDashPattern(
        options.strokeDashArray ?? [],
        options.strokeDashPhase ?? 0,
      ),

    ...line(
      asNumber(options.x1),
      asNumber(options.y1),
      asNumber(options.x2),
      asNumber(options.y2),
    ),

    options.stroke ? stroke() : undefined,

    popGraphicsState(),
  ].filter(Boolean) as PDFOperator[];

export const drawRect = (options: {
  x: number | PDFNumber;
  y: number | PDFNumber;
  width: number | PDFNumber;
  height: number | PDFNumber;
  rx?: number | PDFNumber;
  ry?: number | PDFNumber;
  fill?: Color;
  fillRule?: 'nonzero' | 'evenodd';
  stroke?: Color;
  strokeWidth?: number | PDFNumber;
  strokeLineCap?: LineCapStyle;
  strokeDashArray?: (number | PDFNumber)[];
  strokeDashPhase?: number | PDFNumber;
  graphicsState?: string | PDFName;
}) =>
  [
    pushGraphicsState(),
    options.graphicsState && setGraphicsState(options.graphicsState),

    options.fill && setFillingColor(options.fill),
    options.stroke && setStrokingColor(options.stroke),
    options.strokeWidth && setLineWidth(options.strokeWidth),
    options.strokeLineCap && setLineCap(options.strokeLineCap),
    (options.strokeDashArray || options.strokeDashPhase) &&
      setDashPattern(
        options.strokeDashArray ?? [],
        options.strokeDashPhase ?? 0,
      ),

    ...rect(
      asNumber(options.x),
      asNumber(options.y),
      asNumber(options.width),
      asNumber(options.height),
      options.rx ? asNumber(options.rx) : undefined,
      options.ry ? asNumber(options.ry) : undefined,
    ),

    // prettier-ignore
    options.fill && options.stroke ? fillAndStroke(options.fillRule)
      : options.fill               ? fill(options.fillRule)
      : options.stroke             ? stroke()
      : undefined,

    popGraphicsState(),
  ].filter(Boolean) as PDFOperator[];

export const drawEllipse = (options: {
  cx: number | PDFNumber;
  cy: number | PDFNumber;
  rx: number | PDFNumber;
  ry: number | PDFNumber;
  rotate?: Rotation;
  origin?: [number | PDFNumber, number | PDFNumber];
  fill?: Color;
  fillRule?: 'nonzero' | 'evenodd';
  stroke?: Color;
  strokeWidth?: number | PDFNumber;
  strokeDashArray?: (number | PDFNumber)[];
  strokeDashPhase?: number | PDFNumber;
  strokeLineCap?: LineCapStyle;
  graphicsState?: string | PDFName;
}) =>
  [
    pushGraphicsState(),
    options.graphicsState && setGraphicsState(options.graphicsState),

    options.fill && setFillingColor(options.fill),
    options.stroke && setStrokingColor(options.stroke),
    options.strokeWidth && setLineWidth(options.strokeWidth),
    options.strokeLineCap && setLineCap(options.strokeLineCap),
    (options.strokeDashArray || options.strokeDashPhase) &&
      setDashPattern(
        options.strokeDashArray ?? [],
        options.strokeDashPhase ?? 0,
      ),

    ...ellipse(
      asNumber(options.cx),
      asNumber(options.cy),
      asNumber(options.rx),
      asNumber(options.ry),
    ),

    // prettier-ignore
    options.fill && options.stroke ? fillAndStroke(options.fillRule)
  : options.fill                   ? fill(options.fillRule)
  : options.stroke                 ? stroke()
  : closePath(),

    popGraphicsState(),
  ].filter(Boolean) as PDFOperator[];

export const drawCircle = (options: {
  cx: number | PDFNumber;
  cy: number | PDFNumber;
  r: number | PDFNumber;
  fill?: Color;
  fillRule?: 'nonzero' | 'evenodd';
  stroke?: Color;
  strokeWidth?: number | PDFNumber;
  strokeDashArray?: (number | PDFNumber)[];
  strokeDashPhase?: number | PDFNumber;
  strokeLineCap?: LineCapStyle;
  graphicsState?: string | PDFName;
}) =>
  [
    pushGraphicsState(),
    options.graphicsState && setGraphicsState(options.graphicsState),
    options.fill && setFillingColor(options.fill),
    options.stroke && setStrokingColor(options.stroke),
    options.strokeWidth && setLineWidth(options.strokeWidth),
    options.strokeLineCap && setLineCap(options.strokeLineCap),
    (options.strokeDashArray || options.strokeDashPhase) &&
      setDashPattern(
        options.strokeDashArray ?? [],
        options.strokeDashPhase ?? 0,
      ),

    ...circle(asNumber(options.cx), asNumber(options.cy), asNumber(options.r)),

    // prettier-ignore
    options.fill && options.stroke ? fillAndStroke(options.fillRule)
    : options.fill                 ? fill(options.fillRule)
    : options.stroke               ? stroke()
    : undefined,

    popGraphicsState(),
  ].filter(Boolean) as PDFOperator[];

export const drawPath = (options: {
  d: string;
  rotate?: Rotation;
  scale?: number | PDFNumber;
  fill?: Color;
  fillRule?: 'nonzero' | 'evenodd';
  stroke?: Color;
  strokeWidth?: number | PDFNumber;
  strokeDashArray?: (number | PDFNumber)[];
  strokeDashPhase?: number | PDFNumber;
  strokeLineCap?: LineCapStyle;
  graphicsState?: string | PDFName;
}) =>
  [
    pushGraphicsState(),
    options.graphicsState && setGraphicsState(options.graphicsState),

    rotateRadians(toRadians(options.rotate ?? degrees(0))),

    options.scale && scale(options.scale, options.scale),
    options.fill && setFillingColor(options.fill),
    options.stroke && setStrokingColor(options.stroke),
    options.strokeWidth && setLineWidth(options.strokeWidth),
    options.strokeLineCap && setLineCap(options.strokeLineCap),
    (options.strokeDashArray || options.strokeDashPhase) &&
      setDashPattern(
        options.strokeDashArray ?? [],
        options.strokeDashPhase ?? 0,
      ),

    ...path(options.d),

    // prettier-ignore
    options.fill && options.stroke ? fillAndStroke(options.fillRule)
        : options.fill             ? fill(options.fillRule)
        : options.stroke           ? stroke()
        : undefined,

    popGraphicsState(),
  ].filter(Boolean) as PDFOperator[];

export const draw = (
  g: Shape | Text | Image | Group,
  page: PDFPage,
  options: {
    x: number | PDFNumber;
    y: number | PDFNumber;
    rotate: Rotation;
    scale: number | PDFNumber;
    clipPath?: PDFOperator[];
    clipRule?: 'nonzero' | 'evenodd';
    graphicsState?: string | PDFName;
  },
) => {
  const operators: (PDFOperator | undefined)[] = [];
  operators.push(
    pushGraphicsState(),
    options.graphicsState ? setGraphicsState(options.graphicsState) : undefined,
    translate(options.x, options.y),
    rotateRadians(toRadians(options.rotate)),
    scale(options.scale, options.scale),
    scale(1, -1), // make top left
  );

  if (options.clipPath) {
    options.clipPath.forEach((c) => operators.push(c));
    operators.push(clip(options.clipRule));
    operators.push(endPath());
  }

  const ops = graphic(g, page); // can't use spread operator or will hit max call stack
  ops.forEach((o) => operators.push(o));

  operators.push(popGraphicsState());

  return operators.filter(Boolean) as PDFOperator[];
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
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    strokeWidth: options.borderWidth,
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
    cx: options.x,
    cy: options.y,
    rx: outlineScale,
    ry: outlineScale,
    fill: options.color,
    stroke: options.borderColor,
    strokeWidth: options.borderWidth,
  });

  if (!options.filled) return outline;

  const dot = drawEllipse({
    cx: options.x,
    cy: options.y,
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
  const x = asNumber(options.x);
  const y = asNumber(options.y);
  const width = asNumber(options.width);
  const height = asNumber(options.height);

  const background = drawRect({
    x,
    y,
    width,
    height,
    strokeWidth: options.borderWidth,
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
    strokeWidth: options.borderWidth,
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
    strokeWidth: options.borderWidth,
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
    g.transform.forEach((t) => ops.push(t));
  }

  // maybe apply clipping to graphic state
  if (g.clipPath) {
    g.clipPath.operators.forEach((o) => ops.push(o));
    ops.push(clip(g.clipRule));
    ops.push(endPath());
  }

  // draw shape, text or image to graphic state, or continue walking tree from group
  switch (g.type) {
    case 'group':
      // for each child recursively call graphic and push resultant operators
      g.children.forEach((child) => {
        const operators = graphic(child, page);
        operators.forEach((o) => ops.push(o)); // can't use spread operator or will hit max call stack
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
      g.operators.forEach((o) => ops.push(o));

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

      console.log(g);

      //   ops.push(scale(1, -1)); // make top left)

      g.segments.forEach((segment) => {
        if (typeof segment === 'string') {
          const text = g.font.encodeText(segment);

          const font = page.node.newFontDictionary(g.font.name, g.font.ref);

          ops.push(
            beginText(),
            g.fill ? setFillingColor(g.fill as Color) : undefined,
            setFontAndSize(font, g.fontSize),
            g.lineHeight ? setLineHeight(g.lineHeight) : undefined,
            // rotateAndSkewTextRadiansAndTranslate(
            //   toRadians(options.rotate),
            //   toRadians(options.xSkew),
            //   toRadians(options.ySkew),
            //   options.x,
            //   options.y,
            // ),
          );

          ops.push(showText(text), endText());
        } else {
          const operators = graphic(segment, page);
          operators.forEach((o) => ops.push(o));
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

      const name = page.node.newXObject('Image', g.image.ref);
      ops.push(translate(0, g.height)); // shift by height corrects flip
      ops.push(scale(g.width, -g.height)); // negative (flip) corrects upside down drawing
      ops.push(drawObject(name));
      break;
  }

  // pop current graphic state back to parents as this graphic is now complete
  ops.push(popGraphicsState());

  // only return defined operators
  return ops.filter(Boolean) as PDFOperator[];
};
