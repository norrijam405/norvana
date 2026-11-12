/** Fictional, local-only negotiation demonstration. No messaging API exists. */
export type DemoMessage = { id: string; role: "BUYER" | "SELLER"; text: string; sent: false };
export const DEMO_MESSAGE_TEMPLATES = [
  { id: "availability", label: "Is this item still available?", text: "Hi! Is the item still available?" },
  { id: "bundle", label: "Ask about a bundle", text: "Would you consider a bundle offer for the selected items?" },
  { id: "condition", label: "Ask about condition", text: "Could you tell me more about the item's condition?" },
  { id: "pickup", label: "Discuss a public meetup", text: "Would you be comfortable discussing a public exchange location once both sides agree?" },
] as const;
export function demoMessageFromTemplate(id: string): DemoMessage | null {
  const template = DEMO_MESSAGE_TEMPLATES.find(item => item.id === id);
  if (!template) return null;
  return { id: template.id, role: "BUYER", text: template.text, sent: false };
}
export function messagePreviewGuard(): { permitted: false; code: "NO_REAL_MESSAGING_AUTHORIZED" } {
  return { permitted: false, code: "NO_REAL_MESSAGING_AUTHORIZED" };
}
