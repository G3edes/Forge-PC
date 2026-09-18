/**
 * Build exporters: JSON download, clipboard summary and a printable sheet
 * (rendered through the browser's own "save as PDF", so no extra dependency).
 */

import type { BuildExport, BuildSelection, CompatibilityReport } from '@/types/build';
import { CATEGORIES, type ComponentCategory } from '@/types/components';
import { calculateTotal, estimatePower } from './calculations';
import { formatPrice, toSpecRows } from './format';

const DISCLAIMER =
  'Preços, índices de desempenho e temperaturas são estimativas geradas a partir de um catálogo de demonstração (dados mock). Não representam valores reais de mercado.';

interface ExportRow {
  category: ComponentCategory;
  label: string;
  name: string;
  brand: string;
  quantity: number;
  price: number;
  specifications: Record<string, unknown>;
}

function toRows(build: BuildSelection): ExportRow[] {
  const rows: ExportRow[] = [];

  const simple: Array<[ComponentCategory, BuildSelection[keyof BuildSelection]]> = [
    ['cpu', build.cpu],
    ['gpu', build.gpu],
    ['motherboard', build.motherboard],
    ['ram', build.ram],
    ['storage', build.storage],
    ['psu', build.psu],
    ['case', build.case],
    ['cooler', build.cooler],
  ];

  for (const [category, value] of simple) {
    if (!value || Array.isArray(value)) continue;
    rows.push({
      category,
      label: CATEGORIES[category].shortLabel,
      name: value.name,
      brand: value.brand,
      quantity: 1,
      price: value.price,
      specifications: value.specifications,
    });
  }

  for (const fan of build.fans) {
    rows.push({
      category: 'fans',
      label: CATEGORIES.fans.shortLabel,
      name: fan.component.name,
      brand: fan.component.brand,
      quantity: fan.quantity,
      price: fan.component.price * fan.quantity,
      specifications: fan.component.specifications,
    });
  }

  return rows;
}

export function buildExportPayload(
  build: BuildSelection,
  report: CompatibilityReport,
  name: string,
): BuildExport {
  const power = estimatePower(build);
  return {
    application: 'Build Forge — PC Builder 3D',
    version: 1,
    exportedAt: new Date().toISOString(),
    name,
    components: toRows(build).map((row) => ({
      category: row.category,
      id: `${row.category}-${row.name}`,
      name: row.name,
      brand: row.brand,
      quantity: row.quantity,
      price: row.price,
      specifications: row.specifications,
    })),
    totals: {
      price: calculateTotal(build),
      estimatedPowerDraw: power.estimatedDraw,
      recommendedPsu: power.recommendedPsu,
    },
    compatibility: {
      status: report.status,
      issues: report.issues.map((issue) => ({
        severity: issue.severity,
        title: issue.title,
        detail: issue.detail,
      })),
    },
    disclaimer: DISCLAIMER,
  };
}

