import {
  dispatchEventAction,
  dispatchMenuAction,
  dispatchShortcutAction,
} from "./modules/events";
import { ClipboardHelper } from "zotero-plugin-toolkit/dist/helpers/clipboard";

const utils = {
  ClipboardHelper,
};

export default {
  dispatchEventAction,
  dispatchShortcutAction,
  dispatchMenuAction,
  utils,
};
