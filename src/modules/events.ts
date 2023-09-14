import { TagEventTypes, TagRuleData, applyRule } from "../utils/rules";
import { KeyModifier } from "../utils/shorcut";

export { dispatchRuleEvents, dispatchRuleShortcuts, dispatchRuleMenu };

async function dispatchRuleEvents(eventType: TagEventTypes, data: TagRuleData) {
  const rules = getRulesByEvent(eventType);
  for (const rule of rules) {
    await applyRule(rule, data);
  }
}

function getRulesByEvent(event: TagEventTypes) {
  return Array.from(addon.data.rules.data.values()).filter(
    (rule) => rule.event === event && rule.enabled
  );
}

async function dispatchRuleShortcuts(shortcut: KeyModifier, data: TagRuleData) {
  const rules = getRulesByShortcuts(shortcut);
  for (const rule of rules) {
    await applyRule(rule, data);
  }
}

function getRulesByShortcuts(shortcut: KeyModifier) {
  return Array.from(addon.data.rules.data.values()).filter(
    (rule) =>
      rule.enabled &&
      rule.shortcut &&
      new KeyModifier(rule.shortcut).equals(shortcut)
  );
}

async function dispatchRuleMenu(key: string, data: TagRuleData) {
  const rule = addon.data.rules.data.get(key);
  if (!rule) {
    return;
  }
  await applyRule(rule, data);
}
