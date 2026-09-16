import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Headless tests exercise Leaflet interactions without downloading community-funded map tiles.
  await page.route('https://tile.openstreetmap.org/**', (route) => route.abort())
})

test('an anonymous reporter selects a map point and revisits a private report', async ({
  page,
}) => {
  const title = `E2E synthetic map report ${Date.now()}`
  await page.goto('/')
  await page.getByRole('link', { name: 'Fazer uma denúncia' }).click()

  await page.getByLabel('Título da denúncia').fill(title)
  await page.getByLabel('Descrição').fill('Fictitious E2E report; no real environmental incident.')
  await page.getByLabel('Categoria').selectOption({ index: 1 })
  await page.locator('.report-map .leaflet-container').click({ position: { x: 120, y: 90 } })
  await expect(page.getByRole('button', { name: /Localização adicionada/ })).toBeVisible()
  await page.getByRole('button', { name: 'Enviar denúncia' }).click()

  await expect(page).toHaveURL(/\/denuncias\/[0-9a-f-]{36}$/)
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  const accessCode = await page.locator('.message-token code').textContent()
  expect(accessCode).toBeTruthy()

  await page.reload()
  await expect(page.getByText('Consulte sua denúncia')).toBeVisible()
  await page.getByLabel('Código de acesso').fill(accessCode!)
  await page.getByRole('button', { name: 'Consultar' }).click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
})

test('a citizen registers, files a report and finds it in their dashboard', async ({
  page,
  browser,
}) => {
  const title = `E2E synthetic citizen report ${Date.now()}`
  await page.goto('/cadastro')
  await page.getByLabel('Nome', { exact: true }).fill('Synthetic')
  await page.getByLabel('Sobrenome').fill('Citizen')
  await page.getByLabel('E-mail').fill(`e2e-${Date.now()}@example.test`)
  await page.getByLabel('Senha').fill('SafeSyntheticTestPassword2026!')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page).toHaveURL(/\/denuncias$/)

  await page.getByRole('main').getByRole('link', { name: 'Nova denúncia' }).click()
  await page.getByLabel('Título da denúncia').fill(title)
  await page.getByLabel('Descrição').fill('Fictitious citizen E2E report.')
  await page.getByLabel('Categoria').selectOption({ index: 1 })
  await page.getByRole('button', { name: 'Enviar denúncia' }).click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  const privateUrl = page.url()

  await page.getByRole('link', { name: 'Voltar às denúncias' }).click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()

  const outsiderContext = await browser.newContext()
  const outsiderPage = await outsiderContext.newPage()
  await outsiderPage.goto(privateUrl)
  await expect(outsiderPage.getByText('Consulte sua denúncia')).toBeVisible()
  await expect(outsiderPage.getByRole('heading', { name: title })).toHaveCount(0)
  await outsiderContext.close()
})
