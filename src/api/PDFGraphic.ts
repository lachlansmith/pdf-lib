import React from 'react';
import ColorParser from 'color';

import { LineCapStyle, LineJoinStyle } from 'src/api/operators';
import { PDFImage, BlendMode } from 'src/api';
import PDFDocument from './PDFDocument';
import { Color, ColorTypes, RGB } from 'src/api/colors';
import {
  line,
  circle,
  ellipse,
  rect,
  path,
  polygon,
  polyline,
  shape,
} from 'src/api/shape';
import { transform } from 'src/api/transform';
import { PDFOperator } from 'src/core';

interface Mask {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  maskContentUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
  maskUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
  operators: PDFOperator[];
}

interface Filter {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  filterUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
  primitiveUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
  effects: PDFGraphic[];
}

interface ClipPath {
  clipPathUnits: 'userSpaceOnUse' | 'objectBoundingBox';
  operators: PDFOperator[];
}

interface LinearGradient {
  x1?: number;
  y1?: number;
  x2: number;
  y2?: number;
  gradientUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
  gradientTransform?: any;
  spreadMethod?: 'pad' | 'reflect' | 'reflect';
  stops: PDFGraphic[];
}

interface RadialGradient {
  cx?: number;
  cy?: number;
  r?: number;
  fr: number;
  fx?: number;
  fy?: number;
  gradientUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
  gradientTransform?: any;
  spreadMethod?: 'pad' | 'reflect' | 'reflect';
  stops: PDFGraphic[];
}

interface Iterator {
  [key: string]: any;
}

interface Base extends Iterator {
  transform?: PDFOperator[];
  mask?: Mask;
  filter?: Filter; //unknown how to handle this at this time
  clipPath?: ClipPath;
  clipRule?: 'nonzero' | 'evenodd';
  mixBlendMode?: BlendMode;
}

export interface Shape extends Base {
  type: 'shape';
  operators: PDFOperator[];
  fill?: Color;
  fillRule?: 'nonzero' | 'evenodd';
  fillOpacity?: number;
  strokeOpacity?: number;
  stroke?: Color;
  strokeWidth?: number;
  strokeLineJoin?: LineJoinStyle;
  strokeMiterLimit?: number;
  strokeDashArray?: number[];
  strokeDashOffset?: number;
  strokeLineCap?: LineCapStyle;
}

export interface Text extends Base {
  type: 'text';
  children: Text[];
}

export interface Image extends Base {
  type: 'image';
  image: PDFImage;
  width: number;
  height: number;
  opacity?: number;
}

export interface Group extends Base {
  type: 'group';
  fill?: Color;
  fillRule?: 'nonzero' | 'evenodd';
  fillOpacity?: number;
  strokeOpacity?: number;
  stroke?: Color;
  strokeWidth?: number;
  strokeLineJoin?: LineJoinStyle;
  strokeMiterLimit?: number;
  strokeDashArray?: number[];
  strokeDashOffset?: number;
  strokeLineCap?: LineCapStyle;
  children: PDFGraphic[];
}

type PDFGraphic = Shape | Text | Image | Group;

export default PDFGraphic;

export class PDFGraphicState {
  internalCSS: any;
  defs: {
    [id: string]: Mask | Filter | ClipPath | LinearGradient | RadialGradient;
  };

  constructor() {
    this.internalCSS = {};
    this.defs = {};
  }
}

/**
 * Utility function for converting snake case to camel case
 *
 * @param str
 * @returns
 */
const camel = (str: string) =>
  str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

/**
 *
 * @param obj
 * @returns
 */
const removeUndefined = <T extends Iterator>(obj: T): T => {
  Object.keys(obj).forEach((key) => obj[key] === undefined && delete obj[key]);
  return obj;
};

/**
 * Constructs style hierachy as presentation attributes
 *
 * @param presentationAttributes
 * @param internalCss
 * @param inlineStyle
 * @returns attributes
 */
