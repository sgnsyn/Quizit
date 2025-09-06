# Test Forge

## About This Program

Test Forge is a web program that helps you create and take tests. Because you can install it on your device and use it offline, it works without an internet connection.

The program works in a straightforward way:

1.  **Get Your Questions Ready:** You create your own test questions. You can do this by hand or by using a tool to generate them. Your questions must be saved in a specific JSON file format.
2.  **Make a Test:** You upload your JSON file to the program. Test Forge then turns the data into a working test right away.
3.  **Use Key Features:** As you take the test, the program automatically saves your progress, keeps track of your score, and lets you review your answers when you're done.

This project was built to make it easy to create tests, so you can spend less time building them and more time learning.

## How to Get Started

### What You Need

- A modern web browser (like Chrome, Firefox, or Safari).

### How to Run It

This program is live and ready to use. Simply visit the following link in your browser:

[PASTE YOUR GITHUB PAGES LINK HERE]

To install the program, look for an "install" button in your browser's address bar after the page has loaded. This will add Test Forge to your home screen or desktop so you can use it offline.

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
2.  **Upload the JSON file** on the Test Forge.
3.  **Start the test!** The questions will appear, and your work will be saved automatically, even if you are not connected to the internet.

## How to Help

We appreciate any help you can give to make this project better.

1.  Copy the project to your own GitHub account (Fork it).
2.  Create a new branch for your changes (`git checkout -b new-feature`).
3.  Save your changes (`git commit -m 'Add a new feature'`).
4.  Send your changes to your new branch (`git push origin new-feature`).
5.  Create a pull request to share your work with us.

## License

This project is open-source under the MIT License. See the `LICENSE` file for more details.

## Contact

Your Name - [YOUR EMAIL]

Project Link: [https://github.com/YOUR-USERNAME/test-forge](https://github.com/YOUR-USERNAME/test-forge)
