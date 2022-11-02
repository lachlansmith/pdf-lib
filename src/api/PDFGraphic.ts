import React from 'react';
import ColorParser from 'color';

import { LineCapStyle, LineJoinStyle } from 'src/api/operators';
import { PDFImage, BlendMode } from 'src/api';
import PDFDocument from './PDFDocument';
import { Color, ColorTypes } from 'src/api/colors';
import { line, circle, ellipse, rect, path, shape } from 'src/api/shape';
import { transform } from 'src/api/transform';
import { PDFOperator } from 'src/core';

interface Iterator {
  [key: string]: any;
}

interface Base extends Iterator {
  transform?: PDFOperator[];
  clipPath?: PDFOperator[];
  clipRule?: 'nonzero' | 'evenodd';
  opacity?: number;
  strokeOpacity?: number;
  mixBlendMode?: BlendMode;
}

export interface Shape extends Base {
  type: 'shape';
  operators: PDFOperator[];
  fill?: Color;
  fillRule?: 'nonzero' | 'evenodd';
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
  value: string;
}

export interface Image extends Base {
  type: 'image';
  image: PDFImage;
  width: number;
  height: number;
}

export interface Group extends Base {
  type: 'group';
  fill?: Color;
  fillRule?: 'nonzero' | 'evenodd';
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
const removeUndefined = <T extends PDFGraphic>(obj: T): T => {
  Object.keys(obj).forEach((key) => obj[key] === undefined && delete obj[key]);
  return obj;
};

/**
 *
 * @param props
 * @param internalCss
 * @param inlineStyle
 * @returns
 */
const hierarchy = (props: any, internalCss: any, inlineStyle: any) => {
  // construct styles classes from listed class names
  let classes = {};
  if (props.className) {
    const names = props.className.split(' '); // multiple internal styles

    names.forEach((name: string) => {
      if (!(name in internalCss)) return;
      classes = { ...classes, ...internalCss[name] };
    });
  }

  return {
    clipPath: props.clipPath,
    clipRule: props.clipRule,
    fill: props.fill,
    fileRule: props.fileRule,
    stroke: props.stroke,
    strokeWidth: props.strokeWidth,
    strokeLineJoin: props.strokeLineJoin,
    strokeMiterLimit: props.strokeMiterLimit,
    strokeDashArray: props.strokeDashArray,
    strokeDashOffset: props.strokeDashOffset,
    strokeOpacity: props.strokeOpacity,
    opacity: props.opacity,
    ...classes,
    ...inlineStyle,
  };
};

/**
 * Convert color string to desired response type
 *
 * @param str
 * @param type // TODO: currently not used, will be used
 * @returns
 */
const color = (
  str?: string,
  type?: 'RGB' | 'CMYK' | 'Grayscale',
): Color | undefined => {
  if (!str) return;
  switch (type) {
    case 'CMYK':
      const { c, m, y, k } = ColorParser(str).cmyk().object();
      return {
        type: ColorTypes.CMYK,
        cyan: c / 255,
        magenta: m / 255,
        yellow: y / 255,
        key: k / 255,
      };

    case 'Grayscale':
      const { gr, gg, gb } = ColorParser(str).grayscale().rgb().object();
      return {
        type: ColorTypes.RGB,
        red: gr / 255,
        green: gg / 255,
        blue: gb / 255,
      };

    case 'RGB':
    default:
      const { r, g, b } = ColorParser(str).rgb().object();
      return {
        type: ColorTypes.RGB,
        red: r / 255,
        green: g / 255,
        blue: b / 255,
      };
  }
};

/**
 *
 * @param defs
 * @param clipString
 * @returns
 */
const clipPath = (
  defs: any,
  clipString?: string,
): PDFOperator[] | undefined => {
  if (!clipString) return;

  let clip: PDFOperator[] = [];
  const match = /url\((.*)\)/g.exec(clipString);
  if (match) {
    clip = defs[match[1]] as PDFOperator[];
  }

  return clip;
};

/**
 *
 * @param blendmode
 * @returns
 */
const mixBlendMode = (blendmode?: string): BlendMode | undefined => {
  if (!blendmode) return;
  const blendMode = camel(blendmode);
  return (blendMode.charAt(0).toUpperCase() + blendMode.slice(1)) as BlendMode;
};

export class PDFGraphicState {
  internalCSS: any;
  defs: any;

