const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctOpt: { type: Number, required: true },
  adminUsername: { type: String, required: true },
});

module.exports = mongoose.model("Question", QuestionSchema);
