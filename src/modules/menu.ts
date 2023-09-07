import { config } from "../../package.json";
import { getString } from "../utils/locale";

export { initMenu };

function initMenu() {
  ztoolkit.Menu.register("item", {
    tag: "menuitem",
    label: getString("menuItem.exportNote"),
    icon: `chrome://${config.addonRef}/content/icons/favicon.png`,
  });
}
