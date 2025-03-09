const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../model/Admin");
const Challenger = require("../model/Challenger");

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { username, password, passphrase } = req.body;

  if (!username || !password || !passphrase) {
    return res.status(400).json({ error: "Tutti i campi sono obbligatori" });
  }

  try {
    const userExists = await Admin.findOne({ username });
    if (userExists) {
      return res.status(400).json({ error: "Username già in uso" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new Admin({
      username,
      password: hashedPassword,
      passphrase,
    });
    await newUser.save();

    res.status(201).json({ message: "Registrazione completata" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore server" });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log("req.body", req.body);
  if (!username || !password) {
    return res.status(400).json({ error: "Tutti i campi sono obbligatori" });
  }

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(400).json({ error: "Admin non trovato" });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(400).json({ error: "Password non valida" });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username, passphrase: admin.passphrase },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h",
      }
    );

    res.json({ message: "Login effettuato", token });
  } catch (err) {
    console.error("err", err);
    res.status(500).json({ error: "Errore server" });
  }
});

router.post("/verify-passphrase", async (req, res) => {
  const { challengerName, passphrase } = req.body;

  try {
    if (!challengerName || !passphrase) {
      return res.status(400).json({ error: "Dati mancanti" });
    }

    const challenger = await Challenger.findOne({ name: challengerName });
    if (!challenger) {
      return res.status(404).json({ error: "Challenger non trovato" });
    }

    const admin = await Admin.findOne({ username: challenger.adminUsername });
    if (!admin) {
      return res.status(404).json({ error: "Admin non trovato" });
    }

    const isValid = admin.passphrase === passphrase;

    res.status(200).json({ valid: isValid, adminUsername: admin.username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nella verifica della passphrase" });
  }
});

module.exports = router;
