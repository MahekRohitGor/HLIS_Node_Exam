const {default: localizify} = require('localizify');
const database = require("../config/database");
const { t } = require('localizify');
const common = require("../utilities/common");
const response_code = require("../utilities/response-error-code");
const en = require("../language/en");
const fr = require("../language/fr");
const guj = require("../language/guj");
const lodash = require('lodash');
var lib = require('crypto-lib');

class headerAuth{

    async validateHeader(req,res,next){
        var api_key = (req.headers['api-key'] != undefined && req.headers['api-key'] != "" ? req.headers['api-key'] : '');
        if(api_key != ""){
            try{
                var api_dec = common.decryptPlain(api_key).replace(/\0/g, '').replace(/[^\x00-\xFF]/g, "");
                console.log(api_dec === process.env.API_KEY);
                if(api_dec === process.env.API_KEY){
                    next();
                } else{
                    const response_data_ = {
                        code: response_code.UNAUTHORIZED,
                        message: "Invalid API Key"
                    }
                    const response_data = common.encrypt(response_data_);
                    res.status(401).send(response_data);
                }

            } catch(error){
                console.log(error);
                    const response_data_ = {
                        code: response_code.UNAUTHORIZED,
                        message: "Invalid API Key"
                    }
                    const response_data = common.encrypt(response_data_);
                    res.status(401).send(response_data);
            }
        } else{
            const response_data_ = {
                code: response_code.UNAUTHORIZED,
                message: "Invalid API Key"
            }
            const response_data = common.encrypt(response_data_);
            res.status(401).send(response_data);
        }
    }

    extractMethod(request) {
        var url = request.originalUrl;
        var segment = [];
        url.split("/").forEach((element) => {
            if (!lodash.isEmpty(element)) {
                segment.push(element.trim());
            }
        });
        request.appVersion = segment[0];
        request.requestedModule = segment[1];
        request.requestMethod = segment[segment.length - 1];

        return request;
    }

    async getRequestOwner(token) {
        try {
            console.log("here");
            var selectRequestOwnerQuery = "SELECT * from tbl_user WHERE token = ? and is_deleted = 0 and is_active = 1";
            const [owner] = await database.query(selectRequestOwnerQuery, [token]);
            console.log(owner);
            if (owner.length > 0) {
                return owner[0];
            } else {
                throw new Error("Invalid access token");
            }
        } catch (error) {
            throw error;
        }
    }

    async getRequestAdmin(token){
        try{
            console.log("Getting Admin from token:", token);
            const selectQuery = `SELECT * FROM tbl_admin WHERE token = ?`;
            const [owner] = await database.query(selectQuery, [token]);
            console.log(owner);
            if(owner.length > 0){
                return owner[0];
            }else{
                throw new Error("Invalid access token");
            }
        }catch (error) {
            throw error;
        }
    }

    async header(req, res, next) {
        try {
            console.log("here");
            let headers = req.headers;
            var supported_languages = ["en", "fr", "guj"];
            let lng = (headers["accept-language"] && supported_languages.includes(headers["accept-language"]))
                    ? headers["accept-language"]
                    : "en";

            process.env.LNG = lng;

            localizify
                .add("en", en)
                .add("fr", fr)
                .add("guj", guj);
    
            const byPassApi = ['forgotPassword', 'verifyOtp', 'resendOTP' , 'login', 'signup', 'resetPassword', 'api-docs', 'admin-login'];
            var api_dec = common.decryptPlain(headers["api-key"]).replace(/\0/g, '').replace(/[^\x00-\xFF]/g, "");
            if (api_dec === process.env.API_KEY) {
                var headerObj = new headerAuth();
                req = headerObj.extractMethod(req);
    
                if (byPassApi.includes(req.requestMethod)) {
                    return next();
                } else {
                    const token = headers.authorization_token;
                    if (!token) {
                        return res.status(401).json({
                            code: response_code.UNAUTHORIZED,
                            message: "Authorization token is missing"
                        });
                    }

                    try {
                        var user;

                        // Determine whether request is for 'admin' or 'user'
                        if (req.requestedModule === 'admin') {
                            user = await headerObj.getRequestAdmin(token);
                            console.log("Admin found:", user);
                            req.user_id = user.id;
                        } else {
                            user = await headerObj.getRequestOwner(token);
                            console.log("User found:", user);
                            req.user_id = user.user_id;
                        }

                        req.user = user;
                        console.log("req.user_id set to:", req.user_id);
                        next();
                    } catch (error) {
                        console.log(error);
                        return res.status(401).json({
                            code: response_code.UNAUTHORIZED,
                            message: "Invalid Access Token"
                        });
                    }
                }
            } else {
                return res.status(401).json({
                    code: response_code.UNAUTHORIZED,
                    message: "Invalid API key",
                });
            }
        } catch (error) {
            return res.status(500).json({
                code: response_code.UNAUTHORIZED,
                message: "Internal Server Error",
                data: error.message,
            });
        }
    }

}

module.exports = new headerAuth();