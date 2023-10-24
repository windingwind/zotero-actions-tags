import { config } from "../../package.json";
import { updateHint } from "./hint";
import { getPref, setPref } from "./prefs";

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

export {
  defaultActions,
  emptyAction,
  ActionMap,
  ActionData,
  ActionEventTypes,
  ActionOperationTypes,
  ActionArgs,
  initActions,
  updateCachedActionKeys,
  applyAction,
  getActions,
  updateAction,
  deleteAction,
};

enum ActionEventTypes {
  "none",
  "createItem",
  "openFile",
  "closeTab",
  "createAnnotation",
  "createNote",
  "appendAnnotation",
  "appendNote",
  "programStartup",
  "mainWindowLoad",
  "mainWindowUnload",
}

enum ActionOperationTypes {
  "none",
  "add",
  "remove",
  "toggle",
  "script",
  "triggerAction"
}

interface ActionData<T extends ActionOperationTypes = ActionOperationTypes> {
  event: ActionEventTypes;
  operation: T;
  data: string;
  shortcut?: string;
  enabled?: boolean;
  menu?: string;
  name?: string;
}

const defaultActions: ActionMap = new Map([
  [
    "default0",
    {
      name: "Add Unread When Create Item",
      event: ActionEventTypes.createItem,
      operation: ActionOperationTypes.add,
      data: "/unread",
      shortcut: "",
      enabled: true,
    },
  ],
  [
    "default1",
    {
      name: "Remove Unread When Close Tab",
      event: ActionEventTypes.closeTab,
      operation: ActionOperationTypes.remove,
      data: "/unread",
      shortcut: "",
      enabled: true,
    },
  ],
]);

const emptyAction: ActionData = {
  event: ActionEventTypes.none,
  operation: ActionOperationTypes.none,
  data: "",
  shortcut: "",
  enabled: true,
  menu: "",
  name: "",
};

type ActionMap = Map<string, ActionData>;

type ActionArgs = {
  itemID?: number;
  [key: string]: any;
};

function initActions() {
  addon.data.actions.map = new ztoolkit.LargePref(
    `${config.prefsPrefix}.rules`,
    `${config.prefsPrefix}.rules.`,
    "parser",
  ).asMapLike() as ActionMap;
  if (!getPref("rulesInit")) {
    for (const key of defaultActions.keys()) {
      if (!Array.from(addon.data.actions.map.keys()).includes(key)) {
        addon.data.actions.map.set(key, defaultActions.get(key)!);
      }
    }
    setPref("rulesInit", true);
  }
  updateCachedActionKeys();
}

function updateCachedActionKeys() {
  addon.data.actions.cachedKeys = Array.from(addon.data.actions.map.keys());
}

async function applyAction(rule: ActionData, args: ActionArgs) {
  const item =
    (Zotero.Items.get(args.itemID || -1) as Zotero.Item | false) || null;
  //  If the item is not found and the operation is not script, early return.
  if (rule.operation !== ActionOperationTypes.script && !item) {
    return false;
  }
  const tags = rule.data
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag);
  let message: string = "";
  switch (rule.operation) {
    case ActionOperationTypes.add: {
      for (const tag of tags) {
        item?.addTag(tag, 1);
      }
      message = `Add tag ${tags.join(",")} to item ${item?.getField("title")}`;
      break;
    }
    case ActionOperationTypes.remove: {
      for (const tag of tags) {
        item?.removeTag(tag);
      }
      message = `Remove tag ${tags.join(",")} from item ${item?.getField(
        "title",
      )}`;
      break;
    }
    case ActionOperationTypes.toggle: {
      for (const tag of tags) {
        if (item?.hasTag(tag)) {
          item?.removeTag(tag);
        } else {
          item?.addTag(tag, 1);
        }
      }
      message = `Toggle tag ${tags.join(",")} to item ${item?.getField(
        "title",
      )}`;
      break;
    }
    case ActionOperationTypes.script: {
      const script = rule.data as string;
      const _require = (module: string) => ztoolkit.getGlobal(module);
      const items = Zotero.Items.get(args.itemIDs || []) || null;

      let paramList: any[] = [item, items, _require];
      let paramSign = "item, items, require";
      switch (rule.event) {
        case ActionEventTypes.mainWindowLoad:
        case ActionEventTypes.mainWindowUnload:
          paramList = [args.window, _require];
          paramSign = "window, require";
          break;
        case ActionEventTypes.programStartup:
          paramList = [_require];
          paramSign = "require";
          break;
        // Use default value
        case ActionEventTypes.createItem:
        case ActionEventTypes.openFile:
        case ActionEventTypes.closeTab:
        case ActionEventTypes.createAnnotation:
        case ActionEventTypes.createNote:
        case ActionEventTypes.appendAnnotation:
        case ActionEventTypes.appendNote:
        case ActionEventTypes.none:
        default:
          break;
      }

      try {
        const func = new AsyncFunction(paramSign, script);
        message = await func(...paramList);
      } catch (e) {
        ztoolkit.log("Script Error", e);
        message = `Script Error: ${(e as Error).message}`;
      }
      break;
    }
    case ActionOperationTypes.triggerAction: {
      const actions = getActions();
      // Find the action by name
      const action = Object.values(actions).find(
        (action) => action.name === rule.data,
      );
      if (action) {
        await applyAction(action, args);
        return true;
      }
      message = `Action ${rule.data} not found`;
      return false;
    }
  }
  await Zotero.DB.executeTransaction(async function () {
    await (item && item.save());
  });
  ztoolkit.log("applyAction", rule, args);
  message && updateHint(message);
  return true;
}

function getActions(): Record<string, ActionData>;
function getActions(key: string): ActionData | undefined;
function getActions(
  key?: string,
): Record<string, ActionData> | ActionData | undefined {
  if (!key) {
    const map = addon.data.actions.map;
    const actions: Record<string, ActionData> = {};
    for (const [key, value] of map) {
      actions[key] = Object.assign({}, value);
    }
    return actions;
  }
  return addon.data.actions.map.get(key) || undefined;
}

function updateAction(action: ActionData, key?: string) {
  key = key || `${Date.now()}`;
  addon.data.actions.map.set(key, action);
  updateCachedActionKeys();
  return key;
}

function deleteAction(key: string) {
  addon.data.actions.map.delete(key);
  updateCachedActionKeys();
}
