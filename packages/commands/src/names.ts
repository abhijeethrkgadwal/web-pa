export const COMMAND_NAMES = {
  FILL_FIELD: 'FillField',
  SELECT_OPTION: 'SelectOption',
  CLICK_BUTTON: 'ClickButton',
  FOCUS_FIELD: 'FocusField',
  SCROLL_PAGE: 'ScrollPage',
} as const;

export type CommandName = (typeof COMMAND_NAMES)[keyof typeof COMMAND_NAMES];
