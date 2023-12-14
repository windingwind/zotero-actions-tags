import { KeyModifier } from "zotero-plugin-toolkit/dist/managers/keyboard";
import { ActionEventTypes, ActionArgs, applyAction } from "../utils/actions";

export { dispatchActionByEvent, dispatchActionByShortcut, dispatchActionByKey };

async function dispatchActionByEvent(
  eventType: ActionEventTypes,
  data: ActionArgs,
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

async function dispatchActionByShortcut(
  shortcut: KeyModifier,
  data: ActionArgs,
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

async function dispatchActionByKey(key: string, data: ActionArgs) {
  const action = addon.data.actions.map.get(key);
  if (!action) {
    return;
  }
  await applyAction(action, data);
}
