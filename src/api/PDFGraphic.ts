import { PDFImage, BlendMode } from 'src/api';
import { LineCapStyle } from 'src/api/operators';
import React from 'react';
import PDFDocument from './PDFDocument';
import { Color, ColorTypes, RGB, CMYK } from 'src/api/colors';

import ColorParser from 'color';
const UnitParser = require('units-css');

interface Base {
  transform?: [string, ...number[]][];
  clipPath?: PDFClip;
  clipRule?: 'nonzero' | 'evenodd';
  opacity?: number;
  strokeOpacity?: number;
  mixBlendMode?: BlendMode;
}

interface Shape extends Base {
  fill?: Color;
  fillRule?: 'nonzero' | 'evenodd';
  stroke?: Color;
  strokeWidth?: number;
  strokeDashArray?: number[];
  strokeDashOffset?: number;
  strokeLineCap?: LineCapStyle;
}

export interface Path extends Shape {
  type: 'path';
  d: string;
}

export interface Polyline extends Shape {
  type: 'polyline';
  points: string;
}

export interface Polygon extends Shape {
  type: 'polygon';
  points: string;
}

export interface Path extends Shape {
  type: 'path';
  d: string;
}

export interface Rect extends Shape {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
  ry?: number;
}

export interface Line extends Shape {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Circle extends Shape {
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
}

export interface Ellipse extends Shape {
  type: 'ellipse';
  cx: number;
  cy: number;
  rx: number;
  ry: number;
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
  children: PDFGraphic[];
}

type PDFClip =
  | Path
  | Polygon
  | Rect
  | Ellipse
  | Circle
  | {
      type: 'group';
      children: PDFClip[];
    };

type PDFGraphic =
  | Path
  | Polyline
  | Polygon
  | Rect
  | Line
  | Ellipse
  | Circle
  | Text
  | Image
  | Group;

export default PDFGraphic;

export interface Embed {
  key: string;
  url: string;
}

export interface Stow {
  [name: string]: any;
}

const removeUndefined = (obj: any) => {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  });

  return obj;
};

const camel = (string: string) =>
  string.replace(/-([a-z])/g, (g) => {
    return g[1].toUpperCase();
  });

