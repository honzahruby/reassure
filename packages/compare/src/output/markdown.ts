import * as fs from 'fs/promises';
import * as path from 'path';
import * as md from 'ts-markdown-builder';
// @ts-ignore
import markdownTable from 'markdown-table';
import * as logger from '@callstack/reassure-logger';
import {
  formatCount,
  formatDuration,
  formatMetadata,
  formatPercent,
  formatCountChange,
  formatDurationChange,
} from '../utils/format';
import type { AddedEntry, CompareEntry, CompareResult, RemovedEntry, MeasureEntry, RenderIssues } from '../types';
import { disclosure } from '../utils/markdown';

const tableHeader = ['Name', 'Type', 'Duration', 'Count'] as const;

export const writeToMarkdown = async (filePath: string, data: CompareResult) => {
  try {
    const markdown = buildMarkdown(data);
    await writeToFile(filePath, markdown);
  } catch (error: any) {
    logger.error(error);
    throw error;
  }
};

async function writeToFile(filePath: string, content: string) {
  try {
    await fs.writeFile(filePath, content);

    logger.log(`✅  Written output markdown output file ${filePath}`);
    logger.log(`🔗 ${path.resolve(filePath)}\n`);
  } catch (error) {
    logger.error(`❌  Could not write markdown output file ${filePath}`);
    logger.error(`🔗 ${path.resolve(filePath)}`);
    logger.error('Error details:', error);
    throw error;
  }
}

function buildMarkdown(data: CompareResult) {
  let doc = [
    md.heading('Performance Comparison Report', 1),
    md.unorderedList([
      `${md.bold('Current')}: ${formatMetadata(data.metadata.current)}`,
      `${md.bold('Baseline')}: ${formatMetadata(data.metadata.baseline)}`,
    ]),
  ];

  if (data.errors?.length) {
    doc = [...doc, md.heading('Errors', 2), ...data.errors.map((message) => `🛑 ${message}`)];
  }

  if (data.warnings?.length) {
    doc = [...doc, md.heading('Warnings', 2), ...data.warnings.map((message) => `🟡 ${message}`)];
  }

  doc = [
    ...doc,
    md.heading('Significant Changes To Duration', 3),
    buildSummaryTable(data.significant),
    buildDetailsTable(data.significant),
    md.heading('Meaningless Changes To Duration', 3),
    buildSummaryTable(data.meaningless, true),
    buildDetailsTable(data.meaningless),
  ];

  // Skip renders counts if user only has function measurements
  const allEntries = [...data.significant, ...data.meaningless, ...data.added, ...data.removed];
  const hasRenderEntries = allEntries.some((e) => e.type === 'render');
  if (hasRenderEntries) {
    doc = [
      ...doc,
      md.heading('Render Count Changes', 3),
      buildSummaryTable(data.countChanged),
      buildDetailsTable(data.countChanged),
      md.heading('Render Issues', 3),
      buildRenderIssuesTable(data.renderIssues),
    ];
  }

  doc = [
    ...doc,
    md.heading('Added Entries', 3),
    buildSummaryTable(data.added),
    buildDetailsTable(data.added),
    md.heading('Removed Entries', 3),
    buildSummaryTable(data.removed),
    buildDetailsTable(data.removed),
  ];

  return doc.join('\n\n');
}

function buildSummaryTable(entries: Array<CompareEntry | AddedEntry | RemovedEntry>, collapse: boolean = false) {
  if (!entries.length) return md.italic('There are no entries');

  const rows = entries.map((entry) => [entry.name, entry.type, formatEntryDuration(entry), formatEntryCount(entry)]);
  const table = markdownTable([tableHeader, ...rows]) as string;
  return collapse ? disclosure('Show entries', table) : table;
}

function buildDetailsTable(entries: Array<CompareEntry | AddedEntry | RemovedEntry>) {
  if (!entries.length) return '';

  const rows = entries.map((entry) => [
    entry.name,
    entry.type,
    buildDurationDetailsEntry(entry),
    buildCountDetailsEntry(entry),
  ]);

  return disclosure('Show details', markdownTable([tableHeader, ...rows]));
}

