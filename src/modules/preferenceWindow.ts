import { config } from "../../package.json";
import { getString } from "../utils/locale";
import {
  ActionEventTypes,
  ActionOperationTypes,
  ActionData,
  emptyAction,
  updateCachedActionKeys,
} from "../utils/actions";
import { isWindowAlive } from "../utils/window";

export async function initPrefPane(_window: Window) {
  addon.data.prefs.window = _window;
  initUI();
  initEvents();
}

async function initUI() {
  const renderLock = Zotero.Promise.defer();
  if (!isWindowAlive(addon.data.prefs.window)) return;
  addon.data.prefs.tableHelper = new ztoolkit.VirtualizedTable(
    addon.data.prefs.window!,
  )
    .setContainerId(`${config.addonRef}-table-container`)
    .setProp({
      id: `${config.addonRef}-prefs-table`,
      columns: addon.data.prefs.columns,
      showHeader: true,
      multiSelect: true,
      staticColumns: false,
      disableFontSizeScaling: true,
    })
    .setProp("getRowCount", () => addon.data.actions.map.size || 0)
    .setProp("getRowData", getRowData as any)
    // Update selected key when selection changes
    .setProp("onSelectionChange", (selection) => {
      const selectedKeys = getSelection();
      addon.data.actions.selectedKey = selectedKeys[0];

      addon.data.prefs.window?.document
        .querySelectorAll(".action-selection")
        ?.forEach((e) =>
          setButtonDisabled(e as XUL.Button, selectedKeys.length === 0),
        );

      addon.data.prefs.window?.document
        .querySelectorAll(".action-selection-single")
        ?.forEach((e) =>
          setButtonDisabled(e as XUL.Button, selectedKeys.length !== 1),
        );
    })
    // When pressing delete, delete selected line and refresh table.
    // Returning false to prevent default event.
    .setProp("onKeyDown", (event: KeyboardEvent) => {
      if (event.key == "Delete" || (Zotero.isMac && event.key == "Backspace")) {
        addon.api.actionManager.deleteAction(addon.data.actions.selectedKey!);
        updateUI();
        return false;
      }
      if (event.key == "Enter") {
        editAndUpdate();
        return false;
      }
      return true;
    })
    .setProp("onActivate", (ev) => {
      editAndUpdate();
      return true;
    })
    // @ts-ignore TODO: Fix type in zotero-plugin-toolkit
    .setProp("onColumnSort", (columnIndex, ascending) => {
      addon.data.prefs.columnIndex = columnIndex;
      addon.data.prefs.columnAscending = ascending > 0;
      updateCachedActionKeys();
      updateUI();
    })
    // Render the table.
    .render(-1, () => {
      renderLock.resolve();
    });
  await renderLock.promise;
  updateUI();
}

function initEvents() {
  const doc = addon.data.prefs.window?.document;
  if (!doc) {
    return;
  }
  doc
    .querySelector(`#${config.addonRef}-container`)
    ?.addEventListener("showing", (e) => {
      updateUI();
    });

  doc
    .querySelector(`#${config.addonRef}-action-add`)
    ?.addEventListener("command", (e) => {
      const key = addon.api.actionManager.updateAction(
        Object.assign({}, emptyAction),
      );
      updateUI();
      editAndUpdate(key);
    });

  doc
    .querySelector(`#${config.addonRef}-action-remove`)
    ?.addEventListener("command", (e) => {
      getSelection().forEach((currentKey) => {
        addon.api.actionManager.deleteAction(currentKey!);
      });
      updateUI();
    });

  doc
    .querySelector(`#${config.addonRef}-action-edit`)
    ?.addEventListener("command", async (e) => {
      await editAndUpdate();
    });

  doc
    .querySelector(`#${config.addonRef}-action-duplicate`)
    ?.addEventListener("command", async (e) => {
      const newAction = Object.assign(
        {},
        addon.data.actions.map.get(addon.data.actions.selectedKey!),
      );
      if (newAction.name) {
        // Add (1) (2) ... to the end of the name
        if (newAction.name.match(/\(\d+\)$/)) {
          newAction.name = newAction.name.replace(
            /\((\d+)\)$/,
            (_, num) => `(${parseInt(num) + 1})`,
          );
        } else {
          newAction.name += " (1)";
        }
      } else {
        // Use time as name
        newAction.name = new Date().toLocaleString();
      }
      const key = addon.api.actionManager.updateAction(newAction);
      updateUI();
      await editAndUpdate(key);
    });

  doc
    .querySelector(`#${config.addonRef}-action-export`)
    ?.addEventListener("command", async (e) => {
      await addon.hooks.onActionExport(getSelection(), {
        win: addon.data.prefs.window!,
      });
      updateUI();
    });

  doc
    .querySelector(`#${config.addonRef}-action-import`)
    ?.addEventListener("command", async (e) => {
      await addon.hooks.onActionImport({
        win: addon.data.prefs.window!,
      });
      updateUI();
    });
}

async function editAndUpdate(key?: string) {
  (await addon.hooks.onActionEdit(key)) && updateUI();
}

function updateUI() {
  setTimeout(() => addon.data.prefs.tableHelper?.treeInstance.invalidate());
}

function getRowData(index: number) {
  const keys = addon.data.actions.cachedKeys;
  let action: ActionData = emptyAction;
  if (keys.length > index) {
    const key = keys[index];
    action = addon.data.actions.map.get(key) || emptyAction;
  }
  return {
    event: getString(`prefs-action-event-${ActionEventTypes[action.event]}`),
    operation: getString(
      `prefs-action-operation-${ActionOperationTypes[action.operation]}`,
    ),
    data: action.data,
    shortcut: action.shortcut,
    enabled: action.enabled,
    menu: action.menu || "❌",
    name: action.name || "",
  };
}

function getSelection() {
  const indices = addon.data.prefs.tableHelper?.treeInstance.selection.selected;
  if (!indices) {
    return [];
  }
  const keys = addon.data.actions.cachedKeys;
  return Array.from(indices).map((i) => keys[i]);
}

function setButtonDisabled(button: XUL.Button, disabled: boolean = true) {
  if (disabled) {
    button.setAttribute("disabled", "true");
  } else {
    button.removeAttribute("disabled");
  }
}
