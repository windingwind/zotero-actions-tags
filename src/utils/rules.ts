import { config } from "../../package.json";
import { updateHint } from "./hint";

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

export {
  defaultRules,
  emptyRule,
  TagRuleMap,
  TagRule,
  TagEventTypes,
  TagOperationTypes,
  TagRuleData,
  initRules,
  updateCachedRuleKeys,
  applyRule,
};

enum TagEventTypes {
  "none",
  "createItem",
  "openFile",
  "closeTab",
  "createAnnotation",
  "createNote",
  "appendAnnotation",
  "appendNote",
}

enum TagOperationTypes {
  "none",
  "add",
  "remove",
  "toggle",
  "script",
}

interface TagRule<T extends TagOperationTypes = TagOperationTypes> {
  event: TagEventTypes;
  operation: T;
  data: string;
  shortcut?: string;
  enabled?: boolean;
}

const defaultRules: TagRuleMap = new Map([
  [
    "default0",
    {
      event: TagEventTypes.createItem,
      operation: TagOperationTypes.add,
      data: "/unread",
      shortcut: "",
      enabled: true,
    },
  ],
  [
    "default1",
    {
      event: TagEventTypes.closeTab,
      operation: TagOperationTypes.remove,
      data: "/unread",
      shortcut: "",
      enabled: true,
    },
  ],
]);

const emptyRule: TagRule = {
  event: TagEventTypes.none,
  operation: TagOperationTypes.none,
  data: "",
  shortcut: "",
  enabled: true,
};

type TagRuleMap = Map<string, TagRule>;

type TagRuleData = {
  itemID: number;
  [key: string]: any;
};

function initRules() {
  addon.data.rules.data = new ztoolkit.LargePref(
    `${config.prefsPrefix}.rules`,
    `${config.prefsPrefix}.rules.`,
    "parser",
  ).asMapLike() as TagRuleMap;
  for (const key of defaultRules.keys()) {
    if (!Array.from(addon.data.rules.data.keys()).includes(key)) {
      addon.data.rules.data.set(key, defaultRules.get(key)!);
    }
  }
}

function updateCachedRuleKeys() {
  addon.data.rules.cachedKeys = Array.from(addon.data.rules.data.keys());
}

async function applyRule(rule: TagRule, data: TagRuleData) {
  const item = Zotero.Items.get(data.itemID);
  //  If the item is not found and the operation is not script, early return.
  if (rule.operation !== TagOperationTypes.script && !item) {
    return false;
  }
  const tags = rule.data
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag);
  let message: string = "";
  switch (rule.operation) {
    case TagOperationTypes.add: {
      for (const tag of tags) {
        item.addTag(tag, 1);
      }
      message = `Add tag ${tags.join(",")} to item ${item.getField("title")}`;
      break;
    }
    case TagOperationTypes.remove: {
      for (const tag of tags) {
        item.removeTag(tag);
      }
      message = `Remove tag ${tags.join(",")} from item ${item.getField(
        "title",
      )}`;
      break;
    }
    case TagOperationTypes.toggle: {
      for (const tag of tags) {
        if (item.hasTag(tag)) {
          item.removeTag(tag);
        } else {
          item.addTag(tag, 1);
        }
      }
      message = `Toggle tag ${tags.join(",")} to item ${item.getField(
        "title",
      )}`;
      break;
    }
    case TagOperationTypes.script: {
      const script = rule.data as string;
      try {
        const func = new AsyncFunction("item, data, require", script);
        message = await func(item, data, (module: string) =>
          ztoolkit.getGlobal(module),
        );
      } catch (e) {
        ztoolkit.log("Script Error", e);
        message = `Script Error: ${(e as Error).message}`;
      }
      break;
    }
  }
  await Zotero.DB.executeTransaction(async function () {
    await (item && item.save());
  });
  ztoolkit.log("applyRule", rule, data);
  updateHint(message);
  return true;
}
