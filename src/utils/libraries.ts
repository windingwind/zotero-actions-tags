import { getPref, setPref } from "./prefs";

export {
  getAutomationLibraries,
  getDisabledLibraryIDs,
  isLibraryAutomationDisabled,
  setLibraryAutomationDisabled,
};

function getDisabledLibraryIDs(): number[] {
  return String(getPref("disabledLibraries") || "")
    .split(",")
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => Number.isInteger(id));
}

function setLibraryAutomationDisabled(libraryID: number, disabled: boolean) {
  const ids = new Set(getDisabledLibraryIDs());
  if (disabled) {
    ids.add(libraryID);
  } else {
    ids.delete(libraryID);
  }
  setPref("disabledLibraries", Array.from(ids).join(","));
}

function isLibraryAutomationDisabled(libraryID?: number): boolean {
  if (typeof libraryID !== "number") {
    return false;
  }
  return getDisabledLibraryIDs().includes(libraryID);
}

function getAutomationLibraries() {
  // Feed items never trigger automation; only offer user/group libraries.
  return Zotero.Libraries.getAll().filter(
    (library) => library.libraryType !== "feed",
  );
}
