import { ProgressWindowHelper } from "zotero-plugin-toolkit/dist/helpers/progressWindow";
import {
  ColumnOptions,
  VirtualizedTableHelper,
} from "zotero-plugin-toolkit/dist/helpers/virtualizedTable";
import { createZToolkit } from "./utils/ztoolkit";
import { ActionMap } from "./utils/actions";
import hooks from "./hooks";
import api from "./api";

class Addon {
  public data: {
    alive: boolean;
    // Env type, see build.js
    env: "development" | "production";
    ztoolkit: ZToolkit;
    locale?: {
      current: any;
    };
    prefs: {
      window?: Window;
      tableHelper?: VirtualizedTableHelper;
      dialogWindow?: Window;
      editorWindow?: Window;
      editorInstance?: any;
      columns: ColumnOptions[];
      columnIndex: number;
      columnAscending: boolean;
    };
    actions: {
      map: ActionMap;
      cachedKeys: string[];
      selectedKey?: string;
    };
    tabStatus: Map<string, number>;
    hint: {
      total: number;
      current: number;
      progressHelper?: ProgressWindowHelper;
    };
  };
  // Lifecycle hooks
  public hooks: typeof hooks;
  // APIs
  public api: typeof api;

  constructor() {
    this.data = {
      alive: true,
      env: __env__,
      ztoolkit: createZToolkit(),
      prefs: {
        columns: [],
        columnIndex: 0,
        columnAscending: false,
      },
      actions: {
        map: new Map(),
        cachedKeys: [],
      },
      tabStatus: new Map(),
      hint: {
        total: 0,
        current: 0,
      },
    };
    this.hooks = hooks;
    this.api = api;
  }
}

export default Addon;
