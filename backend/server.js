require("dotenv").config();

const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const express = require("express");
const path = require("path");

const app = express();

if (process.env.NODE_ENV === "development") {
    app.use((req, res, next) => {
        const origin = req.headers.origin;
        if (origin && origin.startsWith("http://localhost:")) {
            res.setHeader("Access-Control-Allow-Origin", origin);
            res.setHeader("Access-Control-Allow-Credentials", "true");
            res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
        }
        if (req.method === "OPTIONS") return res.sendStatus(204);
        next();
    });
}

app.use(express.json());
app.use(cookieParser());
mongoose.connect(process.env.MONGODB_URL);

//RUTAS
app.use("/api/auth", require("./routes/auth"));
app.use("/api/decklist", require("./routes/decklist"));
app.use("/api/commandertech", require("./routes/commandertech"));
app.use("/api/tournament", require("./routes/tournament"));
app.use("/api/comment", require("./routes/comment"));
app.use("/api/user", require("./routes/user"));
app.use("/api/tag", require("./routes/tag"));
app.use("/api/session", require("./routes/session"));

if (process.env.NODE_ENV !== "development") {
    app.use(express.static(path.join(__dirname, "../dist")));
    app.get(/.*/, (req, res) => {
        res.sendFile(path.resolve(__dirname, "../dist/index.html"));
    });
}

//LISTENER
app.listen(process.env.BACKEND_PORT, () => {
    console.log("Backend corriendo en puerto " + process.env.BACKEND_PORT);
});
