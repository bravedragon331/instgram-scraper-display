const ora = require('ora')
const chalk = require('chalk')
const fs = require('fs')

exports.index = function(req, res){
    let user = req.params.user;
    let spinner = ora('Loading').start()
    spinner.color = 'yellow'
    spinner.text = chalk.yellow('Reading ' +  user + ' data.')
    let contents = JSON.parse(fs.readFileSync('./public/result/'+user+'_download.json', "utf8"));
    spinner.succeed(chalk.cyan('Finish Reading.'))
    res.render('user', { length: contents.length, data: contents.slice(0, 29), name: user });
}

exports.user = function(req, res) {
    let user = req.params.user;
    let page = req.body.page;
    let spinner = ora('Loading').start()
    spinner.color = 'yellow'
    spinner.text = chalk.yellow('Reading ' +  user + ' data.')
    let contents = JSON.parse(fs.readFileSync('./public/result/'+user+'_download.json', "utf8"));
    spinner.succeed(chalk.cyan('Finish Reading.'))
    if (30*(page -1) > contents.length) {
        res.status(200).send({
            isSuccess: true, data: []
        })
    } else {
        res.status(200).send({
            isSuccess: true, data: contents.slice(30*(page-1), 30*page)
        })
    }
}