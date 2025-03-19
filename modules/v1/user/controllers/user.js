var userModel = require("../models/user_model");
var common = require("../../../../utilities/common");
const response_code = require("../../../../utilities/response-error-code");
const {default: localizify} = require('localizify');
const validator = require("../../../../middlewares/validator");
const { t } = require('localizify');
const vrules = require("../../../validation_rules");

class User{
    async signup(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        
        userModel.signup(request_data, (_response_data)=>{
            common.response(res, _response_data);
        });
    }
}


module.exports = new User();