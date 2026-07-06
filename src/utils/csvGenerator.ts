import { Parser } from 'json2csv';

export const generateCsv = <T extends object>(rows: T[], fields?: string[]) => {
  const parser = new Parser<T>({ fields });
  return parser.parse(rows);
};
