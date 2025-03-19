const users = require("../controllers/user");

const user = (app) =>{
        app.post("/v1/user/signup", users.signup);
        app.post("/v1/user/verifyOtp", users.verifyOTP);
        app.post("/v1/user/forgotPassword", users.forgotPassword);
        app.post("/v1/user/resetPassword", users.resetPassword);
        app.post("/v1/user/complete-profile", users.complete_profile);
        app.post("/v1/user/change-password", users.changePassword);
        app.post("/v1/user/login", users.login);
}

module.exports = user;