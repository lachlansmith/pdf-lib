import { LineCapStyle } from 'src/api/operators';
import { PDFImage, BlendMode } from 'src/api';
import React from 'react';
import PDFDocument from './PDFDocument';
import { Color, ColorTypes, RGB, CMYK } from 'src/api/colors';
import { line, circle, ellipse, rect, path } from 'src/api/shape';
import { transform } from 'src/api/transform';
import { PDFOperator } from 'src/core';

import ColorParser from 'color';

interface Base {
  transform?: PDFOperator[];
  clip?: PDFOperator[];
  clipRule?: 'nonzero' | 'evenodd';
  opacity?: number;
  strokeOpacity?: number;
  mixBlendMode?: BlendMode;
}

interface Shape extends Base {
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
  children: PDFGraphic[];
}

type PDFGraphic = Shape | Text | Image | Group;

export default PDFGraphic;

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

    return {
      type: 'group',
      clipPath: clipPath,
      clipRule: attr.clipRule,
      opacity: attr.opacity,
      strokeOpacity: attr.strokeOpacity,
      mixBlendMode: mixBlendMode,
      transform: transform(props.transform),
      children: children.filter(Boolean) as PDFGraphic[],
    };
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

    return {
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
      transform: transform(props.transform),
      children: children.filter(Boolean) as PDFGraphic[],
    };
  },

  ['Symbol(react.fragment)'](props: any, doc: PDFDocument) {
    return this['g'](props.children.props, doc);
  },

  path(props: any, _: PDFDocument): Shape {
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

    return {
      type: 'shape',
      operators: path(props.d),
      clip: clipPath,
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
      transform: transform(props.transform),
    };
  },

  polyline(props: any, _: PDFDocument): Shape {
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

    return {
      type: 'shape',
      operators: path('M' + props.points),
      clip: clipPath,
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
      transform: transform(props.transform),
    };
  },

  polygon(props: any, _: PDFDocument): Shape {
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

    return {
      type: 'shape',
      operators: path('M' + props.points + 'z'),
      clip: clipPath,
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
      transform: transform(props.transform),
    };
  },

  circle(props: any, _: PDFDocument): Shape {
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

    return {
      type: 'shape',
      operators: circle(
        parseFloat(props.cx),
        parseFloat(props.cy),
        parseFloat(props.r),
      ),
      clip: clipPath,
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
      transform: transform(props.transform),
    };
  },

  ellipse(props: any, _: PDFDocument): Shape {
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

    return {
      type: 'shape',
      operators: ellipse(
        parseFloat(props.cx),
        parseFloat(props.cy),
        parseFloat(props.rx),
        parseFloat(props.ry),
      ),
      clip: clipPath,
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
      transform: transform(props.transform),
    };
  },

  rect(props: any, _: PDFDocument): Shape {
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

    return {
      type: 'shape',
      operators: rect(
        parseFloat(props.x),
        parseFloat(props.y),
        parseFloat(props.width),
        parseFloat(props.height),
        props.rx ? parseFloat(props.rx) : undefined,
        props.ry ? parseFloat(props.ry) : undefined,
      ),
      clip: clipPath,
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
      transform: transform(props.transform),
    };
  },

  line(props: any, _: PDFDocument): Shape {
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

    return {
      type: 'shape',
      operators: line(
        parseFloat(props.x1),
        parseFloat(props.y1),
        parseFloat(props.x2),
        parseFloat(props.y2),
      ),
      clip: clipPath,
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
      transform: transform(props.transform),
    };
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

  async image(props: any, doc: PDFDocument): Promise<Image> {
    let { width, height, style } = props;
    const attr = hierarchy(props, this.internalCSS, style);

    width = parseFloat(width);
    height = parseFloat(height);

    let { mixBlendMode } = attr,
      clip;

    if (attr.clipPath) {
      const match = /url\((.*)\)/g.exec(attr.clipPath);
      if (match) {
        clip = this.definitions[match[1]];
      }
    }

    if (mixBlendMode) {
      mixBlendMode = camel(mixBlendMode);
      mixBlendMode =
        mixBlendMode.charAt(0).toUpperCase() + mixBlendMode.slice(1);
    }

    const image = await doc.embedPng(props['xlink:href']);
    return {
      type: 'image',
      image: image,
      width: width,
      height: height,
      clip: clip,
      clipRule: attr.clipRule,
      opacity: attr.opacity,
      mixBlendMode: mixBlendMode,
      transform: transform(props.transform),
    };
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
