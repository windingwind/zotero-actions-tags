import { TagElementProps } from "zotero-plugin-toolkit/dist/tools/ui";
import { config } from "../../package.json";
import { getString } from "../utils/locale";

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
  const enabledActions = getRulesByMenu();
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
        children: enabledActions.map((rule) => {
          return {
            tag: "menuitem",
            properties: {
              label: rule.menu,
            },
            listeners: [
              {
                type: "command",
                listener: (event) => {
                  triggerMenuCommand(rule.key);
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

function getRulesByMenu() {
  return Array.from(addon.data.rules.data.keys())
    .map((key) => {
      const rule = addon.data.rules.data.get(key);
      if (rule?.menu && rule?.enabled) {
        return { key, menu: rule.menu };
      }
      return null;
    })
    .filter((rule) => rule) as { key: string; menu: string }[];
}

async function triggerMenuCommand(key: string) {
  const items = Zotero.getActiveZoteroPane().getSelectedItems();
  for (const item of items) {
    await addon.api.dispatchRuleMenu(key, {
      itemID: item.id,
    });
  }
}