export function downloadJson(payload: BuildExport, fileName: string): void {
  if (typeof window === 'undefined') return;
  try {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${slugify(fileName)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[build-forge] falha ao exportar JSON', error);
  }
}

/** Plain-text summary suitable for pasting into chat or a forum post. */
export function buildTextSummary(build: BuildSelection, name: string): string {
  const rows = toRows(build);
  const power = estimatePower(build);
  const lines: string[] = [`BUILD FORGE — ${name}`, ''];

  if (rows.length === 0) {
    lines.push('Nenhum componente selecionado.');
  } else {
    const width = Math.max(...rows.map((row) => row.label.length)) + 2;
    for (const row of rows) {
      const quantity = row.quantity > 1 ? `${row.quantity}x ` : '';
      lines.push(
        `${row.label.padEnd(width)}${quantity}${row.brand} ${row.name} — ${formatPrice(row.price)}`,
      );
    }
    lines.push('-'.repeat(48));
    lines.push(`${'TOTAL'.padEnd(width)}${formatPrice(calculateTotal(build))}`);
    lines.push('');
    lines.push(`Consumo estimado: ${power.estimatedDraw} W`);
    lines.push(`Fonte recomendada: ${power.recommendedPsu} W+`);
  }

  lines.push('');
  lines.push(DISCLAIMER);
  return lines.join('\n');
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers/contexts without the async clipboard API.
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Opens a print-ready document in a new tab. The user picks "Salvar como PDF"
 * in the native print dialog — keeps the bundle free of a PDF library.
 */
export function exportBuildToPdf(
  build: BuildSelection,
  report: CompatibilityReport,
  name: string,
): boolean {
  if (typeof window === 'undefined') return false;

  const rows = toRows(build);
  const power = estimatePower(build);
  const total = calculateTotal(build);

  const componentsHtml = rows
    .map((row) => {
      const specs = toSpecRows(row.specifications)
        .slice(0, 6)
        .map((spec) => `${escapeHtml(spec.label)}: ${escapeHtml(spec.value)}`)
        .join(' &middot; ');
      return `
        <tr>
          <td class="cat">${escapeHtml(row.label)}</td>
          <td>
            <strong>${escapeHtml(row.brand)} ${escapeHtml(row.name)}</strong>
            ${row.quantity > 1 ? `<span class="qty">${row.quantity} unidades</span>` : ''}
            <div class="specs">${specs}</div>
          </td>
          <td class="price">${escapeHtml(formatPrice(row.price))}</td>
        </tr>`;
    })
    .join('');

  const issuesHtml = report.issues
    .map(
      (issue) => `
      <li class="issue ${issue.severity}">
        <strong>${escapeHtml(issue.title)}</strong>
        <span>${escapeHtml(issue.detail)}</span>
      </li>`,
    )
    .join('');

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(name)} — Build Forge</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; color: #14161c; margin: 32px; }
  header { border-bottom: 2px solid #14161c; padding-bottom: 12px; margin-bottom: 20px; }
  h1 { margin: 0; font-size: 22px; letter-spacing: .14em; text-transform: uppercase; }
  .sub { color: #5b6270; font-size: 12px; letter-spacing: .3em; text-transform: uppercase; margin-top: 4px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .16em; color: #5b6270; margin: 24px 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  td { border-bottom: 1px solid #e3e6ec; padding: 8px 6px; vertical-align: top; }
  td.cat { width: 110px; text-transform: uppercase; font-size: 10px; letter-spacing: .12em; color: #5b6270; }
  td.price { width: 110px; text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .specs { color: #5b6270; font-size: 10.5px; margin-top: 3px; }
  .qty { font-size: 10px; color: #5b6270; margin-left: 6px; }
  .total { display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; margin-top: 14px; padding-top: 10px; border-top: 2px solid #14161c; }
  .grid { display: flex; gap: 32px; font-size: 12px; margin-top: 6px; }
  ul { list-style: none; padding: 0; margin: 0; font-size: 11.5px; }
  .issue { padding: 6px 0 6px 12px; border-left: 3px solid #cbd0d9; margin-bottom: 6px; }
  .issue.ok { border-color: #1f9d55; }
  .issue.warning { border-color: #d68f00; }
  .issue.error { border-color: #d0342c; }
  .issue span { display: block; color: #5b6270; }
  footer { margin-top: 28px; font-size: 10px; color: #7a818f; border-top: 1px solid #e3e6ec; padding-top: 10px; }
  @media print { body { margin: 14mm; } }
</style>
</head>
<body>
  <header>
    <h1>Build Forge</h1>
    <div class="sub">PC Builder 3D</div>
  </header>
  <h2>Configuração</h2>
  <strong style="font-size:16px">${escapeHtml(name)}</strong>
  <table>${componentsHtml || '<tr><td colspan="3">Nenhum componente selecionado.</td></tr>'}</table>
  <div class="total"><span>TOTAL</span><span>${escapeHtml(formatPrice(total))}</span></div>

  <h2>Energia</h2>
  <div class="grid">
    <div><strong>${power.estimatedDraw} W</strong><div>Consumo estimado</div></div>
    <div><strong>${power.recommendedPsu} W+</strong><div>Fonte recomendada</div></div>
    <div><strong>${Math.round(power.margin * 100)}%</strong><div>Margem de segurança</div></div>
  </div>

  <h2>Compatibilidade</h2>
  <ul>${issuesHtml || '<li class="issue">Nenhuma verificação disponível — selecione mais componentes.</li>'}</ul>

  <footer>${escapeHtml(DISCLAIMER)}</footer>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (!printWindow) return false;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  // Give the new document a tick to lay out before opening the print dialog.
  window.setTimeout(() => {
    try {
      printWindow.print();
    } catch (error) {
      console.warn('[build-forge] não foi possível abrir a caixa de impressão', error);
    }
  }, 350);

  return true;
}

function slugify(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'build-forge'
  );
}
