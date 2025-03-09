const express = require("express");
const authMiddleware = require("../middleware/auth");
const Admin = require("../model/Admin");
const Challenger = require("../model/Challenger");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  const adminId = req.user.id;

  try {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const challengers = await Challenger.find({
      adminUsername: admin.username,
    });

    res.status(200).json(challengers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error retrieving challengers" });
  }
});

router.post("/create", authMiddleware, async (req, res) => {
  const { name, imgLink } = req.body;
  const adminId = req.user.id; // Estratto dal JWT

  try {
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ error: "Admin non trovato" });
    const alreadyPresentChallenger = await Challenger.find({
      name: name,
    });
    if (alreadyPresentChallenger)
      return res.status(409).json({ error: "Nome già in uso" });

    const questionsForChallenger = admin.questions.map((questionId) => ({
      questionId,
      wasAnswered: false,
      answer: null,
      isCorrect: false,
    }));

    const challenger = new Challenger({
      name,
      adminUsername: admin.username,
      imgLink,
      questions: questionsForChallenger,
      score: 0,
    });

    await challenger.save();
    res
      .status(201)
      .json({ message: "Challenger creato con successo", challenger });
  } catch (error) {
    res.status(500).json({ error: "Errore nella creazione del Challenger" });
    console.error(error);
  }
});

router.get("/by-name", async (req, res) => {
  const { id } = req.query;

  try {
    if (!id) {
      return res.status(400).json({ error: "nome e id obbligatori" });
    }

    const challenger = await Challenger.findById(id).populate(
      "questions.questionId",
      "-correctOpt"
    );

    if (!challenger) {
      return res.status(404).json({ error: "Challenger non trovato" });
    }

    res.status(200).json(challenger);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel recupero del Challenger" });
  }
});

router.get("/challenger-exists", async (req, res) => {
  const { name, id } = req.query;

  try {
    if (!name || !id) {
      return res.status(400).json({ error: "name e id sono obbligatori" });
    }
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res
        .status(400)
        .json({ error: "id must be a 24 character hex string" });
    }

    const exists = await Challenger.exists({ _id: id, name });

    res.status(200).json(!!exists);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel controllo del Challenger" });
  }
});

module.exports = router;
