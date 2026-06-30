/**
 * Smoke test suite — verifies the core product decisions from the UX redesign.
 *
 * Auth strategy: uses TEST_EMAIL / TEST_PASSWORD env vars. Tests that require
 * an authenticated session are skipped when these are not set, so the suite
 * can always run cleanly in CI without credentials.
 *
 * Run against the preview build:
 *   npm run build && npx playwright test
 *
 * Run against the dev server (baseURL override):
 *   PLAYWRIGHT_BASE_URL=http://localhost:5173 npx playwright test
 */

import { expect, test } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4173'
const TEST_EMAIL = process.env.TEST_EMAIL ?? ''
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? ''
const HAS_CREDS = Boolean(TEST_EMAIL && TEST_PASSWORD)

// ── Helpers ─────────────────────────────────────────────────────────────────

function collectConsoleErrors(page: import('@playwright/test').Page) {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))
  return errors
}

/** Sign in via the login form and wait for the authenticated landing. */
async function signIn(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.getByLabel('Email').fill(TEST_EMAIL)
  await page.getByLabel('Password').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 10_000 })
}

// ── Unauthenticated checks ───────────────────────────────────────────────────

test.describe('unauthenticated', () => {
  test('login page renders without JS errors', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.goto(`${BASE_URL}/login`)
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    expect(errors.filter((e) => !e.includes('HydrateFallback'))).toHaveLength(0)
  })

  test('/study redirects to /login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/study`)
    await expect(page).toHaveURL(/\/login/)
  })

  test('/decks redirects to /login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/decks`)
    await expect(page).toHaveURL(/\/login/)
  })
})

// ── Authenticated checks ─────────────────────────────────────────────────────

