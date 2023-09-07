import { ColumnOptions } from "zotero-plugin-toolkit/dist/helpers/virtualizedTable";
import { config } from "../../package.json";
import { getString } from "../utils/locale";
import {
  TagEventTypes,
  TagOperationTypes,
  TagRule,
  emptyRule,
  updateCachedRuleKeys,
} from "../utils/rules";
import { closeWindow, isWindowAlive } from "../utils/window";
import { KeyModifier } from "../utils/shorcut";
import { waitUtilAsync } from "../utils/wait";

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
  updateCachedRuleKeys();
  addon.data.prefs.tableHelper = new ztoolkit.VirtualizedTable(
    addon.data.prefs.window!,
  )
    .setContainerId(`${config.addonRef}-table-container`)
    .setProp({
      id: `${config.addonRef}-prefs-table`,
      columns: getColumnsData(),
      showHeader: true,
      multiSelect: true,
      staticColumns: false,
      disableFontSizeScaling: true,
    })
    .setProp("renderItem", renderItem)
    .setProp("getRowCount", () => addon.data.rules.data.size || 0)
    .setProp("getRowData", getRowData as any)
    // Update selected key when selection changes
    .setProp("onSelectionChange", (selection) => {
      const switchButtons =
        addon.data.prefs.window?.document.querySelectorAll(".rule-selection");
      for (let i = 0; i < addon.data.rules.cachedKeys.length; i++) {
        if (selection.isSelected(i)) {
          addon.data.rules.selectedKey = addon.data.rules.cachedKeys[i];
          switchButtons &&
            switchButtons.forEach((e) => e.removeAttribute("disabled"));
          return;
        }
      }
      addon.data.rules.selectedKey = undefined;
      switchButtons &&
        switchButtons.forEach((e) => e.setAttribute("disabled", "true"));
    })
    // When pressing delete, delete selected line and refresh table.
    // Returning false to prevent default event.
    .setProp("onKeyDown", (event: KeyboardEvent) => {
      if (event.key == "Delete" || (Zotero.isMac && event.key == "Backspace")) {
        addon.data.rules.data.delete(addon.data.rules.selectedKey!);
        updateUI();
        return false;
      }
      if (event.key == "Enter") {
        editRule();
        return false;
      }
      return true;
    })
    // Render the table.
    .render(-1, () => {
      renderLock.resolve();
    });
  await renderLock.promise;
  ztoolkit.log("Preference table rendered!");
}

function initEvents() {
  addon.data.prefs.window?.addEventListener("focus", () => {
    if (isWindowAlive(addon.data.prefs.dialogWindow)) {
      addon.data.prefs.dialogWindow?.focus();
    }
  });
  addon.data.prefs.window?.addEventListener("click", () => {
    if (isWindowAlive(addon.data.prefs.dialogWindow)) {
      addon.data.prefs.dialogWindow?.focus();
    }
  });

  addon.data.prefs.window?.document
    .querySelector(`#${config.addonRef}-rule-add`)
    ?.addEventListener("command", (e) => {
      const newKey = `${Date.now()}`;
      addon.data.rules.data.set(newKey, Object.assign({}, emptyRule));
      updateUI();
      editRule(newKey);
    });

  addon.data.prefs.window?.document
    .querySelector(`#${config.addonRef}-rule-remove`)
    ?.addEventListener("command", (e) => {
      const currentKey = addon.data.rules.selectedKey;
      addon.data.rules.data.delete(currentKey!);
      updateUI();
    });

  addon.data.prefs.window?.document
    .querySelector(`#${config.addonRef}-rule-edit`)
    ?.addEventListener("command", (e) => {
      const currentKey = addon.data.rules.selectedKey;
      editRule(currentKey);
    });
}

function updateUI() {
  updateCachedRuleKeys();
  addon.data.prefs.tableHelper?.render();
}

function getColumnsData(): ColumnOptions[] {
  return [
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
      dataKey: "enabled",
      label: getString("prefs-rule-enabled"),
    },
  ];
}

function getRowData(index: number) {
  if (addon.data.rules.cachedKeys.length == 0) updateCachedRuleKeys();
  const keys = addon.data.rules.cachedKeys;
  let rule: TagRule = emptyRule;
  if (keys.length > index) {
    const key = keys[index];
    rule = addon.data.rules.data.get(key) || emptyRule;
  }
  return rule;
}

type renderItemType = Parameters<
  InstanceType<ZToolkit["VirtualizedTable"]>["setProp"]
>[0]["renderItem"];

const renderItem = <renderItemType>(
  function (index, selection, oldDiv, columns) {
    const win = addon.data.prefs?.window;
    if (!win || !isWindowAlive(win)) {
      return;
    }
    const doc = win.document;

    const rowData = getRowData(index);
    const key = addon.data.rules.cachedKeys[index];

    let div;
    if (oldDiv) {
      div = oldDiv;
      div.innerHTML = "";
    } else {
      div = doc.createElement("div");
      div.className = "row";
      div.addEventListener("dblclick", () => {
        editRule();
      });
    }

    div.classList.toggle("selected", selection.isSelected(index));
    div.classList.toggle("focused", selection.focused == index);
    div.classList.remove("drop", "drop-before", "drop-after");

    for (const column of columns) {
      const cell = renderCell(
        index,
        key,
        rowData[column.dataKey as keyof TagRule],
        column as ColumnOptions & { className: string },
      );
      cell && div.appendChild(cell);
    }
    return div;
  }
);

