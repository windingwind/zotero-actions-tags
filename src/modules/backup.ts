import * as yaml from "js-yaml";
import { ActionData } from "../utils/actions";
import { version } from "../../package.json";
import { updateHint } from "../utils/hint";

export { exportToFile, importFromFile };

async function exportToFile(
  keys: string[],
  options: {
    win: Window;
  },
) {
  const path = await new ztoolkit.FilePicker(
    "Save actions to YAML file",
    "save",
    [["YAML File(*.yml)", "*.yml"]],
    "actions-zotero.yml",
    options.win || window,
    "text",
  ).open();
  if (!path) {
    return false;
  }
  const exportObj = {} as Record<string, any>;
  exportObj.type = "ActionsTagsBackup";
  exportObj.author = Zotero.Users.getCurrentUsername() || "anonymous";
  exportObj.platformVersion = Zotero.version;
  exportObj.pluginVersion = version;
  exportObj.timestamp = new Date().toISOString();
  exportObj.actions = keys.reduce(
    (acc, key) => {
      const action = addon.api.actionManager.getActions(key);
      if (action) {
        acc[key] = action;
      }
      return acc;
    },
    {} as Record<string, ActionData | string>,
  );

  ztoolkit.log("Export Actions", exportObj);
  const exportStr = yaml.dump(exportObj);
  await Zotero.File.putContentsAsync(path, exportStr);
  updateHint(`Actions saved to ${path}`);
  return true;
}

async function importFromFile(options: { win: Window }) {
  const path = await new ztoolkit.FilePicker(
    "Choose actions YAML file",
    "open",
    [["YAML File(*.yml)", "*.yml"]],
    "actions-zotero.yaml",
    options.win || window,
    "text",
  ).open();
  if (!path) {
    return false;
  }
  const importStr = await Zotero.File.getContentsAsync(path);
  if (!importStr || typeof importStr !== "string") {
    return false;
  }
  const importObj = yaml.load(importStr) as any;
  if (!importObj || typeof importObj !== "object") {
    return false;
  }
  ztoolkit.log("Import Actions", importObj);
  if (
    !importObj.actions ||
    typeof importObj.actions !== "object" ||
    importObj.type !== "ActionsTagsBackup" ||
    !Object.keys(importObj.actions).length
  ) {
    updateHint(`${path} is not a valid actions file`);
    return false;
  }
  const conflictKeys = Object.keys(importObj.actions).filter((key) =>
    addon.api.actionManager.getActions(key),
  );
  const actionsCount = Object.keys(importObj.actions).length;
  const conflictCount = conflictKeys.length;
  const isContinue = options.win.confirm(
    `You are trying to import actions from ${path}.
Details:
  Actions to create: ${actionsCount - conflictCount}
  Actions to overwrite: ${conflictCount}
  Author: ${importObj.author}
  Platform Version: ${importObj.platformVersion}(Current: ${Zotero.version})
  Plugin Version: ${importObj.pluginVersion}(Current: ${version})
  Create Time: ${importObj.timestamp}
Are you sure to continue?`,
  );
  if (!isContinue) {
    return false;
  }
  for (const key in importObj.actions) {
    const action = importObj.actions[key];
    if (typeof action === "object") {
      addon.api.actionManager.updateAction(action, key);
    }
  }
  updateHint(`Actions imported from ${path}`);
  return true;
}
