import { asNumber } from 'src/api/objects';
import { PDFNumber, PDFOperator } from 'src/core';
import { concatTransformationMatrix, rotateDegrees } from './operators';

export const matrix = (
  a: number | PDFNumber,
  b: number | PDFNumber,
  c: number | PDFNumber,
  d: number | PDFNumber,
  e: number | PDFNumber,
  f: number | PDFNumber,
) => concatTransformationMatrix(a, b, c, d, e, f);

export const translate = (tx: number | PDFNumber, ty: number | PDFNumber) =>
  concatTransformationMatrix(1, 0, 0, 1, tx, ty);

export const translateX = (tx: number | PDFNumber) =>
  concatTransformationMatrix(1, 0, 0, 1, tx, 0);

export const translateY = (ty: number | PDFNumber) =>
  concatTransformationMatrix(1, 0, 0, 1, 0, ty);

export const rotate = (angle: number | PDFNumber) => rotateDegrees(angle);

export const scale = (sx: number | PDFNumber, sy: number | PDFNumber) =>
  concatTransformationMatrix(sx, 0, 0, sy, 0, 0);

export const scaleX = (xPos: number | PDFNumber) =>
  concatTransformationMatrix(xPos, 0, 0, 0, 0, 0);

export const scaleY = (yPos: number | PDFNumber) =>
  concatTransformationMatrix(0, 0, 0, yPos, 0, 0);

export const skew = (skx: number | PDFNumber, sky: number | PDFNumber) =>
  concatTransformationMatrix(
    1,
    Math.tan(asNumber(skx)),
    Math.tan(asNumber(sky)),
    1,
    0,
    0,
  );

export const skewX = (skx: number | PDFNumber) =>
  concatTransformationMatrix(1, Math.tan(asNumber(skx)), 0, 1, 0, 0);

export const skewY = (sky: number | PDFNumber) =>
  concatTransformationMatrix(1, 0, Math.tan(asNumber(sky)), 1, 0, 0);

export const transform = (str?: string): PDFOperator[] | undefined => {
  if (!str) return;
  const ops: (PDFOperator | undefined)[] = [];

  str = str.split(' ').join(',');

  const regex = /((.*?)\((.*?)\))/g;
  let match;
  while ((match = regex.exec(str))) {
    const type = match[2].split(',').join('');
    const args = match[3].split(',').map((arg) => parseFloat(arg));

    switch (type) {
      case 'matrix':
        ops.push(matrix(args[0], args[1], args[2], args[3], args[4], args[5]));
        break;

      case 'translate':
        if (args.length === 1) {
          ops.push(translate(args[0], 0));
          break;
        }

        if (args.length === 2) {
          ops.push(translate(args[0], args[1]));
          break;
        }
        break;

      case 'translateX':
        ops.push(translateX(args[0]));
        break;

      case 'translateY':
        ops.push(translateY(args[0]));
        break;

      case 'rotate':
        if (args.length === 1) {
          ops.push(rotate(args[0]));
          break;
        }

        if (args.length === 3) {
          ops.push(
            ...[
              translate(args[1], args[2]),
              rotate(args[0]),
              translate(-args[1], -args[2]),
            ],
          );
          break;
        }

        break;

      case 'scale':
        if (args.length === 1) {
          ops.push(scale(args[0], args[0]));
          break;
        }

        if (args.length === 2) {
          ops.push(scale(args[0], args[1]));
          break;
        }

        break;

      case 'scaleX':
        ops.push(scaleX(args[0]));
        break;

      case 'scaleY':
        ops.push(scaleY(args[0]));
        break;

      case 'skew':
        ops.push(skew(args[0], args[1]));
        break;

      case 'skewX':
        ops.push(skewX(args[0]));
        break;

      case 'skewY':
        ops.push(skewY(args[0]));
        break;
    }
  }

  return ops.filter(Boolean) as PDFOperator[];
};
