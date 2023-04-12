const express = require("express");
const http = require("http");
const path = require("path");
const { routesInit } = require("./routes/configRoutes")
const cors = require("cors");

require("./db/mongoConnect")

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

routesInit(app);
app.get('*', function (req, res) {
    res.status(404).sendfile(path.join(__dirname, "public", "page404.html"));
})



const server = http.createServer(app);
let port = process.env.PORT || 3003;
server.listen(port);



