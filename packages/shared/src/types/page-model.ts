export interface PageModel {
  title?: string;
  fields?: Array<{
    name: string;
    type: string;
  }>;
}
