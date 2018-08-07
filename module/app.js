const puppeteer = require('puppeteer')
const ora = require('ora')
const chalk = require('chalk')
const fs = require('fs')

const self = module.exports = {
  findDuplicateInArray: async (hrefs) => {
    let len = hrefs.length
    let result = []
    let obj = {}
    for (i = 0; i < len; i++) {
      obj[hrefs[i]] = 0
    }
    for (i in obj) {
      result.push(i)
    }
    return result
  },

  getResource: async (page) => {
    const src = await page.evaluate(async () => {
      const images = document.querySelectorAll('div.eLAPa > div.KL4Bh > img')
      if(images.length > 0) {        
        return {
          ext: 'jpg',
          src: images[0].src
        };
      }
      const videos = document.querySelectorAll('div.GRtmf > div._5wCQW > video')
      const thumb = document.querySelectorAll('div.GRtmf > div._5wCQW > img')
      if(videos.length > 0) {        
        return {
          ext: 'mp4',
          src: videos[0].src,
          thumb: thumb[0].src
        };
      }
    })
    return src
  },

  getMedia: async (browser, page, scrollLimit, item) => {
    let mediaText = []
    let previousHeight
    let spinner = ora('Loading').start()
    for (let i = 1; i <= scrollLimit; i++) {
      try {
        previousHeight = await page.evaluate('document.body.scrollHeight')
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
        await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`)
        await page.waitFor(500)
        spinner.color = 'yellow'
        spinner.text = chalk.yellow('Account: ' + item + ' | ⏳ Scrolling [ ' + i + ' / ' + scrollLimit + ' ]')
        
        // const textPost = await page.evaluate(async () => {
        //   const images = document.querySelectorAll('a > div > div.KL4Bh > img')          
        //   return [].map.call(images, img => img.src)
        // })
        // for (let post of textPost) {
        //   mediaText.push(post)
        // }
        // mediaText = await self.findDuplicateInArray(mediaText)
        
        const posts = await page.evaluate(async () => {
          let posts = document.querySelectorAll('div.v1Nh3 > a');          
          return [].map.call(posts, a => a.href)
        })
        if(posts.length == 0) break;
        const textPost = [];
        let p = [];
        for(let post of posts) {
          p.push(
            new Promise(async(resolve) => {
              const newpage = await browser.newPage();
              newpage.on('error', () => {
                console.log(chalk.red('🚀 Page Reload'))
                page.reload()
              })
              await newpage.goto(post + '/', {
                timeout: 0
              })
              let singleurl = await self.getResource(newpage)
              textPost.push(singleurl);
              await newpage.close()
              resolve();
            })
          )
        }
        await Promise.all(p);
        for (let post of textPost) {
          mediaText.push(post)
        }
      } catch (e) {
        break
      }
    }
    spinner.succeed(chalk.yellow('Scroll Succeed'))    
    return mediaText
  },

  makeFolder: async (item) => {
    try {      
      let dir = './result/' + item
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
      }
    } catch (err) {
      console.log(chalk.red('❌ Error makeFolder: ' + err))
    }
  },

  splitUp: (arr, n) => {
    let rest = arr.length % n
    let restUsed = rest
    let partLength = Math.floor(arr.length / n)
    let result = []
    for (let i = 0; i < arr.length; i += partLength) {
      let end = partLength + i
      let add = false
      if (rest !== 0 && restUsed) {
        end++
        restUsed--
        add = true
      }
      result.push(arr.slice(i, end))
      if (add) {
        i++
      }
    }
    return result
  },

  save: async (page, item, urls, bot) => {
    let count = 0
    let countTotal = urls.length
    for (const url of urls) {      
      try {
        let viewSource = await page.goto(url.src)
        var ext = url.ext;
        fs.writeFile('./result/' + item + '/bot-' + bot + '-' + count + '.' + ext, await viewSource.buffer(), function (err) {
          if (err) {
            throw (err)
          }
          count = count + 1
          console.log(chalk.green('BOT [' + bot + ']The file was saved! [ ' + count + ' / ' + countTotal + ' ]'))
        })
      } catch (error) {        
        console.log(chalk.red('❌ Error: invalid URL undefined'))
        console.log(url);
        continue
      }
    }
  },

  main: async (quest) => {
    const browser = await puppeteer.launch()    
    const account = quest.account
    const scrollLimit = parseInt(quest.limit)    
    const page = await browser.newPage()
    page.on('error', () => {
      console.log(chalk.red('🚀 Page Reload'))
      page.reload()
    })
    await page.goto('https://www.instagram.com/' + account + '/', {
      timeout: 0
    })
    let urls = await self.getMedia(browser, page, scrollLimit, account)
    console.log(chalk.cyan('🌄 Found Total: ' + urls.length))

    await page.close()
    fs.writeFile('./public/result/' + account + '.json', JSON.stringify(urls), function (err) {
      if (err) {
        throw (err)
      }      
    })

    await browser.close()
  }
}
