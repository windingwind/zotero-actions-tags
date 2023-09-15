import {
  ActionEventTypes,
  ActionDataData,
  applyAction,
} from "../utils/actions";
import { KeyModifier } from "../utils/shorcut";

export { dispatchEventAction, dispatchShortcutAction, dispatchMenuAction };

async function dispatchEventAction(
  eventType: ActionEventTypes,
  data: ActionDataData,
) {
  const actions = getActionsByEvent(eventType);
  for (const action of actions) {
    await applyAction(action, data);
  }
}

function getActionsByEvent(event: ActionEventTypes) {
  return Array.from(addon.data.actions.map.values()).filter(
    (action) => action.event === event && action.enabled,
  );
}

async function dispatchShortcutAction(
  shortcut: KeyModifier,
  data: ActionDataData,
) {
  const actions = getActionsByShortcuts(shortcut);
  for (const action of actions) {
    await applyAction(action, data);
  }
}

function getActionsByShortcuts(shortcut: KeyModifier) {
  return Array.from(addon.data.actions.map.values()).filter(
    (action) =>
      action.enabled &&
      action.shortcut &&
      new KeyModifier(action.shortcut).equals(shortcut),
  );
}

async function dispatchMenuAction(key: string, data: ActionDataData) {
  const action = addon.data.actions.map.get(key);
  if (!action) {
    return;
  }
  await applyAction(action, data);
}
