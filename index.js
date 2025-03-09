require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());

const allowedOrigins = ["http://localhost:3000", "https://uizzle.netlify.app"];

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("origin", origin);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed for this origin"));
      }
    },
    credentials: true,
  })
);

app.use((err, req, res, next) => {
  if (err.message === "CORS not allowed for this origin") {
    return res
      .status(403)
      .json({ error: "Accesso non consentito da questa origine" });
  }
  next(err);
});

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("connected", () => console.log("✅ Connesso a MongoDB"));
mongoose.connection.on("error", (err) => console.error("Errore MongoDB:", err));

const authRoutes = require("./routes/auth");
const questionRoutes = require("./routes/question");
const challengerRoutes = require("./routes/challenger");
const dashboardRoutes = require("./routes/dashboard");
app.use("/auth", authRoutes);
app.use("/question", questionRoutes);
app.use("/challenger", challengerRoutes);
app.use("/dashboard", dashboardRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server avviato sulla porta ${PORT}`));
