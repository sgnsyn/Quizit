export function validateQuizJSON(jsonString) {
  let data;
  try {
    data = JSON.parse(jsonString);
  } catch (error) {
    return { isValid: false, error: "Invalid JSON format." };
  }

  if (typeof data.title !== 'string' || data.title.trim() === '') {
    return { isValid: false, error: "Missing or empty 'title'." };
  }

  if (typeof data.type !== 'string' || data.type.trim() === '') {
    return { isValid: false, error: "Missing or empty 'type'." };
  }

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    return { isValid: false, error: "'questions' must be an array with at least one question." };
  }

  for (let i = 0; i < data.questions.length; i++) {
    const question = data.questions[i];
    if (typeof question.question !== 'string' || question.question.trim() === '') {
      return { isValid: false, error: `Question ${i + 1} is missing or empty.` };
    }
    if (!Array.isArray(question.answers) || question.answers.length < 2) {
      return { isValid: false, error: `Question ${i + 1} must have at least two answers.` };
    }
    if (typeof question.explanation !== 'string' || question.explanation.trim() === '') {
      return { isValid: false, error: `Question ${i + 1} is missing or empty explanation.` };
    }
    if (typeof question.correct_option !== 'number' || !Number.isInteger(question.correct_option)) {
      return { isValid: false, error: `Question ${i + 1} 'correct_option' must be an integer.` };
    }
    if (question.correct_option < 0 || question.correct_option >= question.answers.length) {
      return { isValid: false, error: `Question ${i + 1} 'correct_option' is out of range.` };
    }
  }

  return { isValid: true, data: data };
}