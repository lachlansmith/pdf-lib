import { Children } from 'react';
import CssParser from 'clean-css';
import fontkit from '@pdf-lib/fontkit';

import JSXParserState from 'src/api/JSXParserState';

import PDFFont from 'src/api/PDFFont';
import { LineCapStyle, LineJoinStyle } from 'src/api/operators';
import { PDFImage, BlendMode, Rotation } from 'src/api';
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
  PDFOperator,
  JSXParserInvalidElementError,
  JSXParserInvalidAttributeError,
  JSXParserUnsupportedImageError,
  Invalid,
  JSXParsingError,
} from 'src/core';
import {
  definedKeysOf,
  attributes,
  mixBlendMode,
  mask,
  filter,
  clipPath,
  color,
  opacity,
  camel,
} from 'src/utils';

export const HTMLMinifierOptions = {
  collapseWhitespace: true,
  caseSensitive: true,
  removeComments: true,
};

export const HTMLReactParserOptions = {
  htmlparser2: {
    lowerCaseTags: false,
  },
};

interface Iterator {
  [key: string]: any;
}

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
  font: PDFFont;
  fontSize: number;
  segments: (string | Text)[];
  x?: number;
  y?: number;
  dx?: number;
  dy?: number;
  rotate?: Rotation;
  lengthAdjust?: 'spacing' | 'spacingAndGlyphs';
  textLength?: number;
  textAnchor?: 'start' | 'middle' | 'end';
  lineHeight?: number;
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

export interface Mask {
  type: 'mask';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  maskContentUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
  maskUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
  operators: PDFOperator[];
}

export interface Filter {
  type: 'filter';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  filterUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
  primitiveUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
  effects: Effect[];
}

export interface ClipPath {
  type: 'clipPath';
  clipPathUnits: 'userSpaceOnUse' | 'objectBoundingBox';
  operators: PDFOperator[];
}

export interface LinearGradient {
  type: 'linearGradient';
  x1?: number;
  y1?: number;
  x2: number;
  y2?: number;
  gradientUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
  gradientTransform?: PDFOperator[];
  spreadMethod?: 'pad' | 'reflect' | 'reflect';
  stops: Stop[];
}

