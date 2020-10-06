module.exports = app => {
    const user = require("../controllers/UserControllers");
    const question = require("../controllers/QuestionController");

    app.route('/v1/user')
        .post(user.create);
    app.route('/v1/user/self')
        .get(user.get);
    app.route('/v1/user/self')
        .put(user.update);

    app.route('/v1/question/')
       // .post(question.createQuestion);
        .post(question.addQuestion);

};