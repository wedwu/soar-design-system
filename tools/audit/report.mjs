// Markdown summary of an audit report, for the CI job summary and PR comments.
const ICON = { pass: '✅', warn: '⚠️', fail: '❌', skipped: '➖', 'n/a': '' };

export function toMarkdown(report) {
  const ids = report.checks.map((c) => c.id);
  const s = report.summary;
  const lines = [
    '## Component audit',
    '',
    `**${s.errors} error(s), ${s.warnings} warning(s), ${s.excepted} excepted** across ${s.components} components (Web Awesome ${report.webAwesome}).`,
    '',
    `| Component | Layer | ${report.checks.map((c) => c.title).join(' | ')} |`,
    `|---|---|${ids.map(() => ':-:').join('|')}|`,
    ...report.rows.map((r) => `| ${r.tag ? `\`${r.tag}\`` : r.name} | ${r.layer} | ${ids.map((id) => ICON[r.results[id].status]).join(' | ')} |`),
    '',
  ];
  const problems = report.rows.flatMap((r) =>
    Object.entries(r.results).flatMap(([check, res]) => res.findings.filter((f) => f.level === 'error' || f.level === 'warn').map((f) => ({ ...f, check, row: r.tag ?? r.name }))),
  );
  if (problems.length) {
    lines.push('### Findings', '');
    for (const f of problems.sort((a, b) => (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1))) {
      lines.push(`- ${f.level === 'error' ? '❌' : '⚠️'} **${f.row}** · ${f.check}/${f.rule}: ${f.message}${f.file ? ` (\`${f.file}\`)` : ''}`);
    }
    lines.push('');
  }
  const skipped = report.checks.filter((c) => c.skipped);
  if (skipped.length) lines.push('### Skipped', '', ...skipped.map((c) => `- **${c.title}**: ${c.skipped}`), '');
  if (report.exceptions.length) {
    lines.push('### Registered exceptions', '', '| Id | Check | Component | Owner | Review by |', '|---|---|---|---|---|');
    for (const e of report.exceptions) lines.push(`| \`${e.id}\` | ${e.check} | \`${e.component}\` | ${e.owner} | ${e.review} |`);
    lines.push('');
  }
  return lines.join('\n');
}
