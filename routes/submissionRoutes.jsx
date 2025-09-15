// Lecturer grades a submission
router.patch("/grade/:submissionId", authMiddleware("lecturer"), async (req, res) => {
  const { grade, feedback } = req.body;
  const submission = await Submission.findById(req.params.submissionId);

  if (!submission) return res.status(404).json({ message: "Submission not found" });

  submission.grade = grade;
  submission.feedback = feedback;
  await submission.save();

  res.json(submission);
});

// Student views their own submission with grade & feedback
router.get("/my/:taskId", authMiddleware("student"), async (req, res) => {
  const mySub = await Submission.findOne({ task: req.params.taskId, student: req.user.id });
  res.json(mySub);
});
