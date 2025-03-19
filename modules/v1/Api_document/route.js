var express = require('express');
var path = require('path');
var globals = require('../../../config/constants');
var user_model = require('../user/models/user_model');

app = express();
var router = express.Router();

app.set('view engine', 'ejs')
router.get('/api_doc', (req, res) => {

    res.render(path.join(__dirname + '/view/api_doc.ejs'), {
        BASE_URL: process.env.BASE_URL,
        BASE_URL_WITHOUT_API: process.env.BASE_URL_WITHOUT_API,
        APP_NAME: process.env.APP_NAME,
        API_KEY: process.env.API_KEY,
        PORT_BASE_URL: process.env.PORT_BASE_URL
    });
});

router.get('/code', (req, res) => {
    res.render(path.join(__dirname + '/view/reference_code.ejs'), { globals: globals })
});

router.get('/user_list', (req, res) => {
    user_model.api_user_list(function(response) {
        res.render(path.join(__dirname + '/view/user_list.ejs'), { data: response, globals: globals })
    });
});

module.exports = router;