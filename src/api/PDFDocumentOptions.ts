import { EmbeddedFileOptions } from 'src/core/embedders/FileEmbedder';
import { TypeFeatures } from 'src/types/fontkit';
import {
  Fonts,
  JSXParserState,
  Css,
  Defs,
  Attributes,
} from 'src/api/JSXParser';

export enum ParseSpeeds {
  Fastest = Infinity,
  Fast = 1500,
  Medium = 500,
  Slow = 100,
}

export interface AttachmentOptions extends EmbeddedFileOptions {}

export interface SaveOptions {
  useObjectStreams?: boolean;
  addDefaultPage?: boolean;
  objectsPerTick?: number;
  updateFieldAppearances?: boolean;
}

export interface Base64SaveOptions extends SaveOptions {
  dataUri?: boolean;
}

export interface LoadOptions {
  ignoreEncryption?: boolean;
  parseSpeed?: ParseSpeeds | number;
  throwOnInvalidObject?: boolean;
  updateMetadata?: boolean;
  capNumbers?: boolean;
}

export interface CreateOptions {
  updateMetadata?: boolean;
}

export interface OfOptions {
  updateMetadata?: boolean;
  css?: Css;
  defs?: Defs;
  fonts?: Fonts;
  attributes?: Attributes;
  throwOnInvalidElement?: boolean;
}

export interface EmbedFontOptions {
  subset?: boolean;
  customName?: string;
  features?: TypeFeatures;
}

export interface SetTitleOptions {
  showInWindowTitleBar: boolean;
}

export interface EmbedJsxOptions {
  state?: JSXParserState;
  throwOnInvalidElement?: boolean;
}
