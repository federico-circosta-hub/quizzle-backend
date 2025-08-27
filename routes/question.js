const express = require("express");
const Admin = require("../model/Admin");
const Challenger = require("../model/Challenger");
const Question = require("../model/Question");
const authMiddleware = require("../middleware/auth");
const { default: mongoose } = require("mongoose");

const router = express.Router();

router.post("/add-question", authMiddleware, async (req, res) => {
  const { question, media, options, correctOpt } = req.body;
  const adminUsername = req.user.username; // dal JWT

  try {
    if (!question || !options || correctOpt === undefined) {
      return res.status(400).json({ error: "Dati mancanti nella richiesta" });
    }

    const newQuestion = new Question({
      question,
      media,
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

    res.status(201).json({
      message: "Domanda aggiunta con successo",
      question: newQuestion,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore durante l'aggiunta della domanda" });
  }
});

router.put("/edit/:id", authMiddleware, async (req, res) => {
  const { id } = req.params; // ID della domanda
  const { question, media, options, correctOpt } = req.body;

  try {
    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      { question, media, options, correctOpt },
      { new: true, runValidators: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({ error: "Domanda non trovata" });
    }

    res
      .status(200)
      .json({
        message: "Domanda aggiornata con successo",
        question: updatedQuestion,
      });
  } catch (error) {
    console.error("Errore nella modifica della domanda:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});

router.post("/publish-question", authMiddleware, async (req, res) => {
  const { questionId } = req.body;
  const adminUsername = req.user.username;

  try {
    const admin = await Admin.findOne({ username: adminUsername });
    console.log("admin", admin);
    if (!admin) return res.status(404).json({ error: "Admin non trovato" });

    const question = await Question.findById(questionId);
    if (!question)
      return res.status(404).json({ error: "Domanda non trovata" });

    question.isPublished = true;
    await question.save();

    await Challenger.updateMany(
      { adminUsername },
      {
        $push: {
          questions: {
            questionId: question._id,
            wasAnswered: false,
            _id: question._id,
          },
        },
      }
    );

    res.status(200).json({ message: "Domanda pubblicata con successo" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nella pubblicazione della domanda" });
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

router.delete("/delete/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const deletedQuestion = await Question.findByIdAndDelete(id);
    if (!deletedQuestion) {
      return res.status(404).json({ error: "Domanda non trovata" });
    }
    console.log("deletedQuestion", deletedQuestion);
    await Admin.updateMany(
      { questions: deletedQuestion._id },
      { $pull: { questions: deletedQuestion._id } }
    );

    await Challenger.updateMany(
      { "questions.questionId": deletedQuestion._id },
      { $pull: { questions: { questionId: deletedQuestion._id } } }
    );

    res
      .status(200)
      .json({ message: "Domanda eliminata e rimossa dai riferimenti" });
  } catch (error) {
    console.error("Errore nella cancellazione della domanda:", error);
    res
      .status(500)
      .json({ error: "Errore durante l'eliminazione della domanda" });
  }
});

module.exports = router;
