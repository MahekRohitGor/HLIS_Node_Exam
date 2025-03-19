var adminModel = require("../models/admin_model");
var common = require("../../../../utilities/common");
const response_code = require("../../../../utilities/response-error-code");
const {default: localizify} = require('localizify');
const validator = require("../../../../middlewares/validator");
const { t } = require('localizify');
const vrules = require("../../../validation_rules");

class Admin {
    async admin_login(req,res){
        const request_data = req.body;
        console.log(typeof adminModel.admin_login);
        adminModel.admin_login(request_data, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async admin_logout(req,res){
        const admin_id = req.user_id;
        adminModel.admin_logout(admin_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }
}

module.exports = new Admin();