const attributes = (
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

/**
 * Convert color string to desired response type
 *
 * @param str
 * @param color
 * @returns
 */
const color = (
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

/**
 * Convert color string to desired response type
 *
 * @param fillOrStrokeOpacity
 * @param opacity
 * @returns
 */
const opacity = (fillOrStrokeOpacity?: string, opacity?: string) => {
  return fillOrStrokeOpacity
    ? parseFloat(fillOrStrokeOpacity)
    : opacity
    ? parseFloat(opacity)
    : undefined;
};

const url = (defs: any, str?: string) => {
  if (!str) return undefined;

  const match = /url\((.*)\)/g.exec(str);
  if (match) {
    return defs[match[1]] as PDFOperator[];
  }

  return undefined;
};

const clipPath = (defs: any, clipString?: string): PDFOperator[] | undefined =>
  url(defs, clipString);
const filter = (defs: any, filterString?: string): PDFOperator[] | undefined =>
  url(defs, filterString);
const mask = (defs: any, maskString?: string): PDFOperator[] | undefined =>
  url(defs, maskString);

/**
 *
 * @param blendmode
 * @returns
 */
const mixBlendMode = (blendmode?: string): BlendMode | undefined => {
  if (!blendmode) return undefined;
  const blendMode = camel(blendmode);
  return (blendMode.charAt(0).toUpperCase() + blendMode.slice(1)) as BlendMode;
};

/**
 * DO NOT DESTRUCTURE AND AVOID DECLARING NEW VARIABLES AS YOU'LL SLOW THINGS DOWN
 *
 * Parsers are based of element index defined at https://www.w3.org/TR/SVG/eltindex.html
 */
export const JSXParsers: {
  [type: string]: (
    props: any,
    doc: PDFDocument,
    state: PDFGraphicState,
  ) => Promise<PDFGraphic> | PDFGraphic | Promise<void> | void;
} = {
  a() {
    throw new Error('Not yet supported element, a');
  },

  circle(props: any, _: PDFDocument, state: PDFGraphicState): Shape {
    const attr = attributes(props, state.internalCSS, props.style);

    return removeUndefined({
      type: 'shape',
      operators: circle(
        parseFloat(props.cx),
        parseFloat(props.cy),
        parseFloat(props.r),
      ),
      mask: mask(state.defs, attr.mask),
      filter: filter(state.defs, attr.filter),
      clipPath: clipPath(state.defs, attr.clipPath),
      clipRule: attr.clipRule,
      fill: color(state.defs, attr.fill, {
        type: ColorTypes.RGB,
        red: 0,
        green: 0,
        blue: 0,
      } as RGB),
      fillRule: attr.fillRule,
      fillOpacity: opacity(attr.fillOpacity, attr.opacity),
      stroke: color(state.defs, attr.stroke),
      strokeWidth: attr.strokeWidth,
      strokeLineJoin: attr.strokeLineJoin,
      strokeMiterLimit: parseFloat(attr.strokeMiterLimit),
      strokeLineCap: attr.strokeLineCap,
      strokeDashArray: attr.strokeDashArray,
      strokeDashOffset: parseFloat(attr.strokeDashOffset),
      strokeOpacity: opacity(attr.strokeOpacity, attr.opacity),
      mixBlendMode: mixBlendMode(attr.mixBlendMode),
      transform: transform(props.transform),
    } as Shape);
  },

  async clipPath(
    props: any,
    doc: PDFDocument,
    state: PDFGraphicState,
  ): Promise<void> {
    const children: (PDFGraphic | undefined)[] = [];
    for (const child of React.Children.toArray(props.children)) {
      if (
        typeof child === 'string' ||
        typeof child === 'number' ||
        !('type' in child)
      ) {
        // TODO: figure out if these cases are applicable
        continue;
      }

      const tagName = child.type.toString();
      if (typeof this[tagName] === 'function') {
        children.push(
          (await this[tagName](child.props, doc, state)) as PDFGraphic,
        );
      }
    }

    state.defs['#' + props.id] = removeUndefined({
      clipPathUnits: props.clipPathUnits,
      operators: shape({
        type: 'group',
        children: children.filter(Boolean) as PDFGraphic[],
      }),
    } as ClipPath);
  },

  defs(props: any, doc: PDFDocument, state: PDFGraphicState): void {
    const children = React.Children.toArray(props.children);
    children.forEach((child: any) => {
      try {
        this[child.type](child.props, doc, state);
      } catch (err) {
        throw new Error(
          'Unsupported or not yet supported element, ' + child.type,
        );
      }
    });
  },

  desc() {
    throw new Error('Unsupported or not yet supported element, desc');
  },

  discard() {
    throw new Error('Unsupported or not yet supported element, discard');
  },

  ellipse(props: any, _: PDFDocument, state: PDFGraphicState): Shape {
    const attr = attributes(props, state.internalCSS, props.style);

    return removeUndefined({
      type: 'shape',
      operators: ellipse(
        parseFloat(props.cx),
        parseFloat(props.cy),
        parseFloat(props.rx),
        parseFloat(props.ry),
      ),
      mask: mask(state.defs, attr.mask),
      filter: filter(state.defs, attr.filter),
      clipPath: clipPath(state.defs, attr.clipPath),
      clipRule: attr.clipRule,
      fill: color(state.defs, attr.fill, {
        type: ColorTypes.RGB,
        red: 0,
        green: 0,
        blue: 0,
      } as RGB),
      fillRule: attr.fillRule,
      fillOpacity: opacity(attr.fillOpacity, attr.opacity),
      stroke: color(state.defs, attr.stroke),
      strokeWidth: attr.strokeWidth,
      strokeLineJoin: attr.strokeLineJoin,
      strokeMiterLimit: parseFloat(attr.strokeMiterLimit),
      strokeLineCap: attr.strokeLineCap,
      strokeDashArray: attr.strokeDashArray,
      strokeDashOffset: parseFloat(attr.strokeDashOffset),
      strokeOpacity: opacity(attr.strokeOpacity, attr.opacity),
      mixBlendMode: mixBlendMode(attr.mixBlendMode),
      transform: transform(props.transform),
    } as Shape);
  },

  feBlend() {
    throw new Error('Unsupported or not yet supported element, feBlend');
  },

  feColorMatrix() {
    throw new Error('Unsupported or not yet supported element, feColorMatrix');
  },

  feComponentTransfer() {
    throw new Error(
      'Unsupported or not yet supported element, feComponentTransfer',
    );
  },

  feComposite() {
    throw new Error('Unsupported or not yet supported element, feComposite');
  },

  feConvolveMatrix() {
    throw new Error(
      'Unsupported or not yet supported element, feConvolveMatrix',
    );
  },

  feDiffuseLighting() {
    throw new Error(
      'Unsupported or not yet supported element, feDiffuseLighting',
    );
  },

  feDisplacementMap() {
    throw new Error(
      'Unsupported or not yet supported element, feDisplacementMap',
    );
  },

  feDistantLight() {
    throw new Error('Unsupported or not yet supported element, feDistantLight');
  },

  feDropShadow() {
    throw new Error('Unsupported or not yet supported element, feDropShadow');
  },

  feFlood() {
    throw new Error('Unsupported or not yet supported element, feFlood');
  },

  feFuncA() {
    throw new Error('Unsupported or not yet supported element, feFuncA');
  },

  feFuncB() {
    throw new Error('Unsupported or not yet supported element, feFuncB');
  },

  feFuncG() {
    throw new Error('Unsupported or not yet supported element, feFuncG');
  },

  feFuncR() {
    throw new Error('Unsupported or not yet supported element, feFuncR');
  },

  feGaussianBlur() {
    throw new Error('Unsupported or not yet supported element, feGaussianBlur');
  },

  feImage() {
    throw new Error('Unsupported or not yet supported element, feImage');
  },

  feMerge() {
    throw new Error('Unsupported or not yet supported element, feMerge');
  },

  feMergeNode() {
    throw new Error('Unsupported or not yet supported element, feMergeNode');
  },

  feMorphology() {
    throw new Error('Unsupported or not yet supported element, feMorphology');
  },

  feOffset() {
    throw new Error('Unsupported or not yet supported element, feOffset');
  },

  fePointLight() {
    throw new Error('Unsupported or not yet supported element, fePointLight');
  },

  feSpecularLighting() {
    throw new Error(
      'Unsupported or not yet supported element, feSpecularLighting',
    );
  },

  feSpotLight() {
    throw new Error('Unsupported or not yet supported element, feSpotLight');
  },

  feTile() {
    throw new Error('Unsupported or not yet supported element, feTile');
  },

  feTurbulence() {
    throw new Error('Unsupported or not yet supported element, feTurbulence');
  },

  async filter(props: any, doc: PDFDocument, state: PDFGraphicState) {
    const children: (PDFGraphic | undefined)[] = [];
    for (const child of React.Children.toArray(props.children)) {
      if (
        typeof child === 'string' ||
        typeof child === 'number' ||
        !('type' in child)
      ) {
        // TODO: figure out if these cases are applicable
        continue;
      }

      const tagName = child.type.toString();
      if (typeof this[tagName] === 'function') {
        children.push(
          (await this[tagName](child.props, doc, state)) as PDFGraphic,
        );
      }
    }

    state.defs['#' + props.id] = {
      x: parseFloat(props.x),
      y: parseFloat(props.y),
      width: parseFloat(props.width),
      height: parseFloat(props.height),
      filterUnits: props.filterUnits,
      primitiveUnits: props.primitiveUnits,
      effects: children.filter(Boolean) as PDFGraphic[],
    };

    throw new Error('Unsupported or not yet supported element, filter');
  },

  async g(
    props: any,
    doc: PDFDocument,
    state: PDFGraphicState,
  ): Promise<Group> {
    const attr = attributes(props, state.internalCSS, props.style);

    const children: (PDFGraphic | undefined)[] = [];
    for (const child of React.Children.toArray(props.children)) {
      if (
        typeof child === 'string' ||
        typeof child === 'number' ||
        !('type' in child)
      ) {
        // TODO: figure out if these case are applicable
        continue;
      }

      const tagName = child.type.toString();
      if (typeof this[tagName] === 'function') {
        children.push(
          (await this[tagName](child.props, doc, state)) as PDFGraphic,
        );
      }
    }

    return removeUndefined({
      type: 'group',
      mask: mask(state.defs, attr.mask),
      filter: filter(state.defs, attr.filter),
      clipPath: clipPath(state.defs, attr.clipPath),
      clipRule: attr.clipRule,
      fill: color(state.defs, attr.fill),
      fillRule: attr.fillRule,
      fillOpacity: parseFloat(attr.fillOpacity),
      stroke: color(state.defs, attr.stroke),
      strokeWidth: attr.strokeWidth,
      strokeLineJoin: attr.strokeLineJoin,
      strokeMiterLimit: parseFloat(attr.strokeMiterLimit),
      strokeLineCap: attr.strokeLineCap,
      strokeDashArray: attr.strokeDashArray,
      strokeDashOffset: parseFloat(attr.strokeDashOffset),
      strokeOpacity: parseFloat(attr.strokeOpacity),
      mixBlendMode: mixBlendMode(attr.mixBlendMode),
      transform: transform(props.transform),
      children: children.filter(Boolean) as PDFGraphic[],
    } as Group);
  },

  async image(
    props: any,
    doc: PDFDocument,
    state: PDFGraphicState,
  ): Promise<Image> {
    const attr = attributes(props, state.internalCSS, props.style);

    // const res = await axios.get(new URL(props.href), {
    //   responseType: 'text',
    //   responseEncoding: 'base64',
    // });

    // const href = res.data;

    // TODO: implement image URL support

    const mimeType = props.href.substring(
      props.href.indexOf(':') + 1,
      props.href.indexOf(';'),
    );

    switch (mimeType) {
      case 'image/png':
        const png = await doc.embedPng(props.href);
        return removeUndefined({
          type: 'image',
          image: png,
          width: parseFloat(props.width),
          height: parseFloat(props.height),
          mask: mask(state.defs, attr.mask),
          filter: filter(state.defs, attr.filter),
          clipPath: clipPath(state.defs, attr.clipPath),
          clipRule: attr.clipRule,
          opacity: parseFloat(attr.opacity),
          mixBlendMode: mixBlendMode(attr.mixBlendMode),
          transform: transform(props.transform),
        } as Image);

      case 'image/jpg':
      case 'image/jpeg':
        const jpeg = await doc.embedJpg(props.href);
        return removeUndefined({
          type: 'image',
          image: jpeg,
          width: parseFloat(props.width),
          height: parseFloat(props.height),
          mask: mask(state.defs, attr.mask),
          filter: filter(state.defs, attr.filter),
          clipPath: clipPath(state.defs, attr.clipPath),
          clipRule: attr.clipRule,
          opacity: parseFloat(attr.opacity),
          mixBlendMode: mixBlendMode(attr.mixBlendMode),
          transform: transform(props.transform),
        } as Image);

      // TODO: Image svg support may be added if a means (to pass a data uri to a string and then) to pass valid jsx is added to dependencies
      // This is not something willing to do at this time, but it would look like below

      // import { Buffer } from 'buffer';
      // import HtmlReactParser from 'html-react-parser';

      //   case 'image/svg+xml':
      //     let string = props.href;
      //     if (string === 'dataUri') {
      //       string = Buffer.from(
      //         string.split(';base64,')[1],
      //         'base64',
      //       ).toString(); // base64 encoding to svg string
      //     } else if (string === 'url') {
      //       const res = await axios.get(new URL(props.href), {
      //         responseType: 'text',
      //       });
      //       string = res.data;
      //     }

      //     const jsx = HtmlReactParser(string, {
      //       htmlparser2: {
      //         lowerCaseTags: false,
      //       },
      //     });

      //     return await doc.parseJsx(jsx);

      default:
        throw new TypeError(
          'Unsupported data type, ' +
            mimeType +
            ', on href of image tag\n - image/png\n - image/jpeg\n - image/jpg\n',
        );
    }
  },

  line(props: any, _: PDFDocument, state: PDFGraphicState): Shape {
    const attr = attributes(props, state.internalCSS, props.style);

    return removeUndefined({
      type: 'shape',
      operators: line(
        parseFloat(props.x1),
        parseFloat(props.y1),
        parseFloat(props.x2),
        parseFloat(props.y2),
      ),
      mask: mask(state.defs, attr.mask),
      filter: filter(state.defs, attr.filter),
      clipPath: clipPath(state.defs, attr.clipPath),
      clipRule: attr.clipRule,
      stroke: color(state.defs, attr.stroke),
      strokeWidth: attr.strokeWidth,
      strokeLineJoin: attr.strokeLineJoin,
      strokeMiterLimit: parseFloat(attr.strokeMiterLimit),
      strokeLineCap: attr.strokeLineCap,
      strokeDashArray: attr.strokeDashArray,
      strokeDashOffset: parseFloat(attr.strokeDashOffset),
      strokeOpacity: opacity(attr.strokeOpacity, attr.opacity),
      mixBlendMode: mixBlendMode(attr.mixBlendMode),
      transform: transform(props.transform),
    } as Shape);
  },

  async linearGradient(props: any, doc: PDFDocument, state: PDFGraphicState) {
    const children: (PDFGraphic | undefined)[] = [];
    for (const child of React.Children.toArray(props.children)) {
      if (
        typeof child === 'string' ||
        typeof child === 'number' ||
        !('type' in child)
      ) {
        // TODO: figure out if these cases are applicable
        continue;
      }

      const tagName = child.type.toString();
      if (typeof this[tagName] === 'function') {
        children.push(
          (await this[tagName](child.props, doc, state)) as PDFGraphic,
        );
      }
    }

    state.defs['#' + props.id] = removeUndefined({
      x1: parseFloat(props.x1),
      y1: parseFloat(props.y1),
      x2: parseFloat(props.x2),
      y2: parseFloat(props.y2),
      gradientUnits: props.gradientUnits,
      gradientTransform: props.gradientTransform,
      spreadMethod: props.spreadMethod,
      stops: children.filter(Boolean) as PDFGraphic[],
    } as LinearGradient);
  },

  marker() {
    throw new Error('Unsupported or not yet supported element, marker');
  },

  async mask(props: any, doc: PDFDocument, state: PDFGraphicState) {
    const children: (PDFGraphic | undefined)[] = [];
    for (const child of React.Children.toArray(props.children)) {
      if (
        typeof child === 'string' ||
        typeof child === 'number' ||
        !('type' in child)
      ) {
        // TODO: figure out if these cases are applicable
        continue;
      }

      const tagName = child.type.toString();
      if (typeof this[tagName] === 'function') {
        children.push(
          (await this[tagName](child.props, doc, state)) as PDFGraphic,
        );
      }
    }

    state.defs['#' + props.id] = {
      x: parseFloat(props.x),
      y: parseFloat(props.y),
      width: parseFloat(props.width),
      height: parseFloat(props.height),
      maskContentUnits: props.maskContentUnits,
      maskUnits: props.maskUnits,
      operators: shape({
        type: 'group',
        children: children.filter(Boolean) as PDFGraphic[],
      }),
    };

    throw new Error('Unsupported or not yet supported element, mask'); //
  },

  metadata() {
    throw new Error('Unsupported or not yet supported element, metadata');
  },

  path(props: any, _: PDFDocument, state: PDFGraphicState): Shape {
    const attr = attributes(props, state.internalCSS, props.style);

    return removeUndefined({
      type: 'shape',
      operators: path(props.d),
      mask: mask(state.defs, attr.mask),
      filter: filter(state.defs, attr.filter),
      clipPath: clipPath(state.defs, attr.clipPath),
      clipRule: attr.clipRule,
      fill: color(state.defs, attr.fill, {
        type: ColorTypes.RGB,
        red: 0,
        green: 0,
        blue: 0,
      } as RGB),
      fillRule: attr.fillRule,
      stroke: color(state.defs, attr.stroke),
      strokeWidth: attr.strokeWidth,
      strokeLineJoin: attr.strokeLineJoin,
      strokeMiterLimit: parseFloat(attr.strokeMiterLimit),
      strokeLineCap: attr.strokeLineCap,
      strokeDashArray: attr.strokeDashArray,
      strokeDashOffset: parseFloat(attr.strokeDashOffset),
      fillOpacity: opacity(attr.fillOpacity, attr.opacity),
      strokeOpacity: opacity(attr.strokeOpacity, attr.opacity),
      mixBlendMode: mixBlendMode(attr.mixBlendMode),
      transform: transform(props.transform),
    } as Shape);
  },

  pattern() {
    throw new Error('Unsupported or not yet supported element, pattern');
  },

  polygon(props: any, _: PDFDocument, state: PDFGraphicState): Shape {
    const attr = attributes(props, state.internalCSS, props.style);

    return removeUndefined({
      type: 'shape',
      operators: polygon(props.points),
      mask: mask(state.defs, attr.mask),
      filter: filter(state.defs, attr.filter),
      clipPath: clipPath(state.defs, attr.clipPath),
      clipRule: attr.clipRule,
      fill: color(state.defs, attr.fill, {
        type: ColorTypes.RGB,
        red: 0,
        green: 0,
        blue: 0,
      } as RGB),
      fillRule: attr.fillRule,
      fillOpacity: opacity(attr.fillOpacity, attr.opacity),
      stroke: color(state.defs, attr.stroke),
      strokeWidth: attr.strokeWidth,
      strokeLineJoin: attr.strokeLineJoin,
      strokeMiterLimit: parseFloat(attr.strokeMiterLimit),
      strokeLineCap: attr.strokeLineCap,
      strokeDashArray: attr.strokeDashArray,
      strokeDashOffset: parseFloat(attr.strokeDashOffset),
      strokeOpacity: opacity(attr.strokeOpacity, attr.opacity),
      mixBlendMode: mixBlendMode(attr.mixBlendMode),
      transform: transform(props.transform),
    } as Shape);
  },

  polyline(props: any, _: PDFDocument, state: PDFGraphicState): Shape {
    const attr = attributes(props, state.internalCSS, props.style);

    return removeUndefined({
      type: 'shape',
      operators: polyline(props.points),
      mask: mask(state.defs, attr.mask),
      filter: filter(state.defs, attr.filter),
      clipPath: clipPath(state.defs, attr.clipPath),
      clipRule: attr.clipRule,
      stroke: color(state.defs, attr.stroke),
      strokeWidth: attr.strokeWidth,
      strokeLineJoin: attr.strokeLineJoin,
      strokeMiterLimit: parseFloat(attr.strokeMiterLimit),
      strokeLineCap: attr.strokeLineCap,
      strokeDashArray: attr.strokeDashArray,
      strokeDashOffset: parseFloat(attr.strokeDashOffset),
      strokeOpacity: opacity(attr.strokeOpacity, attr.opacity),
      mixBlendMode: mixBlendMode(attr.mixBlendMode),
      transform: transform(props.transform),
    } as Shape);
  },

  async radialGradient(props: any, doc: PDFDocument, state: PDFGraphicState) {
    const children: (PDFGraphic | undefined)[] = [];
    for (const child of React.Children.toArray(props.children)) {
      if (
        typeof child === 'string' ||
        typeof child === 'number' ||
        !('type' in child)
      ) {
        // TODO: figure out if these cases are applicable
        continue;
      }

      const tagName = child.type.toString();
      if (typeof this[tagName] === 'function') {
        children.push(
          (await this[tagName](child.props, doc, state)) as PDFGraphic,
        );
      }
    }

    state.defs['#' + props.id] = removeUndefined({
      cx: parseFloat(props.cx),
      cy: parseFloat(props.cy),
      r: parseFloat(props.r),
      fx: parseFloat(props.f2),
      fy: parseFloat(props.fy),
      fr: parseFloat(props.fr),
      gradientUnits: props.gradientUnits,
      gradientTransform: props.gradientTransform,
      spreadMethod: props.spreadMethod,
      stops: children.filter(Boolean) as PDFGraphic[],
    } as RadialGradient);
  },

  rect(props: any, _: PDFDocument, state: PDFGraphicState): Shape {
    const attr = attributes(props, state.internalCSS, props.style);

    return removeUndefined({
      type: 'shape',
      operators: rect(
        parseFloat(props.x),
        parseFloat(props.y),
        parseFloat(props.width),
        parseFloat(props.height),
        props.rx ? parseFloat(props.rx) : undefined,
        props.ry ? parseFloat(props.ry) : undefined,
      ),
      mask: mask(state.defs, attr.mask),
      filter: filter(state.defs, attr.filter),
      clipPath: clipPath(state.defs, attr.clipPath),
      clipRule: attr.clipRule,
      fill: color(state.defs, attr.fill, {
        type: ColorTypes.RGB,
        red: 0,
        green: 0,
        blue: 0,
      } as RGB),
      fillRule: attr.fillRule,
      fillOpacity: opacity(attr.fillOpacity, attr.opacity),
      stroke: color(state.defs, attr.stroke),
      strokeWidth: attr.strokeWidth,
      strokeLineJoin: attr.strokeLineJoin,
      strokeMiterLimit: parseFloat(attr.strokeMiterLimit),
      strokeLineCap: attr.strokeLineCap,
      strokeDashArray: attr.strokeDashArray,
      strokeDashOffset: parseFloat(attr.strokeDashOffset),
      strokeOpacity: opacity(attr.strokeOpacity, attr.opacity),
      mixBlendMode: mixBlendMode(attr.mixBlendMode),
      transform: transform(props.transform),
    } as Shape);
  },

  stop() {
    throw new Error('Unsupported or not yet supported element, stop');
  },

  style(props: any, _: PDFDocument, state: PDFGraphicState): void {
    // TODO: make this quicker as large amount of internal CSS is slow
    // TODO: add tag name support

    const innerHTML = props.dangerouslySetInnerHTML.__html;
    const regCls = /.(.*?){(.*?)}/g;
    let cls;
    while ((cls = regCls.exec(innerHTML))) {
      const names = cls[1].split(',.');
      for (const name of names) {
        const styles = cls[2];

        if (!(name in state.internalCSS)) {
          state.internalCSS[name] = {};
        }

        styles.split(';').map((style) => {
          const [key, value] = style.split(':');
          state.internalCSS[name][camel(key)] = value;
        });
      }
    }
  },

  async svg(
    props: any,
    doc: PDFDocument,
    state: PDFGraphicState,
  ): Promise<Group> {
    const attr = attributes(props, state.internalCSS, props.style);

    const children: (PDFGraphic | undefined)[] = [];
    for (const child of React.Children.toArray(props.children)) {
      if (
        typeof child === 'string' ||
        typeof child === 'number' ||
        !('type' in child)
      ) {
        // TODO: figure out if these case are applicable
        continue;
      }

      const tagName = child.type.toString();
      if (typeof this[tagName] === 'function') {
        children.push(
          (await this[tagName](child.props, doc, state)) as PDFGraphic,
        );
      }
    }

    return removeUndefined({
      type: 'group',
      mask: mask(state.defs, attr.mask),
      filter: filter(state.defs, attr.filter),
      clipPath: clipPath(state.defs, attr.clipPath),
      clipRule: attr.clipRule,
      fillOpacity: opacity(attr.fillOpacity, attr.opacity),
      strokeOpacity: opacity(attr.strokeOpacity, attr.opacity),
      mixBlendMode: mixBlendMode(attr.mixBlendMode),
      transform: transform(props.transform),
      children: children.filter(Boolean) as PDFGraphic[],
    } as Group);
  },

  switch() {
    throw new Error('Unsupported or not yet supported element, stop');
  },

  symbol() {
    throw new Error('Unsupported or not yet supported element, symbol');
  },

  async text(
    props: any,
    doc: PDFDocument,
    state: PDFGraphicState,
  ): Promise<Text> {
    // const attr = attributes(
    //   props,
    //   state.internalCSS,
    //   props.style,
    // );

    const children: (PDFGraphic | undefined)[] = [];
    for (const child of React.Children.toArray(props.children)) {
      if (
        typeof child === 'string' ||
        typeof child === 'number' ||
        !('type' in child)
      ) {
        // TODO: figure out if these case are applicable
        continue;
      }

      const tagName = child.type.toString();
      if (typeof this[tagName] === 'function') {
        children.push(
          (await this[tagName](child.props, doc, state)) as PDFGraphic,
        );
      }
    }

    return removeUndefined({
      type: 'text',
      children: children.filter(Boolean) as Text[],
    } as Text);
  },

  async textPath() {
    throw new Error('Unsupported or not yet supported element, textPath');
  },

  title() {
    throw new Error('Unsupported or not yet supported element, title');
  },

  async tspan(
    props: any,
    doc: PDFDocument,
    state: PDFGraphicState,
  ): Promise<Text> {
    // const attr = attributes(
    //   props,
    //   state.internalCSS,
    //   props.style,
    // );

    const children: (PDFGraphic | undefined)[] = [];
    for (const child of React.Children.toArray(props.children)) {
      if (
        typeof child === 'string' ||
        typeof child === 'number' ||
        !('type' in child)
      ) {
        // TODO: figure out if these case are applicable
        continue;
      }

      const tagName = child.type.toString();
      if (typeof this[tagName] === 'function') {
        children.push(
          (await this[tagName](child.props, doc, state)) as PDFGraphic,
        );
      }
    }

    return removeUndefined({
      type: 'text',
      children: children.filter(Boolean) as Text[],
    } as Text);
  },

  unknown() {
    throw new Error('Unsupported or not yet supported element, unknown');
  },

  async use() {
    throw new Error('Unsupported or not yet supported element, use');
  },

  view() {
    throw new Error('Unsupported element, view');
  },

  ['Symbol(react.fragment)'](
    props: any,
    doc: PDFDocument,
    state: PDFGraphicState,
  ) {
    return this.g(props, doc, state); // SVG 2 spec treats all non SVG elements as g
  },
};
