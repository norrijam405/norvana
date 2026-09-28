export function currentWatchtowerRuntimeId() {
  const value =
    process.env.VERCEL_DEPLOYMENT_ID ||
    process.env.NORVANA_RUNTIME_ID ||
    process.env.VERCEL_GIT_COMMIT_SHA;

  const normalized = value?.trim();
  return normalized ? normalized.slice(0, 255) : null;
}
