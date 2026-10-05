import type { ConnectionEntry } from "./connections";

export type OwnerAction = {
  id: string;
  priority: "NOW" | "SOON" | "INFO";
  title: string;
  detail: string;
  href?: string;
  actionLabel?: string;
};

export function buildOwnerActions(input: {
  initialized: boolean;
  unresolvedCandidates: number;
  enabledJobs: number;
  totalJobs: number;
  ownerCredentialRotated: boolean;
  connections: Array<{ entry: ConnectionEntry; state: string }>;
  producerInterestEnabled: boolean;
  producerConversationPersistenceEnabled: boolean;
  externalActionsEnabled: boolean;
}): OwnerAction[] {
  const actions: OwnerAction[] = [];

  if (!input.ownerCredentialRotated) {
    actions.push({
      id: "owner-credential",
      priority: "NOW",
      title: "Replace the temporary owner password",
      detail: "Watchtower should not stay on a temporary recovery credential.",
      href: "/admin/account",
      actionLabel: "Open Account",
    });
  }

  if (!input.initialized) {
    actions.push({
      id: "watchtower-init",
      priority: "NOW",
      title: "Initialize Watchtower",
      detail: "The control tables are not available to this deployment yet.",
      href: "/admin",
      actionLabel: "Open Watchtower",
    });
  }

  if (input.unresolvedCandidates > 0) {
    actions.push({
      id: "candidate-inbox",
      priority: "NOW",
      title: input.unresolvedCandidates + " candidate" + (input.unresolvedCandidates === 1 ? "" : "s") + " waiting for review",
      detail: "Scout found items that still need an owner decision.",
      href: "/admin",
      actionLabel: "Review candidates",
    });
  }

  const connectionGaps = input.connections.filter(
    (item) => item.state === "NEEDS_SETUP" || item.state === "PARTIAL"
  );
  if (connectionGaps.length > 0) {
    const firstNames = connectionGaps.slice(0, 3).map((item) => item.entry.name).join(", ");
    actions.push({
      id: "connections",
      priority: "SOON",
      title: connectionGaps.length + " connection" + (connectionGaps.length === 1 ? "" : "s") + " still need setup",
      detail:
        firstNames +
        (connectionGaps.length > 3 ? " +" + (connectionGaps.length - 3) + " more" : ""),
      href: "/admin/connections",
      actionLabel: "Open Connections",
    });
  }

  if (!input.producerInterestEnabled) {
    actions.push({
      id: "producer-interest",
      priority: "SOON",
      title: "Public producer submissions are still in demo mode",
      detail: "The farmer-facing form is visible, but it cannot store submissions until its approved persistence path is enabled.",
      href: "/growers#interest",
      actionLabel: "View producer form",
    });
  }

  if (!input.producerConversationPersistenceEnabled) {
    actions.push({
      id: "producer-notes",
      priority: "INFO",
      title: "Producer call notes are device drafts only",
      detail: "The Watchtower notebook works now, but durable server history is still intentionally locked.",
      href: "/admin/producers",
      actionLabel: "Open notebook",
    });
  }

  if (input.totalJobs > 0 && input.enabledJobs === 0) {
    actions.push({
      id: "watchers-paused",
      priority: "INFO",
      title: "All watchers are paused",
      detail: "Nothing is running in the background unless you deliberately enable a watcher.",
      href: "/admin",
      actionLabel: "Review watchers",
    });
  }

  if (!input.externalActionsEnabled) {
    actions.push({
      id: "act-locked",
      priority: "INFO",
      title: "Consequential actions remain locked",
      detail: "Watchtower can observe and recommend, but it cannot spend money, create shipments, refund, or activate suppliers.",
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: "clear",
      priority: "INFO",
      title: "Nothing urgent needs you",
      detail: "Watchtower has no owner-blocking items at the moment.",
    });
  }

  const order = { NOW: 0, SOON: 1, INFO: 2 };
  return actions.sort((a, b) => order[a.priority] - order[b.priority]);
}
