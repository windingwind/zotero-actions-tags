import { TagElementProps } from "zotero-plugin-toolkit/dist/tools/ui";
import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { getPref } from "../utils/prefs";
import { ActionData } from "../utils/actions";

export { initMenu, buildItemMenu };

function initMenu() {
  ztoolkit.Menu.register("item", {
    tag: "menu",
    popupId: `${config.addonRef}-itemPopup`,
    label: getString("menupopup-label"),
    icon: `chrome://${config.addonRef}/content/icons/favicon.png`,
    onpopupshowing: `Zotero.${config.addonInstance}.hooks.onMenuEvent("showing", { window })`,
    children: [
      {
        tag: "menuitem",
        label: getString("menupopup-placeholder"),
        disabled: true,
      },
    ],
  });
}

function buildItemMenu(win: Window) {
  const doc = win.document;
  const popup = doc.querySelector(
    `#${config.addonRef}-itemPopup`
  ) as XUL.MenuPopup;
  // Remove all children in popup
  while (popup.firstChild) {
    popup.removeChild(popup.firstChild);
  }
  // Add new children
  let elemProp: TagElementProps;
  const enabledActions = getActionsByMenu();
  if (enabledActions.length === 0) {
    elemProp = {
      tag: "menuitem",
      properties: {
        label: getString("menupopup-placeholder"),
        disabled: true,
      },
    };
  } else {
    ztoolkit.UI.appendElement(
      {
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
                  triggerMenuCommand(action.key);
                },
              },
            ],
          };
        }),
      },
      popup
    );
  }
}

function getActionsByMenu() {
  const sortBy = (getPref("menuSortBy") || "menu") as keyof ActionData;
  return Array.from(addon.data.actions.map.keys())
    .map((k) => Object.assign({}, addon.data.actions.map.get(k), { key: k }))
    .filter((action) => action && action.menu && action.enabled)
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
        Zotero.locale
      );
    });
}

async function triggerMenuCommand(key: string) {
  const items = Zotero.getActiveZoteroPane().getSelectedItems();
  // Trigger action for all items
  await addon.api.actionManager.dispatchActionByKey(key, {
    itemIDs: items.map((item) => item.id),
  });
  // Trigger action for each item
  for (const item of items) {
    await addon.api.actionManager.dispatchActionByKey(key, {
      itemID: item.id,
    });
  }
}
