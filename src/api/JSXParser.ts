import React from 'react';
import ColorParser from 'color';
import CssParser from 'clean-css';
import fontkit from '@pdf-lib/fontkit';
import PDFFont from 'src/api/PDFFont';
import { StandardFonts } from 'src/api/StandardFonts';

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
import {
  SVGParserNotSupportedError,
  PDFOperator,
  SVGParserFontError,
  SVGParserNotFoundError,
  SVGParserUnsupportedImageError,
} from 'src/core';

export const HTMLReactParserOptions = {
  htmlparser2: {
    lowerCaseTags: false,
  },
};

export const viewBox = (viewBox: string) => {
  const [x0, y0, x1, y1] = viewBox.split(' ').map((coord) => parseFloat(coord));

  return [x1 - x0, y1 - y0] as [number, number];
};

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
  effects: Effect[];
}

interface Effect {}

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
  gradientTransform?: PDFOperator[];
  spreadMethod?: 'pad' | 'reflect' | 'reflect';
  stops: Stop[];
}

interface RadialGradient {
  cx?: number;
  cy?: number;
  r?: number;
  fr: number;
  fx?: number;
  fy?: number;
  gradientUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
  gradientTransform?: PDFOperator[];
  spreadMethod?: 'pad' | 'reflect' | 'reflect';
  stops: Stop[];
}

interface Stop {}

interface Iterator {
  [key: string]: any;
}

const definedKeysOf = <T extends Iterator>(obj: T): T => {
  Object.keys(obj).forEach((key) => obj[key] === undefined && delete obj[key]);
  return obj;
};

interface Base extends Iterator {
  //   size: [number, number];
  transform?: PDFOperator[];
  mask?: Mask;
  filter?: Filter;
  clipPath?: ClipPath;
  clipRule?: 'nonzero' | 'evenodd';
  mixBlendMode?: BlendMode;
}

export interface Shape extends Base {
  type: 'shape';
  operators: PDFOperator[];
  fill?: Color | LinearGradient | RadialGradient;
  fillRule?: 'nonzero' | 'evenodd';
  fillOpacity?: number;
  strokeOpacity?: number;
  stroke?: Color | LinearGradient | RadialGradient;
  strokeWidth?: number;
  strokeLineJoin?: LineJoinStyle;
  strokeMiterLimit?: number;
  strokeDashArray?: number[];
  strokeDashOffset?: number;
  strokeLineCap?: LineCapStyle;
}

export interface Text extends Base {
  type: 'text';
  //   value: string;
  font: PDFFont | StandardFonts;
  children?: Text[];
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
  fill?: Color | LinearGradient | RadialGradient;
  fillRule?: 'nonzero' | 'evenodd';
  fillOpacity?: number;
  strokeOpacity?: number;
  stroke?: Color | LinearGradient | RadialGradient;
  strokeWidth?: number;
  strokeLineJoin?: LineJoinStyle;
  strokeMiterLimit?: number;
  strokeDashArray?: number[];
  strokeDashOffset?: number;
  strokeLineCap?: LineCapStyle;
  children: (Shape | Text | Image | Group)[];
}

const camel = (str: string) =>
  str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

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
  } as RGB;
};

const opacity = (fillOrStrokeOpacity?: string, opacity?: string) => {
  return fillOrStrokeOpacity
    ? parseFloat(fillOrStrokeOpacity)
    : opacity
    ? parseFloat(opacity)
    : undefined;
};

