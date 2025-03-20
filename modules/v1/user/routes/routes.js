const users = require("../controllers/user");

const user = (app) =>{
        app.post("/v1/user/signup", users.signup);
        app.post("/v1/user/verifyOtp", users.verifyOTP);
        app.post("/v1/user/forgotPassword", users.forgotPassword);
        app.post("/v1/user/resetPassword", users.resetPassword);
        app.post("/v1/user/complete-profile", users.complete_profile);
        app.post("/v1/user/change-password", users.changePassword);
        app.post("/v1/user/login", users.login);
        app.post("/v1/user/logout", users.logout);
        app.post("/v1/user/view-profile", users.view_profile);
        app.post("/v1/user/edit-profile", users.editProfile);
        app.post("/v1/user/home-page", users.home_page);
        app.post("/v1/user/list-stores", users.list_stores);
        app.post("/v1/user/product-listing", users.product_listing);
        app.post("/v1/user/product-detail", users.product_detail);
        app.post("/v1/user/post-review", users.post_review);
        app.post("/v1/user/place-order", users.place_order);
}

module.exports = user;