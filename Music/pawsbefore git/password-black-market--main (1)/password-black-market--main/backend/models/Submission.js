const mongoose = require("mongoose");

const SubmissionSchema = new mongoose.Schema(
  {
    teamId: { type: String, required: true, index: true },
    firebaseUID: { type: String, required: true, index: true },
    accountUsername: { type: String, required: true },
    passwordAttempt: { type: String, required: true },
    success: { type: Boolean, default: false },
    message: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", SubmissionSchema);
