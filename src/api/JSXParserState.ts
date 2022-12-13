import PDFFont from 'src/api/PDFFont';
import { first, exists, color } from 'src/utils';
import { Color } from 'src/api/colors';
import {
  Mask,
  Filter,
  ClipPath,
  LinearGradient,
  RadialGradient,
  JSXParsers,
} from 'src/api/JSXParser';
import { JSXParserInvalidAttributeError, Invalid } from 'src/core/errors';

export interface Css {
  [className: string]: any;
}

export interface Defs {
  [url: string]: Mask | Filter | ClipPath | LinearGradient | RadialGradient;
}

export interface Fonts {
  [family: string]: { [weight: string]: { [style: string]: PDFFont } };
}

export interface Attributes {
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  fontSize: number;
  font: PDFFont;
  fill?: Color;
}

export class JSXParserState {
  css: Css;
  defs: Defs;
  fonts: Fonts;
  attributes: Attributes;

  //   font: PDFFont;

  options: {
    throwOnInvalidElement?: boolean;
    throwOnInvalidAttribute?: boolean;
    outlineText?: boolean;
  } = {};

  tagName?: keyof JSXParsers;
  children: JSXParserState[];

  constructor(
    css: Css,
    defs: Defs,
    fonts: Fonts,
    attributes: Attributes,
    options: {
      throwOnInvalidElement?: boolean;
      throwOnInvalidAttribute?: boolean;
      outlineText?: boolean;
    } = {},
  ) {
    this.css = css;
    this.defs = defs;
    this.fonts = fonts;
    this.attributes = attributes;

    this.options = options;

    this.children = [];
  }

  update = ({
    fill,
    fontFamily,
    fontWeight,
    fontStyle,
    fontSize,
  }: {
    fill: string | undefined;
    fontFamily: string | undefined;
    fontWeight: string | undefined;
    fontStyle: string | undefined;
    fontSize: string | undefined;
  }) => {
    if (fontFamily && this.attributes.fontFamily !== fontFamily) {
      // if font family and different family
      this.attributes.fontFamily = fontFamily;

      if (fontWeight) {
        // new family, use provided weight
        this.attributes.fontWeight = fontWeight;

        if (fontStyle) {
          // new family and weight, use provided style
          this.attributes.fontStyle;
        } else {
          // new family and weight, unknown style
          if (this.options.throwOnInvalidAttribute) {
            if (!exists(this.fonts, this.attributes.fontFamily)) {
              // check family exists
              throw new JSXParserInvalidAttributeError(
                this,
                Invalid.fontFamily,
              );
            }

            if (
              !exists(
                this.fonts[this.attributes.fontFamily],
                this.attributes.fontWeight,
              )
            ) {
              // check weight exists on family
              throw new JSXParserInvalidAttributeError(
                this,
                Invalid.fontWeight,
              );
            }

            this.attributes.fontStyle = first(
              // choose first in provided weight
              this.fonts[this.attributes.fontFamily][
                this.attributes.fontWeight
              ],
            );
          }
        }
      } else {
        // new family, unknown weight

        if (this.options.throwOnInvalidAttribute) {
          if (!exists(this.fonts, this.attributes.fontFamily)) {
            // check family exists
            throw new JSXParserInvalidAttributeError(this, Invalid.fontFamily);
          }

          this.attributes.fontWeight = first(
            // choose first in family
            this.fonts[this.attributes.fontFamily],
          );
        }

        if (fontStyle) {
          // new family and choosen weight, use provided style
          this.attributes.fontStyle;
        } else {
          // new family and choosen weight, unknown style

          if (this.options.throwOnInvalidAttribute) {
            if (
              !exists(
                this.fonts[this.attributes.fontFamily],
                this.attributes.fontWeight,
              )
            ) {
              // check weight exists on family
              throw new JSXParserInvalidAttributeError(
                this,
                Invalid.fontWeight,
              );
            }

            this.attributes.fontStyle = first(
              // choose first in choosen weight
              this.fonts[this.attributes.fontFamily][
                this.attributes.fontWeight
              ],
            );
          }
        }
      }
    } else {
      // if not font family or same family, use current family
      if (fontWeight && this.attributes.fontWeight !== fontWeight) {
        // if font weight and different weight, use that weight
        this.attributes.fontWeight = fontWeight;

        if (fontStyle && this.attributes.fontStyle !== fontStyle) {
          // if font style and different style, use that style
          this.attributes.fontStyle = fontStyle;
        }
      }
    }

    if (this.options.throwOnInvalidAttribute) {
      if (!exists(this.fonts, this.attributes.fontFamily)) {
        // check family exists
        throw new JSXParserInvalidAttributeError(this, Invalid.fontFamily);
      }

      if (
        !exists(
          this.fonts[this.attributes.fontFamily],
          this.attributes.fontWeight,
        )
      ) {
        // check weight exists on family
        throw new JSXParserInvalidAttributeError(this, Invalid.fontWeight);
      }

      if (
        !exists(
          this.fonts[this.attributes.fontFamily][this.attributes.fontWeight],
          this.attributes.fontStyle,
        )
      ) {
        // check style exists on selected families selected weight
        throw new JSXParserInvalidAttributeError(this, Invalid.fontStyle);
      }
    }

    if (
      this.attributes.font.ref.tag !==
      this.fonts[this.attributes.fontFamily][this.attributes.fontWeight][
        this.attributes.fontStyle
      ].ref.tag
    ) {
      // current font is different to selected font, use selected font
      this.attributes.font = this.fonts[this.attributes.fontFamily][
        this.attributes.fontWeight
      ][this.attributes.fontStyle];
    }

    if (fontSize) {
      this.attributes.fontSize = parseInt(fontSize);
    }

    if (fill) {
      this.attributes.fill = color(this, fill) as Color;
    }
  };

  copy = () => {
    const state = new JSXParserState(
      this.css,
      this.defs,
      this.fonts,
      this.attributes,
      this.options,
    );

    this.children.push(state);

    return state;
  };

  compile = async () => {
    const obj: { css: Css; defs: Defs; fonts: Fonts } = {
      css: this.css,
      defs: this.defs,
      fonts: this.fonts,
    };

    // TODO: only merge states at bottom of tree
    await Promise.all(
      this.children.map(async (state) => {
        const { css, defs, fonts } = await state.compile();

        obj.css = { ...obj.css, ...css };
        obj.defs = { ...obj.defs, ...defs };
        obj.fonts = { ...obj.fonts, ...fonts };
      }),
    );

    return obj;
  };
}

export default JSXParserState;
