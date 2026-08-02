import { COMMAND_NAMES } from '@browser-ai/commands';
import type { UserProfile } from '@browser-ai/memory';
import { hasProfileValues } from '@browser-ai/memory';
import type { ExecutionPlan } from '@browser-ai/contracts';

import { createExecutionPlan, step } from '../ExecutionPlan';

/**
 * Build a job-application fill plan from a stored user profile.
 * Only includes steps for fields that have values.
 */
export function buildJobApplicationPlanFromProfile(profile: UserProfile): ExecutionPlan {
  if (!hasProfileValues(profile)) {
    return createExecutionPlan('job-application-from-profile', []);
  }

  const steps = [];

  if (profile.firstName) {
    steps.push(
      step('focus-first-name', COMMAND_NAMES.FOCUS_FIELD, {
        target: '#first-name',
      }),
      step('fill-first-name', COMMAND_NAMES.FILL_FIELD, {
        target: '#first-name',
        value: profile.firstName,
      }),
    );
  }

  if (profile.email) {
    steps.push(
      step('fill-email', COMMAND_NAMES.FILL_FIELD, {
        target: '#email',
        value: profile.email,
      }),
    );
  }

  if (profile.phone) {
    steps.push(
      step('fill-phone', COMMAND_NAMES.FILL_FIELD, {
        target: '#phone',
        value: profile.phone,
      }),
    );
  }

  if (profile.country) {
    steps.push(
      step('select-country', COMMAND_NAMES.SELECT_OPTION, {
        target: '#country',
        value: profile.country,
      }),
    );
  }

  if (profile.summary) {
    steps.push(
      step('fill-summary', COMMAND_NAMES.FILL_FIELD, {
        target: '#summary',
        value: profile.summary,
      }),
    );
  }

  if (typeof profile.willingToRelocate === 'boolean') {
    steps.push(
      step('check-relocate', COMMAND_NAMES.FILL_FIELD, {
        target: 'input[name="relocate"]',
        value: profile.willingToRelocate ? 'true' : 'false',
      }),
    );
  }

  return createExecutionPlan('job-application-from-profile', steps);
}
