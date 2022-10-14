import { LineCapStyle } from 'src/api/operators';
import { PDFImage, BlendMode } from 'src/api';
import React from 'react';
import PDFDocument from './PDFDocument';
import { Color, ColorTypes } from 'src/api/colors';
import { line, circle, ellipse, rect, path, shape } from 'src/api/shape';
import { transform } from 'src/api/transform';
import { PDFOperator } from 'src/core';

import ColorParser from 'color';

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
  strokeDashArray?: number[];
  strokeDashOffset?: number;
  strokeLineCap?: LineCapStyle;
  children: PDFGraphic[];
}

type PDFGraphic = Shape | Text | Image | Group;

export default PDFGraphic;

const camel = (string: string) =>
  string.replace(/-([a-z])/g, (g) => {
    return g[1].toUpperCase();
  });

const removeUndefined = <T extends PDFGraphic>(obj: T): T => {
  Object.keys(obj).forEach((key) => obj[key] === undefined && delete obj[key]);
  return obj;
};

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

  // construct the presentation attributes based on style hierarchy
  const presentationAttributes = {
    ...{
      clipPath: props.clipPath,
      clipRule: props.clipRule,
      fill: props.fill,
      fileRule: props.fileRule,
      stroke: props.stroke,
      strokeWidth: props.strokeWidth,
      strokeDashArray: props.strokeDashArray,
      strokeDashOffset: props.strokeDashOffset,
      strokeOpacity: props.strokeOpacity,
      opacity: props.opacity,
    },
    ...classes,
    ...inlineStyle,
  };

  return presentationAttributes;
};

const color = (string?: string, type?: 'RGB' | 'CMYK'): Color | undefined => {
  if (!string) return;
  switch (type) {
    case 'CMYK':
      const { c, m, y, k } = ColorParser(string).cmyk().object();
      return {
        type: ColorTypes.CMYK,
        cyan: c / 255,
        magenta: m / 255,
        yellow: y / 255,
        key: k / 255,
      };

    case 'RGB':
    default:
      const { r, g, b } = ColorParser(string).rgb().object();
      return {
        type: ColorTypes.RGB,
        red: r / 255,
        green: g / 255,
        blue: b / 255,
      };
  }
};

const clipPath = (defs: any, clipPath?: string): PDFOperator[] | undefined => {
  if (!clipPath) return;

  let clip: PDFOperator[] = [];
  const match = /url\((.*)\)/g.exec(clipPath);
  if (match) {
    clip = defs[match[1]] as PDFOperator[];
  }

  return clip;
};

const mixBlendMode = (mixBlendMode?: string): BlendMode | undefined => {
  if (!mixBlendMode) return;
  const blendMode = camel(mixBlendMode);
  return (blendMode.charAt(0).toUpperCase() + blendMode.slice(1)) as BlendMode;
};

export class PDFGraphicState {
  public internalCSS: any;
  public defs: any;

  constructor() {
    this.internalCSS = {};
    this.defs = {};
  }
}

