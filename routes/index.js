var express = require('express');
var router = express.Router();
var user = require('../controller/user');


/* GET home page. */
router.get('/:user', user.index);
router.post('/:user', user.user);
module.exports = router;
