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
    async findExistingUser(database, email_id, mobile_number = null) {
        const findUserQuery = `SELECT * FROM tbl_user WHERE (email_id = ? OR mobile_number = ?) AND is_deleted = 0 AND is_active = 1`;
        const [existingUser] = await database.query(findUserQuery, [email_id, mobile_number || email_id]);
        return existingUser;
    }

    async handleExistingUserOTP(database, user, callback) {
        const findOtpQuery = `SELECT * FROM tbl_otp WHERE user_id = ? AND is_deleted = 0 AND is_active = 1 AND verify = 0`;
        const [userOTP] = await database.query(findOtpQuery, [user.user_id]);
    
        if (userOTP.length > 0) {
            return callback(common.encrypt({
                code: response_code.VERIFICATION_PENDING,
                message: t('verify_account_user_exists')
            }));
        }
    
        const otp_ = common.generateOtp(4);
        const otpObj = {
            otp: otp_,
            user_id: user.user_id
        };
    
        const insertOtp = `INSERT INTO tbl_otp SET ?`;
        await database.query(insertOtp, [otpObj]);
    
        return callback(common.encrypt({
            code: response_code.VERIFICATION_PENDING,
            message: t('otp_sent_please_verify_acc'),
            data: user.email_id
        }));
    }

    async signup(request_data, callback) {
        try {
            const data_received = {
                email_id: request_data.email_id,
                signup_type: request_data.signup_type
            };
    
            const device_data = {
                device_type: request_data.device_type,
                os_version: request_data.os_version,
                app_version: request_data.app_version,
                time_zone: request_data.time_zone
            };
    
            let userData;
            let insertResult;
    
            if (data_received.signup_type === 'S') {
                userData = {
                    fname: request_data.fname,
                    lname: request_data.lname,
                    email_id: request_data.email_id,
                    code_id: request_data.code_id,
                    mobile_number: request_data.mobile_number,
                    passwords: md5(request_data.passwords),
                    signup_type: request_data.signup_type
                };
    
                const existingUser = await this.findExistingUser(database, userData.email_id, userData.mobile_number);
                
                if (existingUser.length > 0) {
                    return await this.handleExistingUserOTP(database, existingUser[0], callback);
                }
    
            } else {
                const checkSocialQuery = `SELECT * FROM tbl_socials WHERE email_id = ? and is_active = 1 and is_deleted = 0`;
                const [socialResults] = await database.query(checkSocialQuery, [data_received.email_id]);
    
                if (socialResults.length === 0) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('social_id_not_found'),
                        data: socialResults
                    }));
                }
    
                const existingUser = await this.findExistingUser(database, data_received.email_id);
                if (existingUser.length > 0) {
                    return await this.handleExistingUserOTP(database, existingUser[0], callback);
                }
    
                userData = {
                    fname: socialResults[0].name_,
                    passwords: md5(socialResults[0].passwords),
                    profile_pic: socialResults[0].profile_pic,
                    email_id: data_received.email_id,
                    signup_type: request_data.signup_type
                };
            }
    
            const insertIntoUser = `INSERT INTO tbl_user SET ?`;
            [insertResult] = await database.query(insertIntoUser, [userData]);
    
            const updateStep = `UPDATE tbl_user SET isstep_ = '1' WHERE user_id = ? and is_active = 1 and is_deleted = 0`;
            await database.query(updateStep, [insertResult.insertId]);
    
            const devicetoken = common.generateToken(40);
            device_data.device_token = devicetoken;
            device_data.user_id = insertResult.insertId;
    
            const insertDeviceData = `INSERT INTO tbl_device_info SET ?`;
            await database.query(insertDeviceData, device_data);

            const userFind = `SELECT fname, lname FROM tbl_user WHERE user_id = ? and is_active = 1 and is_deleted = 0`;
            const [user] = await database.query(userFind, [insertResult.insertId]);

            const otp_ = common.generateOtp(4);
            const otpObj = {
                otp: otp_,
                user_id: insertResult.insertId
            };
        
            const insertOtp = `INSERT INTO tbl_otp SET ?`;
            await database.query(insertOtp, [otpObj]);
    
            return callback({
                code: response_code.SUCCESS,
                message: t('signup_success'),
                data: user
            });
    
        } catch (error) {
            return callback(common.encrypt({
                code: response_code.OPERATION_FAILED,
                message: t('some_error_occurred'),
                data: error.message
            }));
        }
    }

    async verifyOTP(request_data, callback){
        try {
            const {email_id} = request_data;
            const selectUserQuery = "SELECT user_id FROM tbl_user WHERE email_id = ?";
            const [userResult] = await database.query(selectUserQuery, [email_id]);

            if (userResult.length === 0) {
                return callback(common.encrypt({
                    code: response_code.NOT_FOUND,
                    message: t('email_not_registered')
                }));
            }

            const user_id = userResult[0].user_id;
    
            const selectUserWithUnverified = "SELECT * FROM tbl_otp WHERE user_id = ?";
            const [result] = await database.query(selectUserWithUnverified, [user_id]);
    
            if (result.length === 0) {
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('otp_not_found')
                }));
            }
    
            const userOtpData = result[result.length - 1];
            const currentTime = new Date();
            const expireTime = new Date(userOtpData.expire_time);
    
            if (userOtpData.verify === 1) {
                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('already_verified'),
                    data: userOtpData
                }));
            }

            if (currentTime > expireTime) {
                const newOtp = common.generateOtp(4)
                const newExpireTime = new Date();
                newExpireTime.setHours(newExpireTime.getHours() + 1);
    
                const updateOtpQuery = "UPDATE tbl_otp SET otp = ?, expire_time = ? WHERE user_id = ?";
                await database.query(updateOtpQuery, [newOtp, newExpireTime, user_id]);
    
                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: "OTP Expired. New OTP sent.",
                    data: { newOtp, expire_time: newExpireTime }
                }));
            }
    
            if (request_data.otp === userOtpData.otp) {
                const updateUserQuery = "UPDATE tbl_otp SET verify = 1, is_active=0, is_deleted = 1 WHERE user_id = ?";
                await database.query(updateUserQuery, [user_id]);

                const updateIsStepQuery = "UPDATE tbl_user SET isstep_ = ? WHERE user_id = ?";
                await database.query(updateIsStepQuery, ['2', user_id]);
    
                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('otp_verify_success')
                }));
            } else {
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('invalid_otp')
                }));
            }
        } catch (error) {
            return callback(common.encrypt({
                code: response_code.OPERATION_FAILED,
                message: t('some_error_occurred'),
                data: error
            }));
        }
    }

    async forgotPassword(request_data, callback) {
        try {
            if (!request_data.email_id) {
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('provide_email')
                }));
            }
    
            const data = {};
            let userQuery = "SELECT * FROM tbl_user WHERE email_id = ? and is_active = 1 and is_deleted = 0";
            const [userResult] = await database.query(userQuery, [request_data.email_id]);
    
            if (userResult.length === 0) {
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('user_not_found_signup_req') // new
                }));
            }
    
            const user = userResult[0];
            if(user.signup_type != 'S'){
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('signup_type_invalid_for_forgot_pswd'), // new
                    data: user.fname
                }))
            }

            const existingToken = `SELECT * from tbl_forgot_passwords where email_id = ? and expires_at > NOW()`;
            const [exitingTokenData] = await database.query(existingToken, [request_data.email_id]);
            if(exitingTokenData.length > 0){
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('token_sent_already_req_after_1hr'), // new
                    data: exitingTokenData[0].reset_token
                }))
            }

            const resetToken = common.generateToken(10);
            const tokenData = {
                reset_token: resetToken,
                expires_at: new Date(Date.now() + 3600000)
            };
    
            tokenData.email_id = request_data.email_id;

            await database.query("INSERT INTO tbl_forgot_passwords SET ?", tokenData);
            
            return callback(common.encrypt({
                code: response_code.SUCCESS,
                message: t('password_reset_token_sent')
            }));
    
        } catch(error) {
            console.error(error);
            return callback(common.encrypt({
                code: response_code.OPERATION_FAILED,
                message: error.sqlMessage || t('forgot_password_error')
            }));
        }
    }

    async resetPassword(requested_data, callback){
        const { reset_token, new_password } = requested_data;
    
        try {
            const selectTokenQuery = `
                SELECT email_id FROM tbl_forgot_passwords 
                WHERE reset_token = '${reset_token}' AND is_active = 1 AND expires_at > NOW()
            `;
    
            const [result] = await database.query(selectTokenQuery);
            console.log(result);
    
            if (!result.length) {
                return callback(common.encrypt({
                    code: response_code.NOT_FOUND,
                    message: t('invalid_expired_reset_token')
                }));
            }
    
            const email_id = result[0].email_id;
            const hashedPassword = md5(new_password);
    
            const updatePasswordQuery = "UPDATE tbl_user SET passwords = ? WHERE email_id = ?";
            await database.query(updatePasswordQuery, [hashedPassword, email_id]);
    
            const deactivateTokenQuery = "UPDATE tbl_forgot_passwords SET is_active = 0 WHERE reset_token = ?";
            await database.query(deactivateTokenQuery, [reset_token]);
    
            return callback(common.encrypt({
                code: response_code.SUCCESS,
                message: t('password_reset_success')
            }));
    
        } catch (error) {
            return callback(common.encrypt({
                code: response_code.OPERATION_FAILED,
                message: error.sqlMessage || t('password_reset_error')
            }));
        }
    }

    async complete_profile(requested_data, callback) {
        try {
            const { email_id, address, date_of_birth, gender, latitude, longitude } = requested_data;
    
            const findUserQuery = `SELECT * FROM tbl_user WHERE email_id = ?`;
            const [user_data] = await database.query(findUserQuery, [email_id]);
    
            if (!user_data.length) {
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('please_register')
                }));
            }
    
            const user_id = user_data[0].user_id;

            const profile_status = user_data[0].is_profile_completed;
            if(profile_status === 1){
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('profile_already_completed')
                }))
            }

            let formattedDOB = null;
            if (date_of_birth) {
                const parsedDate = new Date(date_of_birth);
                if (isNaN(parsedDate.getTime())) {
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('invalid_date_of_birth')
                    }));
                }
                formattedDOB = parsedDate.toISOString().split('T')[0];
            }
    
            const updateUserQuery = `
                UPDATE tbl_user 
                SET address = ?, date_of_birth = ?, gender = ?, 
                    isstep_ = ?, is_profile_completed = ?, latitude = ?, longitude = ? 
                WHERE user_id = ?
            `;
    
            await database.query(updateUserQuery, [
                address, formattedDOB, gender, '3', 1, latitude, longitude, user_id
            ]);
    
            return callback(common.encrypt({
                code: response_code.SUCCESS,
                message: t('profile_completed_success')
            }));
    
        } catch (error) {
            return callback(common.encrypt({
                code: response_code.OPERATION_FAILED,
                message: t('some_error_occurred'),
                data: error
            }));
        }
    }    

    async login(request_data, callback){
        try{
            const login_type = request_data.login_type;

            if(login_type === 'S'){
                const email_id = request_data.email_id;
                const passwords = md5(request_data.passwords);

                const findUser = `SELECT * from tbl_user where email_id = ? and passwords = ? and is_active = 1 and is_deleted = 0 and is_profile_completed = 1`;
                const [user] = await database.query(findUser, [email_id, passwords]);

                if(user.length === 0){
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('user_not_found')
                    }));
                }

                if(user[0].signup_type != 'S'){
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('invalid_login_type')
                    }));
                }

                const token = common.generateToken(40);
                const updateUser = `UPDATE tbl_user SET login_type = 'S', token = ?, is_login = 1 where user_id = ?`;
                await database.query(updateUser, [token, user[0].user_id]);

                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('login_success'), // new
                    data: "WELCOME " + user[0].fname
                }));

            } else{
                const email_id = request_data.email_id;
                const findUser = `SELECT * from tbl_user where email_id = ? and is_active = 1 and is_deleted = 0 and is_profile_completed = 1`;
                const [user] = await database.query(findUser, [email_id]);

                if(user.length === 0){
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('user_not_found'),
                        data: user[0]
                    }));
                }

                if(user[0].signup_type != login_type){
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('invalid_login_type')
                    }));
                }

                const findUserInSocials = `SELECT passwords from tbl_socials where email_id = ? and is_active = 1 and is_deleted = 0`;
                const [data] = await database.query(findUserInSocials, [email_id]);
                const passwords = md5(data[0].passwords);
                if(passwords != user[0].passwords){
                    return callback(common.encrypt({
                        code: response_code.OPERATION_FAILED,
                        message: t('invalid_password')
                    }));
                }

                const token = common.generateToken(40);
                const updateUser = `UPDATE tbl_user SET login_type = ?, token = ?, is_login = 1 where user_id = ?`;
                await database.query(updateUser, [login_type, token, user[0].user_id]);

                return callback(common.encrypt({
                    code: response_code.SUCCESS,
                    message: t('login_success'), // new
                    data: "WELCOME " + user[0].fname
                }));
            }

        } catch(error){
            return callback(common.encrypt({
                code: response_code.OPERATION_FAILED,
                message: t('some_error_occured'),
                data: error.message
            }));
        }
    }

    async changePassword(request_data, user_id, callback){
        var selectQuery = "SELECT * FROM tbl_user WHERE user_id = ? and is_login = 1 and is_active = 1 and is_deleted = 0";
        try {
            const [rows] = await database.query(selectQuery, [user_id]);
            
            if (!rows || rows.length === 0) {
                return callback(common.encrypt({
                    code: response_code.NOT_FOUND,
                    message: t('no_data_found')
                }));
            }
            const user = rows[0];
            if(user.signup_type != "S"){
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('cant_change_password_for_socials')
                }));
            }
    
            const oldPasswordHash = md5(request_data.old_password);
            const newPasswordHash = md5(request_data.new_password);

            if (oldPasswordHash !== user.passwords) {
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('old_password_mismatch')
                }));
            }
    
            if (newPasswordHash === user.passwords) {
                return callback(common.encrypt({
                    code: response_code.OPERATION_FAILED,
                    message: t('old_new_password_same')
                }));
            }
    
            const data = {
                passwords: newPasswordHash
            };

            const updateQuery = "UPDATE tbl_user SET ? where user_id = ?";
            await database.query(updateQuery, [data, user_id]);

            const selectUser = "SELECT * FROM tbl_user where user_id = ?"
            const [result] = await database.query(selectUser, [user_id]);

            return callback(common.encrypt({
                code: response_code.SUCCESS,
                message: t('password_changed_success'),
                data: result
            }));
    
        } catch (error) {
            console.error('Change Password Error:', error);
            return callback(common.encrypt({
                code: response_code.OPERATION_FAILED,
                message: error.message || t('password_change_error')
            }));
        }
    }

    async logout(request_data, user_id, callback){
        try{

            

        } catch(error){
            return callback(common.encrypt({
                code: response_code.OPERATION_FAILED,
                message: error.message
            }));
        }
    }
    
}

module.exports = new userModel();