const parseColor = (
  string?: string,
  type?: 'RGB' | 'CMYK',
): RGB | CMYK | undefined => {
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

const parseUnit = (string: string): number => {
  return UnitParser.parse(string).value;
};

const parseTransform = (
  string?: string,
): [string, ...number[]][] | undefined => {
  if (!string) return;

  string = string.split(' ').join(',');

  let transforms: [string, ...number[]][] = [];
  let regex = /((.*?)\((.*?)\))/g,
    match;
  while ((match = regex.exec(string))) {
    const type = match[2].split(',').join('');
    const args = match[3].split(',').map((arg) => parseUnit(arg));

    transforms.push([type, ...args]);
  }

  return transforms as [string, ...number[]][];
};

const hierarchy = (
  {
    clipPath,
    clipRule,
    fillRule,
    fill,
    stroke,
    strokeWidth,
    strokeDashArray,
    strokeDashOffset,
    className,
  }: any,
  internalCSS: any,
  style: any,
) => {
  let css = {};
  if (className) {
    const names = className.split(' ');

    names.forEach((name: string) => {
      if (!(name in internalCSS)) return;
      css = { ...css, ...internalCSS[name] };
    });
  }

  return {
    clipPath,
    clipRule,
    fill,
    fillRule,
    stroke,
    strokeWidth,
    strokeDashArray,
    strokeDashOffset,
    ...css,
    ...style,
  };
};

export const JSXParsers: {
  [type: string]: any | ((props: any, doc: PDFDocument) => PDFGraphic);
} = {
  internalCSS: {},
  definitions: {},

  async svg(props: any, doc: PDFDocument) {
    const attr = hierarchy(props, this.internalCSS, props.style);

    let { clipPath, mixBlendMode } = attr;

    if (clipPath) {
      const match = /url\((.*)\)/g.exec(clipPath);
      if (match) {
        clipPath = this.definitions[match[1]];
      }
    }

    if (mixBlendMode) {
      mixBlendMode = camel(mixBlendMode);
      mixBlendMode =
        mixBlendMode.charAt(0).toUpperCase() + mixBlendMode.slice(1);
    }

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
        children.push(await this[tagName](child.props, doc));
      }
    }

    return removeUndefined({
      type: 'group',
      clipPath: clipPath,
      clipRule: attr.clipRule,
      opacity: attr.opacity,
      strokeOpacity: attr.strokeOpacity,
      mixBlendMode: mixBlendMode,
      transform: parseTransform(props.transform),
      children: children.filter(Boolean) as PDFGraphic[],
    });
  },

  async g(props: any, doc: PDFDocument) {
    const attr = hierarchy(props, this.internalCSS, props.style);

    let { clipPath, mixBlendMode } = attr;

    if (clipPath) {
      const match = /url\((.*)\)/g.exec(clipPath);
      if (match) {
        clipPath = this.definitions[match[1]];
      }
    }

    if (mixBlendMode) {
      mixBlendMode = camel(mixBlendMode);
      mixBlendMode =
        mixBlendMode.charAt(0).toUpperCase() + mixBlendMode.slice(1);
    }

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
        children.push(await this[tagName](child.props, doc));
      }
    }

    return removeUndefined({
      type: 'group',
      clipPath: clipPath,
      clipRule: attr.clipRule,
      fill:
        attr.fill && attr.fill !== 'none' ? parseColor(attr.fill) : undefined,
      fillRule: attr.fillRule,
      stroke:
        attr.stroke && attr.stroke !== 'none'
          ? parseColor(attr.stroke)
          : undefined,
      strokeWidth: attr.strokeWidth,
      strokeDashArray: attr.strokeDashArray,
      strokeDashOffset: attr.strokeDashOffset,
      opacity: attr.opacity,
      strokeOpacity: attr.strokeOpacity,
      mixBlendMode: mixBlendMode,
      transform: parseTransform(props.transform),
      children: children.filter(Boolean) as PDFGraphic[],
    });
  },

  ['Symbol(react.fragment)'](props: any, doc: PDFDocument) {
    return this['g'](props.children.props, doc);
  },

  path(props: any, _: PDFDocument): Path {
    const attr = hierarchy(props, this.internalCSS, props.style);

    let { clipPath, fill, mixBlendMode } = attr;

    if (clipPath) {
      const match = /url\((.*)\)/g.exec(clipPath);
      if (match) {
        clipPath = this.definitions[match[1]];
      }
    }

    if (fill) {
      if (fill !== 'none') {
        fill = parseColor(fill);
      } else {
        fill = undefined;
      }
    } else {
      fill = { type: ColorTypes.RGB, red: 0, green: 0, blue: 0 };
    }

    if (mixBlendMode) {
      mixBlendMode = camel(mixBlendMode);
      mixBlendMode =
        mixBlendMode.charAt(0).toUpperCase() + mixBlendMode.slice(1);
    }

    return removeUndefined({
      type: 'path',
      d: props.d,
      clipPath: clipPath,
      clipRule: attr.clipRule,
      fill: fill,
      fillRule: attr.fillRule,
      stroke:
        attr.stroke && attr.stroke !== 'none'
          ? parseColor(attr.stroke)
          : undefined,
      strokeWidth: attr.strokeWidth,
      strokeDashArray: attr.strokeDashArray,
      strokeDashOffset: attr.strokeDashOffset,
      opacity: attr.opacity,
      strokeOpacity: attr.strokeOpacity,
      mixBlendMode: mixBlendMode,
      transform: parseTransform(props.transform),
    });
  },

  polyline(props: any, _: PDFDocument): Path {
    const attr = hierarchy(props, this.internalCSS, props.style);

    let { clipPath, mixBlendMode } = attr;

    if (clipPath) {
      const match = /url\((.*)\)/g.exec(clipPath);
      if (match) {
        clipPath = this.definitions[match[1]];
      }
    }

    if (mixBlendMode) {
      mixBlendMode = camel(mixBlendMode);
      mixBlendMode =
        mixBlendMode.charAt(0).toUpperCase() + mixBlendMode.slice(1);
    }

    return removeUndefined({
      type: 'path',
      d: 'M' + props.points,
      clipPath: clipPath,
      clipRule: attr.clipRule,
      stroke:
        attr.stroke && attr.stroke !== 'none'
          ? parseColor(attr.stroke)
          : undefined,
      strokeWidth: attr.strokeWidth,
      strokeDashArray: attr.strokeDashArray,
      strokeDashOffset: attr.strokeDashOffset,
      opacity: attr.opacity,
      strokeOpacity: attr.strokeOpacity,
      mixBlendMode: mixBlendMode,
      transform: parseTransform(props.transform),
    });
  },

  polygon(props: any, _: PDFDocument): Path {
    const attr = hierarchy(props, this.internalCSS, props.style);

    let { clipPath, fill, mixBlendMode } = attr;

    if (clipPath) {
      const match = /url\((.*)\)/g.exec(clipPath);
      if (match) {
        clipPath = this.definitions[match[1]];
      }
    }

    if (fill) {
      if (fill !== 'none') {
        fill = parseColor(fill);
      } else {
        fill = undefined;
      }
    } else {
      fill = { type: ColorTypes.RGB, red: 0, green: 0, blue: 0 };
    }

    if (mixBlendMode) {
      mixBlendMode = camel(mixBlendMode);
      mixBlendMode =
        mixBlendMode.charAt(0).toUpperCase() + mixBlendMode.slice(1);
    }

    return removeUndefined({
      type: 'path',
      d: 'M' + props.points + 'z',
      clipPath: clipPath,
      clipRule: attr.clipRule,
      fill: fill,
      fillRule: attr.fillRule,
      stroke:
        attr.stroke && attr.stroke !== 'none'
          ? parseColor(attr.stroke)
          : undefined,
      strokeWidth: attr.strokeWidth,
      strokeDashArray: attr.strokeDashArray,
      strokeDashOffset: attr.strokeDashOffset,
      opacity: attr.opacity,
      strokeOpacity: attr.strokeOpacity,
      mixBlendMode: mixBlendMode,
      transform: parseTransform(props.transform),
    });
  },

  circle(props: any, _: PDFDocument): Ellipse {
    const attr = hierarchy(props, this.internalCSS, props.style);
    let { clipPath, fill, mixBlendMode } = attr;

    if (clipPath) {
      const match = /url\((.*)\)/g.exec(clipPath);
      if (match) {
        clipPath = this.definitions[match[1]];
      }
    }

    if (fill) {
      if (fill !== 'none') {
        fill = parseColor(fill);
      } else {
        fill = undefined;
      }
    } else {
      fill = { type: ColorTypes.RGB, red: 0, green: 0, blue: 0 };
    }

    if (mixBlendMode) {
      mixBlendMode = camel(mixBlendMode);
      mixBlendMode =
        mixBlendMode.charAt(0).toUpperCase() + mixBlendMode.slice(1);
    }

    return removeUndefined({
      type: 'ellipse',
      cx: parseFloat(props.cx),
      cy: parseFloat(props.cy),
      rx: parseFloat(props.r),
      ry: parseFloat(props.r),
      clipPath: clipPath,
      clipRule: attr.clipRule,
      fill: fill,
      fillRule: attr.fillRule,
      stroke:
        attr.stroke && attr.stroke !== 'none'
          ? parseColor(attr.stroke)
          : undefined,
      strokeWidth: attr.strokeWidth,
      strokeDashArray: attr.strokeDashArray,
      strokeDashOffset: attr.strokeDashOffset,
      opacity: attr.opacity,
      strokeOpacity: attr.strokeOpacity,
      mixBlendMode: mixBlendMode,
      transform: parseTransform(props.transform),
    });
  },

  ellipse(props: any, _: PDFDocument): Ellipse {
    const attr = hierarchy(props, this.internalCSS, props.style);

    let { clipPath, fill, mixBlendMode } = attr;

    if (clipPath) {
      const match = /url\((.*)\)/g.exec(clipPath);
      if (match) {
        clipPath = this.definitions[match[1]];
      }
    }

    if (fill) {
      if (fill !== 'none') {
        fill = parseColor(fill);
      } else {
        fill = undefined;
      }
    } else {
      fill = { type: ColorTypes.RGB, red: 0, green: 0, blue: 0 };
    }

    if (mixBlendMode) {
      mixBlendMode = camel(mixBlendMode);
      mixBlendMode =
        mixBlendMode.charAt(0).toUpperCase() + mixBlendMode.slice(1);
    }

    return removeUndefined({
      type: 'ellipse',
      cx: parseFloat(props.cx),
      cy: parseFloat(props.cy),
      rx: parseFloat(props.rx),
      ry: parseFloat(props.ry),
      clipPath: clipPath,
      clipRule: attr.clipRule,
      fill: fill,
      fillRule: attr.fillRule,
      stroke:
        attr.stroke && attr.stroke !== 'none'
          ? parseColor(attr.stroke)
          : undefined,
      strokeWidth: attr.strokeWidth,
      strokeDashArray: attr.strokeDashArray,
      strokeDashOffset: attr.strokeDashOffset,
      opacity: attr.opacity,
      strokeOpacity: attr.strokeOpacity,
      mixBlendMode: mixBlendMode,
      transform: parseTransform(props.transform),
    });
  },

  rect(props: any, _: PDFDocument): Rect {
    const attr = hierarchy(props, this.internalCSS, props.style);

    let { clipPath, fill, mixBlendMode } = attr;

    if (clipPath) {
      const match = /url\((.*)\)/g.exec(clipPath);
      if (match) {
        clipPath = this.definitions[match[1]];
      }
    }

    if (fill) {
      if (fill !== 'none') {
        fill = parseColor(fill);
      } else {
        fill = undefined;
      }
    } else {
      fill = { type: ColorTypes.RGB, red: 0, green: 0, blue: 0 };
    }

    if (mixBlendMode) {
      mixBlendMode = camel(mixBlendMode);
      mixBlendMode =
        mixBlendMode.charAt(0).toUpperCase() + mixBlendMode.slice(1);
    }

    return removeUndefined({
      type: 'rect',
      x: parseFloat(props.x),
      y: parseFloat(props.y),
      width: parseFloat(props.width),
      height: parseFloat(props.height),
      rx: props.rx ? parseFloat(props.rx) : undefined,
      ry: props.ry ? parseFloat(props.ry) : undefined,
      clipPath: clipPath,
      clipRule: attr.clipRule,
      fill: fill,
      fillRule: attr.fillRule,
      stroke:
        attr.stroke && attr.stroke !== 'none'
          ? parseColor(attr.stroke)
          : undefined,
      strokeWidth: attr.strokeWidth,
      strokeDashArray: attr.strokeDashArray,
      strokeDashOffset: attr.strokeDashOffset,
      opacity: attr.opacity,
      strokeOpacity: attr.strokeOpacity,
      mixBlendMode: mixBlendMode,
      transform: parseTransform(props.transform),
    });
  },

  line(props: any, _: PDFDocument): Line {
    const attr = hierarchy(props, this.internalCSS, props.style);

    let { clipPath, mixBlendMode } = attr;

    if (clipPath) {
      const match = /url\((.*)\)/g.exec(clipPath);
      if (match) {
        clipPath = this.definitions[match[1]];
      }
    }

    if (mixBlendMode) {
      mixBlendMode = camel(mixBlendMode);
      mixBlendMode =
        mixBlendMode.charAt(0).toUpperCase() + mixBlendMode.slice(1);
    }

    return removeUndefined({
      type: 'line',
      x1: parseFloat(props.x1),
      y1: parseFloat(props.y1),
      x2: parseFloat(props.x2),
      y2: parseFloat(props.y2),
      clipPath: clipPath,
      clipRule: attr.clipRule,
      stroke:
        attr.stroke && attr.stroke !== 'none'
          ? parseColor(attr.stroke)
          : undefined,
      strokeWidth: attr.strokeWidth,
      strokeDashArray: attr.strokeDashArray,
      strokeDashOffset: attr.strokeDashOffset,
      opacity: attr.opacity,
      strokeOpacity: attr.strokeOpacity,
      mixBlendMode: mixBlendMode,
      transform: parseTransform(props.transform),
    });
  },

  defs(props: any, doc: PDFDocument) {
    let children = React.Children.toArray(props.children);
    children.forEach(({ type, props }: any) => this[type](props, doc));
  },

  style(props: any, _: PDFDocument) {
    const string = props.children;
    let regCls = /.(.*?){(.*?)}/g,
      cls;
    while ((cls = regCls.exec(string))) {
      const names = cls[1].split(',.');
      for (const name of names) {
        const styles = cls[2];

        if (!(name in this.internalCSS)) {
          this.internalCSS[name] = {};
        }

        styles.split(';').map((style) => {
          const [key, value] = style.split(':');
          this.internalCSS[name][camel(key)] = value;
        });
      }
    }
  },

  async image(props: any, doc: PDFDocument) {
    let { width, height, style, transform } = props;
    const attributes = hierarchy(props, this.internalCSS, style);

    width = parseFloat(width);
    height = parseFloat(height);

    let { clipPath, clipRule, opacity, mixBlendMode } = attributes;

    if (clipPath) {
      const match = /url\((.*)\)/g.exec(clipPath);
      if (match) {
        clipPath = this.definitions[match[1]];
      }
    }

    if (mixBlendMode) {
      mixBlendMode = camel(mixBlendMode);
      mixBlendMode =
        mixBlendMode.charAt(0).toUpperCase() + mixBlendMode.slice(1);
    }

    if (transform) {
      transform = parseTransform(transform);
    }

    const image = await doc.embedPng(props['xlink:href']);
    return removeUndefined({
      type: 'image',
      image: image,
      width: width,
      height: height,
      clipPath: clipPath,
      clipRule: clipRule,
      opacity: opacity,
      mixBlendMode: mixBlendMode,
      transform: transform,
    });
  },

  async clippath(props: any, doc: PDFDocument) {
    let children = React.Children.toArray(props.children);
    this.definitions['#' + props.id] = {
      type: 'group',
      children: (
        await Promise.all(
          children.map(async ({ type, props }: any) =>
            typeof this[type] === 'function'
              ? await this[type](props, doc)
              : undefined,
          ),
        )
      ).filter(Boolean) as PDFGraphic[],
    };
  },
};
