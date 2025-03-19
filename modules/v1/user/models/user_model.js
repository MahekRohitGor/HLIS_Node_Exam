const common = require("../../../../utilities/common");
const database = require("../../../../config/database");
const response_code = require("../../../../utilities/response-error-code");
const md5 = require("md5");
const {default: localizify} = require('localizify');
const en = require("../../../../language/en");
const fr = require("../../../../language/fr");
const guj = require("../../../../language/guj");
const validator = require("../../../../middlewares/validator");
var lib = require('crypto-lib');

const { t } = require('localizify');
// const user = require("../controllers/user");

class userModel{
    async signup(request_data, callback) {
        try {
            const data_received = {
                email_id: request_data.email_id,
                signup_type: request_data.signup_type
            };
    
            if (data_received.signup_type === 'S') {
                const data = {
                    fname: request_data.fname,
                    lname: request_data.lname,
                    email_id: request_data.email_id,
                    code_id: request_data.code_id,
                    mobile_number: request_data.mobile_number,
                    passwords: md5(request_data.passwords),
                    signup_type: request_data.signup_type
                };
    
                const findUser = `SELECT * FROM tbl_user WHERE email_id = ? OR mobile_number = ?`;
                const [existingUser] = await database.query(findUser, [data.email_id, data.mobile_number]);
    
                if (existingUser.length > 0) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: "USER ALREADY EXISTS",
                        data: existingUser[0].email_id
                    }));
                }
    
                const insertIntoUser = `INSERT INTO tbl_user SET ?`;
                const [insertResult] = await database.query(insertIntoUser, [data]);
    
                const updateStep = `UPDATE tbl_user SET isstep_ = '1' WHERE user_id = ?`;
                await database.query(updateStep, [insertResult.insertId]);
    
                const userFind = `SELECT fname, lname FROM tbl_user WHERE user_id = ?`;
                const [user] = await database.query(userFind, [insertResult.insertId]);
    
                return callback({
                    code: response_code.SUCCESS,
                    message: t('signup_success'),
                    data: user
                });
    
            } else {
                const checkUserQuery = `SELECT * FROM tbl_socials WHERE email_id = ?`;
                const [results] = await database.query(checkUserQuery, [data_received.email_id]);
    
                if (results.length === 0) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('social_id_not_found'),
                        data: results
                    }));
                }
    
                const data_socials = {
                    fname: results[0].name_,
                    passwords: md5(results[0].passwords),
                    profile_pic: results[0].profile_pic,
                    email_id: data_received.email_id,
                    signup_type: request_data.signup_type
                };
    
                const insertIntoUser = `INSERT INTO tbl_user SET ?`;
                const [insertResult] = await database.query(insertIntoUser, [data_socials]);
    
                const updateStep = `UPDATE tbl_user SET isstep_ = '1' WHERE user_id = ?`;
                await database.query(updateStep, [insertResult.insertId]);
    
                const userFind = `SELECT fname, lname FROM tbl_user WHERE user_id = ?`;
                const [user] = await database.query(userFind, [insertResult.insertId]);
    
                return callback({
                    code: response_code.SUCCESS,
                    message: t('signup_success'),
                    data: user
                });
            }
        } catch (error) {
            return callback(common.encrypt({
                code: response_code.OPERATION_FAILED,
                message: t('some_error_occurred'),
                data: error.message
            }));
        }
    }
    
}

module.exports = new userModel();