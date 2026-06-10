import { test, expect, type Page } from '@playwright/test';
import { installSupabaseMock } from './fixtures/supabase-mock';

async function bootApp(page: Page) {
  await installSupabaseMock(page);
  await page.goto('/');
  await expect(page.locator('#main-header')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('th[id^="hdr-col-"]')).toHaveCount(5, { timeout: 10_000 });
}

test.describe('FinanSpreadOS — fluxos E2E', () => {

  test('01 — auth: tela de login exibe email input', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.route('**/supabase.co/**', (r) => r.fulfill({ status: 200, body: '{}' }));
    await page.goto('/');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('02 — template seed: 5 colunas padrão visíveis no header', async ({ page }) => {
    await installSupabaseMock(page);
    await page.goto('/');
    await expect(page.locator('#main-header')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('th[id^="hdr-col-"]')).toHaveCount(5, { timeout: 10_000 });
  });

  test('03 — navegação de mês: atualiza label', async ({ page }) => {
    await bootApp(page);
    const label = page.locator('#main-header span.font-mono');
    const before = await label.textContent();
    await page.click('#btn-next-month');
    await expect(label).not.toHaveText(before ?? '');
  });

  test('04 — adicionar linha: incrementa contador', async ({ page }) => {
    await bootApp(page);
    const rows = page.locator('tr[id^="spreadsheet-row-"]');
    const initialCount = await rows.count();
    await page.click('#btn-add-row-quick');
    await expect(rows).toHaveCount(initialCount + 1, { timeout: 5_000 });
  });

  test('05 — coerção temporal: data fora do mês é ajustada', async ({ page }) => {
    await bootApp(page);
    const dateCell = page.locator('td[id$="-data"]').first();
    await expect(dateCell).toBeVisible({ timeout: 5_000 });
    await dateCell.click();
    const input = page.locator('input[id^="edit-input-"]').first();
    await expect(input).toBeVisible({ timeout: 3_000 });
    await input.fill('2026-08-15');
    await page.locator('body').click({ position: { x: 10, y: 10 }, force: true });
    await expect(page.locator('#toast-notification')).toContainText(/ajustada/i, { timeout: 5_000 });
  });

  test('06 — undo/redo: habilita após mudança', async ({ page }) => {
    await bootApp(page);
    const undo = page.locator('#btn-undo');
    await expect(undo).toBeDisabled();
    await page.click('#btn-add-row-quick');
    await expect(undo).toBeEnabled({ timeout: 3_000 });
  });

  test('07 — dark mode: alterna classe no <html>', async ({ page }) => {
    await bootApp(page);
    const html = page.locator('html');
    const before = await html.evaluate((n) => n.classList.contains('dark'));
    await page.click('#theme-toggler');
    const after = await html.evaluate((n) => n.classList.contains('dark'));
    expect(after).toBe(!before);
  });

  test('08 — busca: filtra linhas', async ({ page }) => {
    await bootApp(page);
    const search = page.locator('#spreadsheet-search');
    await search.fill('Salário');
    const rows = page.locator('tbody tr[id^="spreadsheet-row-"]');
    await expect(rows).toHaveCount(1, { timeout: 3_000 });
  });

  test('09 — logout: volta para tela de auth', async ({ page }) => {
    await bootApp(page);
    await page.click('#btn-signout');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5_000 });
  });

  test('10 — adicionar coluna: modal valida nome duplicado', async ({ page }) => {
    await bootApp(page);
    await page.click('#btn-add-column-trigger');
    await expect(page.locator('#add-column-modal-frame')).toBeVisible();
    await page.fill('#input-col-name', 'Data');
    await page.click('#btn-confirm-col');
    await expect(page.locator('#add-column-modal-frame')).toContainText(/já existe/i);
  });

  test('11 — excluir coluna: última coluna desabilita botão', async ({ page }) => {
    await bootApp(page);
    await page.click('#btn-delete-column-trigger');
    const deleteButtons = page.locator('[id^="btn-purge-col-"]:not([disabled])');
    for (let i = 0; i < 4; i++) {
      const btn = deleteButtons.first();
      if (!(await btn.isVisible())) break;
      await btn.click();
      await page.locator('[id^="btn-purge-confirm-"]').first().click();
      await expect(deleteButtons.first()).toBeVisible({ timeout: 3_000 }).catch(() => {});
    }
    const lastDel = page.locator('[id^="btn-purge-col-"]').first();
    await expect(lastDel).toBeDisabled();
  });

  test('12 — settings de coluna: abre menu modal', async ({ page }) => {
    await bootApp(page);
    const settingsBtn = page.locator('[id^="col-settings-btn-"]').first();
    await settingsBtn.click();
    await expect(page.locator('[id^="col-settings-menu-"]')).toBeVisible();
  });

  test('13 — toasts: aparece ao validar coluna duplicada', async ({ page }) => {
    await bootApp(page);
    await page.click('#btn-add-column-trigger');
    await expect(page.locator('#add-column-modal-frame')).toBeVisible();
    await page.fill('#input-col-name', 'Data');
    await page.click('#btn-confirm-col');
    await expect(page.locator('#add-column-modal-frame')).toContainText(/já existe/i, { timeout: 3_000 });
    await page.click('#btn-close-modal');
    await expect(page.locator('#add-column-modal-frame')).toBeHidden();
    await page.click('#btn-delete-column-trigger');
    const firstDel = page.locator('[id^="btn-purge-col-"]').first();
    await firstDel.click();
    await page.locator('[id^="btn-purge-confirm-"]').first().click();
    await expect(page.locator('#toast-notification')).toBeVisible({ timeout: 3_000 });
  });

  test('14 — error boundary: smoke test', async ({ page }) => {
    await bootApp(page);
    await expect(page.locator('#spreadsheet-container')).toBeVisible();
  });

  test('15 — KPIs: cards renderizam com valores', async ({ page }) => {
    await bootApp(page);
    await expect(page.locator('#kpi-entradas')).toBeVisible();
    await expect(page.locator('#kpi-saidas')).toBeVisible();
    await expect(page.locator('#kpi-saldo')).toBeVisible();
  });
});