function formatEntryDuration(entry: CompareEntry | AddedEntry | RemovedEntry) {
  if (entry.baseline != null && 'current' in entry) return formatDurationChange(entry);
  if (entry.baseline != null) return formatDuration(entry.baseline.meanDuration);
  if ('current' in entry) return formatDuration(entry.current.meanDuration);
  return '';
}

function formatEntryCount(entry: CompareEntry | AddedEntry | RemovedEntry) {
  if (entry.baseline != null && 'current' in entry)
    return formatCountChange(entry.current.meanCount, entry.baseline.meanCount);
  if (entry.baseline != null) return formatCount(entry.baseline.meanCount);
  if ('current' in entry) return formatCount(entry.current.meanCount);
  return '';
}

function buildDurationDetailsEntry(entry: CompareEntry | AddedEntry | RemovedEntry) {
  return [
    entry.baseline != null ? buildDurationDetails('Baseline', entry.baseline) : '',
    'current' in entry ? buildDurationDetails('Current', entry.current) : '',
  ]
    .filter(Boolean)
    .join('<br/><br/>');
}

function buildCountDetailsEntry(entry: CompareEntry | AddedEntry | RemovedEntry) {
  return [
    entry.baseline != null ? buildCountDetails('Baseline', entry.baseline) : '',
    'current' in entry ? buildCountDetails('Current', entry.current) : '',
  ]
    .filter(Boolean)
    .join('<br/><br/>');
}

function buildDurationDetails(title: string, entry: MeasureEntry) {
  const relativeStdev = entry.stdevDuration / entry.meanDuration;

  return [
    md.bold(title),
    `Mean: ${formatDuration(entry.meanDuration)}`,
    `Stdev: ${formatDuration(entry.stdevDuration)} (${formatPercent(relativeStdev)})`,
    entry.durations ? `Runs: ${formatRunDurations(entry.durations)}` : '',
    entry.warmupDurations ? `Warmup runs: ${formatRunDurations(entry.warmupDurations)}` : '',
  ]
    .filter(Boolean)
    .join(`<br/>`);
}

function buildCountDetails(title: string, entry: MeasureEntry) {
  const relativeStdev = entry.stdevCount / entry.meanCount;

  return [
    md.bold(title),
    `Mean: ${formatCount(entry.meanCount)}`,
    `Stdev: ${formatCount(entry.stdevCount)} (${formatPercent(relativeStdev)})`,
    entry.counts ? `Runs: ${entry.counts.map(formatCount).join(' ')}` : '',
    buildRenderIssuesList(entry.issues),
  ]
    .filter(Boolean)
    .join(`<br/>`);
}

function formatRunDurations(values: number[]) {
  return values.map((v) => (Number.isInteger(v) ? `${v}` : `${v.toFixed(1)}`)).join(' ');
}

function buildRenderIssuesTable(entries: Array<CompareEntry | AddedEntry>) {
  if (!entries.length) return md.italic('There are no entries');

  const tableHeader = ['Name', 'Initial Updates', 'Redundant Updates'] as const;
  const rows = entries.map((entry) => [
    entry.name,
    formatInitialUpdates(entry.current.issues?.initialUpdateCount),
    formatRedundantUpdates(entry.current.issues?.redundantUpdates),
  ]);

  return markdownTable([tableHeader, ...rows]);
}

function buildRenderIssuesList(issues: RenderIssues | undefined) {
  if (issues == null) return '';

  const output = ['Render issues:'];
  if (issues?.initialUpdateCount) {
    output.push(` - Initial updates: ${formatInitialUpdates(issues.initialUpdateCount, false)}`);
  }
  if (issues?.redundantUpdates?.length) {
    output.push(` - Redundant updates: ${formatRedundantUpdates(issues.redundantUpdates, false)}`);
  }

  return output.join('<br/>');
}

function formatInitialUpdates(count: number | undefined, showSymbol: boolean = true) {
  if (count == null) return '?';
  if (count === 0) return '-';

  return `${count}${showSymbol ? ' 🔴' : ''}`;
}

function formatRedundantUpdates(redundantUpdates: number[] | undefined, showSymbol: boolean = true) {
  if (redundantUpdates == null) return '?';
  if (redundantUpdates.length === 0) return '-';

  return `${redundantUpdates.length} (${redundantUpdates.join(', ')})${showSymbol ? ' 🔴' : ''}`;
}
