import { config, homepage } from "../package.json";
import { getString, initLocale } from "./utils/locale";
import { initPrefPane } from "./modules/preferenceWindow";
import { ActionEventTypes, initActions } from "./utils/actions";
import { initNotifierObserver } from "./modules/notify";
import { initShortcuts } from "./modules/shortcuts";
import {
  buildItemMenu,
  initItemMenu,
  initReaderAnnotationMenu,
  initReaderMenu,
} from "./modules/menu";
import { editAction } from "./modules/edit";
import { exportToFile, importFromFile } from "./modules/backup";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  // TODO: Remove this after zotero#3387 is merged
  if (__env__ === "development") {
    // Keep in sync with the scripts/startup.mjs
    const loadDevToolWhen = `Plugin ${config.addonID} startup`;
    ztoolkit.log(loadDevToolWhen);
  }

  initLocale();

  initActions();

  initNotifierObserver();

  Zotero.PreferencePanes.register({
    pluginID: config.addonID,
    src: rootURI + "chrome/content/preferences.xhtml",
    label: getString("prefs-title"),
    helpURL: homepage,
    image: rootURI + "chrome/content/icons/favicon.png",
  });

  await addon.api.actionManager.dispatchActionByEvent(
    ActionEventTypes.programStartup,
    {},
  );

  initShortcuts();

  initReaderMenu();

  initReaderAnnotationMenu();

  await onMainWindowLoad(window);
}

async function onMainWindowLoad(win: Window): Promise<void> {
  initItemMenu(win);
  await addon.api.actionManager.dispatchActionByEvent(
    ActionEventTypes.mainWindowLoad,
    {
      window: win,
    },
  );
}

async function onMainWindowUnload(win: Window): Promise<void> {
  await addon.api.actionManager.dispatchActionByEvent(
    ActionEventTypes.mainWindowUnload,
    {
      window: win,
    },
  );
}

function onShutdown(): void {
  ztoolkit.unregisterAll();
  // Remove addon object
  addon.data.alive = false;
  delete Zotero[config.addonInstance];
}

/**
 * This function is just an example of dispatcher for Preference UI events.
 * Any operations should be placed in a function to keep this funcion clear.
 * @param type event type
 * @param data event data
 */
async function onPrefsEvent(type: string, data: { [key: string]: any }) {
  switch (type) {
    case "load":
      initPrefPane(data.window);
      break;
    default:
      return;
  }
}

async function onMenuEvent(type: "showing", data: { [key: string]: any }) {
  switch (type) {
    case "showing":
      buildItemMenu(data.window, data.target);
      break;
    default:
      return;
  }
}

// Add your hooks here. For element click, etc.
// Keep in mind hooks only do dispatch. Don't add code that does real jobs in hooks.
// Otherwise the code would be hard to read and maintian.

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  onPrefsEvent,
  onMenuEvent,
  onActionEdit: editAction,
  onActionExport: exportToFile,
  onActionImport: importFromFile,
};
