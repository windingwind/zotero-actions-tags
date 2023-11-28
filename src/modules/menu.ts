import { TagElementProps } from "zotero-plugin-toolkit/dist/tools/ui";
import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { getPref } from "../utils/prefs";
import { ActionData, ActionShowInMenu } from "../utils/actions";
import { getCurrentItems } from "../utils/items";

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

  ztoolkit.UI.appendElement(
    {
      tag: "menupopup",
      id: `${config.addonRef}-reader-popup`,
      listeners: [
        {
          type: "popupshowing",
          listener: (ev) => {
            addon.hooks.onMenuEvent("showing", { window, target: "reader" });
          },
        },
      ],
    },
    win.document.querySelector("popupset")!
  );
}

function initReaderMenu() {
  const image =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAAA40lEQVRYCWP8//8/AyFwJL/hjsbXJ8oEFSKBG9wyd20mNqgQUsdESMGCypkppFoOAiA924s711PsAOmfb2NItRwGWP7/FaTYAbQGow4YdcCoA0YdMOqAUQcMuANYCCm4yS394AWboD05hn9k5XrgSqkDjgloPiDHcih4kENAwWgaGHXAqAModcBFKB4QB4AsdoBish1BrgPAli8rNvsAwpQ4ghwHLIRZDhNAcsRCUg0jWBSjW76s2CwBmwTUEQlRvadA3HhiDSQlBHBajuYQkBqiQ4JYBxQSYzmaIwoJKmRgYAAAgCNBYXH3oBUAAAAASUVORK5CYII=";
  const readerButtonCSS = `
.actions-tags-reader-menu::before {
  background-image: url(${image});
  background-size: 100%;
  content: "";
  display: inline-block;
  height: 16px;
  vertical-align: top;
  width: 16px;
}
.actions-tags-reader-menu .dropmarker {
  background: url(assets/icons/searchbar-dropmarker@2x.4ebeb64c.png) no-repeat 0 0/100%;
  display: inline-block;
  height: 4px;
  margin: 6px 0;
  margin-inline-start: 2px;
  position: relative;
  vertical-align: top;
  width: 7px;
  z-index: 1;
}
`;
  Zotero.Reader.registerEventListener("renderToolbar", (event) => {
    const { append, doc } = event;
    append(
      ztoolkit.UI.createElement(doc, "button", {
        namespace: "html",
        classList: ["toolbarButton", "actions-tags-reader-menu"],
        properties: {
          tabIndex: -1,
          title: "Actions",
        },
        listeners: [
          {
            type: "click",
            listener: (ev: Event) => {
              const _ev = ev as MouseEvent;
              const target = ev.target as HTMLElement;
              const elemRect = target.getBoundingClientRect();

              const x = _ev.screenX - _ev.offsetX;
              const y =
                _ev.screenY - _ev.offsetY + elemRect.bottom - elemRect.top;

              document
                .querySelector(`#${config.addonRef}-reader-popup`)
                // @ts-ignore XUL.MenuPopup
                ?.openPopupAtScreen(x + 1, y + 1, true);
            },
          },
        ],
        children: [
          {
            tag: "span",
            classList: ["button-background"],
          },
          {
            tag: "span",
            classList: ["dropmarker"],
          },
        ],
      })
    );
    append(
      ztoolkit.UI.createElement(doc, "style", {
        id: `${config.addonRef}-reader-button`,
        properties: {
          textContent: readerButtonCSS,
        },
      })
    );
  });
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
            triggerMenuCommand(
              action.key,
              reader._item.libraryID,
              ...params.ids
            );
          },
        });
      }
    }
  );
}

function buildItemMenu(win: Window, target: "item" | "reader") {
  const doc = win.document;
  const popup = doc.querySelector(
    `#${config.addonRef}-${target}-popup`
  ) as XUL.MenuPopup;
  // Remove all children in popup
  while (popup.firstChild) {
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

function getActionsByMenu(target: ActionShowInMenu) {
  const sortBy = (getPref("menuSortBy") || "menu") as keyof ActionData;
  return Array.from(addon.data.actions.map.keys())
    .map((k) => Object.assign({}, addon.data.actions.map.get(k), { key: k }))
    .filter(
      (action) =>
        action &&
        action.menu &&
        action.enabled &&
        (!action.showInMenu || action.showInMenu[target] !== false)
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
        Zotero.locale
      );
    });
}

async function triggerMenuCommand(
  key: string,
  libraryID?: number,
  ...itemKeys: string[]
) {
  let items: Zotero.Item[];
  if (libraryID && itemKeys) {
    items = itemKeys
      .map((key) => Zotero.Items.getByLibraryAndKey(libraryID, key))
      .filter((item) => item) as Zotero.Item[];
  } else {
    items = getCurrentItems();
  }
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
