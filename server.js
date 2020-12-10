const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./api/models");
const logger = require('./api/config/winston');

function main () {
    const app = express();
    logger.info("Application start up");
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
    db.sequelize.query("SHOW STATUS LIKE 'Ssl_cipher'", { type: db.sequelize.QueryTypes.SELECT })
        .then((result) => {
            logger.info("SSL Validation: " + result.toString() + " Result[0]  " + result[0]  + " Result value  " + JSON.stringify(result));
        });

  // let sslValidation = sslStatus();
   // logger.info("SSL Validation: " + sslValidation );
}

// async function sslStatus() {
//     return await db.sequelize.query("SHOW STATUS LIKE 'Ssl_cipher'", { type: db.sequelize.QueryTypes.SELECT });
// }

main();




