require("dotenv").config();

const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const express = require("express");
const path = require("path");

const app = express();
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
