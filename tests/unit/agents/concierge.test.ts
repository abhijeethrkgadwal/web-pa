import { describe, expect, it } from 'vitest';

import { ConciergeAgent } from '@browser-ai/agents';
import { InMemoryStore, upsertAnswers } from '@browser-ai/memory';
import { FieldType, type PageField } from '@browser-ai/shared';

describe('ConciergeAgent', () => {
  it('recalls known answers, asks unknowns, and skips uploads', async () => {
    const store = new InMemoryStore();
    await upsertAnswers(
      [
        {
          intent: 'email',
          value: 'abhijeeth@example.com',
          label: 'Email',
          scope: 'global',
        },
        {
          intent: 'custom:commute preference',
          value: 'Comfortable with 4 days',
          label: 'How do you feel about commuting',
          site: 'example.com',
          scope: 'site',
        },
      ],
      store,
    );

    const fields: PageField[] = [
      {
        id: 'email',
        name: 'email',
        type: FieldType.EMAIL,
        label: 'Work email',
        selector: '#email',
        visible: true,
      },
      {
        id: 'commute',
        name: 'commute',
        type: FieldType.TEXTAREA,
        label: 'How do you feel about commuting to the office 4 days a week?',
        selector: '#commute',
        visible: true,
      },
      {
        id: 'cv',
        name: 'cv',
        type: FieldType.FILE,
        label: 'Upload CV',
        selector: '#cv',
        visible: true,
      },
      {
        id: 'phone',
        name: 'phone',
        type: FieldType.TEL,
        label: 'Phone',
        selector: '#phone',
        visible: true,
      },
    ];

    const agent = new ConciergeAgent();
    const preview = await agent.buildPreview(
      fields,
      { url: 'https://example.com/apply', title: 'Apply' },
      store,
    );

    expect(preview.fields.find((item) => item.selector === '#email')?.status).toBe('known');
    expect(preview.fields.find((item) => item.selector === '#email')?.value).toBe(
      'abhijeeth@example.com',
    );
    expect(preview.fields.find((item) => item.selector === '#cv')?.status).toBe(
      'skipped_upload',
    );
    expect(preview.fields.find((item) => item.selector === '#phone')?.status).toBe('unknown');
    expect(preview.skippedUploadCount).toBe(1);
  });
});
