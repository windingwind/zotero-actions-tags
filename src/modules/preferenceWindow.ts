import { ColumnOptions } from "zotero-plugin-toolkit/dist/helpers/virtualizedTable";
import { config } from "../../package.json";
import { getString } from "../utils/locale";
import {
  ActionEventTypes,
  ActionOperationTypes,
  ActionData,
  emptyAction,
} from "../utils/actions";
import { closeWindow, isWindowAlive } from "../utils/window";
import { KeyModifier } from "../utils/shorcut";
import { waitUtilAsync } from "../utils/wait";
import { getPref } from "../utils/prefs";

export async function initPrefPane(_window: Window) {
  // This function is called when the prefs window is opened
  // See addon/chrome/content/preferences.xul onpaneload
  if (!addon.data.prefs) {
    addon.data.prefs = {
      window: _window,
    };
  } else {
    addon.data.prefs.window = _window;
  }
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
      columns: [
        {
          dataKey: "name",
          label: getString("prefs-rule-name"),
        },
        {
          dataKey: "event",
          label: getString("prefs-rule-event"),
        },
        {
          dataKey: "operation",
          label: getString("prefs-rule-operation"),
        },
        {
          dataKey: "data",
          label: getString("prefs-rule-data"),
        },
        {
          dataKey: "shortcut",
          label: getString("prefs-rule-shortcut"),
        },
        {
          dataKey: "menu",
          label: getString("prefs-rule-menu"),
        },
        {
          dataKey: "enabled",
          label: getString("prefs-rule-enabled"),
          type: "checkbox",
          fixedWidth: true,
          width: 70,
        },
      ] as ColumnOptions[],
      showHeader: true,
      multiSelect: true,
      staticColumns: false,
      disableFontSizeScaling: true,
    })
    .setProp("getRowCount", () => addon.data.actions.map.size || 0)
    .setProp("getRowData", getRowData as any)
    // Update selected key when selection changes
    .setProp("onSelectionChange", (selection) => {
      const switchButtons =
        addon.data.prefs.window?.document.querySelectorAll(".rule-selection");
      for (let i = 0; i < addon.data.actions.cachedKeys.length; i++) {
        if (selection.isSelected(i)) {
          addon.data.actions.selectedKey = addon.data.actions.cachedKeys[i];
          switchButtons &&
            switchButtons.forEach((e) => e.removeAttribute("disabled"));
          return;
        }
      }
      addon.data.actions.selectedKey = undefined;
      switchButtons &&
        switchButtons.forEach((e) => e.setAttribute("disabled", "true"));
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
        editAction();
        return false;
      }
      return true;
    })
    .setProp("onActivate", (ev) => {
      editAction();
      return true;
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
    .querySelector(`#${config.addonRef}-rule-add`)
    ?.addEventListener("command", (e) => {
      const key = addon.api.actionManager.updateAction(
        Object.assign({}, emptyAction),
      );
      updateUI();
      editAction(key);
    });

  doc
    .querySelector(`#${config.addonRef}-rule-remove`)
    ?.addEventListener("command", (e) => {
      const currentKey = addon.data.actions.selectedKey;
      addon.api.actionManager.deleteAction(currentKey!);
      updateUI();
    });

  doc
    .querySelector(`#${config.addonRef}-rule-edit`)
    ?.addEventListener("command", (e) => {
      editAction();
    });
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
    event: getString(`prefs-rule-event-${ActionEventTypes[action.event]}`),
    operation: getString(
      `prefs-rule-operation-${ActionOperationTypes[action.operation]}`,
    ),
    data: action.data,
    shortcut: action.shortcut,
    enabled: action.enabled,
    menu: action.menu || "❌",
    name: action.name || "",
  };
}

