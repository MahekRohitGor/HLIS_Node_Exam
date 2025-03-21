const Validator = require('Validator');
const {default: localizify} = require('localizify');
const en = require("../language/en");
const fr = require("../language/fr");
const guj = require("../language/guj");
const database = require("../config/database");
const { t } = require('localizify');
const common = require("../utilities/common");
const response_code = require("../utilities/response-error-code");

localizify
    .add("en", en)
    .add("fr", fr)
    .add("guj", guj);

class validator{
    async checkValidationRules(req,res,request_data,rules,message,keywords){
        const v = Validator.make(request_data, rules, message, keywords);

            if(v.fails()){
                const errors = v.getErrors();
                const firstError = Object.values(errors)[0][0];
                const response_data = common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: firstError
                });
                common.response(res, response_data);
                return false;
            } else{
                return true;
            }
    }

    extractHeaderLang(req,res,next) {
        req.userLang = req.headers["accept-language"] || "en";

        localizify
        .add("en", en)
        .add("fr", fr)
        .add("guj", guj);
        
        localizify.setLocale(req.userLang);
        if (!req.body.userLang) {
            const req_body = JSON.parse(common.decryptPlain(req.body));
            req_body.userLang = req.userLang;
            req.body = common.encrypt(req_body);
        }
        next();
    }
    
}

module.exports = new validator();