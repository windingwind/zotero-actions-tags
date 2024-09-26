import { KeyModifier } from "zotero-plugin-toolkit";
import { ActionEventTypes, ActionArgs, applyAction } from "../utils/actions";

export { dispatchActionByEvent, dispatchActionByShortcut, dispatchActionByKey };

async function dispatchActionByEvent(
  eventType: ActionEventTypes,
  data: Omit<ActionArgs, "triggerType">,
) {
  const actions = getActionsByEvent(eventType);
  for (const action of actions) {
    await applyAction(
      action,
      Object.assign({}, data, {
        triggerType: eventType,
      }),
    );
  }
}

function getActionsByEvent(event: ActionEventTypes) {
  return Array.from(addon.data.actions.map.values()).filter(
    (action) => action.event === event && action.enabled,
  );
}

async function dispatchActionByShortcut(
  shortcut: KeyModifier,
  data: Omit<ActionArgs, "triggerType">,
) {
  const actions = getActionsByShortcuts(shortcut);
  for (const action of actions) {
    await applyAction(
      action,
      Object.assign({}, data, {
        triggerType: "shortcut",
      } as ActionArgs),
    );
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
