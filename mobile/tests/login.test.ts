describe('Login Screen', () => {
  it('dado formato válido, navega a la pantalla Home', async () => {
    await browser.$('~input-email').setValue('mobiletest@taskflow.com')
    await browser.$('~input-password').setValue('Mobiletest123!')
    await browser.$('~button-LOGIN').click()

    await browser.acceptAlert()

    const homeElement = await browser.$('~Home')
    await expect(homeElement).toBeDisplayed()
  })

  it('dado email con formato inválido, muestra mensaje de error', async () => {
    await browser.$('~input-email').setValue('mailsinformato')
    await browser.$('~input-password').setValue('Mobiletest123!')
    await browser.$('~button-LOGIN').click()

    const errorMsg = await browser.$('~input-error-message')
    await expect(errorMsg).toBeDisplayed()
    await expect(errorMsg).toHaveText('Please enter a valid email address')
  })

  it('dado password menor a 8 caracteres, muestra mensaje de error', async () => {
    await browser.$('~input-email').setValue('mobiletest@taskflow.com')
    await browser.$('~input-password').setValue('test')
    await browser.$('~button-LOGIN').click()

    const errorMsg = await browser.$('~input-error-message')
    await expect(errorMsg).toBeDisplayed()
    await expect(errorMsg).toHaveText('Please enter at least 8 characters')
  })
})
