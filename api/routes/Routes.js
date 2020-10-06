module.exports = app => {
    const user = require("../controllers/UserControllers");
    const question = require("../controllers/QuestionController");
    const answer = require("../controllers/AnswerController");

    app.route('/v1/user')
        .post(user.create);
    app.route('/v1/user/self')
        .get(user.get);
    app.route('/v1/user/self')
        .put(user.update);
    app.route('/v1/user/:user_id')
        .get(user.getByUserId);

    app.route('/v1/question/')
        .post(question.addQuestion);
    app.route('/v1/question/:question_id')
        .put(question.updateQuestion);
    app.route('/v1/question/:question_id')
        .delete(question.deleteQuestion);

    app.route('/v1/question/:question_id/answer')
        .post(answer.addAnswer);
    app.route('/v1/question/:question_id/answer/:answer_id')
        .put(answer.updateAnswer);
    app.route('/v1/question/:question_id/answer/:answer_id')
        .delete(answer.deleteAnswer);
    app.route('/v1/question/:question_id/answer/:answer_id')
        .get(answer.getAnswer);


};