export interface RadialGradient {
  type: 'radialGradient';
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

export interface Stop {
  // TODO: figure this out
}

export interface Effect {
  // TODO: figure this out
}

const children = async <T>(
  children: any,
  callback: (child: string | JSX.Element) => Promise<T>,
) => {
  const kiddles = [];
  for (const child of Children.toArray(children)) {
    if (typeof child === 'number') {
      continue;
    }

    if (typeof child === 'string') {
      kiddles.push(await callback(child));
      continue;
    }

    if (!('type' in child)) {
      continue;
    }

    kiddles.push(await callback(child));
  }

  return kiddles.filter(Boolean) as Exclude<T, undefined>[];
};

export type JSXParsers = typeof parsers;

export const parsers = {
  a(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  circle(props: any, _: PDFDocument, state: JSXParserState) {
    const a = attributes(props, state.css, props.style);

    const shape: Shape = {
      type: 'shape',
      operators: circle(
        parseFloat(props.cx),
        parseFloat(props.cy),
        parseFloat(props.r),
      ),
      mask: mask(state, a.mask),
      filter: filter(state, a.filter),
      clipPath: clipPath(state, a.clipPath),
      clipRule: a.clipRule,
      fill: color(state, a.fill, {
        type: ColorTypes.RGB,
        red: 0,
        green: 0,
        blue: 0,
      } as RGB),
      fillRule: a.fillRule,
      fillOpacity: opacity(a.fillOpacity, a.opacity),
      stroke: color(state, a.stroke),
      strokeWidth: a.strokeWidth,
      strokeLineJoin: a.strokeLineJoin,
      strokeMiterLimit: parseFloat(a.strokeMiterLimit),
      strokeLineCap: a.strokeLineCap,
      strokeDashArray: a.strokeDashArray,
      strokeDashOffset: parseFloat(a.strokeDashOffset),
      strokeOpacity: opacity(a.strokeOpacity, a.opacity),
      mixBlendMode: mixBlendMode(a.mixBlendMode),
      transform: transform(props.transform),
    };

    return definedKeysOf(shape);
  },

  async clipPath(props: any, doc: PDFDocument, state: JSXParserState) {
    const url = '#' + props.id;
    const clipPath: ClipPath = {
      type: 'clipPath',
      clipPathUnits: props.clipPathUnits,
      operators: shape(
        await children(props.children, async (child) => {
          if (typeof child === 'string') {
            return;
          }

          const tagName = child.type.toString() as keyof JSXParsers;
          if (
            tagName !== 'circle' &&
            tagName !== 'ellipse' &&
            tagName !== 'path' &&
            tagName !== 'polygon' &&
            tagName !== 'rect'
            // tagName !== 'text' && // needs fontkit conversion to Shape
            // tagName !== 'use'
          ) {
            throw new JSXParserInvalidElementError(
              state,
              'Invalid child, ' + tagName,
            );
          }

          state.tagName = tagName;

          const shape = await parsers[tagName](child.props, doc, state.copy());
          return shape.operators;
        }),
      ),
    };

    state.defs[url] = definedKeysOf(clipPath);

    return undefined;
  },

  async defs(props: any, doc: PDFDocument, state: JSXParserState) {
    await children(props.children, async (child) => {
      if (typeof child === 'string') {
        return;
      }

      return await parseJsx(child, doc, state.copy());
    });

    return undefined;
  },

  desc(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  ellipse(props: any, _: PDFDocument, state: JSXParserState) {
    const a = attributes(props, state.css, props.style);

    const shape: Shape = {
      type: 'shape',
      operators: ellipse(
        parseFloat(props.cx),
        parseFloat(props.cy),
        parseFloat(props.rx),
        parseFloat(props.ry),
      ),
      mask: mask(state, a.mask),
      filter: filter(state, a.filter),
      clipPath: clipPath(state, a.clipPath),
      clipRule: a.clipRule,
      fill: color(state, a.fill, {
        type: ColorTypes.RGB,
        red: 0,
        green: 0,
        blue: 0,
      } as RGB),
      fillRule: a.fillRule,
      fillOpacity: opacity(a.fillOpacity, a.opacity),
      stroke: color(state, a.stroke),
      strokeWidth: a.strokeWidth,
      strokeLineJoin: a.strokeLineJoin,
      strokeMiterLimit: parseFloat(a.strokeMiterLimit),
      strokeLineCap: a.strokeLineCap,
      strokeDashArray: a.strokeDashArray,
      strokeDashOffset: parseFloat(a.strokeDashOffset),
      strokeOpacity: opacity(a.strokeOpacity, a.opacity),
      mixBlendMode: mixBlendMode(a.mixBlendMode),
      transform: transform(props.transform),
    };

    return definedKeysOf(shape);
  },

  feBlend(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  feColorMatrix(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  feComponentTransfer(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  feComposite(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  feConvolveMatrix(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  feDiffuseLighting(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  feDisplacementMap(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  feDistantLight(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  feDropShadow(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  feFlood(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  feFuncA(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  feFuncB(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  feFuncG(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  feFuncR(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  feGaussianBlur(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  feImage(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  feMerge(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  feMergeNode(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  feMorphology(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  feOffset(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  fePointLight(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  feSpecularLighting(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  feSpotLight(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  feTile(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  feTurbulence(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  async filter(props: any, doc: PDFDocument, state: JSXParserState) {
    // this is here until implementation verified
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    const url = '#' + props.id;
    const filter: Filter = {
      type: 'filter',
      x: parseFloat(props.x),
      y: parseFloat(props.y),
      width: parseFloat(props.width),
      height: parseFloat(props.height),
      filterUnits: props.filterUnits,
      primitiveUnits: props.primitiveUnits,
      effects: await children(props.children, async (child) => {
        if (typeof child === 'string') {
          return;
        }

        const tagName = child.type.toString() as keyof JSXParsers;
        if (
          tagName !== 'feBlend' &&
          tagName !== 'feColorMatrix' &&
          tagName !== 'feComponentTransfer' &&
          tagName !== 'feComposite' &&
          tagName !== 'feConvolveMatrix' &&
          tagName !== 'feDiffuseLighting' &&
          tagName !== 'feDisplacementMap' &&
          tagName !== 'feDistantLight' &&
          tagName !== 'feDropShadow' &&
          tagName !== 'feFlood' &&
          tagName !== 'feFuncA' &&
          tagName !== 'feFuncB' &&
          tagName !== 'feFuncG' &&
          tagName !== 'feFuncR' &&
          tagName !== 'feGaussianBlur' &&
          tagName !== 'feImage' &&
          tagName !== 'feMerge' &&
          tagName !== 'feMergeNode' &&
          tagName !== 'feMorphology' &&
          tagName !== 'feOffset' &&
          tagName !== 'fePointLight' &&
          tagName !== 'feSpecularLighting' &&
          tagName !== 'feSpotLight' &&
          tagName !== 'feTile' &&
          tagName !== 'feTurbulence'
        ) {
          throw new JSXParserInvalidElementError(
            state,
            'Invalid child, ' + tagName,
          );
        }

        return await parsers[tagName](child.props, doc, state.copy());
      }),
    };

    state.defs[url] = filter;

    return undefined;
  },

  async g(props: any, doc: PDFDocument, state: JSXParserState) {
    const a = attributes(props, state.css, props.style);

    const group: Group = {
      type: 'group',
      mask: mask(state, a.mask),
      filter: filter(state, a.filter),
      clipPath: clipPath(state, a.clipPath),
      clipRule: a.clipRule,
      fill: color(state, a.fill),
      fillRule: a.fillRule,
      fillOpacity: parseFloat(a.fillOpacity),
      stroke: color(state, a.stroke),
      strokeWidth: a.strokeWidth,
      strokeLineJoin: a.strokeLineJoin,
      strokeMiterLimit: parseFloat(a.strokeMiterLimit),
      strokeLineCap: a.strokeLineCap,
      strokeDashArray: a.strokeDashArray,
      strokeDashOffset: parseFloat(a.strokeDashOffset),
      strokeOpacity: parseFloat(a.strokeOpacity),
      mixBlendMode: mixBlendMode(a.mixBlendMode),
      transform: transform(props.transform),
      children: await children(props.children, async (child) => {
        if (typeof child === 'string') {
          return;
        }

        return await parseJsx(child, doc, state.copy());
      }),
    };

    return definedKeysOf(group);
  },

  async image(props: any, doc: PDFDocument, state: JSXParserState) {
    const a = attributes(props, state.css, props.style);

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
        mask: mask(state, a.mask),
        filter: filter(state, a.filter),
        clipPath: clipPath(state, a.clipPath),
        clipRule: a.clipRule,
        opacity: parseFloat(a.opacity),
        mixBlendMode: mixBlendMode(a.mixBlendMode),
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
        mask: mask(state, a.mask),
        filter: filter(state, a.filter),
        clipPath: clipPath(state, a.clipPath),
        clipRule: a.clipRule,
        opacity: parseFloat(a.opacity),
        mixBlendMode: mixBlendMode(a.mixBlendMode),
        transform: transform(props.transform),
      };

      return definedKeysOf(image);
    }

    // TODO: Image svg support may be added if a means (to pass a data uri to a string and then) to pass valid jsx is added to dependencies
    // This is not something willing to do at this time, but it would look like below

    // import axios from 'axios';
    // import { Buffer } from 'buffer';
    // import HtmlReactParser from 'html-react-parser';

    // if (mimeType === 'image/svg+xml') {
    //   let string = props.href;
    //   if (string === 'dataUri') {
    //     string = Buffer.from(string.split(';base64,')[1], 'base64').toString(); // base64 encoding to svg string
    //   } else if (string === 'url') {
    //     const res = await axios.get(new URL(props.href), {
    //       responseType: 'text',
    //     });
    //     string = res.data;
    //   }

    //   const element = HtmlReactParser(string, {
    //     htmlparser2: {
    //       lowerCaseTags: false,
    //     },
    //   });

    //   return await parseJsx(element, doc, state);
    // }

    throw new JSXParserUnsupportedImageError(state, mimeType);
  },

  line(props: any, _: PDFDocument, state: JSXParserState) {
    const a = attributes(props, state.css, props.style);

    const shape: Shape = {
      type: 'shape',
      operators: line(
        parseFloat(props.x1),
        parseFloat(props.y1),
        parseFloat(props.x2),
        parseFloat(props.y2),
      ),
      mask: mask(state, a.mask),
      filter: filter(state, a.filter),
      clipPath: clipPath(state, a.clipPath),
      clipRule: a.clipRule,
      stroke: color(state, a.stroke),
      strokeWidth: a.strokeWidth,
      strokeLineJoin: a.strokeLineJoin,
      strokeMiterLimit: parseFloat(a.strokeMiterLimit),
      strokeLineCap: a.strokeLineCap,
      strokeDashArray: a.strokeDashArray,
      strokeDashOffset: parseFloat(a.strokeDashOffset),
      strokeOpacity: opacity(a.strokeOpacity, a.opacity),
      mixBlendMode: mixBlendMode(a.mixBlendMode),
      transform: transform(props.transform),
    };

    return definedKeysOf(shape);
  },

  async linearGradient(props: any, doc: PDFDocument, state: JSXParserState) {
    // this is here until implementation verified
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    const url = '#' + props.id;
    const linearGradient: LinearGradient = {
      type: 'linearGradient',
      x1: parseFloat(props.x1),
      y1: parseFloat(props.y1),
      x2: parseFloat(props.x2),
      y2: parseFloat(props.y2),
      gradientUnits: props.gradientUnits,
      gradientTransform: props.gradientTransform,
      spreadMethod: props.spreadMethod,
      stops: await children(props.children, async (child) => {
        if (typeof child === 'string') {
          return;
        }

        const tagName = child.type.toString() as keyof JSXParsers;
        if (tagName !== 'stop') {
          throw new JSXParserInvalidElementError(
            state,
            'Invalid child, ' + tagName,
          );
        }

        state.tagName = tagName;

        return await parsers[tagName](child.props, doc, state.copy());
      }),
    };

    state.defs[url] = definedKeysOf(linearGradient);

    return undefined;
  },

  marker(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  async mask(props: any, doc: PDFDocument, state: JSXParserState) {
    // this is here until implementation verified
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    const url = '#' + props.id;
    const mask: Mask = {
      type: 'mask',
      x: parseFloat(props.x),
      y: parseFloat(props.y),
      width: parseFloat(props.width),
      height: parseFloat(props.height),
      maskContentUnits: props.maskContentUnits,
      maskUnits: props.maskUnits,
      operators: shape(
        await children(props.children, async (child) => {
          if (typeof child === 'string') {
            return;
          }

          const tagName = child.type.toString() as keyof JSXParsers;
          if (
            tagName !== 'circle' &&
            tagName !== 'ellipse' &&
            tagName !== 'path' &&
            tagName !== 'polygon' &&
            tagName !== 'rect'
            // tagName !== 'text' && // needs fontkit conversion to Shape
            // tagName !== 'use'
          ) {
            throw new JSXParserInvalidElementError(
              state,
              'Invalid child, ' + tagName,
            );
          }

          const shape = await parsers[tagName](child.props, doc, state.copy());
          return shape.operators;
        }),
      ),
    };

    state.defs[url] = definedKeysOf(mask);

    return undefined;
  },

  metadata(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  path(props: any, _: PDFDocument, state: JSXParserState) {
    const a = attributes(props, state.css, props.style);

    const shape: Shape = {
      type: 'shape',
      operators: path(props.d),
      mask: mask(state, a.mask),
      filter: filter(state, a.filter),
      clipPath: clipPath(state, a.clipPath),
      clipRule: a.clipRule,
      fill: color(state, a.fill, {
        type: ColorTypes.RGB,
        red: 0,
        green: 0,
        blue: 0,
      } as RGB),
      fillRule: a.fillRule,
      stroke: color(state, a.stroke),
      strokeWidth: a.strokeWidth,
      strokeLineJoin: a.strokeLineJoin,
      strokeMiterLimit: parseFloat(a.strokeMiterLimit),
      strokeLineCap: a.strokeLineCap,
      strokeDashArray: a.strokeDashArray,
      strokeDashOffset: parseFloat(a.strokeDashOffset),
      fillOpacity: opacity(a.fillOpacity, a.opacity),
      strokeOpacity: opacity(a.strokeOpacity, a.opacity),
      mixBlendMode: mixBlendMode(a.mixBlendMode),
      transform: transform(props.transform),
    };

    return definedKeysOf(shape);
  },

  pattern(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  polygon(props: any, _: PDFDocument, state: JSXParserState) {
    const a = attributes(props, state.css, props.style);

    const shape: Shape = {
      type: 'shape',
      operators: polygon(props.points),
      mask: mask(state, a.mask),
      filter: filter(state, a.filter),
      clipPath: clipPath(state, a.clipPath),
      clipRule: a.clipRule,
      fill: color(state, a.fill, {
        type: ColorTypes.RGB,
        red: 0,
        green: 0,
        blue: 0,
      } as RGB),
      fillRule: a.fillRule,
      fillOpacity: opacity(a.fillOpacity, a.opacity),
      stroke: color(state, a.stroke),
      strokeWidth: a.strokeWidth,
      strokeLineJoin: a.strokeLineJoin,
      strokeMiterLimit: parseFloat(a.strokeMiterLimit),
      strokeLineCap: a.strokeLineCap,
      strokeDashArray: a.strokeDashArray,
      strokeDashOffset: parseFloat(a.strokeDashOffset),
      strokeOpacity: opacity(a.strokeOpacity, a.opacity),
      mixBlendMode: mixBlendMode(a.mixBlendMode),
      transform: transform(props.transform),
    };

    return definedKeysOf(shape);
  },

  polyline(props: any, _: PDFDocument, state: JSXParserState) {
    const a = attributes(props, state.css, props.style);

    const shape: Shape = {
      type: 'shape',
      operators: polyline(props.points),
      mask: mask(state, a.mask),
      filter: filter(state, a.filter),
      clipPath: clipPath(state, a.clipPath),
      clipRule: a.clipRule,
      stroke: color(state, a.stroke),
      strokeWidth: a.strokeWidth,
      strokeLineJoin: a.strokeLineJoin,
      strokeMiterLimit: parseFloat(a.strokeMiterLimit),
      strokeLineCap: a.strokeLineCap,
      strokeDashArray: a.strokeDashArray,
      strokeDashOffset: parseFloat(a.strokeDashOffset),
      strokeOpacity: opacity(a.strokeOpacity, a.opacity),
      mixBlendMode: mixBlendMode(a.mixBlendMode),
      transform: transform(props.transform),
    };

    return definedKeysOf(shape);
  },

  async radialGradient(props: any, doc: PDFDocument, state: JSXParserState) {
    // this is here until implementation verified
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    const url = '#' + props.id;
    const radialGradient: RadialGradient = {
      type: 'radialGradient',
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
        if (typeof child === 'string') {
          return;
        }

        const tagName = child.type.toString() as keyof JSXParsers;
        if (tagName !== 'stop') {
          throw new JSXParserInvalidElementError(
            state,
            'Invalid child, ' + tagName,
          );
        }

        state.tagName = tagName;

        return await parsers[tagName](child.props, doc, state.copy());
      }),
    };

    state.defs[url] = definedKeysOf(radialGradient);

    return undefined;
  },

  rect(props: any, _: PDFDocument, state: JSXParserState) {
    const a = attributes(props, state.css, props.style);

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
      mask: mask(state, a.mask),
      filter: filter(state, a.filter),
      clipPath: clipPath(state, a.clipPath),
      clipRule: a.clipRule,
      fill: color(state, a.fill, {
        type: ColorTypes.RGB,
        red: 0,
        green: 0,
        blue: 0,
      } as RGB),
      fillRule: a.fillRule,
      fillOpacity: opacity(a.fillOpacity, a.opacity),
      stroke: color(state, a.stroke),
      strokeWidth: a.strokeWidth,
      strokeLineJoin: a.strokeLineJoin,
      strokeMiterLimit: parseFloat(a.strokeMiterLimit),
      strokeLineCap: a.strokeLineCap,
      strokeDashArray: a.strokeDashArray,
      strokeDashOffset: parseFloat(a.strokeDashOffset),
      strokeOpacity: opacity(a.strokeOpacity, a.opacity),
      mixBlendMode: mixBlendMode(a.mixBlendMode),
      transform: transform(props.transform),
    };

    return definedKeysOf(shape);
  },

  stop(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  async style(props: any, doc: PDFDocument, state: JSXParserState) {
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
          throw new JSXParsingError(
            state,
            '@font-face font-family not provided',
          );
        }

        if (!weight) {
          throw new JSXParsingError(
            state,
            '@font-face font-weight not provided',
          );
        }

        if (!src) {
          throw new JSXParsingError(state, '@font-face src not provided');
        }

        if (!style) {
          style = 'normal';
        }

        doc.registerFontkit(fontkit);
        if (state.fonts[family]) {
          if (state.fonts[family][weight]) {
            state.fonts[family][weight][style] = await doc.embedFont(src);
          } else {
            state.fonts[family][weight] = {
              [style]: await doc.embedFont(src),
            };
          }
        } else {
          state.fonts[family] = {
            [weight]: {
              [style]: await doc.embedFont(src),
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
    const a = attributes(props, state.css, props.style);

    const group: Group = {
      type: 'group',
      mask: mask(state, a.mask),
      filter: filter(state, a.filter),
      clipPath: clipPath(state, a.clipPath),
      clipRule: a.clipRule,
      fillOpacity: opacity(a.fillOpacity, a.opacity),
      strokeOpacity: opacity(a.strokeOpacity, a.opacity),
      mixBlendMode: mixBlendMode(a.mixBlendMode),
      transform: transform(props.transform),
      children: await children(props.children, async (child) => {
        if (typeof child === 'string') {
          return;
        }

        return await parseJsx(child, doc, state.copy());
      }),
    };

    return definedKeysOf(group);
  },

  symbol(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  async text(props: any, doc: PDFDocument, state: JSXParserState) {
    const a = attributes(props, state.css, props.style);

    state.update(a);

    if (!state.attributes.font && state.options.throwOnInvalidAttribute) {
      throw new JSXParserInvalidAttributeError(state, Invalid.font);
    }

    const text: Text = {
      type: 'text',
      font: state.attributes.font,
      fontSize: state.attributes.fontSize,
      segments: await children(props.children, async (child) => {
        if (typeof child === 'string') {
          return child;
        }

        const tagName = child.type.toString() as keyof JSXParsers;
        if (tagName !== 'tspan' && tagName !== 'textPath') {
          throw new JSXParserInvalidElementError(
            state,
            'Invalid child, ' + tagName,
          );
        }

        state.tagName = tagName;

        return await parsers[tagName](child.props, doc, state.copy());
      }),
      mask: mask(state, a.mask),
      filter: filter(state, a.filter),
      clipPath: clipPath(state, a.clipPath),
      clipRule: a.clipRule,
      fill: state.attributes.fill,
      fillRule: a.fillRule,
      fillOpacity: opacity(a.fillOpacity, a.opacity),
      stroke: color(state, a.stroke),
      strokeWidth: a.strokeWidth,
      strokeLineJoin: a.strokeLineJoin,
      strokeMiterLimit: parseFloat(a.strokeMiterLimit),
      strokeLineCap: a.strokeLineCap,
      strokeDashArray: a.strokeDashArray,
      strokeDashOffset: parseFloat(a.strokeDashOffset),
      strokeOpacity: opacity(a.strokeOpacity, a.opacity),
      mixBlendMode: mixBlendMode(a.mixBlendMode),
      transform: transform(props.transform),
    };

    return definedKeysOf(text);
  },

  async textPath(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  title(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
    }

    return undefined;
  },

  async tspan(props: any, doc: PDFDocument, state: JSXParserState) {
    const a = attributes(props, state.css, props.style);

    state.update(a);

    if (!state.attributes.font) {
      throw new JSXParserInvalidAttributeError(state, Invalid.font);
    }

    const text: Text = {
      type: 'text',
      font: state.attributes.font,
      fontSize: state.attributes.fontSize,
      segments: await children(props.children, async (child) => {
        if (typeof child === 'string') {
          return child;
        }

        const tagName = child.type.toString() as keyof JSXParsers;
        if (tagName !== 'tspan' && tagName !== 'textPath') {
          throw new JSXParserInvalidElementError(
            state,
            'Invalid child, ' + tagName,
          );
        }

        state.tagName = tagName;

        return await parsers[tagName](child.props, doc, state.copy());
      }),
      mask: mask(state, a.mask),
      filter: filter(state, a.filter),
      clipPath: clipPath(state, a.clipPath),
      clipRule: a.clipRule,
      fill: state.attributes.fill,
      fillRule: a.fillRule,
      fillOpacity: opacity(a.fillOpacity, a.opacity),
      stroke: color(state, a.stroke),
      strokeWidth: a.strokeWidth,
      strokeLineJoin: a.strokeLineJoin,
      strokeMiterLimit: parseFloat(a.strokeMiterLimit),
      strokeLineCap: a.strokeLineCap,
      strokeDashArray: a.strokeDashArray,
      strokeDashOffset: parseFloat(a.strokeDashOffset),
      strokeOpacity: opacity(a.strokeOpacity, a.opacity),
      mixBlendMode: mixBlendMode(a.mixBlendMode),
      transform: transform(props.transform),
    };

    return definedKeysOf(text);
  },

  async use(_: any, __: PDFDocument, state: JSXParserState) {
    if (state.options.throwOnInvalidElement) {
      throw new JSXParserInvalidElementError(
        state,
        'Parser for element not supported',
      );
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

export default async function parseJsx(
  element: JSX.Element,
  doc: PDFDocument,
  state: JSXParserState,
) {
  const tagName = element.type.toString() as keyof JSXParsers;
  if (typeof parsers[tagName] !== 'function') {
    throw new JSXParserInvalidElementError(
      state,
      'Parser for element not found',
    );
  }

  state.tagName = tagName;

  return await parsers[tagName](element.props, doc, state);
}
