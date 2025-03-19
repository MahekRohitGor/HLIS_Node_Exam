const users = require("../controllers/user");

const user = (app) =>{
        app.post("/v1/user/signup", users.signup);
}

module.exports = user;