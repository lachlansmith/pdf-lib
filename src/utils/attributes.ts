import { Color, ColorTypes } from 'src/api/colors';
import ColorParser from 'color';
import { camel } from 'src/utils';
import PDFFont from 'src/api/PDFFont';
import { BlendMode } from 'src/api/PDFPageOptions';
import {
  RadialGradient,
  LinearGradient,
  Filter,
  Mask,
  ClipPath,
} from 'src/api/JSXParser';

export const attributes = (
  presentationAttributes: any,
  internalCss: any,
  inlineStyle: any,
) => {
  // construct styles classes from listed class names
  let classes = {};
  if (presentationAttributes.className) {
    const names = presentationAttributes.className.split(' '); // multiple internal styles

    names.forEach((name: string) => {
      if (!(name in internalCss)) return;
      classes = { ...classes, ...internalCss[name] };
    });
  }

  return {
    color: presentationAttributes.color,
    mask: presentationAttributes.mask,
    filter: presentationAttributes.filter,
    clipPath: presentationAttributes.clipPath,
    clipRule: presentationAttributes.clipRule,
    fill: presentationAttributes.fill,
    fileRule: presentationAttributes.fileRule,
    stroke: presentationAttributes.stroke,
    strokeWidth: presentationAttributes.strokeWidth,
    strokeLineJoin: presentationAttributes.strokeLineJoin,
    strokeMiterLimit: presentationAttributes.strokeMiterLimit,
    strokeLineCap: presentationAttributes.strokeLineCap,
    strokeDashArray: presentationAttributes.strokeDashArray,
    strokeDashOffset: presentationAttributes.strokeDashOffset,
    strokeOpacity: presentationAttributes.strokeOpacity,
    fillOpacity: presentationAttributes.fillOpacity,
    opacity: presentationAttributes.opacity,
    ...classes,
    ...(inlineStyle ? inlineStyle : {}),
  };
};

export const viewBox = (viewBox: string) => {
  const [x0, y0, x1, y1] = viewBox.split(' ').map((coord) => parseFloat(coord));

  return [x1 - x0, y1 - y0] as [number, number];
};

export const font = async (
  fonts: {
    [family: string]: { [weight: string]: { [style: string]: PDFFont } };
  },
  fontFamily: string,
  fontWeight: string,
  fontStyle: string,
) => {
  const family = fontFamily;
  const weight = fontWeight ? fontWeight : Object.keys(fonts[fontFamily])[0];
  const style = fontStyle ? fontStyle : 'normal';

  return fonts[family][weight][style];
};

export const color = (
  defs: {
    [id: string]: Mask | Filter | ClipPath | LinearGradient | RadialGradient;
  },
  str: string | undefined,
  color?: Color,
): Color | LinearGradient | RadialGradient | undefined => {
  if (str === 'none') return undefined;
  if (!str) return color;
  const match = /url\((.*)\)/g.exec(str);
  if (match) {
    return defs[match[1]] as LinearGradient | RadialGradient;
  }
  const { r, g, b } = ColorParser(str).rgb().object();
  return {
    type: ColorTypes.RGB,
    red: r / 255,
    green: g / 255,
    blue: b / 255,
  };
};

export const opacity = (fillOrStrokeOpacity?: string, opacity?: string) => {
  return fillOrStrokeOpacity
    ? parseFloat(fillOrStrokeOpacity)
    : opacity
    ? parseFloat(opacity)
    : undefined;
};

export const url = (
  defs: {
    [id: string]: Mask | Filter | ClipPath | LinearGradient | RadialGradient;
  },
  str?: string,
) => {
  if (!str) return undefined;

  const match = /url\((.*)\)/g.exec(str);
  if (match) {
    return defs[match[1]] as Mask | Filter | ClipPath;
  }

  return undefined;
};

export const clipPath = (
  defs: {
    [id: string]: Mask | Filter | ClipPath | LinearGradient | RadialGradient;
  },
  clipString?: string,
): ClipPath | undefined => url(defs, clipString) as ClipPath | undefined;

export const filter = (
  defs: {
    [id: string]: Mask | Filter | ClipPath | LinearGradient | RadialGradient;
  },
  filterString?: string,
): Filter | undefined => url(defs, filterString) as Filter | undefined;

export const mask = (
  defs: {
    [id: string]: Mask | Filter | ClipPath | LinearGradient | RadialGradient;
  },
  maskString?: string,
): Mask | undefined => url(defs, maskString) as Mask | undefined;

export const mixBlendMode = (blendmode?: string): BlendMode | undefined => {
  if (!blendmode) return undefined;
  const blendMode = camel(blendmode);
  return (blendMode.charAt(0).toUpperCase() + blendMode.slice(1)) as BlendMode;
};
