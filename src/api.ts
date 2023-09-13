import { dispatchRuleEvents, dispatchRuleShortcuts } from "./modules/events";
import { ClipboardHelper } from "zotero-plugin-toolkit/dist/helpers/clipboard";

const utils = {
  ClipboardHelper,
};

export default { dispatchRuleEvents, dispatchRuleShortcuts, utils };
