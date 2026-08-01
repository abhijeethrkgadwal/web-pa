import { PageField } from './page-field';

export interface PageModel {
  url: string;

  title: string;

  forms: number;

  fields: PageField[];

  scannedAt: number;
}
