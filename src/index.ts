import puppeteer from 'puppeteer'
import express from 'express'
import { AddressInfo } from 'net'

const app = express()

app.get('/image', async (req, res) => {
  const url = req.query.url
  const index = req.query.index

  if (!url) {
    return res.send('Please provide URL as GET image list')
  }

  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage()
  await page.goto(`https://www.google.com/search?tbm=isch&q=${url}`)
  const src = await page.evaluate(() => {
    const base64: Array<any> = []
    document.querySelectorAll('img.rg_ic.rg_i').forEach((v: any) => {
      if (v && v.src && v.id) {
        base64.push(v.src)
      }
    })
    return base64
  })
  browser.close()

  if (index) {
    res.send(JSON.stringify({ base64: src[index] }))
  } else {
    res.send(JSON.stringify({ base64: src }))
  }
})

app.get('/title', async (req, res) => {
  const url = req.query.url

  if (!url) {
    return res.send('Please provide URL as GET image list')
  }

  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage()
  await page.goto(`https://www.google.com/search?q=${url}`)
  const title = await page.evaluate(() => {
    let text: string = undefined
    document.querySelectorAll('h3').forEach(v => {
      if (v.className && !text) text = v.textContent
    })
    return text
  })
  browser.close()

  res.send(JSON.stringify({ title: title }))
})

const server = app.listen(process.env.PORT || 8080, (err: any) => {
  if (err) return console.error(err)
  const address = server.address() as AddressInfo
  console.info(`App listening on ${address.port}`)
})
