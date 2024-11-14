import { TagElementProps } from "zotero-plugin-toolkit";
import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { getPref } from "../utils/prefs";
import { ActionData, ActionShowInMenu } from "../utils/actions";
import { getCurrentItems, getItemIDsByKey } from "../utils/items";
import { getIcon } from "../utils/icon";

export {
  initItemMenu,
  initReaderMenu,
  initReaderAnnotationMenu,
  buildItemMenu,
};

function initItemMenu(win: Window) {
  ztoolkit.Menu.register("item", {
    tag: "menu",
    popupId: `${config.addonRef}-item-popup`,
    label: getString("menupopup-label"),
    icon: `chrome://${config.addonRef}/content/icons/favicon.png`,
    onpopupshowing: `Zotero.${config.addonInstance}.hooks.onMenuEvent("showing", { window, target: "item" })`,
    children: [
      {
        tag: "menuitem",
        label: getString("menupopup-placeholder"),
        disabled: true,
      },
    ],
  });

  ztoolkit.Menu.register("collection", {
    tag: "menu",
    popupId: `${config.addonRef}-collection-popup`,
    label: getString("menupopup-label"),
    icon: `chrome://${config.addonRef}/content/icons/favicon.png`,
    onpopupshowing: `Zotero.${config.addonInstance}.hooks.onMenuEvent("showing", { window, target: "collection" })`,
    children: [
      {
        tag: "menuitem",
        label: getString("menupopup-placeholder"),
        disabled: true,
      },
    ],
  });

  ztoolkit.Menu.register("menuTools", {
    tag: "menu",
    popupId: `${config.addonRef}-tools-popup`,
    label: getString("menupopup-label"),
    icon: `chrome://${config.addonRef}/content/icons/favicon.png`,
    onpopupshowing: `Zotero.${config.addonInstance}.hooks.onMenuEvent("showing", { window, target: "tools" })`,
    children: [
      {
        tag: "menuitem",
        label: getString("menupopup-placeholder"),
        disabled: true,
      },
    ],
  });
}

async function initReaderMenu() {
  // Cache icons
  await getIcon(`chrome://${config.addonRef}/content/icons/icon-20.svg`);
  await getIcon(`chrome://${config.addonRef}/content/icons/dropmarker.svg`);
  Zotero.Reader.registerEventListener(
    "renderToolbar",
    readerToolbarCallback,
    config.addonID,
  );

  Zotero.Reader._readers.forEach(buildReaderMenuButton);
}

function getReaderMenuPopup(reader: _ZoteroTypes.ReaderInstance) {
  const doc = reader._iframe?.ownerDocument;
  if (!doc) {
    return;
  }
  let popup = doc.querySelector(
    `#${config.addonRef}-reader-popup`,
  ) as XUL.MenuPopup;
  if (!popup) {
    popup = ztoolkit.UI.appendElement(
      {
        tag: "menupopup",
        id: `${config.addonRef}-reader-popup`,
        listeners: [
          {
            type: "popupshowing",
            listener: (ev) => {
              addon.hooks.onMenuEvent("showing", {
                window: doc.defaultView,
                target: "reader",
                extraData: {
                  readerID:
                    // Do not pass readerID if the reader is in main window
                    reader._window?.location.href ===
                    "chrome://zotero/content/zoteroPane.xhtml"
                      ? undefined
                      : reader._instanceID,
                },
              });
            },
          },
        ],
      },
      doc.querySelector("popupset")!,
    ) as XUL.MenuPopup;
  }
  return popup;
}

function initReaderAnnotationMenu() {
  Zotero.Reader.registerEventListener(
    "createAnnotationContextMenu",
    (event) => {
      const { append, params, reader } = event;
      const actions = getActionsByMenu("readerAnnotation");
      for (const action of actions) {
        append({
          label: action.menu!,
          onCommand: () => {
            triggerMenuCommand(action.key, () =>
              getItemIDsByKey(reader._item.libraryID, ...params.ids),
            );
          },
        });
      }
    },
    config.addonID,
  );
}

async function buildReaderMenuButton(reader: _ZoteroTypes.ReaderInstance) {
  await reader._initPromise;
  const customSections = reader._iframeWindow?.document.querySelector(
    ".toolbar .custom-sections",
  );
  if (!customSections) {
    return;
  }
  const append = (...args: (string | Node)[]) => {
    customSections.append(
      ...Components.utils.cloneInto(args, reader._iframeWindow, {
        wrapReflectors: true,
        cloneFunctions: true,
      }),
    );
  };

  readerToolbarCallback({
    append,
    reader,
    doc: customSections.ownerDocument,
    type: "renderToolbar",
    params: {},
  });
}

