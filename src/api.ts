import {
  dispatchActionByEvent,
  dispatchActionByKey,
  dispatchActionByShortcut,
} from "./modules/dispatch";
import { ClipboardHelper } from "zotero-plugin-toolkit/dist/helpers/clipboard";
import { ExtraFieldTool } from "zotero-plugin-toolkit/dist/tools/extraField";
import { getActions, updateAction, deleteAction } from "./utils/actions";

const actionManager = {
  dispatchActionByEvent,
  dispatchActionByKey,
  dispatchActionByShortcut,
  getActions,
  updateAction,
  deleteAction,
};

const utils = {
  ClipboardHelper,
  ExtraField: new ExtraFieldTool(),
};

export default {
  actionManager,
  utils,
};