  constructor() {
    this.internalCSS = {};
    this.defs = {};
  }
}

/**
 * DO NOT DESTRUCTURE AND AVOID DECLARING NEW VARIABLES AS YOU'LL SLOW THINGS DOWN
 */
export const JSXParsers: {
  [type: string]: (
    props: any,
    doc: PDFDocument,
    state: PDFGraphicState,
  ) => Promise<PDFGraphic> | PDFGraphic | Promise<void> | void;
} = {
  /**
   *
   * @param props
   * @param doc
   * @param state
   * @returns
   */
  async svg(
    props: any,
    doc: PDFDocument,
    state: PDFGraphicState,
  ): Promise<Group> {
    const presentationAttributes = hierarchy(
      props,
      state.internalCSS,
      props.style ? props.style : {},
    );

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
      clipPath: clipPath(state.defs, presentationAttributes.clipPath),
      clipRule: presentationAttributes.clipRule,
      opacity: parseFloat(presentationAttributes.opacity),
      strokeOpacity: parseFloat(presentationAttributes.strokeOpacity),
      mixBlendMode: mixBlendMode(presentationAttributes.mixBlendMode),
      transform: transform(props.transform),
      children: children.filter(Boolean) as PDFGraphic[],
    } as Group);
  },

  /**
   *
   * @param props
   * @param doc
   * @param state
   * @returns
   */
  async g(
    props: any,
    doc: PDFDocument,
    state: PDFGraphicState,
  ): Promise<Group> {
    const presentationAttributes = hierarchy(
      props,
      state.internalCSS,
      props.style ? props.style : {},
    );

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
      clipPath: clipPath(state.defs, presentationAttributes.clipPath),
      clipRule: presentationAttributes.clipRule,
      fill:
        presentationAttributes.fill && presentationAttributes.fill !== 'none'
          ? color(presentationAttributes.fill)
          : undefined,
      fillRule: presentationAttributes.fillRule,
      stroke:
        presentationAttributes.stroke &&
        presentationAttributes.stroke !== 'none'
          ? color(presentationAttributes.stroke)
          : undefined,
      strokeWidth: presentationAttributes.strokeWidth,
      strokeLineJoin: presentationAttributes.strokeLineJoin,
      strokeMiterLimit: parseFloat(presentationAttributes.strokeMiterLimit),
      strokeDashArray: presentationAttributes.strokeDashArray,
      strokeDashOffset: presentationAttributes.strokeDashOffset,
      opacity: parseFloat(presentationAttributes.opacity),
      strokeOpacity: parseFloat(presentationAttributes.strokeOpacity),
      mixBlendMode: mixBlendMode(presentationAttributes.mixBlendMode),
      transform: transform(props.transform),
      children: children.filter(Boolean) as PDFGraphic[],
    } as Group);
  },

  ['Symbol(react.fragment)'](
    props: any,
    doc: PDFDocument,
    state: PDFGraphicState,
  ) {
    return this.g(props, doc, state); // SVG 2 spec treats all non SVG elements as g
  },

  /**
   *
   * @param props
   * @param _
   * @param state
   * @returns
   */
  path(props: any, _: PDFDocument, state: PDFGraphicState): Shape {
    const presentationAttributes = hierarchy(
      props,
      state.internalCSS,
      props.style ? props.style : {},
    );

    let fill: Color | undefined;
    if (presentationAttributes.fill) {
      if (presentationAttributes.fill !== 'none') {
        fill = color(presentationAttributes.fill);
      } else {
        fill = undefined;
      }
    } else {
      fill = { type: ColorTypes.RGB, red: 0, green: 0, blue: 0 };
    }

    return removeUndefined({
      type: 'shape',
      operators: path(props.d),
      clipPath: clipPath(state.defs, presentationAttributes.clipPath),
      clipRule: presentationAttributes.clipRule,
      fill,
      fillRule: presentationAttributes.fillRule,
      stroke:
        presentationAttributes.stroke &&
        presentationAttributes.stroke !== 'none'
          ? color(presentationAttributes.stroke)
          : undefined,
      strokeWidth: presentationAttributes.strokeWidth,
      strokeLineJoin: presentationAttributes.strokeLineJoin,
      strokeMiterLimit: parseFloat(presentationAttributes.strokeMiterLimit),
      strokeDashArray: presentationAttributes.strokeDashArray,
      strokeDashOffset: presentationAttributes.strokeDashOffset,
      opacity: parseFloat(presentationAttributes.opacity),
      strokeOpacity: parseFloat(presentationAttributes.strokeOpacity),
      mixBlendMode: mixBlendMode(presentationAttributes.mixBlendMode),
      transform: transform(props.transform),
    } as Shape);
  },

  /**
   *
   * @param props
   * @param _
   * @param state
   * @returns
   */
  polyline(props: any, _: PDFDocument, state: PDFGraphicState): Shape {
    const presentationAttributes = hierarchy(
      props,
      state.internalCSS,
      props.style ? props.style : {},
    );

    return removeUndefined({
      type: 'shape',
      operators: path('M' + props.points),
      clipPath: clipPath(state.defs, presentationAttributes.clipPath),
      clipRule: presentationAttributes.clipRule,
      stroke:
        presentationAttributes.stroke &&
        presentationAttributes.stroke !== 'none'
          ? color(presentationAttributes.stroke)
          : undefined,
      strokeWidth: presentationAttributes.strokeWidth,
      strokeLineJoin: presentationAttributes.strokeLineJoin,
      strokeMiterLimit: parseFloat(presentationAttributes.strokeMiterLimit),
      strokeDashArray: presentationAttributes.strokeDashArray,
      strokeDashOffset: presentationAttributes.strokeDashOffset,
      opacity: parseFloat(presentationAttributes.opacity),
      strokeOpacity: parseFloat(presentationAttributes.strokeOpacity),
      mixBlendMode: mixBlendMode(presentationAttributes.mixBlendMode),
      transform: transform(props.transform),
    } as Shape);
  },

  /**
   *
   * @param props
   * @param _
   * @param state
   * @returns
   */
  polygon(props: any, _: PDFDocument, state: PDFGraphicState): Shape {
    const presentationAttributes = hierarchy(
      props,
      state.internalCSS,
      props.style ? props.style : {},
    );

    let fill: Color | undefined;
    if (presentationAttributes.fill) {
      if (presentationAttributes.fill !== 'none') {
        fill = color(presentationAttributes.fill);
      } else {
        fill = undefined;
      }
    } else {
      fill = { type: ColorTypes.RGB, red: 0, green: 0, blue: 0 };
    }

    return removeUndefined({
      type: 'shape',
      operators: path('M' + props.points + 'z'),
      clipPath: clipPath(state.defs, presentationAttributes.clipPath),
      clipRule: presentationAttributes.clipRule,
      fill,
      fillRule: presentationAttributes.fillRule,
      stroke:
        presentationAttributes.stroke &&
        presentationAttributes.stroke !== 'none'
          ? color(presentationAttributes.stroke)
          : undefined,
      strokeWidth: presentationAttributes.strokeWidth,
      strokeLineJoin: presentationAttributes.strokeLineJoin,
      strokeMiterLimit: parseFloat(presentationAttributes.strokeMiterLimit),
      strokeDashArray: presentationAttributes.strokeDashArray,
      strokeDashOffset: presentationAttributes.strokeDashOffset,
      opacity: parseFloat(presentationAttributes.opacity),
      strokeOpacity: parseFloat(presentationAttributes.strokeOpacity),
      mixBlendMode: mixBlendMode(presentationAttributes.mixBlendMode),
      transform: transform(props.transform),
    } as Shape);
  },

  /**
   *
   * @param props
   * @param _
   * @param state
   * @returns
   */
  circle(props: any, _: PDFDocument, state: PDFGraphicState): Shape {
    const presentationAttributes = hierarchy(
      props,
      state.internalCSS,
      props.style ? props.style : {},
    );

    let fill: Color | undefined;
    if (presentationAttributes.fill) {
      if (presentationAttributes.fill !== 'none') {
        fill = color(presentationAttributes.fill);
      } else {
        fill = undefined;
      }
    } else {
      fill = { type: ColorTypes.RGB, red: 0, green: 0, blue: 0 };
    }

    return removeUndefined({
      type: 'shape',
      operators: circle(
        parseFloat(props.cx),
        parseFloat(props.cy),
        parseFloat(props.r),
      ),
      clipPath: clipPath(state.defs, presentationAttributes.clipPath),
      clipRule: presentationAttributes.clipRule,
      fill,
      fillRule: presentationAttributes.fillRule,
      stroke:
        presentationAttributes.stroke &&
        presentationAttributes.stroke !== 'none'
          ? color(presentationAttributes.stroke)
          : undefined,
      strokeWidth: presentationAttributes.strokeWidth,
      strokeLineJoin: presentationAttributes.strokeLineJoin,
      strokeMiterLimit: parseFloat(presentationAttributes.strokeMiterLimit),
      strokeDashArray: presentationAttributes.strokeDashArray,
      strokeDashOffset: presentationAttributes.strokeDashOffset,
      opacity: parseFloat(presentationAttributes.opacity),
      strokeOpacity: parseFloat(presentationAttributes.strokeOpacity),
      mixBlendMode: mixBlendMode(presentationAttributes.mixBlendMode),
      transform: transform(props.transform),
    } as Shape);
  },

  /**
   *
   * @param props
   * @param _
   * @param state
   * @returns
   */
  ellipse(props: any, _: PDFDocument, state: PDFGraphicState): Shape {
    const presentationAttributes = hierarchy(
      props,
      state.internalCSS,
      props.style ? props.style : {},
    );

    let fill: Color | undefined;
    if (presentationAttributes.fill) {
      if (presentationAttributes.fill !== 'none') {
        fill = color(presentationAttributes.fill);
      } else {
        fill = undefined;
      }
    } else {
      fill = { type: ColorTypes.RGB, red: 0, green: 0, blue: 0 };
    }

    return removeUndefined({
      type: 'shape',
      operators: ellipse(
        parseFloat(props.cx),
        parseFloat(props.cy),
        parseFloat(props.rx),
        parseFloat(props.ry),
      ),
      clipPath: clipPath(state.defs, presentationAttributes.clipPath),
      clipRule: presentationAttributes.clipRule,
      fill,
      fillRule: presentationAttributes.fillRule,
      stroke:
        presentationAttributes.stroke &&
        presentationAttributes.stroke !== 'none'
          ? color(presentationAttributes.stroke)
          : undefined,
      strokeWidth: presentationAttributes.strokeWidth,
      strokeLineJoin: presentationAttributes.strokeLineJoin,
      strokeMiterLimit: parseFloat(presentationAttributes.strokeMiterLimit),
      strokeDashArray: presentationAttributes.strokeDashArray,
      strokeDashOffset: presentationAttributes.strokeDashOffset,
      opacity: parseFloat(presentationAttributes.opacity),
      strokeOpacity: parseFloat(presentationAttributes.strokeOpacity),
      mixBlendMode: mixBlendMode(presentationAttributes.mixBlendMode),
      transform: transform(props.transform),
    } as Shape);
  },

  /**
   *
   * @param props
   * @param _
   * @param state
   * @returns
   */
  rect(props: any, _: PDFDocument, state: PDFGraphicState): Shape {
    const presentationAttributes = hierarchy(
      props,
      state.internalCSS,
      props.style ? props.style : {},
    );

    let fill: Color | undefined;
    if (presentationAttributes.fill) {
      if (presentationAttributes.fill !== 'none') {
        fill = color(presentationAttributes.fill);
      } else {
        fill = undefined;
      }
    } else {
      fill = { type: ColorTypes.RGB, red: 0, green: 0, blue: 0 };
    }

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
      clipPath: clipPath(state.defs, presentationAttributes.clipPath),
      clipRule: presentationAttributes.clipRule,
      fill,
      fillRule: presentationAttributes.fillRule,
      stroke:
        presentationAttributes.stroke &&
        presentationAttributes.stroke !== 'none'
          ? color(presentationAttributes.stroke)
          : undefined,
      strokeWidth: presentationAttributes.strokeWidth,
      strokeLineJoin: presentationAttributes.strokeLineJoin,
      strokeMiterLimit: parseFloat(presentationAttributes.strokeMiterLimit),
      strokeDashArray: presentationAttributes.strokeDashArray,
      strokeDashOffset: presentationAttributes.strokeDashOffset,
      opacity: parseFloat(presentationAttributes.opacity),
      strokeOpacity: parseFloat(presentationAttributes.strokeOpacity),
      mixBlendMode: mixBlendMode(presentationAttributes.mixBlendMode),
      transform: transform(props.transform),
    } as Shape);
  },

  /**
   *
   * @param props
   * @param _
   * @param state
   * @returns
   */
  line(props: any, _: PDFDocument, state: PDFGraphicState): Shape {
    const presentationAttributes = hierarchy(
      props,
      state.internalCSS,
      props.style ? props.style : {},
    );

    return removeUndefined({
      type: 'shape',
      operators: line(
        parseFloat(props.x1),
        parseFloat(props.y1),
        parseFloat(props.x2),
        parseFloat(props.y2),
      ),
      clipPath: clipPath(state.defs, presentationAttributes.clipPath),
      clipRule: presentationAttributes.clipRule,
      stroke:
        presentationAttributes.stroke &&
        presentationAttributes.stroke !== 'none'
          ? color(presentationAttributes.stroke)
          : undefined,
      strokeWidth: presentationAttributes.strokeWidth,
      strokeLineJoin: presentationAttributes.strokeLineJoin,
      strokeMiterLimit: parseFloat(presentationAttributes.strokeMiterLimit),
      strokeDashArray: presentationAttributes.strokeDashArray,
      strokeDashOffset: presentationAttributes.strokeDashOffset,
      opacity: parseFloat(presentationAttributes.opacity),
      strokeOpacity: parseFloat(presentationAttributes.strokeOpacity),
      mixBlendMode: mixBlendMode(presentationAttributes.mixBlendMode),
      transform: transform(props.transform),
    } as Shape);
  },

  /**
   *
   * @param props
   * @param doc
   * @param state
   */
  defs(props: any, doc: PDFDocument, state: PDFGraphicState): void {
    const children = React.Children.toArray(props.children);
    children.forEach((child: any) => {
      try {
        this[child.type](child.props, doc, state);
      } catch (err) {
        throw new Error('Unsupported or not yet supported tag, ' + child.type);
      }
    });
  },

  /**
   *
   * @param props
   * @param _
   * @param state
   */
  style(props: any, _: PDFDocument, state: PDFGraphicState): void {
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

  /**
   *
   * @param props
   * @param doc
   * @param state
   * @returns
   */
  async image(
    props: any,
    doc: PDFDocument,
    state: PDFGraphicState,
  ): Promise<Image> {
    const presentationAttributes = hierarchy(
      props,
      state.internalCSS,
      props.style,
    );

    if (props['xlink:href']) {
      props.href = props['xlink:href']; // shouldn't be using this anyway so should be okay with performance hit
    }

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
          clipPath: clipPath(state.defs, presentationAttributes.clipPath),
          clipRule: presentationAttributes.clipRule,
          opacity: parseFloat(presentationAttributes.opacity),
          mixBlendMode: mixBlendMode(presentationAttributes.mixBlendMode),
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
          clipPath: clipPath(state.defs, presentationAttributes.clipPath),
          clipRule: presentationAttributes.clipRule,
          opacity: parseFloat(presentationAttributes.opacity),
          mixBlendMode: mixBlendMode(presentationAttributes.mixBlendMode),
          transform: transform(props.transform),
        } as Image);

      // TODO: Image svg support may be added if a means (to pass a data uri to a string and then) to pass valid jsx is added to dependencies

      // This is not something willing to do at this time, but it would look like below

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

    state.defs['#' + props.id] = shape({
      type: 'group',
      children: children.filter(Boolean) as PDFGraphic[],
    });
  },

  text(props: any, _: PDFDocument, state: PDFGraphicState): Text {
    const presentationAttributes = hierarchy(
      props,
      state.internalCSS,
      props.style,
    );

    console.log(presentationAttributes);
    // let children = React.Children.toArray(props.children);
    return removeUndefined({ type: 'text', value: '' } as Text);
  },

  tspan(props: any, _: PDFDocument, __: PDFGraphicState) {
    // const presentationAttributes = hierarchy(
    //   props,
    //   state.internalCSS,
    //   props.style,
    // );
    if (props) return;
  },
};