function renderCell<T extends keyof TagRule>(
  index: number,
  key: string,
  data: TagRule[T],
  column: ColumnOptions & { className: string },
) {
  const win = addon.data.prefs?.window;
  if (!win || !isWindowAlive(win)) {
    return;
  }
  const doc = win.document;
  const cell = doc.createElement("span");
  cell.className = `cell ${column.className}`;
  switch (column.dataKey) {
    case "event": {
      cell.setAttribute(
        "data-l10n-id",
        `${config.addonRef}-prefs-rule-event-${
          TagEventTypes[data as keyof typeof TagEventTypes]
        }`,
      );
      break;
    }
    case "operation": {
      cell.setAttribute(
        "data-l10n-id",
        `${config.addonRef}-prefs-rule-operation-${
          TagOperationTypes[data as keyof typeof TagOperationTypes]
        }`,
      );
      break;
    }
    case "data": {
      cell.textContent = data as string;
      break;
    }
    case "shortcut": {
      cell.textContent = (data as string) || "";
      break;
    }
    case "enabled": {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = !!data;
      checkbox.addEventListener("change", (e) => {
        const currentRule = addon.data.rules.data.get(key) || emptyRule;
        addon.data.rules.data.set(key, {
          ...currentRule,
          enabled: (e.target as HTMLInputElement).checked,
        });
      });
      cell.appendChild(checkbox as any);
      break;
    }
  }
  return cell;
}

async function editRule(currentKey?: string) {
  currentKey = currentKey || addon.data.rules.selectedKey;
  if (!currentKey) return;
  const rule = addon.data.rules.data.get(currentKey);
  if (!rule) return;
  const win = addon.data.prefs?.window;
  if (!isWindowAlive(win)) return;
  closeWindow(addon.data.prefs.dialogWindow!);

  const dialogData: { [key: string | number]: any } = Object.assign({}, rule);
  dialogData.shortcut =
    new KeyModifier(rule.shortcut || "").getLocalized() ||
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
            textContent: getString("prefs-rule-event"),
          },
        },
        {
          tag: "select",
          properties: {
            value: rule.event,
          },
          attributes: {
            "data-bind": "event",
            "data-prop": "value",
          },
          children: getEnumKeys(TagEventTypes).map((key) => ({
            tag: "option",
            properties: {
              innerHTML: getString(`prefs-rule-event-${key}`),
              value: TagEventTypes[key as keyof typeof TagEventTypes],
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
            value: rule.operation,
          },
          attributes: {
            "data-bind": "operation",
            "data-prop": "value",
          },
          children: getEnumKeys(TagOperationTypes).map((key) => ({
            tag: "option",
            properties: {
              innerHTML: getString(`prefs-rule-operation-${key}`),
              value: TagOperationTypes[key as keyof typeof TagOperationTypes],
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
                value: rule.data,
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
          listeners: [
            {
              type: "click",
              listener: (ev) => {
                // Record pressed key
                const key = ev.target as HTMLElement;
                const win = dialog.window;
                key.textContent = `[${getString(
                  "prefs-rule-edit-shortcut-placholder",
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
            textContent: getString("prefs-rule-enabled"),
          },
        },
        {
          tag: "input",
          properties: {
            type: "checkbox",
            checked: rule.enabled,
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
    .addButton("Save", "save")
    .addButton("Cancel", "cancel")
    .open(getString("prefs-rule-edit-title"), {
      centerscreen: true,
      noDialogMode: true,
      fitContent: true,
      alwaysRaised: true,
    });
  addon.data.prefs.dialogWindow = dialog.window;
  await dialogData.unloadLock?.promise;
  switch (dialogData._lastButtonId) {
    case "save":
      {
        addon.data.rules.data.set(currentKey, {
          event: Number(dialogData.event),
          operation: Number(dialogData.operation),
          data: addon.data.prefs.editorInstance?.getValue() || dialogData.data,
          // Replace things inside []
          shortcut: dialogData.shortcut.replace(/\[(.*?)\]/g, ""),
          enabled: dialogData.enabled,
        });
        updateUI();
      }
      break;
    default:
      break;
  }
  closeWindow(addon.data.prefs.editorWindow!);
}

async function openEditorWindow(content: string) {
  const unloadLock = Zotero.Promise.defer();
  let modifiedContent = content;
  // @ts-ignore
  const editorWin = addon.data.prefs.window?.openDialog(
    "chrome://scaffold/content/monaco/monaco.html",
    "monaco",
    "chrome,centerscreen,dialog=no,resizable,scrollbars=yes,width=800,height=600",
  );
  await waitUtilAsync(() => editorWin?.loadMonaco);
  const { monaco, editor } = await editorWin.loadMonaco({
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
