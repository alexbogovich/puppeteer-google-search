import puppeteer from 'puppeteer'
import express from 'express'
import { AddressInfo } from 'net'
import querystring from 'querystring'
import url from 'url'

const app = express()

app.use(express.json())

app.get('/image', async (req, res) => {
  const { search, https = false, hl = 'en' } = req.query
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
  const { search, hl = 'en' } = req.query

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

app.post('/translate', async (req, res) => {
  const { from = 'ru', to = 'en' } = req.query
  const { search } = req.body

  if (!search) {
    return res.send('Please provide URL as GET image list')
  }

  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage()
  const searchQuery = `https://translate.google.com/?um=1&ie=UTF-8&hl=en&client=tw-ob#${from}/${to}/${encodeURIComponent(search)}`
  console.log(`navigate to ${searchQuery}`)
  await page.goto(searchQuery)
  const text = await page.evaluate(() => {
    return new Promise((resolve, reject) => {
      const getTranslate = () => document.querySelectorAll('span#result_box')[0]
      let spent = 0;
      const timer = setInterval(() => {
        const textContent = getTranslate().textContent
        if (textContent && textContent !== '') {
          clearInterval(timer)
          resolve(textContent)
        } else if (spent > 3000) {
          clearInterval(timer)
          reject("spent more than 3 sec")
        }
        spent += 100
      }, 100)
    })

  })
  browser.close()

  res.send(JSON.stringify({ translate: text, source: search }))
})

const server = app.listen(process.env.PORT || 8080, (err: any) => {
  if (err) return console.error(err)
  const address = server.address() as AddressInfo
  console.info(`App listening on ${address.port}`)
})