async function editAction(currentKey?: string) {
  currentKey = currentKey || addon.data.actions.selectedKey;
  if (!currentKey) return;
  const action = addon.data.actions.map.get(currentKey);
  if (!action) return;
  const win = addon.data.prefs?.window;
  if (!isWindowAlive(win)) return;
  closeWindow(addon.data.prefs.dialogWindow!);
  addon.data.prefs.editorInstance = undefined;

  const dialogData: { [key: string | number]: any } = Object.assign({}, action);
  dialogData.shortcut =
    new KeyModifier(action.shortcut || "").getLocalized() ||
    `[${getString("prefs-rule-edit-shortcut-empty")}]`;
  const dialog = new ztoolkit.Dialog(1, 1)
    .setDialogData(dialogData)
    .addCell(0, 0, {
      tag: "div",
      styles: {
        display: "grid",
        gridTemplateColumns: "1fr 4fr",
        rowGap: "10px",
        columnGap: "5px",
      },
      children: [
        {
          tag: "label",
          namespace: "html",
          properties: {
            textContent: getString("prefs-rule-name"),
          },
        },
        {
          tag: "input",
          attributes: {
            "data-bind": "name",
            "data-prop": "value",
          },
          styles: {
            width: "fit-content",
          },
        },
        {
          tag: "label",
          namespace: "html",
          properties: {
            textContent: getString("prefs-rule-event"),
          },
        },
        {
          tag: "select",
          properties: {
            value: action.event,
          },
          attributes: {
            "data-bind": "event",
            "data-prop": "value",
          },
          children: getEnumKeys(ActionEventTypes).map((key) => ({
            tag: "option",
            properties: {
              innerHTML: getString(`prefs-rule-event-${key}`),
              value: ActionEventTypes[key as keyof typeof ActionEventTypes],
            },
          })),
        },
        {
          tag: "label",
          namespace: "html",
          properties: {
            textContent: getString("prefs-rule-operation"),
          },
        },
        {
          tag: "select",
          properties: {
            value: action.operation,
          },
          attributes: {
            "data-bind": "operation",
            "data-prop": "value",
          },
          children: getEnumKeys(ActionOperationTypes).map((key) => ({
            tag: "option",
            properties: {
              innerHTML: getString(`prefs-rule-operation-${key}`),
              value:
                ActionOperationTypes[key as keyof typeof ActionOperationTypes],
            },
          })),
        },
        {
          tag: "label",
          namespace: "html",
          properties: {
            textContent: getString("prefs-rule-data"),
          },
        },
        {
          tag: "hbox",
          children: [
            {
              tag: "textarea",
              id: "data-input",
              properties: {
                value: action.data,
                rows: 1,
              },
              styles: {
                resize: "none",
                height: "1.2em",
                fontSize: "inherit",
              },
              attributes: {
                "data-bind": "data",
                "data-prop": "value",
              },
            },
            {
              tag: "button",
              properties: {
                textContent: "⤤",
              },
              listeners: [
                {
                  type: "click",
                  listener: async () => {
                    const content = await openEditorWindow(dialogData.data);
                    (
                      dialog.window.document.querySelector(
                        "#data-input",
                      ) as HTMLTextAreaElement
                    ).value = content;
                    dialogData.data = content;
                  },
                },
              ],
            },
          ],
        },
        {
          tag: "label",
          namespace: "html",
          properties: {
            textContent: getString("prefs-rule-shortcut"),
          },
        },
        {
          tag: "button",
          attributes: {
            "data-bind": "shortcut",
            "data-prop": "textContent",
          },
          styles: {
            width: "fit-content",
          },
          listeners: [
            {
              type: "click",
              listener: (ev) => {
                // Record pressed key
                const key = ev.target as HTMLElement;
                const win = dialog.window;
                key.textContent = `[${getString(
                  "prefs-rule-edit-shortcut-placeholder",
                )}]`;
                dialogData.shortcut = "";
                const keyDownListener = (e: KeyboardEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const shortcut = new KeyModifier(dialogData.shortcut);
                  shortcut.control = e.ctrlKey;
                  shortcut.meta = e.metaKey;
                  shortcut.shift = e.shiftKey;
                  shortcut.alt = e.altKey;
                  if (
                    !["Shift", "Meta", "Ctrl", "Alt", "Control"].includes(e.key)
                  ) {
                    shortcut.key = e.key;
                  }
                  dialogData.shortcut = shortcut.getLocalized();
                  key.textContent = shortcut.getLocalized();
                };
                const keyUpListener = (e: KeyboardEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  win.removeEventListener("keydown", keyDownListener);
                  win.removeEventListener("keyup", keyUpListener);
                };
                win.addEventListener("keydown", keyDownListener);
                win.addEventListener("keyup", keyUpListener);
              },
            },
          ],
        },
        {
          tag: "label",
          namespace: "html",
          properties: {
            textContent: getString("prefs-rule-menu"),
          },
        },
        {
          tag: "input",
          attributes: {
            "data-bind": "menu",
            "data-prop": "value",
          },
          properties: {
            placeholder: getString("prefs-rule-edit-menu-placeholder"),
          },
          styles: {
            width: "fit-content",
          },
        },
        {
          tag: "label",
          namespace: "html",
          properties: {
            textContent: getString("prefs-rule-enabled"),
          },
        },
        {
          tag: "input",
          properties: {
            type: "checkbox",
            checked: action.enabled,
          },
          attributes: {
            "data-bind": "enabled",
            "data-prop": "checked",
          },
          styles: {
            width: "fit-content",
          },
        },
      ],
    })
    .addButton(getString("prefs-rule-edit-save"), "save")
    .addButton(getString("prefs-rule-edit-cancel"), "cancel")
    .addButton(getString("prefs-rule-edit-delete"), "delete")
    .open(getString("prefs-rule-edit-title"), {
      centerscreen: true,
      noDialogMode: true,
      fitContent: true,
    });
  addon.data.prefs.dialogWindow = dialog.window;
  await dialogData.unloadLock?.promise;
  switch (dialogData._lastButtonId) {
    case "save":
      {
        if (
          Number(dialogData.operation) === ActionOperationTypes.script &&
          !getPref("ruleWarningDisabled") &&
          !win?.confirm(getString("prefs-script-warning"))
        ) {
          break;
        }
        addon.api.actionManager.updateAction(
          {
            event: Number(dialogData.event),
            operation: Number(dialogData.operation),
            data:
              addon.data.prefs.editorInstance?.getValue() || dialogData.data,
            // Replace things inside []
            shortcut: dialogData.shortcut.replace(/\[(.*?)\]/g, ""),
            enabled: dialogData.enabled,
            menu: dialogData.menu,
            name: dialogData.name,
          },
          currentKey,
        );
        updateUI();
      }
      break;
    case "delete": {
      addon.api.actionManager.deleteAction(currentKey);
      updateUI();
      break;
    }
    default:
      break;
  }
  closeWindow(addon.data.prefs.editorWindow!);
}

async function openEditorWindow(content: string) {
  const unloadLock = Zotero.Promise.defer();
  let modifiedContent = content;
  const editorWin = addon.data.prefs.window?.openDialog(
    "chrome://scaffold/content/monaco/monaco.html",
    "monaco",
    "chrome,centerscreen,dialog=no,resizable,scrollbars=yes,width=800,height=600",
  ) as
    | (Window & {
        loadMonaco: (options: Record<string, any>) => Promise<{ editor: any }>;
      })
    | undefined;
  if (!editorWin) {
    return content;
  }
  await waitUtilAsync(() => !!editorWin.loadMonaco);
  const { editor } = await editorWin.loadMonaco({
    language: "javascript",
    theme: "vs-light",
  });
  addon.data.prefs.editorWindow = editorWin;
  addon.data.prefs.editorInstance = editor;
  editorWin.addEventListener("unload", () => {
    modifiedContent = editor.getValue();
    unloadLock.resolve();
  });
  editor.setValue(content);
  await unloadLock.promise;
  return modifiedContent;
}

function getEnumKeys(v: any): string[] {
  return Object.values(v).filter((key) => typeof key === "string") as string[];
}
