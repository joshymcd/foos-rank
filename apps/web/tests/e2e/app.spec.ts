import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

function captureBrowserErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}

async function createPendingMatch(page: Page, red: string, blue: string) {
  await page.goto('/multi/matches/new')
  await page.getByLabel('Player').first().selectOption({ label: red })
  await page.getByLabel('Player').last().selectOption({ label: blue })
  await page.getByRole('button', { name: 'Start match' }).click()
  await expect(page.locator('#red-score')).toBeVisible()
  return page.url().split('/').at(-1)
}

test('creates an organization and records a match', async ({ page }) => {
  const errors = captureBrowserErrors(page)

  await page.goto('/')
  await page.getByPlaceholder('Acme Ltd').fill('Acme Ltd')
  await page.getByPlaceholder('Alex Morgan').fill('Alex Morgan')
  await page.getByRole('button', { name: 'Create organization' }).click()
  await expect(page).toHaveURL(/\/acme-ltd$/)

  await page.goto('/acme-ltd/people')
  await page.getByPlaceholder('Player name').fill('Bob Smith')
  await page.getByRole('button', { name: 'Add player' }).click()
  await expect(page.getByRole('link', { name: 'Bob Smith' })).toBeVisible()

  await page.goto('/acme-ltd/matches/new')
  await page.getByRole('button', { name: 'Start match' }).click()
  await expect(page.getByText('Fill every player slot.')).toBeVisible()
  await page.getByLabel('Player').first().selectOption({ label: 'Alex Morgan' })
  await page.getByLabel('Player').last().selectOption({ label: 'Bob Smith' })
  await page.getByRole('button', { name: 'Start match' }).click()

  await expect(page.locator('#red-score')).toBeVisible()
  await expect(
    page.getByText('Foosball matches cannot end in a draw.'),
  ).toBeHidden()
  await page.getByRole('button', { name: 'Save result' }).click()
  await expect(
    page.getByText('Foosball matches cannot end in a draw.'),
  ).toBeVisible()
  await page.locator('#red-score').fill('10')
  await page.locator('#blue-score').fill('4')
  await page.getByRole('button', { name: 'Save result' }).click()

  await expect(page.getByText('+16')).toBeVisible()
  await page.goto('/acme-ltd/leaderboard')
  await expect(page.getByRole('link', { name: /Alex Morgan/ })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('link', { name: /Alex Morgan/ })).toBeVisible()
  expect(errors).toEqual([])
})

test('supports multiple pending matches and direct navigation', async ({
  page,
}) => {
  const errors = captureBrowserErrors(page)
  await page.addInitScript(() => {
    if (localStorage.getItem('foosrank-organizations')) return
    localStorage.setItem(
      'foosrank-organizations',
      JSON.stringify([
        {
          id: 'multi',
          name: 'Multi Match',
          createdAt: new Date().toISOString(),
        },
      ]),
    )
    localStorage.setItem(
      'foosrank-people',
      JSON.stringify(
        ['Alpha', 'Bravo', 'Charlie', 'Delta'].map((name) => ({
          id: name.toLowerCase(),
          organizationId: 'multi',
          name,
          normalizedName: name.toLowerCase(),
          elo: 1000,
          createdAt: new Date().toISOString(),
        })),
      ),
    )
  })

  const firstId = await createPendingMatch(page, 'Alpha', 'Bravo')
  const secondId = await createPendingMatch(page, 'Charlie', 'Delta')

  await page.goto('/multi/matches')
  await expect(page.getByText('Pending', { exact: true })).toHaveCount(2)

  await page.goto(`/multi/matches/${firstId}`)
  await page.locator('#red-score').fill('10')
  await page.locator('#blue-score').fill('5')
  await page.getByRole('button', { name: 'Save result' }).click()

  await page.goto('/multi')
  await expect(page.getByText('1 pending match', { exact: true })).toBeVisible()

  const thirdId = await createPendingMatch(page, 'Alpha', 'Charlie')
  expect(thirdId).not.toBe(secondId)
  await page.goto(`/multi/matches/${secondId}`)
  await expect(page.getByText('Pending · 1v1')).toBeVisible()
  await expect(page.getByText('Match not found.')).toBeHidden()
  expect(errors).toEqual([])
})
