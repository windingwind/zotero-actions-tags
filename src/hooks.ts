import { config, homepage } from "../package.json";
import { getString, initLocale } from "./utils/locale";
import { initPrefPane } from "./modules/preferenceWindow";
import { initRules } from "./utils/rules";
import { initNotifierObserver } from "./modules/notify";
import { initShortcuts } from "./modules/shortcuts";
import { initMenu } from "./modules/menu";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);
  initLocale();

  initRules();

  initNotifierObserver();

  ztoolkit.PreferencePane.register({
    pluginID: config.addonID,
    src: rootURI + "chrome/content/preferences.xhtml",
    label: getString("prefs-title"),
    defaultXUL: true,
    helpURL: homepage,
  });

  await onMainWindowLoad(window);
}

async function onMainWindowLoad(win: Window): Promise<void> {
  initShortcuts(win);
  // initMenu();
}

async function onMainWindowUnload(win: Window): Promise<void> {}

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

// Add your hooks here. For element click, etc.
// Keep in mind hooks only do dispatch. Don't add code that does real jobs in hooks.
// Otherwise the code would be hard to read and maintian.

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  onPrefsEvent,
};
