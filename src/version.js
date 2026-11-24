// Which version of Refill is running. The committed file says "development";
// when GitHub publishes the site, scripts/stamp-version.mjs writes in the
// commit's short hash and date (see .github/workflows/pages.yml).
export const COMMIT = "development";
export const DATE = "";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function versionLabel(commit = COMMIT, date = DATE) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return `Refill ${commit}`;
  return `Refill ${commit} · ${Number(match[3])} ${MONTHS[Number(match[2]) - 1]} ${match[1]}`;
}
