module.exports = app => {
    const user = require("../controllers/UserControllers");

    var router = require("express").Router();

    router.post("/", user.create);
    router.get("/", user.get);

    app.use('/api/user', router);
};