/* Question related services create question, get question*/
const db = require("../models");
const Question = db.question;
const Category = db.categories;
const {v4: uuidv4} = require("uuid");

// exports.createQuestion = function (question, categories) {
//     const newQuestion = new Question(question);
//     let save = newQuestion.save()
//         .then(function(saveResult){
//             if(!categories || categories.length === 0 ) {
//                 return save;
//             }
//             let getAllCats =  Category.findAll({
//                 attributes: ["category"], raw: true
//             }).then(cats => upsertCategories(cats, categories)).then(function () {
//                 return save;
//             });
//         })
//         .catch(function(e) {
//             console.error(e.message); // "oh, no!"
//             return e;
//         });
//
//
//
//     let upsertCategories =  function(dbCategories, newCategories) {
//         dbCategories = dbCategories.map(category => category.category);
//         newCategories = newCategories.map(category => category.category);
//         let catsToBeAdded = newCategories.filter(e => !dbCategories.includes(e));
//         if(catsToBeAdded.length === 0) {
//             // I dont know what to do here
//             return;
//         }
//         console.log(catsToBeAdded);
//         let values = "";
//         catsToBeAdded.forEach(cat => {
//             values += "(" + "'" + uuidv4() + "'" + "," + " ";
//             values += "'" + cat + "'" + "," + " ";
//             values += "CURRENT_TIMESTAMP" + "," + " ";
//             values += "CURRENT_TIMESTAMP" + ")";
//             values += ",";
//         });
//         values = values.substr(0, values.length-1);
//         let prefix = "INSERT INTO `categories` VALUES ";
//         console.log(values);
//         let query = prefix + values;
//         db.sequelize.query(query, function(err) {
//             if(err){
//                 console.log("blah 1");
//             } else{
//                 console.log("blah 2");
//             }
//         });
//     };
//
//
// };

exports.addQuestion = function (question) {
    const newQuestion = new Question(question);
    let save = newQuestion.save();
    return save;
};