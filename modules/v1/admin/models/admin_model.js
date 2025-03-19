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

class adminModel {
    async admin_login(requested_data, callback){
        try{
            const request_data = JSON.parse(common.decryptPlain(requested_data));
            const { username, password } = request_data;

            if (!username || !password) {
                return callback(common.encrypt({
                    code: response_code.BAD_REQUEST,
                    message: "Email and Password are required"
                }));
            }
            // const pswd = md5(password);

            var query = `SELECT * from tbl_admin where admin_username = ? and admin_password = ?`;
            var [result] = await database.query(query, [username, password]);
            if(result.length === 0){
                return callback(common.encrypt({
                    code: response_code.UNAUTHORIZED,
                    message: "Please Login with Correct Admin Credentials"
                }));
            }

            const token = common.generateToken(40);
            const updateUser = `UPDATE tbl_admin set token = ?, is_login = 1 where admin_username = ?`;
            await database.query(updateUser, [token, username]);

            return callback(common.encrypt({
                code: response_code.SUCCESS,
                message: "Admin Login Success"
            }))

        } catch(error){
            return callback(common.encrypt({
                code: response_code.OPERATION_FAILED,
                message: "ERROR",
                data: error.message
            }));
        }
    }
    
    async admin_logout(admin_id, callback){
        try{
            const findAdmin = `SELECT * from tbl_admin where id = ${admin_id} and is_login = 1`;
            const [result] = await database.query(findAdmin);
            if(result.length === 0){
                return callback(common.encrypt({
                    code: response_code.NOT_FOUND,
                    message: "ADMIN NOT FOUND",
                    data: result
                }));
            }

            const query = `UPDATE tbl_admin SET token = null, is_login = 0 where id = ${admin_id}`;
            const [data] = await database.query(query);

            return callback(common.encrypt({
                code: response_code.SUCCESS,
                message: "SUCCESSFULLY LOGOUT"
            }))

        } catch(error){
            return callback(common.encrypt({
                code: response_code.OPERATION_FAILED,
                message: "ERROR OCCURED",
                data: error.message
            }));
        }
    }
    
}

module.exports = new adminModel();