const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./api/models");
const logger = require('./api/config/winston');

function main () {
    const app = express();
    logger.info("Application start.....");
    // set port, listen for requests
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}.`);
    });

    app.use(cors());

    // parse requests of content-type - application/json
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded());
    app.use (function (error, request, response, next){
        //Catch json error
        response.status(400);
        return response.json({
            status: 400,
            message: "Bad request"
        });
    });

    let routes = require('./api/routes/Routes');
    routes(app);

   db.sequelize.sync();

    //  db.sequelize.sync({ force: true }).then(() => {
    //    console.log("Drop and re-sync db.");
    // });

}

main();




