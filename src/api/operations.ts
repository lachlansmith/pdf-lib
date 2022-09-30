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
  appendBezierCurve,
} from 'src/api/operators';
import {
  Color,
  //   ColorTypes,
  setFillingColor,
  setStrokingColor,
} from 'src/api/colors';
import { Rotation, degrees, toRadians } from 'src/api/rotations';
import { pathToOperators, solveArc } from 'src/api/path';
import { PDFHexString, PDFName, PDFNumber, PDFOperator } from 'src/core';
import { asNumber } from 'src/api/objects';
import {
  matrix,
  translate,
  translateX,
  translateY,
  rotate,
  scale,
  scaleX,
  scaleY,
  skew,
  skewX,
  skewY,
} from 'src/api/operators';
import PDFGraphic from 'src/api/PDFGraphic';
import PDFPage from 'src/api/PDFPage';

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
  line: PDFHexString,
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
    showText(line),
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
  const operators = [
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
    operators.push(showText(lines[idx]), nextLine());
  }

  operators.push(endText(), popGraphicsState());
  return operators;
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

    ...line({ x1: options.x1, y1: options.y1, x2: options.x2, y2: options.y2 }),

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
}) => {
  return [
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

    ...rect({
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
      rx: options.rx,
      ry: options.ry,
    }),

    // prettier-ignore
    options.fill && options.stroke ? fillAndStroke(options.fillRule)
      : options.fill               ? fill(options.fillRule)
      : options.stroke             ? stroke()
      : undefined,

    popGraphicsState(),
  ].filter(Boolean) as PDFOperator[];
};

const KAPPA = 4.0 * ((Math.sqrt(2) - 1.0) / 3.0);

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

    ...arc({
      x: options.cx,
      y: asNumber(options.cy) - asNumber(options.ry),
      rx: options.rx,
      ry: options.ry,
      rot: 0,
      large: 1,
      sweep: 0,
      ex: 1,
      ey: 0,
    }),

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

    ...arc({
      x: options.cx,
      y: asNumber(options.cy) - asNumber(options.r),
      rx: options.r,
      ry: options.r,
      rot: 0,
      large: 1,
      sweep: 0,
      ex: 1,
      ey: 0,
    }),

    closePath(),

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

    ...path({ d: options.d }),

    // prettier-ignore
    options.fill && options.stroke ? fillAndStroke(options.fillRule)
        : options.fill             ? fill(options.fillRule)
        : options.stroke           ? stroke()
        : undefined,

    popGraphicsState(),
  ].filter(Boolean) as PDFOperator[];

