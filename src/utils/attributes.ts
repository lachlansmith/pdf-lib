import { Color, ColorTypes } from 'src/api/colors';
import ColorParser from 'color';
import { camel } from 'src/utils';
import { BlendMode } from 'src/api/PDFPageOptions';
import {
  RadialGradient,
  LinearGradient,
  Filter,
  Mask,
  ClipPath,
} from 'src/api/JSXParser';
import JSXParserState from 'src/api/JSXParserState';

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

export const color = (
  state: JSXParserState,
  str: string | undefined,
  color?: Color,
): Color | LinearGradient | RadialGradient | undefined => {
  if (str === 'none') return undefined;
  if (!str) return color;
  const match = /url\((.*)\)/g.exec(str);
  if (match) {
    return state.defs[match[1]] as LinearGradient | RadialGradient;
  }
  const { r, g, b } = ColorParser(str).rgb().object();
  return {
    type: ColorTypes.RGB,
    red: r / 255,
    green: g / 255,
    blue: b / 255,
  };
};

export const opacity = <T extends string | number>(
  fillOrStrokeOpacity?: T,
  opacity?: T,
): T | undefined => {
  if (typeof fillOrStrokeOpacity === 'string' && typeof opacity === 'string') {
    return (fillOrStrokeOpacity
      ? parseFloat(fillOrStrokeOpacity)
      : opacity
      ? parseFloat(opacity)
      : undefined) as T;
  }

  return fillOrStrokeOpacity
    ? fillOrStrokeOpacity
    : opacity
    ? opacity
    : undefined;
};

export const url = (state: JSXParserState, str?: string) => {
  if (!str) return undefined;

  const match = /url\((.*)\)/g.exec(str);
  if (match) {
    return state.defs[match[1]] as Mask | Filter | ClipPath;
  }

  return undefined;
};

export const clipPath = (
  state: JSXParserState,
  clipString?: string,
): ClipPath | undefined => url(state, clipString) as ClipPath | undefined;

export const filter = (
  state: JSXParserState,
  filterString?: string,
): Filter | undefined => url(state, filterString) as Filter | undefined;

export const mask = (
  state: JSXParserState,
  maskString?: string,
): Mask | undefined => url(state, maskString) as Mask | undefined;

export const mixBlendMode = (blendmode?: string): BlendMode | undefined => {
  if (!blendmode) return undefined;
  const blendMode = camel(blendmode);
  return (blendMode.charAt(0).toUpperCase() + blendMode.slice(1)) as BlendMode;
};
