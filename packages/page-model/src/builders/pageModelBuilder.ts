import { PageField, PageModel } from '@browser-ai/shared/types';

export class PageModelBuilder {
  private fields: PageField[] = [];

  addField(field: PageField): void {
    this.fields.push(field);
  }

  build(): PageModel {
    return {
      url: window.location.href,
      title: document.title,
      forms: document.forms.length,
      fields: this.fields,
      scannedAt: Date.now(),
    };
  }
}