const url = (
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

const clipPath = (
  defs: {
    [id: string]: Mask | Filter | ClipPath | LinearGradient | RadialGradient;
  },
  clipString?: string,
): ClipPath | undefined => url(defs, clipString) as ClipPath | undefined;

const filter = (
  defs: {
    [id: string]: Mask | Filter | ClipPath | LinearGradient | RadialGradient;
  },
  filterString?: string,
): Filter | undefined => url(defs, filterString) as Filter | undefined;

const mask = (
  defs: {
    [id: string]: Mask | Filter | ClipPath | LinearGradient | RadialGradient;
  },
  maskString?: string,
): Mask | undefined => url(defs, maskString) as Mask | undefined;

const mixBlendMode = (blendmode?: string): BlendMode | undefined => {
  if (!blendmode) return undefined;
  const blendMode = camel(blendmode);
  return (blendMode.charAt(0).toUpperCase() + blendMode.slice(1)) as BlendMode;
};

const children = async <T>(
  children: any,
  callback: (child: { tagName: keyof Parsers; props: any }) => Promise<T>,
) => {
  const texts = [];
  for (const child of React.Children.toArray(children)) {
    if (
      typeof child === 'string' ||
      typeof child === 'number' ||
      !('type' in child)
    ) {
      // TODO: figure out if these cases are applicable
      continue;
    }

    const tagName = child.type.toString() as keyof Parsers;
    if (typeof parsers[tagName] !== 'function') {
      throw new SVGParserNotFoundError(tagName);
    }

    texts.push(await callback({ tagName: tagName, props: child.props }));
  }

  return texts.filter(Boolean) as Exclude<T, undefined>[];
};

export class JSXParserState {
  throwOnInvalidElement: boolean;
  css: any;
  fonts: {
    [family: string]: { [weight: string]: { [style: string]: PDFFont } };
  };
  defs: {
    [id: string]: Mask | Filter | ClipPath | LinearGradient | RadialGradient;
  };

  constructor(
    options: {
      throwOnInvalidElement?: boolean;
      fonts?: {
        [family: string]: { [weight: string]: { [style: string]: PDFFont } };
      };
    } = {},
  ) {
    const { throwOnInvalidElement = true, fonts = {} } = options;

    this.throwOnInvalidElement = throwOnInvalidElement;
    this.fonts = fonts;
    this.css = {};
    this.defs = {};
  }
}

type Parsers = typeof parsers;

export const parsers = {
  a(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('a');
    }

    return undefined;
  },

  circle(props: any, _: PDFDocument, state: JSXParserState) {
    const attr = attributes(props, state.css, props.style);

    const shape: Shape = {
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
    };

    return definedKeysOf(shape);
  },

  async clipPath(props: any, doc: PDFDocument, state: JSXParserState) {
    const url = '#' + props.id;
    const clipPath: ClipPath = {
      clipPathUnits: props.clipPathUnits,
      operators: shape({
        type: 'group',
        children: await children(props.children, async (child) => {
          return await this[child.tagName](child.props, doc, state);
        }),
      }),
    };

    state.defs[url] = definedKeysOf(clipPath);

    return undefined;
  },

  async defs(props: any, doc: PDFDocument, state: JSXParserState) {
    await children(props.children, async (child) => {
      return await this[child.tagName](child.props, doc, state);
    });

    return undefined;
  },

  desc(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('desc');
    }

    return undefined;
  },

  ellipse(props: any, _: PDFDocument, state: JSXParserState) {
    const attr = attributes(props, state.css, props.style);

    const shape: Shape = {
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
    };

    return definedKeysOf(shape);
  },

  feBlend(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('feBlend');
    }

    return undefined;
  },

  feColorMatrix(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('feColorMatrix');
    }

    return undefined;
  },

  feComponentTransfer(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('feComponentTransfer');
    }

    return undefined;
  },

  feComposite(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('feComposite');
    }

    return undefined;
  },

  feConvolveMatrix(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('feConvolveMatrix');
    }

    return undefined;
  },

  feDiffuseLighting(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('feDiffuseLighting');
    }

    return undefined;
  },

  feDisplacementMap(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('feDisplacementMap');
    }

    return undefined;
  },

  feDistantLight(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('feDistantLight');
    }

    return undefined;
  },

  feDropShadow(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('feDropShadow');
    }

    return undefined;
  },

  feFlood(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('feFlood');
    }

    return undefined;
  },

  feFuncA(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('feFuncA');
    }

    return undefined;
  },

  feFuncB(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('feFuncB');
    }

    return undefined;
  },

  feFuncG(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('feFuncG');
    }

    return undefined;
  },

  feFuncR(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('feFuncR');
    }

    return undefined;
  },

  feGaussianBlur(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('feGaussianBlur');
    }

    return undefined;
  },

  feImage(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('feImage');
    }

    return undefined;
  },

  feMerge(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('feMerge');
    }

    return undefined;
  },

  feMergeNode(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('feMergeNode');
    }

    return undefined;
  },

  feMorphology(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('feMorphology');
    }

    return undefined;
  },

  feOffset(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('feOffset');
    }

    return undefined;
  },

  fePointLight(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('fePointLight');
    }

    return undefined;
  },

  feSpecularLighting(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('feSpecularLighting');
    }

    return undefined;
  },

  feSpotLight(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('feSpotLight');
    }

    return undefined;
  },

  feTile(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('feTile');
    }

    return undefined;
  },

  feTurbulence(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('feTurbulence');
    }

    return undefined;
  },

  async filter(props: any, doc: PDFDocument, state: JSXParserState) {
    // this is here until implementation verified
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('filter');
    }

    const url = '#' + props.id;
    const filter: Filter = {
      x: parseFloat(props.x),
      y: parseFloat(props.y),
      width: parseFloat(props.width),
      height: parseFloat(props.height),
      filterUnits: props.filterUnits,
      primitiveUnits: props.primitiveUnits,
      effects: await children(props.children, async (child) => {
        const filters = Object.keys(parsers).filter((tagName) =>
          tagName.startsWith('fe'),
        );

        if (!filters.includes(child.tagName)) {
          throw new SVGParserNotSupportedError('filter');
        }

        return await this[child.tagName](child.props, doc, state);
      }),
    };

    state.defs[url] = filter;

    return undefined;
  },

  async g(props: any, doc: PDFDocument, state: JSXParserState) {
    const attr = attributes(props, state.css, props.style);

    const group: Group = {
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
      children: await children(props.children, async (child) => {
        return await this[child.tagName](child.props, doc, state);
      }),
    };

    return definedKeysOf(group);
  },

  async image(props: any, doc: PDFDocument, state: JSXParserState) {
    const attr = attributes(props, state.css, props.style);

    // const res = await axios.get(new URL(props.href), {
    //   responseType: 'text',
    //   responseEncoding: 'base64',
    // });

    // const href = res.data;

    // TODO: implement image URL support

    const mimeType = props.herf
      ? props.href.substring(
          props.href.indexOf(':') + 1,
          props.href.indexOf(';'),
        )
      : props.xlinkHref.substring(
          props.xlinkHref.indexOf(':') + 1,
          props.xlinkHref.indexOf(';'),
        );

    if (mimeType === 'image/png') {
      const png = await doc.embedPng(props.href ? props.href : props.xlinkHref);

      const image: Image = {
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
      };

      return definedKeysOf(image);
    }

    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      const jpeg = await doc.embedJpg(
        props.href ? props.href : props.xlinkHref,
      );

      const image: Image = {
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
      };

      return definedKeysOf(image);
    }

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

    throw new SVGParserUnsupportedImageError(mimeType);
  },

  line(props: any, _: PDFDocument, state: JSXParserState) {
    const attr = attributes(props, state.css, props.style);

    const shape: Shape = {
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
    };

    return definedKeysOf(shape);
  },

  async linearGradient(props: any, doc: PDFDocument, state: JSXParserState) {
    // this is here until implementation verified
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('linearGradient');
    }

    const url = '#' + props.id;
    const linearGradient: LinearGradient = {
      x1: parseFloat(props.x1),
      y1: parseFloat(props.y1),
      x2: parseFloat(props.x2),
      y2: parseFloat(props.y2),
      gradientUnits: props.gradientUnits,
      gradientTransform: props.gradientTransform,
      spreadMethod: props.spreadMethod,
      stops: await children(props.children, async (child) => {
        return await this[child.tagName](child.props, doc, state);
      }),
    };

    state.defs[url] = definedKeysOf(linearGradient);

    return undefined;
  },

  marker(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('marker');
    }

    return undefined;
  },

  async mask(props: any, _: PDFDocument, state: JSXParserState) {
    // this is here until implementation verified
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('mask');
    }

    const url = '#' + props.id;
    const mask: Mask = {
      x: parseFloat(props.x),
      y: parseFloat(props.y),
      width: parseFloat(props.width),
      height: parseFloat(props.height),
      maskContentUnits: props.maskContentUnits,
      maskUnits: props.maskUnits,
      operators: [],
    };

    state.defs[url] = definedKeysOf(mask);

    return undefined;
  },

  metadata(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('metadata');
    }

    return undefined;
  },

  path(props: any, _: PDFDocument, state: JSXParserState) {
    const attr = attributes(props, state.css, props.style);

    const shape: Shape = {
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
    };

    return definedKeysOf(shape);
  },

  pattern(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('pattern');
    }

    return undefined;
  },

  polygon(props: any, _: PDFDocument, state: JSXParserState) {
    const attr = attributes(props, state.css, props.style);

    const shape: Shape = {
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
    };

    return definedKeysOf(shape);
  },

  polyline(props: any, _: PDFDocument, state: JSXParserState) {
    const attr = attributes(props, state.css, props.style);

    const shape: Shape = {
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
    };

    return definedKeysOf(shape);
  },

  async radialGradient(props: any, doc: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('radialGradient');
    }

    const url = '#' + props.id;

    const radialGradient: RadialGradient = {
      cx: parseFloat(props.cx),
      cy: parseFloat(props.cy),
      r: parseFloat(props.r),
      fx: parseFloat(props.fx),
      fy: parseFloat(props.fy),
      fr: parseFloat(props.fr),
      gradientUnits: props.gradientUnits,
      gradientTransform: props.gradientTransform,
      spreadMethod: props.spreadMethod,
      stops: await children(props.children, async (child) => {
        return await this[child.tagName](child.props, doc, state);
      }),
    };

    state.defs[url] = definedKeysOf(radialGradient);

    return undefined;
  },

  rect(props: any, _: PDFDocument, state: JSXParserState) {
    const attr = attributes(props, state.css, props.style);

    const shape: Shape = {
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
    };

    return definedKeysOf(shape);
  },

  stop(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('stop');
    }

    return undefined;
  },

  async style(props: any, doc: PDFDocument, state: JSXParserState) {
    // TODO: make this quicker as large amount of internal CSS is slow
    // TODO: add tag name support

    const css = new CssParser({
      format: {
        semicolonAfterLastProperty: true,
      },
    }).minify(props.dangerouslySetInnerHTML.__html);

    const regex = /(\.(.*?)|@font-face){(.*?)}/g;

    let cls;
    while ((cls = regex.exec(css.styles))) {
      if (cls[1] === '@font-face') {
        let family, weight, style, src;
        doc.registerFontkit(fontkit);
        const reg = /(.*?):(?:url\('(data:(.*?);base64,.*?)'\) format\(.*?\)|(.*?));/g;
        let match;
        while ((match = reg.exec(cls[3]))) {
          if (match[1] === 'src') {
            src = match[2];
          } else {
            if (match[1] === 'font-family') {
              family = match[4];
            }

            if (match[1] === 'font-weight') {
              weight = match[4];
            }

            if (match[1] === 'font-style') {
              style = match[4];
            }
          }
        }

        if (!family) {
          throw new SVGParserFontError('@font-face font-family not provided');
        }

        if (!weight) {
          //TODO: implement weight defaults
          throw new SVGParserFontError('@font-face font-weight not provided');
        }

        if (!src) {
          throw new SVGParserFontError('@font-face src not provided');
        }

        if (!style) {
          style = 'normal';
        }

        if (state.fonts[family]) {
          if (state.fonts[family][weight]) {
            state.fonts[family][weight][style] = await doc.embedFont(src, {
              customName: family,
            });
          } else {
            state.fonts[family][weight] = {
              [style]: await doc.embedFont(src, {
                customName: family,
              }),
            };
          }
        } else {
          state.fonts[family] = {
            [weight]: {
              [style]: await doc.embedFont(src, {
                customName: `${family}-${weight}`,
              }),
            },
          };
        }
      } else {
        for (const name of cls[1].split(',')) {
          const className = name.substring(1);
          if (!(className in state.css)) {
            state.css[className] = {};
          }

          cls[3].split(';').forEach(async (style) => {
            const [key, value] = style.split(':');
            if (key.length === 0) return;
            state.css[className][camel(key)] = value;
          });
        }
      }
    }

    return undefined;
  },

  async svg(props: any, doc: PDFDocument, state: JSXParserState) {
    const attr = attributes(props, state.css, props.style);

    const group: Group = {
      type: 'group',
      mask: mask(state.defs, attr.mask),
      filter: filter(state.defs, attr.filter),
      clipPath: clipPath(state.defs, attr.clipPath),
      clipRule: attr.clipRule,
      fillOpacity: opacity(attr.fillOpacity, attr.opacity),
      strokeOpacity: opacity(attr.strokeOpacity, attr.opacity),
      mixBlendMode: mixBlendMode(attr.mixBlendMode),
      transform: transform(props.transform),
      children: await children(props.children, async (child) => {
        return await this[child.tagName](child.props, doc, state);
      }),
    };

    return definedKeysOf(group);
  },

  symbol(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('symbol');
    }

    return undefined;
  },

  async text(props: any, _: PDFDocument, state: JSXParserState) {
    const attr = attributes(props, state.css, props.style);

    console.log(attr);

    console.log(state.fonts);

    const text: Text = {
      type: 'text',
      font: state.fonts[attr.fontFamily]
        ? state.fonts[attr.fontFamily][
            attr.fontWeight
              ? attr.fontWeight
              : Object.keys(state.fonts[attr.fontFamily])[0]
          ][attr.fontStyle ? attr.fontStyle : 'normal']
        : StandardFonts.Helvetica,
      //   children: await children(props.children, async (child) => {
      //     if (child.tagName !== 'tspan' && child.tagName !== 'textPath') {
      //       throw new Error('Invalid SVG');
      //     }

      //     return await this[child.tagName](child.props, doc, state);
      //   }),
    };

    return definedKeysOf(text);
  },

  async textPath(props: any, doc: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('textPath');
    }

    const attr = attributes(props, state.css, props.style);

    console.log(attr);

    console.log(state.fonts);

    const text: Text = {
      type: 'text',
      font: state.fonts[attr.fontFamily]
        ? state.fonts[attr.fontFamily][
            attr.fontWeight
              ? attr.fontWeight
              : Object.keys(state.fonts[attr.fontFamily])[0]
          ][attr.fontStyle ? attr.fontStyle : 'normal']
        : StandardFonts.Helvetica,
      children: await children(props.children, async (child) => {
        if (child.tagName !== 'tspan' && child.tagName !== 'textPath') {
          throw new Error('Invalid SVG');
        }

        return await this[child.tagName](child.props, doc, state);
      }),
    };

    return definedKeysOf(text);
  },

  title(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('title');
    }

    return undefined;
  },

  async tspan(props: any, doc: PDFDocument, state: JSXParserState) {
    const attr = attributes(props, state.css, props.style);

    console.log(attr);

    const text: Text = {
      type: 'text',
      font: state.fonts[attr.fontFamily]
        ? state.fonts[attr.fontFamily][
            attr.fontWeight
              ? attr.fontWeight
              : Object.keys(state.fonts[attr.fontFamily])[0]
          ][attr.fontStyle ? attr.fontStyle : 'normal']
        : StandardFonts.Helvetica,
      children: await children(props.children, async (child) => {
        if (child.tagName !== 'tspan' && child.tagName !== 'textPath') {
          throw new Error('Invalid SVG');
        }

        return await this[child.tagName](child.props, doc, state);
      }),
    };

    console.log(text);

    return definedKeysOf(text);
  },

  async use(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.throwOnInvalidElement) {
      throw new SVGParserNotSupportedError('use');
    }

    return undefined;
  },

  ['Symbol(react.fragment)'](
    props: any,
    doc: PDFDocument,
    state: JSXParserState,
  ) {
    return this.g(props, doc, state); // SVG 2 spec treats all non SVG elements as g
  },
};

export default parsers;