export const draw = (
  graphic: PDFGraphic,
  page: PDFPage,
  options: {
    x: number | PDFNumber;
    y: number | PDFNumber;
    rotate?: Rotation;
    scale?: number | PDFNumber;
    graphicsState?: string | PDFName;
  },
) =>
  [
    pushGraphicsState(),

    translate(options.x, options.y),
    rotateRadians(toRadians(options.rotate ?? degrees(0))),
    options.scale && scale(options.scale, options.scale),

    // TODO: make coordinate system of draw bottom left, same as others
    scale(1, -1), // make top left
    ...drawGraphic(graphic, page),

    popGraphicsState(),
  ].filter(Boolean) as PDFOperator[];

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
  const operators = [
    beginText(),
    setFillingColor(options.color),
    setFontAndSize(options.font, options.size),
  ];

  for (let idx = 0, len = lines.length; idx < len; idx++) {
    const { encoded, x, y } = lines[idx];
    operators.push(
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

  operators.push(endText());

  return operators;
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
    const line = options.textLines[options.selectedLines[idx]];
    highlights.push(
      ...drawRect({
        x: line.x - padding,
        y: line.y - (lineHeight - line.height) / 2,
        width: width - borderWidth,
        height: line.height + (lineHeight - line.height) / 2,
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

const shape = (g: PDFGraphic): PDFOperator[] => {
  let operators: (PDFOperator | undefined)[] = [];
  switch (g.type) {
    case 'group':
      g.children.forEach((c: PDFGraphic) => {
        operators.push(...shape(c));
      });
      break;

    case 'path':
      operators.push(...path({ d: g.d }));

      break;

    case 'line':
      operators.push(...line({ x1: g.x1, y1: g.y1, x2: g.x2, y2: g.y2 }));

      break;

    case 'rect':
      operators.push(
        ...rect({
          x: g.x,
          y: g.y,
          width: g.width,
          height: g.height,
          rx: g.rx,
          ry: g.ry,
        }),
      );

      break;

    case 'ellipse':
      operators.push(
        ...arc({
          x: g.cx,
          y: g.cy - g.ry,
          rx: g.rx,
          ry: g.ry,
          rot: 0,
          large: 1,
          sweep: 0,
          ex: 1,
          ey: 0,
        }),
      );
      // operators.push(translate(-c.cx, -c.cy));
      break;
  }

  return operators.filter(Boolean) as PDFOperator[];
};

export const drawGraphic = (g: PDFGraphic, page: PDFPage): PDFOperator[] => {
  let operators: (PDFOperator | undefined)[] = [];

  // push a new graphic state that only applies to this graphic (and children)
  operators.push(pushGraphicsState());

  // apply transforms to graphic state
  if (g.transform) {
    g.transform.forEach(([type, ...args]) => {
      switch (type) {
        case 'matrix':
          operators.push(
            matrix(args[0], args[1], args[2], args[3], args[4], args[5]),
          );
          break;

        case 'translate':
          if (args.length == 1) {
            operators.push(translate(args[0], 0));
            break;
          }

          if (args.length == 2) {
            operators.push(translate(args[0], args[1]));
            break;
          }
          break;

        case 'translateX':
          operators.push(translateX(args[0]));
          break;

        case 'translateY':
          operators.push(translateY(args[0]));
          break;

        case 'rotate':
          if (args.length == 1) {
            operators.push(rotate(args[0]));
            break;
          }

          if (args.length == 3) {
            operators.push(
              ...[
                translate(args[1], args[2]),
                rotate(args[0]),
                translate(-args[1], -args[2]),
              ],
            );
            break;
          }

          break;

        case 'scale':
          if (args.length == 1) {
            operators.push(scale(args[0], args[0]));
            break;
          }

          if (args.length == 2) {
            operators.push(scale(args[0], args[1]));
            break;
          }

          break;

        case 'scaleX':
          operators.push(scaleX(args[0]));
          break;

        case 'scaleY':
          operators.push(scaleY(args[0]));
          break;

        case 'skew':
          operators.push(skew(args[0], args[1]));
          break;

        case 'skewX':
          operators.push(skewX(args[0]));
          break;

        case 'skewY':
          operators.push(skewY(args[0]));
          break;
      }
    });
  }

  if (g.mixBlendMode || g.opacity || g.strokeOpacity) {
    const graphicsState = page.doc.context.obj({
      Type: 'ExtGState',
      ca: g.opacity,
      CA: g.strokeOpacity,
      BM: g.mixBlendMode,
    });

    const GState = page.node.newExtGState('GS', graphicsState);
    operators.push(setGraphicsState(GState));
  }

  // apply clipping to graphic state
  if (g.clipPath) {
    operators.push(...shape(g.clipPath), clip(g.clipRule), endPath());
  }

  switch (g.type) {
    case 'group':
      g.children.forEach((graphic: PDFGraphic) => {
        operators.push(...drawGraphic(graphic, page)); // draw children
      });
      break;

    case 'path':
    case 'polyline':
    case 'polygon':
    case 'line':
    case 'rect':
    case 'ellipse':
      operators.push(
        g.fill ? setFillingColor(g.fill) : undefined,
        g.stroke ? setStrokingColor(g.stroke) : undefined,
        g.strokeWidth ? setLineWidth(g.strokeWidth) : undefined,
        g.strokeLineCap ? setLineCap(g.strokeLineCap) : undefined,
        g.strokeDashArray || g.strokeDashOffset
          ? setDashPattern(g.strokeDashArray ?? [], g.strokeDashOffset ?? 0)
          : undefined,
        ...shape(g),
        // prettier-ignore
        (g.fill && g.stroke) ? fillAndStroke(g.fillRule)
        : g.fill             ? fill(g.fillRule)
        : g.stroke           ? stroke()
        : undefined,
      );

      break;

    case 'text':
      // TODO: add support for text
      break;

    case 'image':
      const name = page.node.newXObject('Image', g.image.ref);
      operators.push(
        ...[
          translate(0, g.height), // shift by height corrects flip
          scale(g.width, -g.height), // negative (flip) corrects upside down drawing
          drawObject(name), // draw image
        ],
      );
      break;
  }

  // pop current graphic state back to parents
  operators.push(popGraphicsState());

  // return defined operators
  return operators.filter(Boolean) as PDFOperator[];
};

export const path = (options: { d: string }) =>
  pathToOperators(options.d).filter(Boolean) as PDFOperator[];

export const rect = (options: {
  x: number | PDFNumber;
  y: number | PDFNumber;
  width: number | PDFNumber;
  height: number | PDFNumber;
  rx?: number | PDFNumber;
  ry?: number | PDFNumber;
}) => {
  const X = asNumber(options.x);
  const Y = asNumber(options.y);
  const W = asNumber(options.width);
  const H = asNumber(options.height);
  const RX = asNumber(options.rx ?? 0);
  //   let RY = asNumber(options.ry ?? 0);
  //   if (RX && !options.ry) {
  //     RY = RX;
  //   }
  const CX = RX * (1.0 - KAPPA);
  //   const CY = RY * (1.0 - KAPPA);
  return [
    translate(X, Y),
    moveTo(RX, 0),
    lineTo(W - RX, 0),
    RX > 0 ? appendBezierCurve(W - CX, 0, W, CX, W, RX) : undefined,
    lineTo(W, H - RX),
    RX > 0 ? appendBezierCurve(W, H - CX, W - CX, H, W - RX, H) : undefined,
    lineTo(RX, H),
    RX > 0 ? appendBezierCurve(CX, H, 0, H - CX, 0, H - RX) : undefined,
    RX > 0 ? lineTo(0, RX) : undefined,
    RX > 0 ? appendBezierCurve(0, CX, CX, 0, RX, 0) : undefined,
    closePath(),
  ].filter(Boolean) as PDFOperator[];
};

export const line = (options: {
  x1: number | PDFNumber;
  y1: number | PDFNumber;
  x2: number | PDFNumber;
  y2: number | PDFNumber;
}) => {
  const x1 = asNumber(options.x1);
  const y1 = asNumber(options.y1);
  const x2 = asNumber(options.x2);
  const y2 = asNumber(options.y2);
  return [moveTo(x1, y1), lineTo(x2, y2), closePath()].filter(
    Boolean,
  ) as PDFOperator[];
};

export const arc = (options: {
  x: number | PDFNumber;
  y: number | PDFNumber;
  rx: number | PDFNumber;
  ry: number | PDFNumber;
  rot: number | PDFNumber;
  large: number | PDFNumber;
  sweep: number | PDFNumber;
  ex: number | PDFNumber;
  ey: number | PDFNumber;
}) => {
  const x = asNumber(options.x);
  const y = asNumber(options.y);
  const rx = asNumber(options.rx);
  const ry = asNumber(options.ry);
  const rot = asNumber(options.rot);
  const large = asNumber(options.large);
  const sweep = asNumber(options.sweep);
  const ex = asNumber(options.ex);
  const ey = asNumber(options.ey);

  return [
    moveTo(x, y),
    ...solveArc(x, y, [rx, ry, rot, large, sweep, ex + x, ey + y]),
    closePath(),
  ].filter(Boolean) as PDFOperator[];
};
