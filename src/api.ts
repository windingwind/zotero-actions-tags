import {
  dispatchActionByEvent,
  dispatchActionByKey,
  dispatchActionByShortcut,
} from "./modules/dispatch";
import { ExtraFieldTool, ClipboardHelper } from "zotero-plugin-toolkit";
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