function readerToolbarCallback(
  event: Parameters<_ZoteroTypes.Reader.EventHandler<"renderToolbar">>[0],
) {
  const { append, doc, reader } = event;
  getReaderMenuPopup(reader);
  const button = ztoolkit.UI.createElement(doc, "button", {
    namespace: "html",
    classList: [
      "toolbar-button",
      "toolbar-dropdown-button",
      `${config.addonRef}-reader-button`,
    ],
    properties: {
      tabIndex: -1,
      title: "Actions",
    },
    listeners: [
      {
        type: "click",
        listener: (ev: Event) => {
          // @ts-ignore TODO: update types
          getReaderMenuPopup(reader)?.openPopup(
            doc.querySelector(`.${config.addonRef}-reader-button`),
            "after_start",
          );
        },
      },
    ],
    enableElementRecord: false,
  });
  const buttonIcon = getIcon(
    `chrome://${config.addonRef}/content/icons/icon-20.svg`,
  );
  const dropmarkerIcon = getIcon(
    `chrome://${config.addonRef}/content/icons/dropmarker.svg`,
  );
  button.innerHTML = `${buttonIcon}${dropmarkerIcon}`;
  append(button);
}

function buildItemMenu(
  win: Window,
  target: "item" | "collection" | "tools" | "reader",
  extraData?: { readerID?: string },
) {
  const doc = win.document;
  const popup = doc.querySelector(
    `#${config.addonRef}-${target}-popup`,
  ) as XUL.MenuPopup;
  // Remove all children in popup
  while (popup?.firstChild) {
    popup.removeChild(popup.firstChild);
  }
  // Add new children
  let elemProp: TagElementProps;
  const enabledActions = getActionsByMenu(target);
  if (enabledActions.length === 0) {
    elemProp = {
      tag: "menuitem",
      properties: {
        label: getString("menupopup-placeholder"),
      },
      attributes: {
        disabled: true,
      },
    };
  } else {
    elemProp = {
      tag: "fragment",
      children: enabledActions.map((action) => {
        return {
          tag: "menuitem",
          properties: {
            label:
              action.menu + (action.shortcut ? ` (${action.shortcut})` : ""),
          },
          listeners: [
            {
              type: "command",
              listener: (event) => {
                triggerMenuCommand(
                  action.key,
                  () =>
                    getCurrentItems(target, {
                      asIDs: true,
                      readerID: extraData?.readerID,
                    }),
                  target === "collection",
                );
              },
            },
          ],
        };
      }),
    };
  }
  ztoolkit.UI.appendElement(elemProp, popup);
}

function getActionsByMenu(target: ActionShowInMenu) {
  const sortBy = (getPref("menuSortBy") || "menu") as keyof ActionData;
  return Array.from(addon.data.actions.map.keys())
    .map((k) => Object.assign({}, addon.data.actions.map.get(k), { key: k }))
    .filter(
      (action) =>
        action &&
        action.menu &&
        action.enabled &&
        (!action.showInMenu || action.showInMenu[target] !== false),
    )
    .sort((x, y) => {
      if (!x && !y) {
        return 0;
      }
      if (!x) {
        return -1;
      }
      if (!y) {
        return 1;
      }
      return ((x[sortBy] as string) || "").localeCompare(
        (y[sortBy] || "") as string,
        Zotero.locale,
      );
    });
}

async function triggerMenuCommand(
  key: string,
  getItemIDs: () => number[] | Promise<number[]>,
  withCollection: boolean = false,
) {
  const itemIDs = await getItemIDs();
  let collection: Zotero.Collection | undefined = undefined;
  if (withCollection) {
    collection = Zotero.getActiveZoteroPane().getSelectedCollection();
  }

  // Trigger action for all items
  await addon.api.actionManager.dispatchActionByKey(key, {
    itemIDs,
    collectionID: collection?.id,
    triggerType: "menu",
  });
  // Trigger action for each item
  for (const itemID of itemIDs) {
    await addon.api.actionManager.dispatchActionByKey(key, {
      itemID,
      collectionID: collection?.id,
      triggerType: "menu",
    });
  }
}
