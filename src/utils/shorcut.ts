export { KeyModifierStatus, KeyModifier };

interface KeyModifierStatus {
  accel: boolean;
  shift: boolean;
  control: boolean;
  meta: boolean;
  alt: boolean;
  key: string;
}

class KeyModifier implements KeyModifierStatus {
  accel: boolean;
  shift: boolean;
  control: boolean;
  meta: boolean;
  alt: boolean;
  key: string;

  constructor(raw: string) {
    raw = raw || "";
    raw = this.unLocalized(raw);
    this.accel = raw.includes("accel");
    this.shift = raw.includes("shift");
    this.control = raw.includes("control");
    this.meta = raw.includes("meta");
    this.alt = raw.includes("alt");
    // Remove all modifiers, space, comma, and dash
    this.key = raw.replace(/(accel|shift|control|meta|alt| |,|-)/g, "");
  }

  equals(newMod: KeyModifier) {
    return (
      this.accel === newMod.accel &&
      this.shift === newMod.shift &&
      this.control === newMod.control &&
      this.meta === newMod.meta &&
      this.alt === newMod.alt &&
      this.key === newMod.key
    );
  }

  getRaw() {
    const enabled = [];
    this.accel && enabled.push("accel");
    this.shift && enabled.push("shift");
    this.control && enabled.push("control");
    this.meta && enabled.push("meta");
    this.alt && enabled.push("alt");
    this.key && enabled.push(this.key);
    return enabled.join(",");
  }

  getLocalized() {
    const raw = this.getRaw();
    if (Zotero.isMac) {
      return raw
        .replaceAll("control", "⌃")
        .replaceAll("alt", "⌥")
        .replaceAll("shift", "⇧")
        .replaceAll("meta", "⌘");
    } else {
      return raw
        .replaceAll("control", "Ctrl")
        .replaceAll("alt", "Alt")
        .replaceAll("shift", "Shift")
        .replaceAll("meta", "Win");
    }
  }

  private unLocalized(raw: string) {
    if (Zotero.isMac) {
      return raw
        .replaceAll("⌃", "control")
        .replaceAll("⌥", "alt")
        .replaceAll("⇧", "shift")
        .replaceAll("⌘", "meta");
    } else {
      return raw
        .replaceAll("Ctrl", "control")
        .replaceAll("Alt", "alt")
        .replaceAll("Shift", "shift")
        .replaceAll("Win", "meta");
    }
  }
}
