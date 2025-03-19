class routing{
    v1(app){
        const user = require("./v1/user/routes/routes");
        const admin = require("./v1/admin/routes/routes")

        user(app);
        admin(app);
    }
}

module.exports = new routing();