module.exports = app => {
    const user = require("../controllers/UserControllers");

    app.route('/v1/user')
        .post(user.create);
    app.route('/v1/user/self')
        .get(user.get);
    app.route('/v1/user/self')
        .put(user.update);
};