export const JSXParsers: {
  [type: string]:
    | any
    | ((props: any, doc: PDFDocument, state: PDFGraphicState) => PDFGraphic);
} = {
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

    let children: (PDFGraphic | undefined)[] = [];
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
        children.push(await this[tagName](child.props, doc, state));
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

    let children: (PDFGraphic | undefined)[] = [];
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
        children.push(await this[tagName](child.props, doc, state));
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
    return this['g'](props, doc, state); // SVG 2 spec treats all non SVG elements as g
  },

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
      fill: fill,
      fillRule: presentationAttributes.fillRule,
      stroke:
        presentationAttributes.stroke &&
        presentationAttributes.stroke !== 'none'
          ? color(presentationAttributes.stroke)
          : undefined,
      strokeWidth: presentationAttributes.strokeWidth,
      strokeDashArray: presentationAttributes.strokeDashArray,
      strokeDashOffset: presentationAttributes.strokeDashOffset,
      opacity: parseFloat(presentationAttributes.opacity),
      strokeOpacity: parseFloat(presentationAttributes.strokeOpacity),
      mixBlendMode: mixBlendMode(presentationAttributes.mixBlendMode),
      transform: transform(props.transform),
    } as Shape);
  },

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
      strokeDashArray: presentationAttributes.strokeDashArray,
      strokeDashOffset: presentationAttributes.strokeDashOffset,
      opacity: parseFloat(presentationAttributes.opacity),
      strokeOpacity: parseFloat(presentationAttributes.strokeOpacity),
      mixBlendMode: mixBlendMode(presentationAttributes.mixBlendMode),
      transform: transform(props.transform),
    } as Shape);
  },

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
      fill: fill,
      fillRule: presentationAttributes.fillRule,
      stroke:
        presentationAttributes.stroke &&
        presentationAttributes.stroke !== 'none'
          ? color(presentationAttributes.stroke)
          : undefined,
      strokeWidth: presentationAttributes.strokeWidth,
      strokeDashArray: presentationAttributes.strokeDashArray,
      strokeDashOffset: presentationAttributes.strokeDashOffset,
      opacity: parseFloat(presentationAttributes.opacity),
      strokeOpacity: parseFloat(presentationAttributes.strokeOpacity),
      mixBlendMode: mixBlendMode(presentationAttributes.mixBlendMode),
      transform: transform(props.transform),
    } as Shape);
  },

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
      fill: fill,
      fillRule: presentationAttributes.fillRule,
      stroke:
        presentationAttributes.stroke &&
        presentationAttributes.stroke !== 'none'
          ? color(presentationAttributes.stroke)
          : undefined,
      strokeWidth: presentationAttributes.strokeWidth,
      strokeDashArray: presentationAttributes.strokeDashArray,
      strokeDashOffset: presentationAttributes.strokeDashOffset,
      opacity: parseFloat(presentationAttributes.opacity),
      strokeOpacity: parseFloat(presentationAttributes.strokeOpacity),
      mixBlendMode: mixBlendMode(presentationAttributes.mixBlendMode),
      transform: transform(props.transform),
    } as Shape);
  },

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
      fill: fill,
      fillRule: presentationAttributes.fillRule,
      stroke:
        presentationAttributes.stroke &&
        presentationAttributes.stroke !== 'none'
          ? color(presentationAttributes.stroke)
          : undefined,
      strokeWidth: presentationAttributes.strokeWidth,
      strokeDashArray: presentationAttributes.strokeDashArray,
      strokeDashOffset: presentationAttributes.strokeDashOffset,
      opacity: parseFloat(presentationAttributes.opacity),
      strokeOpacity: parseFloat(presentationAttributes.strokeOpacity),
      mixBlendMode: mixBlendMode(presentationAttributes.mixBlendMode),
      transform: transform(props.transform),
    } as Shape);
  },

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
      fill: fill,
      fillRule: presentationAttributes.fillRule,
      stroke:
        presentationAttributes.stroke &&
        presentationAttributes.stroke !== 'none'
          ? color(presentationAttributes.stroke)
          : undefined,
      strokeWidth: presentationAttributes.strokeWidth,
      strokeDashArray: presentationAttributes.strokeDashArray,
      strokeDashOffset: presentationAttributes.strokeDashOffset,
      opacity: parseFloat(presentationAttributes.opacity),
      strokeOpacity: parseFloat(presentationAttributes.strokeOpacity),
      mixBlendMode: mixBlendMode(presentationAttributes.mixBlendMode),
      transform: transform(props.transform),
    } as Shape);
  },

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
      strokeDashArray: presentationAttributes.strokeDashArray,
      strokeDashOffset: presentationAttributes.strokeDashOffset,
      opacity: parseFloat(presentationAttributes.opacity),
      strokeOpacity: parseFloat(presentationAttributes.strokeOpacity),
      mixBlendMode: mixBlendMode(presentationAttributes.mixBlendMode),
      transform: transform(props.transform),
    } as Shape);
  },

  defs(props: any, doc: PDFDocument, state: PDFGraphicState): void {
    let children = React.Children.toArray(props.children);
    children.forEach(({ type, props }: any) => {
      try {
        this[type](props, doc, state);
      } catch (err) {
        throw new Error('Unsupported or not yet supported tag, ' + type);
      }
    });
  },

  style(props: any, _: PDFDocument, state: PDFGraphicState): void {
    const innerHTML = props.dangerouslySetInnerHTML.__html;
    let regCls = /.(.*?){(.*?)}/g,
      cls;
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

      //   case 'image/svg+xml':
      //     const jsx = HtmlReactParser(
      //       Buffer.from(props.href.split(';base64,')[1], 'base64').toString(), // base64 encoding to svg string
      //       {
      //         htmlparser2: {
      //           lowerCaseTags: false,
      //         },
      //       },
      //     );

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
    let children: (PDFGraphic | undefined)[] = [];
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
        children.push(await this[tagName](child.props, doc, state));
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
