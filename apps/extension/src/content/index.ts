import { fillDemoValues, scanForms } from '@browser-ai/browser';
import { confirmSmartFill, previewSmartFill, runSmartFill } from '@browser-ai/engine';

import {
  MESSAGE_TYPES,
  type ExtensionRequest,
  type ExtensionResponse,
  type FillDemoResponse,
  type PreviewFillResponse,
  type RunPlanResponse,
  type ScanPageResponse,
} from '../shared/messages';

console.info('[Browser AI] content script alive');

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionRequest,
    _sender,
    sendResponse: (response: ExtensionResponse) => void,
  ) => {
    if (message?.type === MESSAGE_TYPES.PING) {
      console.info('[Browser AI] ping received — content script alive');
      sendResponse({
        ok: true,
        message: 'content script alive',
        href: window.location.href,
      });
      return true;
    }

    if (message?.type === MESSAGE_TYPES.SCAN_PAGE) {
      try {
        const pageModel = scanForms();
        console.info('[Browser AI] page model', pageModel);

        const response: ScanPageResponse = {
          ok: true,
          fieldCount: pageModel.fields.length,
          forms: pageModel.forms,
          title: pageModel.title,
          url: pageModel.url,
          fields: pageModel.fields.map((field) => ({
            name: field.name,
            type: String(field.type),
            label: field.label,
            selector: field.selector,
            visible: field.visible,
          })),
        };

        sendResponse(response);
      } catch (error) {
        console.error('[Browser AI] scan failed', error);
        sendResponse({
          ok: true,
          fieldCount: 0,
          forms: 0,
          title: document.title,
          url: window.location.href,
          fields: [],
        });
      }
      return true;
    }

    if (message?.type === MESSAGE_TYPES.FILL_DEMO) {
      void fillDemoValues()
        .then((result) => {
          console.info('[Browser AI] fill demo result', result);
          const response: FillDemoResponse = {
            ok: true,
            attempted: result.attempted,
            filled: result.filled,
            failed: result.failed,
          };
          sendResponse(response);
        })
        .catch((error: unknown) => {
          console.error('[Browser AI] fill demo failed', error);
          sendResponse({
            ok: true,
            attempted: 0,
            filled: 0,
            failed: [
              {
                selector: '',
                error: error instanceof Error ? error.message : 'Fill demo failed',
              },
            ],
          });
        });

      return true;
    }

    if (message?.type === MESSAGE_TYPES.RUN_PLAN) {
      void runSmartFill()
        .then((result) => {
          console.info('[Browser AI] smart fill result', result);
          const response: RunPlanResponse = {
            ok: true,
            planId: result.planId,
            success: result.success,
            completed: result.completed,
            total: result.total,
            mappingSource: result.mappingSource,
            mappingCount: result.mappingCount,
            error: result.error,
          };
          sendResponse(response);
        })
        .catch((error: unknown) => {
          console.error('[Browser AI] smart fill failed', error);
          sendResponse({
            ok: true,
            planId: 'smart-fill',
            success: false,
            completed: 0,
            total: 0,
            mappingSource: 'heuristic',
            mappingCount: 0,
            error: error instanceof Error ? error.message : 'Plan execution failed',
          });
        });

      return true;
    }

    if (message?.type === MESSAGE_TYPES.PREVIEW_FILL) {
      void previewSmartFill()
        .then((result) => {
          console.info('[Browser AI] preview fill', result);
          const response: PreviewFillResponse = {
            ok: result.ok,
            mappings: result.mappings,
            mappingSource: result.mappingSource,
            missingFields: result.missingFields,
            error: result.error,
          };
          sendResponse(response);
        })
        .catch((error: unknown) => {
          sendResponse({
            ok: false,
            mappings: [],
            mappingSource: 'heuristic',
            missingFields: [],
            error: error instanceof Error ? error.message : 'Preview failed',
          });
        });
      return true;
    }

    if (message?.type === MESSAGE_TYPES.CONFIRM_FILL) {
      void confirmSmartFill(message.mappings)
        .then((result) => {
          console.info('[Browser AI] confirm fill', result);
          sendResponse({
            ok: true,
            success: result.success,
            completed: result.completed,
            total: result.total,
            mappingSource: result.mappingSource,
            error: result.error,
          });
        })
        .catch((error: unknown) => {
          sendResponse({
            ok: true,
            success: false,
            completed: 0,
            total: 0,
            error: error instanceof Error ? error.message : 'Confirm fill failed',
          });
        });
      return true;
    }

    if (message?.type === MESSAGE_TYPES.CANCEL_FILL) {
      console.info('[Browser AI] fill cancelled — page untouched');
      sendResponse({ ok: true, cancelled: true });
      return true;
    }

    return false;
  },
);
