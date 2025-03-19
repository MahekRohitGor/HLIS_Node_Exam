const express = require("express");
const app = express();
const path = require("path");
const common = require("./utilities/common");
const constant = require("./config/constants");
const app_routing = require("./modules/app-routing");
const validator = require("./middlewares/validator");
const headerAuth = require("./middlewares/header-auth");
const api_doc = require('./modules/v1/Api_document/route');

require('dotenv').config();

app.use(express.urlencoded({ extended: true }));
app.use(express.text());

app.use("/api-doc", api_doc);

app.use(validator.extractHeaderLang);
app.use(headerAuth.validateHeader);
app.use(headerAuth.header);

app_routing.v1(app);

app.listen(process.env.PORT | 5000, () => {
    console.log(`Server started on: http://localhost:${process.env.PORT}`);
});