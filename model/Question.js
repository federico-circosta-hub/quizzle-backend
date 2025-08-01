const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  media: { type: String, required: false },
  options: { type: [String], required: true },
  correctOpt: { type: Number, required: true },
  adminUsername: { type: String, required: true },
  isPublished: { type: Boolean, default: false },
});

module.exports = mongoose.model("Question", QuestionSchema);
