import puppeteer from 'puppeteer'
import express from 'express'
import { AddressInfo } from 'net'
import querystring from 'querystring'
import url from 'url'

const app = express()

app.get('/image', async (req, res) => {
  const {search, https = false, hl = 'en'} = req.query
  if (!search) {
    return res.send('Please provide URL as GET image list')
  }

  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage()
  await page.goto(`https://www.google.com/search?tbm=isch&q=${search}&hl=${hl}`)
  const src = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#search a'))
      .map((link: any) => link.href)
  })
  browser.close()

  let imgs = src
    .map((link) => querystring.parse(url.parse(link).query).imgurl)
    .filter((img) => img)

  if (https) {
    imgs = imgs.filter((v: string) => v.indexOf('https://') === 0)
  }

  res.send(JSON.stringify({ imgs: imgs }))
})

app.get('/title', async (req, res) => {
  const {search, hl = 'en'} = req.query

  if (!search) {
    return res.send('Please provide URL as GET image list')
  }

  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage()
  await page.goto(`https://www.google.com/search?q=${search}&hl=${hl}`)
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
