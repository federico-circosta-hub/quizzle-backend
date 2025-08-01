const express = require("express");
const Challenger = require("../model/Challenger");

const router = express.Router();

router.get("/", async (req, res) => {
  const { adminUsername } = req.query;

  try {
    if (!adminUsername) {
      return res.status(400).json({ error: "adminUsername è richiesto" });
    }

    const challengers = await Challenger.find({ adminUsername });

    if (challengers.length === 0) {
      return res
        .status(404)
        .json({ error: "Nessun Challenger trovato per questo Admin" });
    }
    const challengersResponse = challengers.map((challenger) => ({
      name: challenger.name,
      imgLink: challenger.imgLink,
      score: challenger.questions.filter((q) => q.isCorrect && q.wasAnswered)
        .length,
      totalQuestions: challenger.questions.length,
      notAnsweredQuestions: challenger.questions.filter((q) => !q.wasAnswered)
        .length,
    }));
    res.json(challengersResponse.sort((a, b) => b.score - a.score));
  } catch (error) {
    res.status(500).json({ error: "Errore nel recupero della dashboard" });
  }
});

module.exports = router;
