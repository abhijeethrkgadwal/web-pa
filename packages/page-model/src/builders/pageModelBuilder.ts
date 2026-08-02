import { PageField, PageModel } from '@browser-ai/shared';

export class PageModelBuilder {
  private fields: PageField[] = [];

  addField(field: PageField): void {
    this.fields.push(field);
  }

  build(doc: Document = document): PageModel {
    const defaultView = doc.defaultView;

    return {
      url: defaultView?.location.href ?? '',
      title: doc.title,
      forms: doc.forms.length,
      fields: [...this.fields],
      scannedAt: Date.now(),
    };
  }
}
