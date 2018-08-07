const ora = require('ora')
const chalk = require('chalk')
const fs = require('fs')
const Request = require('request')

const self = module.exports = {  
  set var(value) {
    this._var = value;
  },
  makeFolder: async (item) => {
    try {      
      let dir = './public/result/' + item
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
      }
    } catch (err) {
      console.log(chalk.red('❌ Error makeFolder: ' + err))
    }
  },
  save: async (account, contents, start) => {
    let spinner = ora('Loading').start()
    spinner.color = 'yellow'
    spinner.text = chalk.yellow('Downloading from ' +  start + ' to ' + (start+10))
    let p = [];
    let names = [];
    for(let i = start; i < start+10; i++) {
      if(!contents[i]) break;
      if(contents[i].ext == 'mp4') {
        p.push(new Promise((resolve, reject) => {
          const r = Request.get(contents[i].src);        
          r.on('response',  (res) => {
            res.pipe(fs.createWriteStream('./public/result/'+account+'/'+i+'.'+contents[i].ext));
          });
          r.on('complete', () => {
            names.push({
              name: i,
              ori: contents[i].src,
              ext: contents[i].ext,
              thumb: '/result/'+account+'/'+i+'_thumb.jpg',
              src: '/result/'+account+'/'+i+'.'+contents[i].ext
            });
            resolve();            
          })
          r.on('error', () => {
            reject();
          })
        }))
        p.push(new Promise((resolve, reject) => {
          const r = Request.get(contents[i].thumb);        
          r.on('response',  (res) => {
            res.pipe(fs.createWriteStream('./public/result/'+account+'/'+i+'_thumb.jpg'));
          });
          r.on('complete', () => {            
            resolve();
          })
          r.on('error', () => {
            reject();
          })
        }))
      } else {
        p.push(new Promise((resolve, reject) => {
          const r = Request.get(contents[i].src);        
          r.on('response',  (res) => {
            res.pipe(fs.createWriteStream('./public/result/'+account+'/'+i+'.'+contents[i].ext));
          });
          r.on('complete', () => {
            names.push({
              name: i,
              ori: contents[i].src,
              ext: contents[i].ext,
              src: '/result/'+account+'/'+i+'.'+contents[i].ext
            });
            resolve();
          })
          r.on('error', () => {
            reject();
          })
        }))
      }      
    }
    await Promise.all(p);    
    spinner.succeed(chalk.cyan('Download success from ' +  start + ' to ' + (start+10)))
    return names;
  },
  main: async (quest) => {
    await self.makeFolder(quest.account)
    let contents = JSON.parse(fs.readFileSync('./public/result/'+quest.account+'.json', "utf8"));
    let names = [];
    for(let i = 0; i < contents.length; i = i+10) {
      names = names.concat(await self.save(quest.account, contents, i));
    }
    fs.writeFile('./public/result/' + quest.account + '_download.json', JSON.stringify(names), function (err) {
      if (err) {
        throw (err)
      }      
    })
    return;
  }
}