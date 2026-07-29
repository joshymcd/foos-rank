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

const runId = Date.now().toString(36)

async function createPendingMatch(
  page: Page,
  organizationId: string,
  red: string,
  blue: string,
) {
  await page.goto(`/${organizationId}/matches/new`)
  await page.getByLabel('Player').first().selectOption({ label: red })
  await page.getByLabel('Player').last().selectOption({ label: blue })
  await page.getByRole('button', { name: 'Start match' }).click()
  await expect(page.locator('#red-score')).toBeVisible()
  return new URL(page.url()).pathname.split('/').at(-1)
}

test('creates an organization and records a match', async ({ page }) => {
  const errors = captureBrowserErrors(page)
  const organizationName = `Acme ${runId}`
  const organizationId = `acme-${runId}`

  await page.goto('/setup')
  await page.getByPlaceholder('Acme Ltd').fill(organizationName)
  await page.getByPlaceholder('Alex Morgan').fill('Alex Morgan')
  await page.getByRole('button', { name: 'Create organization' }).click()
  await expect(page).toHaveURL(new RegExp(`/${organizationId}$`))

  await page.goto(`/${organizationId}/people`)
  await page.getByPlaceholder('Player name').fill('Bob Smith')
  await page.getByRole('button', { name: 'Add player' }).click()
  await expect(page.getByRole('link', { name: 'Bob Smith' })).toBeVisible()

  await page.goto(`/${organizationId}/matches/new`)
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
  await page.goto(`/${organizationId}/leaderboard`)
  await expect(page.getByRole('link', { name: /Alex Morgan/ })).toBeVisible()
  await page.goto(`/${organizationId}/admin`)
  await page.getByLabel('Organization name').fill('Acme Foosball')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Organization settings saved.')).toBeVisible()
  await expect(
    page.getByRole('complementary').getByText('Acme Foosball'),
  ).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Organization name')).toHaveValue(
    'Acme Foosball',
  )
  expect(errors).toEqual([])
})

test('supports multiple pending matches and direct navigation', async ({
  page,
}) => {
  const errors = captureBrowserErrors(page)
  const organizationName = `Multi ${runId}`
  const organizationId = `multi-${runId}`
  await page.goto('/setup')
  await page.getByPlaceholder('Acme Ltd').fill(organizationName)
  await page.getByPlaceholder('Alex Morgan').fill('Alpha')
  await page.getByRole('button', { name: 'Create organization' }).click()
  await page.goto(`/${organizationId}/people`)
  for (const name of ['Bravo', 'Charlie', 'Delta']) {
    await page.getByPlaceholder('Player name').fill(name)
    await page.getByRole('button', { name: 'Add player' }).click()
    await expect(page.getByRole('link', { name })).toBeVisible()
  }

  const firstId = await createPendingMatch(
    page,
    organizationId,
    'Alpha',
    'Bravo',
  )
  const secondId = await createPendingMatch(
    page,
    organizationId,
    'Charlie',
    'Delta',
  )

  await page.goto(`/${organizationId}/matches`)
  await expect(page.getByText('Pending', { exact: true })).toHaveCount(2)

  await page.goto(`/${organizationId}/matches/${firstId}`)
  await page.locator('#red-score').fill('10')
  await page.locator('#blue-score').fill('5')
  await page.getByRole('button', { name: 'Save result' }).click()

  await page.goto(`/${organizationId}`)
  await expect(page.getByText('1 pending match', { exact: true })).toBeVisible()

  const thirdId = await createPendingMatch(
    page,
    organizationId,
    'Alpha',
    'Charlie',
  )
  expect(thirdId).not.toBe(secondId)
  await page.goto(`/${organizationId}/matches/${secondId}`)
  await expect(page.getByText('Pending · 1v1')).toBeVisible()
  await expect(page.getByText('Match not found.')).toBeHidden()
  expect(errors).toEqual([])
})