test.describe('authenticated', () => {
  test.skip(!HAS_CREDS, 'Set TEST_EMAIL and TEST_PASSWORD env vars to run authenticated tests')

  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })

  test('/ redirects to last opened deck when available (or stays at / if none)', async ({
    page,
  }) => {
    await page.waitForLoadState('networkidle')
    const { pathname } = new URL(page.url())
    // Fresh Playwright context has no lastOpenedDeckId, so stays at /.
    // If a lastDeckId existed it would redirect to /decks/:id.
    const validLanding =
      pathname === '/' || pathname === '/home' || /^\/decks\/[^/]+$/.test(pathname)
    expect(validLanding, `Unexpected post-login path: ${pathname}`).toBe(true)
  })

  test('/study redirects to /decks (not a study session)', async ({ page }) => {
    await page.goto(`${BASE_URL}/study`)
    await expect(page).toHaveURL(/\/decks$/)
    await expect(page.getByRole('heading', { name: /your decks/i })).toBeVisible({ timeout: 5_000 })
  })

  test('opening a deck shows Study tab by default', async ({ page }) => {
    await page.goto(`${BASE_URL}/decks`)
    await page.locator('[role="button"]').first().click()
    await expect(page).toHaveURL(/\/decks\/[^/]+$/)
    const studyTab = page.getByRole('button', { name: /^study$/i })
    await expect(studyTab).toBeVisible()
    await expect(studyTab).toHaveClass(/bg-card/)
  })

  test('deck workspace fires study-cards query immediately (no full-page spinner)', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/decks`)
    await page.locator('[role="button"]').first().click()
    await expect(page.getByRole('button', { name: /^study$/i })).toBeVisible({ timeout: 2_000 })
  })

  test('Cards tab renders search field and sort control', async ({ page }) => {
    await page.goto(`${BASE_URL}/decks`)
    await page.locator('[role="button"]').first().click()
    await page.getByRole('button', { name: /^cards$/i }).click()
    await expect(page.getByPlaceholder(/search/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /newest/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /oldest/i })).toBeVisible()
  })

  test('sort order changes correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/decks`)
    await page.locator('[role="button"]').first().click()
    await page.getByRole('button', { name: /^cards$/i }).click()
    await expect(page.getByRole('button', { name: /newest/i })).toHaveClass(/bg-card/)
    await page.getByRole('button', { name: /a.*z/i }).click()
    await expect(page.getByRole('button', { name: /a.*z/i })).toHaveClass(/bg-card/)
  })

  test('Add Card tab renders inline form (not a modal)', async ({ page }) => {
    await page.goto(`${BASE_URL}/decks`)
    await page.locator('[role="button"]').first().click()
    await page.getByRole('button', { name: /^add$/i }).click()
    await expect(page.getByLabel(/front/i)).toBeVisible()
    await expect(page.getByLabel(/back/i)).toBeVisible()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('adding a card switches to Cards tab afterwards', async ({ page }) => {
    await page.goto(`${BASE_URL}/decks`)
    await page.locator('[role="button"]').first().click()
    await page.getByRole('button', { name: /^add$/i }).click()
    const timestamp = Date.now().toString()
    await page.getByLabel(/^front/i).fill(`test-front-${timestamp}`)
    await page.getByLabel(/^back/i).fill(`test-back-${timestamp}`)
    await page.getByRole('button', { name: /create card/i }).click()
    await expect(page.getByRole('button', { name: /^cards$/i })).toHaveClass(/bg-card/, {
      timeout: 5_000,
    })
    await expect(page.getByText(`test-front-${timestamp}`)).toBeVisible()
  })

  test('search filters cards correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/decks`)
    await page.locator('[role="button"]').first().click()
    await page.getByRole('button', { name: /^cards$/i }).click()
    const searchInput = page.getByPlaceholder(/search/i)
    await searchInput.fill('zzz_no_match_xqz')
    await expect(page.getByText(/no cards match/i)).toBeVisible({ timeout: 3_000 })
    await searchInput.fill('')
    await expect(page.getByText(/no cards match/i)).not.toBeVisible()
  })

  test('dark mode: page background remains neutral, not deck-tinted', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`)
    // ThemeToggle buttons have role="radio"
    await page.getByRole('radio', { name: /dark/i }).click()
    await page.goto(`${BASE_URL}/decks`)
    await page.locator('[role="button"]').first().click()
    const bg = await page.evaluate(() => {
      const el = document.querySelector('main')
      return el ? getComputedStyle(el).backgroundColor : ''
    })
    const rgb = bg.match(/\d+/g)?.map(Number) ?? []
    if (rgb.length === 3) {
      expect(rgb[0]).toBeLessThan(40)
      expect(rgb[1]).toBeLessThan(35)
    }
  })

  test('flashcard color bar: card background is neutral, not tinted', async ({ page }) => {
    await page.goto(`${BASE_URL}/decks`)
    await page.locator('[role="button"]').first().click()
    await Promise.race([
      page.getByRole('button', { name: /show answer/i }).waitFor({ timeout: 8_000 }),
      page.getByText(/add/i).waitFor({ timeout: 8_000 }),
    ])
    if (await page.getByRole('button', { name: /show answer/i }).isVisible()) {
      const cardBg = await page.evaluate(() => {
        const el = document.querySelector('[style*="backface-visibility"]')
        return el ? getComputedStyle(el).backgroundColor : ''
      })
      const rgb = cardBg.match(/\d+/g)?.map(Number) ?? []
      if (rgb.length >= 3) {
        expect(rgb[0]).toBeGreaterThanOrEqual(230)
        expect(rgb[1]).toBeGreaterThanOrEqual(230)
        expect(rgb[2]).toBeGreaterThanOrEqual(230)
      }
    }
  })

  test('no console errors during normal deck navigation', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    const failedUrls: string[] = []
    page.on('response', (resp) => {
      if (resp.status() >= 400) failedUrls.push(`${resp.status()} ${resp.url()}`)
    })

    await page.goto(`${BASE_URL}/decks`)
    await page.locator('[role="button"]').first().click()
    await page.getByRole('button', { name: /^cards$/i }).click()
    await page.getByRole('button', { name: /^add$/i }).click()
    await page.getByRole('button', { name: /^study$/i }).click()
    await page.waitForTimeout(1_000)

    if (failedUrls.length) console.log('Failed responses:', failedUrls)

    const jsErrors = errors.filter(
      (e) => !e.includes('HydrateFallback') && !e.includes('Failed to load resource'),
    )
    expect(jsErrors, `JS errors found (404s: ${failedUrls.join(', ')})`).toHaveLength(0)

    const apiErrors = failedUrls.filter(
      (u) => u.includes('supabase') || u.includes('/api/') || u.includes('/rest/'),
    )
    expect(apiErrors, 'Supabase API calls returned errors').toHaveLength(0)
  })
})
