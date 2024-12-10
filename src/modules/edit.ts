import { KeyModifier } from "zotero-plugin-toolkit";
import { ActionEventTypes, ActionOperationTypes } from "../utils/actions";
import { getString } from "../utils/locale";
import { getPref } from "../utils/prefs";
import { waitUtilAsync } from "../utils/wait";
import { closeWindow, isWindowAlive } from "../utils/window";

export { editAction };

async function editAction(currentKey?: string) {
  let edited = false;
  currentKey = currentKey || addon.data.actions.selectedKey;
  if (!currentKey) return false;
  const action = addon.data.actions.map.get(currentKey);
  if (!action) return false;
  const win = addon.data.prefs?.window;
  if (!isWindowAlive(win)) return false;
  closeWindow(addon.data.prefs.dialogWindow!);
  addon.data.prefs.editorInstance = undefined;

  const dialogData: { [key: string | number]: any } = Object.assign({}, action);
  dialogData.shortcut =
    new KeyModifier(action.shortcut || "").getLocalized() ||
    `[${getString("prefs-action-edit-shortcut-empty")}]`;
  dialogData.showInMenuItem = !(action.showInMenu?.item === false);
  dialogData.showInMenuCollection = !(action.showInMenu?.collection === false);
  dialogData.showInMenuTools = !(action.showInMenu?.tools === false);
  dialogData.showInMenuReader = !(action.showInMenu?.reader === false);
  dialogData.showInMenuReaderAnnotation = !(
    action.showInMenu?.readerAnnotation === false
  );
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
            textContent: getString("prefs-action-name"),
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
            textContent: getString("prefs-action-event"),
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
              innerHTML: getString(`prefs-action-event-${key}`),
              value: ActionEventTypes[key as keyof typeof ActionEventTypes],
            },
          })),
        },
        {
          tag: "label",
          namespace: "html",
          properties: {
            textContent: getString("prefs-action-operation"),
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
              innerHTML: getString(`prefs-action-operation-${key}`),
              value:
                ActionOperationTypes[key as keyof typeof ActionOperationTypes],
            },
          })),
        },
        {
          tag: "label",
          namespace: "html",
          properties: {
            textContent: getString("prefs-action-data"),
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
            textContent: getString("prefs-action-shortcut"),
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
                  "prefs-action-edit-shortcut-placeholder",
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
            textContent: getString("prefs-action-menu"),
          },
        },
        {
          tag: "div",
          styles: {
            display: "grid",
            gridTemplateColumns: "3fr 1fr",
            rowGap: "10px",
            columnGap: "5px",
          },
          children: [
            {
              tag: "input",
              attributes: {
                "data-bind": "menu",
                "data-prop": "value",
              },
              properties: {
                placeholder: getString("prefs-action-edit-menu-placeholder"),
              },
              styles: {
                width: "fit-content",
                gridColumnStart: "1",
                gridColumnEnd: "3",
              },
            },
            ...["Item", "Collection", "Tools", "Reader", "ReaderAnnotation"]
              .map((key) => [
                {
                  tag: "label",
                  namespace: "html",
                  properties: {
                    textContent: getString(`prefs-action-showInMenu${key}`),
                  },
                },
                {
                  tag: "input",
                  properties: {
                    type: "checkbox",
                  },
                  attributes: {
                    "data-bind": `showInMenu${key}`,
                    "data-prop": "checked",
                  },
                  styles: {
                    width: "fit-content",
                  },
                },
              ])
              .flat(),
          ],
        },
        {
          tag: "label",
          namespace: "html",
          properties: {
            textContent: getString("prefs-action-enabled"),
          },
        },
        {
          tag: "input",
          properties: {
            type: "checkbox",
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
    .addButton(getString("prefs-action-edit-save"), "save")
    .addButton(getString("prefs-action-edit-cancel"), "cancel")
    .addButton(getString("prefs-action-edit-delete"), "delete")
    .open(getString("prefs-action-edit-title"), {
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
            showInMenu: {
              item: dialogData.showInMenuItem,
              collection: dialogData.showInMenuCollection,
              tools: dialogData.showInMenuTools,
              reader: dialogData.showInMenuReader,
              readerAnnotation: dialogData.showInMenuReaderAnnotation,
            },
          },
          currentKey,
        );
        edited = true;
      }
      break;
    case "delete": {
      addon.api.actionManager.deleteAction(currentKey);
      edited = true;
      break;
    }
    default:
      break;
  }
  closeWindow(addon.data.prefs.editorWindow!);
  addon.data.prefs.window?.focus();
  return edited;
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
        loadMonaco: (
          options: Record<string, any>,
        ) => Promise<{ editor: any; monaco: any }>;
      })
    | undefined;
  if (!editorWin) {
    return content;
  }
  await waitUtilAsync(() => !!editorWin.loadMonaco);
  const isDark = addon.data.prefs.window?.matchMedia(
    "(prefers-color-scheme: dark)",
  )?.matches;
  const { editor, monaco } = await editorWin.loadMonaco({
    language: "javascript",
    theme: "vs-" + (isDark ? "dark" : "light"),
    // allowNonTsExtensions: true,
    // allowJs: true,
    // checkJs: true,
  });

  const model = monaco.editor.createModel(
    "",
    "javascript",
    monaco.Uri.parse("inmemory:///translator.js"),
  );
  editor.setModel(model);

  const req = await Zotero.HTTP.request(
    "GET",
    `chrome://${addon.data.config.addonRef}/content/action-types.d.ts`,
  );

  const tsLib = req.responseText;

  const tsLibPath = "ts:filename/index.d.ts";
  monaco.languages.typescript.javascriptDefaults.addExtraLib(tsLib, tsLibPath);
  addon.data.prefs.editorWindow = editorWin;
  addon.data.prefs.editorInstance = editor;
  editorWin.addEventListener("unload", () => {
    modifiedContent = editor.getValue();
    unloadLock.resolve();
  });
  editor.setValue(content);
  editorWin.document.querySelector("title")!.textContent =
    "Action Script Editor";
  await unloadLock.promise;
  addon.data.prefs.dialogWindow?.focus();
  return modifiedContent;
}

function getEnumKeys(v: any): string[] {
  return Object.values(v).filter((key) => typeof key === "string") as string[];
}
