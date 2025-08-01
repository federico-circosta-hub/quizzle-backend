const mongoose = require("mongoose");

const ChallengerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  adminUsername: { type: String, required: true },
  imgLink: { type: String },
  questions: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
      wasAnswered: { type: Boolean, default: false },
      answer: { type: Number },
      isCorrect: { type: Boolean },
    },
  ],
});

module.exports = mongoose.model("Challenger", ChallengerSchema);
