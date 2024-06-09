import { ColumnOptions } from "zotero-plugin-toolkit/dist/helpers/virtualizedTable";
import { config } from "../../package.json";
import { updateHint } from "./hint";
import { getString } from "./locale";
import { getPref, setPref } from "./prefs";

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

export {
  defaultActions,
  emptyAction,
  ActionMap,
  ActionData,
  ActionEventTypes,
  ActionShowInMenu,
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
  "triggerAction",
}

type ActionShowInMenu =
  | "item"
  | "collection"
  | "tools"
  | "reader"
  | "readerAnnotation";

interface ActionData<T extends ActionOperationTypes = ActionOperationTypes> {
  event: ActionEventTypes;
  operation: T;
  data: string;
  shortcut?: string;
  enabled?: boolean;
  menu?: string;
  name?: string;
  showInMenu?: Partial<Record<ActionShowInMenu, boolean>>;
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
  showInMenu: {
    item: false,
    collection: false,
    tools: false,
    reader: false,
    readerAnnotation: false,
  },
};

type ActionMap = Map<string, ActionData>;

type ActionArgs = {
  itemID?: number;
  itemIDs?: number[];
  collectionID?: number;
  triggerType: ActionEventTypes | "shortcut" | "menu" | "unknown";
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
  addon.data.prefs.columns = [
    {
      dataKey: "name",
      label: getString("prefs-action-name"),
    },
    {
      dataKey: "event",
      label: getString("prefs-action-event"),
    },
    {
      dataKey: "operation",
      label: getString("prefs-action-operation"),
    },
    {
      dataKey: "data",
      label: getString("prefs-action-data"),
    },
    {
      dataKey: "shortcut",
      label: getString("prefs-action-shortcut"),
    },
    {
      dataKey: "menu",
      label: getString("prefs-action-menu"),
    },
    {
      dataKey: "enabled",
      label: getString("prefs-action-enabled"),
      type: "checkbox",
    } as ColumnOptions,
  ];
  updateCachedActionKeys();
}

function updateCachedActionKeys() {
  addon.data.actions.cachedKeys = Array.from(
    addon.data.actions.map.keys(),
  ).sort((a, b) => {
    const actionA = addon.data.actions.map.get(a);
    const actionB = addon.data.actions.map.get(b);
    if (!actionA || !actionB) {
      return 0;
    }
    const valueA = String(
      actionA[
        addon.data.prefs.columns[addon.data.prefs.columnIndex]
          .dataKey as keyof ActionData
      ] || "",
    );
    const valueB = String(
      actionB[
        addon.data.prefs.columns[addon.data.prefs.columnIndex]
          .dataKey as keyof ActionData
      ] || "",
    );

    return addon.data.prefs.columnAscending
      ? valueA.localeCompare(valueB)
      : valueB.localeCompare(valueA);
  });
}

async function applyAction(action: ActionData, args: ActionArgs) {
  const item =
    (Zotero.Items.get(args.itemID || -1) as Zotero.Item | false) || null;
  //  If the item is not found and the operation is not script, early return.
  if (
    ![ActionOperationTypes.script, ActionOperationTypes.triggerAction].includes(
      action.operation,
    ) &&
    !item
  ) {
    return false;
  }
  const tags = action.data
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag);
  let message: string = "";
  let hasChanged = false;
  switch (action.operation) {
    case ActionOperationTypes.add: {
      for (const tag of tags) {
        if (!item?.hasTag(tag)) {
          hasChanged || (hasChanged = true);
          item?.addTag(tag, 1);
        }
      }
      message = hasChanged
        ? `Add tag ${tags.join(",")} to item ${item?.getField("title")}`
        : "";
      break;
    }
    case ActionOperationTypes.remove: {
      for (const tag of tags) {
        if (item?.hasTag(tag)) {
          hasChanged || (hasChanged = true);
          item?.removeTag(tag);
        }
      }
      message = hasChanged
        ? `Remove tag ${tags.join(",")} from item ${item?.getField("title")}`
        : "";
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
      const script = action.data as string;
      const _require = (module: string) => ztoolkit.getGlobal(module);
      const items = Zotero.Items.get(args.itemIDs || []) || null;

      let collection: Zotero.Collection | false = false;
      if (args.collectionID) {
        collection = Zotero.Collections.get(args.collectionID) as
          | Zotero.Collection
          | false;
      }

      let paramList: any[] = [item, items, collection];
      let paramSign = ["item", "items", "collection"];
      switch (action.event) {
        case ActionEventTypes.mainWindowLoad:
        case ActionEventTypes.mainWindowUnload:
          paramList = [args.window];
          paramSign = ["window"];
          break;
        case ActionEventTypes.programStartup:
          paramList = [];
          paramSign = [];
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

      paramList.push(_require, args.triggerType);
      paramSign.push("require", "triggerType");

      try {
        const func = new AsyncFunction(paramSign.join(", "), script);
        message = await func(...paramList);
      } catch (e) {
        ztoolkit.log("Script Error", e);
        message = `Script Error: ${(e as Error).message}`;
      }
      break;
    }
    case ActionOperationTypes.triggerAction: {
      const actions = Object.values(getActions());
      const actionNames = action.data.split("\n");
      const targetActions = actionNames
        .map((name) => actions.find((a) => a.name === name))
        .filter((action) => action) as ActionData<ActionOperationTypes>[];
      if (targetActions.length === 0) {
        return false;
      }
      for (const action of targetActions) {
        await applyAction(action, args);
      }
      return false;
    }
  }
  await Zotero.DB.executeTransaction(async function () {
    await (item && item.save());
  });
  ztoolkit.log("applyAction", action, args);
  message && getPref("showPopup") !== false && updateHint(message);
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
  key = key || `${Date.now()}-${Zotero.Users.getLocalUserKey()}`;
  addon.data.actions.map.set(key, action);
  updateCachedActionKeys();
  return key;
}

function deleteAction(key: string) {
  addon.data.actions.map.delete(key);
  updateCachedActionKeys();
}
