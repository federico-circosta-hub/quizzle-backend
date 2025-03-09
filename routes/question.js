const express = require("express");
const Admin = require("../model/Admin");
const Challenger = require("../model/Challenger");
const Question = require("../model/Question");
const authMiddleware = require("../middleware/auth");
const { default: mongoose } = require("mongoose");

const router = express.Router();

router.post("/add-question", authMiddleware, async (req, res) => {
  const { question, options, correctOpt } = req.body;
  const adminUsername = req.user.username; // dal JWT

  try {
    if (!question || !options || correctOpt === undefined) {
      return res.status(400).json({ error: "Dati mancanti nella richiesta" });
    }

    const newQuestion = new Question({
      question,
      options,
      correctOpt,
      adminUsername,
    });
    await newQuestion.save();

    const admin = await Admin.findOneAndUpdate(
      { username: adminUsername },
      { $push: { questions: newQuestion._id } },
      { new: true }
    );

    if (!admin) return res.status(404).json({ error: "Admin non trovato" });

    await Challenger.updateMany(
      { adminUsername },
      {
        $push: {
          questions: { questionId: newQuestion._id, wasAnswered: false },
        },
      }
    );

    res.status(201).json({
      message: "Domanda aggiunta con successo",
      question: newQuestion,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore durante l'aggiunta della domanda" });
  }
});

router.post("/answer-question", async (req, res) => {
  const { challengerName, adminUsername, questionId, userAnswer } = req.body;

  try {
    if (
      !challengerName ||
      !adminUsername ||
      !questionId ||
      userAnswer === undefined
    ) {
      return res
        .status(400)
        .json({ error: "Dati mancanti nel body della richiesta" });
    }

    const challenger = await Challenger.findOne({
      name: challengerName,
      adminUsername,
    }).populate("questions.questionId");

    if (!challenger)
      return res.status(404).json({ error: "Challenger non trovato" });

    const question = challenger.questions.find((q) => {
      console.log(
        "q.questionId._id , questionIdObj",
        q._id.toString(),
        questionId
      );
      return q._id.toString() === questionId;
    });

    if (!question)
      return res.status(404).json({ error: "Domanda non trovata" });

    if (question.wasAnswered) {
      return res
        .status(400)
        .json({ error: "Hai già risposto a questa domanda" });
    }

    const isCorrect = userAnswer === question.questionId.correctOpt;

    question.wasAnswered = true;
    question.answer = userAnswer;
    question.isCorrect = isCorrect;

    if (isCorrect) challenger.score += 1;

    await challenger.save();
    res
      .status(200)
      .json({ message: "Risposta salvata con successo", challenger });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel salvataggio della risposta" });
  }
});

router.get("/questions", async (req, res) => {
  const { adminUsername } = req.query;

  try {
    if (!adminUsername) {
      return res.status(400).json({ error: "adminUsername è obbligatorio" });
    }

    const admin = await Admin.findOne({ username: adminUsername }).populate(
      "questions"
    );
    if (!admin) {
      return res.status(404).json({ error: "Admin non trovato" });
    }

    res.status(200).json(admin.questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel recupero delle domande" });
  }
});

module.exports = router;
