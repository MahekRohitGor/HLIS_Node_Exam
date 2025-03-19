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

    async verifyOTP(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        
        userModel.verifyOTP(request_data, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async forgotPassword(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        
        userModel.forgotPassword(request_data, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async resetPassword(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        
        userModel.resetPassword(request_data, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async complete_profile(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        
        userModel.complete_profile(request_data, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async changePassword(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        const user_id = req.user_id;

        userModel.changePassword(request_data, user_id, (_response_data)=>{
            common.response(res, _response_data);
        });
    }

    async login(req,res){
        const requested_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(requested_data));
        
        userModel.login(request_data, (_response_data)=>{
            common.response(res, _response_data);
        });
    }
}


module.exports = new User();