import { scanForms } from '@browser-ai/browser';
import type { FieldMapping } from '@browser-ai/contracts';
import { confirmSmartFill, previewSmartFill } from '@browser-ai/engine';
import { InMemoryStore, saveUserProfile, type UserProfile } from '@browser-ai/memory';

const store = new InMemoryStore();

async function seedProfile(profile: UserProfile) {
  await saveUserProfile(profile, store);
  return true;
}

async function preview() {
  return previewSmartFill(store);
}

async function confirm(mappings: FieldMapping[]) {
  return confirmSmartFill(mappings);
}

function scan() {
  return scanForms();
}

window.BrowserAIHarness = {
  seedProfile,
  preview,
  confirm,
  scan,
};
