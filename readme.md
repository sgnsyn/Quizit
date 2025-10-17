# Quizit

---

## Introduction

Quizit is a web app that helps you make and take tests. The best part? You can use it offline once you have it on your device. No internet, no problem!

It works in a few easy steps:

1.  **Prep Your Questions:** Write your own questions and save them in a special JSON file format. (You can also generate your questions using AI, just so you know).
2.  **Make Your Test:** Upload that file to the program. Quizit instantly turns it into a live test.
3.  **Take Your Test:** The program automatically saves your progress, tracks your score, and lets you review everything once you're done.

This project was built to make creating tests a breeze, so you can spend less time setting things up and more time actually learning.

---

## Getting Started

### What You'll Need

- A modern web browser like Chrome, Firefox, or Safari.

### How to Run It

This program is ready to go! Just go to [Quizit](https://sgnsyn.github.io/Quizit/)

If you want to install it, just look for an **"install" button** in your browser's address bar after the page loads. It'll add Quizit to your home screen or desktop, so you can use it offline anytime.

---

## How to Use It

### Making a Test

1.  **Create a JSON file** with your questions. The file should look like this:

    ```json
    {
      "title": "<your subject here>",
      "type": "multiple choice",
      "questions": [
        {
          "question": "sample question?",
          "answers": ["A", "B", "C", "D"],
          "correct_option": 1,
          "explanation": "Why this answer is correct."
        }
      ]
    }
    ```

    A quick heads-up: when using AI to generate questions, the answers can sometimes be biased towards the same option (like 'B' being the correct answer for every question). To avoid this, Quizit automatically shuffles the answers you provide.

2.  **Upload the JSON file** on the Quizit page.
3.  **Start your test!** Questions will pop up, and your progress saves automatically, even if you lose your internet connection.

---

## Want to Help?

We'd love your help to make this project even better.

1.  **Fork** this project to your own GitHub account.
2.  **Create a new branch** for your changes (`git checkout -b new-feature`).
3.  **Commit your changes** (`git commit -m 'Add a new feature'`).
4.  **Push your changes** to your new branch (`git push origin new-feature`).
5.  **Open a pull request** to share your work with everyone!
