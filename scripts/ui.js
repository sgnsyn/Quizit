import {
  openFolders,
  getSelectedItem,
  setSelectedItem,
  setPopupMenu,
  setBackdrop,
  getPopupMenu,
  getBackdrop,
  getActiveFileIcon,
  setActiveFileIcon,
  saveState,
  getDirectory,
  getContent,
  saveContent,
  getQuizState,
  saveQuizState,
} from "./state.js";
import * as fileSystem from "./fileSystem.js";
import { validateQuizJSON } from "./jsonParse.js";

import { showCustomPopup } from "./popup.js";

let currentQuizData = null;
let currentQuestionIndex = 0;
let currentPageWindow = 0;
let currentFilter = "all";
let filteredIndices = [];

const filterMap = {
  all: 0,
  correct: 1,
  incorrect: 2,
  unattempted: 3,
};

function applyFilter() {
  const quizState = getQuizState();
  const path = getSelectedItem();
  const fileQuizState =
    quizState[path] && quizState[path].questions
      ? quizState[path].questions
      : [];

  if (currentFilter === "all") {
    filteredIndices = [...Array(currentQuizData.questions.length).keys()];
  } else if (currentFilter === "correct") {
    filteredIndices = fileQuizState
      .filter((q) => q.is_correct)
      .map((q) => q.question_id);
  } else if (currentFilter === "incorrect") {
    filteredIndices = fileQuizState
      .filter((q) => !q.is_correct)
      .map((q) => q.question_id);
  } else if (currentFilter === "unattempted") {
    const answeredIndices = fileQuizState.map((q) => q.question_id);
    filteredIndices = [
      ...Array(currentQuizData.questions.length).keys(),
    ].filter((i) => !answeredIndices.includes(i));
  }
}

function updateScore() {
  const quizState = getQuizState();
  const path = getSelectedItem();
  const fileQuizState =
    quizState[path] && quizState[path].questions
      ? quizState[path].questions
      : [];
  const correctAnswers = fileQuizState.filter((q) => q.is_correct).length;
  const totalQuestions = currentQuizData.questions.length;

  const scoreSpan = document.querySelector(".total-score span:last-child");
  scoreSpan.textContent = `${correctAnswers}/${totalQuestions}`;

  if (!quizState[path]) {
    quizState[path] = {
      lastQuestionIndex: [0, 0, 0, 0],
      questions: [],
      filter: "all",
    };
  }
  quizState[path].score = {
    correct: correctAnswers,
    total: totalQuestions,
  };
  saveQuizState(quizState);
}

const uiFunctions = {
  createFileTree,
  displayFileContent,
  closePopupMenu,
  toggleNav,
};

export function setInstallIcon() {
  const installBtn = document.getElementById("install-btn");
  if (installBtn) {
    const use = installBtn.querySelector("use");
    if (use) {
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      if (isMobile) {
        use.setAttribute("href", "#mobile-install");
      } else {
        use.setAttribute("href", "#desktop-install");
      }
    }
  }
}

export function toggleNav() {
  document.body.classList.toggle("nav-open");
  const navBackdrop = document.querySelector(".nav-backdrop");
  navBackdrop.classList.toggle("disabled");
}

export function displayFileContent(path) {
  const fileContentDiv = document.querySelector(".file-content");
  const fileView = fileContentDiv.querySelector(".file-view");
  const noFileContent = fileContentDiv.querySelector(".no-file-content");
  const noFileSelected = fileContentDiv.querySelector(".no-file-selected");
  const contentInput = noFileContent.querySelector(".content-textarea");
  const clearButton = noFileContent.querySelector("#clear-btn");
  const saveButton = noFileContent.querySelector("#save-btn");
  const questionDisplay = fileView.querySelector(".question-display");
  const titleSpan = document.querySelector(".directory-display .title");

  titleSpan.textContent = "";

  if (path && getContent().hasOwnProperty(path)) {
    const fileContent = getContent()[path];

    if (fileContent === "") {
      noFileSelected.classList.add("disabled");
      fileView.classList.add("disabled");
      noFileContent.classList.remove("disabled");

      contentInput.value = "";

      const newClearButton = clearButton.cloneNode(true);
      clearButton.parentNode.replaceChild(newClearButton, clearButton);
      const newSaveButton = saveButton.cloneNode(true);
      saveButton.parentNode.replaceChild(newSaveButton, saveButton);

      newClearButton.addEventListener("click", () => {
        contentInput.value = "";
      });

      newSaveButton.addEventListener("click", () => {
        const loadingBackdrop = document.querySelector(".loading-backdrop");
        const loadingText = loadingBackdrop.querySelector(".loading-text");

        loadingBackdrop.classList.remove("disabled");
        let dotCount = 1;
        const intervalId = setInterval(() => {
          loadingText.textContent = "loading" + ".".repeat(dotCount);
          dotCount = (dotCount % 3) + 1;
        }, 500);

        setTimeout(() => {
          try {
            const newContent = contentInput.value;
            const validationResult = validateQuizJSON(newContent);

            const errorContainer =
              noFileContent.querySelector(".error-container");
            if (!validationResult.isValid) {
              errorContainer.textContent = validationResult.error;
              loadingBackdrop.classList.add("disabled");
              clearInterval(intervalId);
              return;
            }

            errorContainer.textContent = "";

            let quizData = JSON.parse(newContent);
            quizData = scrambleQuizAnswers(quizData);
            const scrambledContent = JSON.stringify(quizData, null, 2);

            const currentContent = getContent();
            currentContent[path] = scrambledContent;
            saveContent(currentContent);

            loadingBackdrop.classList.add("disabled");
            clearInterval(intervalId);
            displayFileContent(path);
          } catch (e) {
            // .error("Error processing JSON:", e);
            const errorContainer =
              noFileContent.querySelector(".error-container");
            errorContainer.textContent =
              "An error occurred while processing the file.";
            loadingBackdrop.classList.add("disabled");
            clearInterval(intervalId);
          }
        }, 10);
      });

      contentInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          newSaveButton.click();
        }
      });

      const copyButton = noFileContent.querySelector(".copy-button");
      const copyFeedback = noFileContent.querySelector(".copy-feedback");
      copyButton.addEventListener("click", () => {
        const codeBlock = noFileContent.querySelector(".code-block");
        const textToCopy = codeBlock.innerText;
        copyTextToClipboard(textToCopy).then((success) => {
          if (success) {
            copyFeedback.classList.remove("disabled");
            setTimeout(() => {
              copyFeedback.classList.add("disabled");
            }, 2000);
          }
        });
      });
    } else {
      try {
        const quizData = JSON.parse(fileContent);
        if (quizData.questions) {
          noFileSelected.classList.add("disabled");
          noFileContent.classList.add("disabled");
          fileView.classList.remove("disabled");

          currentQuizData = quizData;
          const quizState = getQuizState();
          const fileState = quizState[path] || {
            lastQuestionIndex: [0, 0, 0, 0],
            questions: [],
            filter: "all",
          };
          currentFilter = fileState.filter;

          const filterButton = document.querySelector(".filter-button");
          const filterButtonSpan = filterButton.querySelector("span");
          const filterPopup = document.querySelector(".filter-popup");
          const filterOptions = filterPopup.querySelectorAll("li");

          const selectedOption = Array.from(filterOptions).find(
            (option) => option.dataset.filter === currentFilter,
          );

          filterOptions.forEach((option) =>
            option.classList.remove("selected"),
          );

          if (selectedOption) {
            selectedOption.classList.add("selected");
            filterButtonSpan.textContent = selectedOption.textContent;
          }

          applyFilter();

          if (filteredIndices.length > 0) {
            if (
              !filteredIndices.includes(
                fileState.lastQuestionIndex[filterMap[currentFilter]],
              )
            ) {
              currentQuestionIndex = filteredIndices[0];
            } else {
              currentQuestionIndex =
                fileState.lastQuestionIndex[filterMap[currentFilter]];
            }
            const questionsPerPage = window.innerWidth <= 720 ? 5 : 10;
            currentPageWindow = Math.floor(
              filteredIndices.indexOf(currentQuestionIndex) / questionsPerPage,
            );
            if (currentPageWindow < 0) {
              currentPageWindow = 0;
            }
            renderQuiz(questionDisplay);
            updateScore();
          } else {
            questionDisplay.innerHTML =
              "<p>No questions match the current filter.</p>";
            renderPagination();
          }

          if (quizData.title) {
            titleSpan.textContent = quizData.title;
          }
        } else {
          throw new Error("Invalid JSON structure");
        }
      } catch (error) {
        noFileSelected.classList.add("disabled");
        noFileContent.classList.add("disabled");
        fileView.classList.remove("disabled");

        questionDisplay.textContent = fileContent;
      }
    }
  } else {
    noFileSelected.classList.remove("disabled");
    fileView.classList.add("disabled");
    noFileContent.classList.add("disabled");
  }
}

function renderQuiz(container) {
  container.innerHTML = "";
  const explanationText = document.querySelector(".explanation-text");
  const prevButton = document.querySelector(".prev-btn");
  const nextButton = document.querySelector(".next-btn");

  explanationText.classList.add("disabled");
  explanationText.textContent = "";

  if (filteredIndices.length === 0) {
    container.innerHTML = "<p>No questions match the current filter.</p>";
    renderPagination();

    prevButton.setAttribute("disabled", "");
    nextButton.setAttribute("disabled", "");

    return;
  }

  const question = currentQuizData.questions[currentQuestionIndex];

  const questionContainer = document.createElement("div");
  questionContainer.className = "question-container";

  const questionTextContainer = document.createElement("div");
  questionTextContainer.className = "question-text-container";

  const questionNumber = document.createElement("span");
  questionNumber.className = "question-number";
  questionNumber.textContent = `${currentQuestionIndex + 1}.`;
  questionTextContainer.appendChild(questionNumber);

  const questionText = document.createElement("span");
  questionText.className = "question-text";
  questionText.textContent = question.question;
  questionTextContainer.appendChild(questionText);

  questionContainer.appendChild(questionTextContainer);

  const answersContainer = document.createElement("div");
  answersContainer.className = "answers-container";

  const quizState = getQuizState();
  const path = getSelectedItem();
  const fileQuizState =
    quizState[path] && quizState[path].questions
      ? quizState[path].questions
      : [];
  const questionState = fileQuizState.find(
    (qs) => qs.question_id === currentQuestionIndex,
  );

  question.answers.forEach((answer, answerIndex) => {
    const answerWrapper = document.createElement("div");
    answerWrapper.className = "answer-wrapper";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = `question-${currentQuestionIndex}`;
    radio.value = answerIndex;
    radio.id = `q${currentQuestionIndex}a${answerIndex}`;

    const label = document.createElement("label");
    label.textContent = answer;
    label.htmlFor = `q${currentQuestionIndex}a${answerIndex}`;

    answerWrapper.appendChild(radio);
    answerWrapper.appendChild(label);
    answersContainer.appendChild(answerWrapper);

    if (questionState) {
      radio.disabled = true;
      if (questionState.user_answer === answerIndex) {
        radio.checked = true;
        if (questionState.is_correct) {
          answerWrapper.classList.add("correct-answer");
        } else {
          answerWrapper.classList.add("wrong-answer");
        }
      }
    } else {
      radio.addEventListener("change", () => {
        const selectedAnswer = parseInt(radio.value);
        const correctAnswer = question.correct_option;
        const isCorrect = selectedAnswer === correctAnswer;

        const allAnswerWrappers =
          answersContainer.querySelectorAll(".answer-wrapper");
        allAnswerWrappers.forEach((wrapper) => {
          wrapper.querySelector('input[type="radio"]').disabled = true;
        });

        if (isCorrect) {
          answerWrapper.classList.add("correct-answer");
        } else {
          answerWrapper.classList.add("wrong-answer");
          const correctAnswerWrapper = allAnswerWrappers[correctAnswer];
          correctAnswerWrapper.classList.add("was-correct");
        }

        explanationText.textContent = question.explanation;
        explanationText.classList.remove("disabled");

        const quizState = getQuizState();
        const path = getSelectedItem();
        if (!quizState[path]) {
          quizState[path] = {
            lastQuestionIndex: [0, 0, 0, 0],
            questions: [],
            filter: "all",
          };
        }
        quizState[path].questions.push({
          question_id: currentQuestionIndex,
          user_answer: selectedAnswer,
          is_correct: isCorrect,
        });
        saveQuizState(quizState);
        updateScore();
      });
    }
  });

  if (questionState && !questionState.is_correct) {
    const correctAnswerWrapper =
      answersContainer.querySelectorAll(".answer-wrapper")[
        question.correct_option
      ];
    correctAnswerWrapper.classList.add("was-correct");
  }

  if (questionState) {
    explanationText.textContent = question.explanation;
    explanationText.classList.remove("disabled");
  }

  questionContainer.appendChild(answersContainer);
  container.appendChild(questionContainer);

  if (filteredIndices.length <= 1) {
    prevButton.setAttribute("disabled", "");
    nextButton.setAttribute("disabled", "");
  } else {
    prevButton.removeAttribute("disabled");
    nextButton.removeAttribute("disabled");

    const currentIndexInFiltered =
      filteredIndices.indexOf(currentQuestionIndex);
    prevButton.disabled = currentIndexInFiltered === 0;
    nextButton.disabled = currentIndexInFiltered === filteredIndices.length - 1;
  }

  renderPagination();
}

function renderPagination() {
  const pageNumbersContainer = document.querySelector(".page-numbers");
  pageNumbersContainer.innerHTML = "";

  if (!currentQuizData) return;

  const questionsPerPage = window.innerWidth <= 720 ? 5 : 10;
  const totalQuestions = filteredIndices.length;
  const quizState = getQuizState();
  const path = getSelectedItem();
  const fileQuizState =
    quizState[path] && quizState[path].questions
      ? quizState[path].questions
      : [];

  const startQuestion = currentPageWindow * questionsPerPage;
  const endQuestion = Math.min(
    startQuestion + questionsPerPage,
    totalQuestions,
  );

  for (let i = startQuestion; i < endQuestion; i++) {
    const questionIndex = filteredIndices[i];
    const pageNumberButton = document.createElement("button");
    pageNumberButton.className = "page-number";
    pageNumberButton.textContent = questionIndex + 1;

    const questionState = fileQuizState.find(
      (qs) => qs.question_id === questionIndex,
    );

    if (currentQuestionIndex === questionIndex) {
      pageNumberButton.classList.add("active");
    } else if (questionState) {
      if (questionState.is_correct) {
        pageNumberButton.classList.add("correct-page");
      } else {
        pageNumberButton.classList.add("incorrect-page");
      }
    }

    pageNumberButton.addEventListener("click", () => {
      currentQuestionIndex = questionIndex;
      const quizState = getQuizState();
      const path = getSelectedItem();
      if (!quizState[path]) {
        quizState[path] = {
          lastQuestionIndex: [0, 0, 0, 0],
          questions: [],
          filter: "all",
        };
      }
      quizState[path].lastQuestionIndex[filterMap[currentFilter]] =
        currentQuestionIndex;
      saveQuizState(quizState);
      renderQuiz(document.querySelector(".question-display"));
    });

    pageNumbersContainer.appendChild(pageNumberButton);
  }

  const leftArrow = document.querySelector(
    ".pagination-display .page-arrow:first-child",
  );
  const rightArrow = document.querySelector(
    ".pagination-display .page-arrow:last-child",
  );

  const totalPages = Math.ceil(totalQuestions / questionsPerPage);

  if (totalPages <= 1) {
    leftArrow.classList.add("disabled");
    rightArrow.classList.add("disabled");
  } else {
    leftArrow.classList.remove("disabled");
    rightArrow.classList.remove("disabled");
    leftArrow.disabled = currentPageWindow === 0;
    rightArrow.disabled = endQuestion >= totalQuestions;
  }
}

export function initializeQuizView() {
  const prevButton = document.querySelector(".prev-btn");
  const nextButton = document.querySelector(".next-btn");
  const questionDisplay = document.querySelector(".question-display");
  const filterButton = document.querySelector(".filter-button");
  const filterPopup = document.querySelector(".filter-popup");
  const backdrop = document.querySelector(".popup-backdrop");

  filterButton.addEventListener("click", () => {
    const rect = filterButton.getBoundingClientRect();
    filterPopup.style.top = `${rect.bottom}px`;
    filterPopup.style.left = `${rect.left}px`;
    filterPopup.classList.remove("disabled");
    backdrop.classList.remove("disabled");
  });

  backdrop.addEventListener("click", () => {
    filterPopup.classList.add("disabled");
    backdrop.classList.add("disabled");
  });

  filterPopup.addEventListener("click", (e) => {
    if (e.target.tagName === "LI") {
      const selectedLi = filterPopup.querySelector("li.selected");
      if (selectedLi) {
        selectedLi.classList.remove("selected");
      }
      e.target.classList.add("selected");

      currentFilter = e.target.dataset.filter;
      filterButton.querySelector("span").textContent = e.target.textContent;

      const quizState = getQuizState();
      const path = getSelectedItem();
      if (!quizState[path]) {
        quizState[path] = {
          lastQuestionIndex: [0, 0, 0, 0],
          questions: [],
          filter: "all",
        };
      }
      quizState[path].filter = currentFilter;
      saveQuizState(quizState);

      applyFilter();
      const lastIndex =
        quizState[path].lastQuestionIndex[filterMap[currentFilter]];
      if (filteredIndices.includes(lastIndex)) {
        currentQuestionIndex = lastIndex;
      } else {
        currentQuestionIndex = filteredIndices[0] || 0;
      }

      const questionsPerPage = window.innerWidth <= 720 ? 5 : 10;
      currentPageWindow = Math.floor(
        filteredIndices.indexOf(currentQuestionIndex) / questionsPerPage,
      );
      if (currentPageWindow < 0) {
        currentPageWindow = 0;
      }
      renderQuiz(document.querySelector(".question-display"));
      filterPopup.classList.add("disabled");
      backdrop.classList.add("disabled");
    }
  });

  prevButton.addEventListener("click", () => {
    const currentIndexInFiltered =
      filteredIndices.indexOf(currentQuestionIndex);
    if (currentIndexInFiltered > 0) {
      currentQuestionIndex = filteredIndices[currentIndexInFiltered - 1];
      const questionsPerPage = window.innerWidth <= 720 ? 5 : 10;
      currentPageWindow = Math.floor(
        filteredIndices.indexOf(currentQuestionIndex) / questionsPerPage,
      );
      const quizState = getQuizState();
      const path = getSelectedItem();
      if (!quizState[path]) {
        quizState[path] = {
          lastQuestionIndex: [0, 0, 0, 0],
          questions: [],
          filter: "all",
        };
      }
      quizState[path].lastQuestionIndex[filterMap[currentFilter]] =
        currentQuestionIndex;
      saveQuizState(quizState);
      renderQuiz(questionDisplay);
    }
  });

  nextButton.addEventListener("click", () => {
    const currentIndexInFiltered =
      filteredIndices.indexOf(currentQuestionIndex);
    if (currentIndexInFiltered < filteredIndices.length - 1) {
      currentQuestionIndex = filteredIndices[currentIndexInFiltered + 1];
      const questionsPerPage = window.innerWidth <= 720 ? 5 : 10;
      currentPageWindow = Math.floor(
        filteredIndices.indexOf(currentQuestionIndex) / questionsPerPage,
      );
      const quizState = getQuizState();
      const path = getSelectedItem();
      if (!quizState[path]) {
        quizState[path] = {
          lastQuestionIndex: [0, 0, 0, 0],
          questions: [],
          filter: "all",
        };
      }
      quizState[path].lastQuestionIndex[filterMap[currentFilter]] =
        currentQuestionIndex;
      saveQuizState(quizState);
      renderQuiz(questionDisplay);
    }
  });

  prevButton.setAttribute("disabled", "");
  nextButton.setAttribute("disabled", "");

  const leftArrow = document.querySelector(
    ".pagination-display .page-arrow:first-child",
  );
  const rightArrow = document.querySelector(
    ".pagination-display .page-arrow:last-child",
  );

  leftArrow.addEventListener("click", () => {
    if (currentPageWindow > 0) {
      currentPageWindow--;
      renderPagination();
    }
  });

  rightArrow.addEventListener("click", () => {
    const questionsPerPage = window.innerWidth <= 720 ? 5 : 10;
    if ((currentPageWindow + 1) * questionsPerPage < filteredIndices.length) {
      currentPageWindow++;
      renderPagination();
    }
  });

  const resetButton = document.querySelector(".reset-btn");

  resetButton.addEventListener("click", async () => {
    const path = getSelectedItem();
    if (path) {
      const confirmation = await showCustomPopup({
        message:
          "This action will reset your progress for the current test. Are you sure you want to proceed?",
        messageClass: "text-center",
        buttons: [
          { text: "Cancel", value: false },
          { text: "Reset", value: true, className: "danger-button" },
        ],
      });

      if (confirmation) {
        const quizState = getQuizState();
        if (quizState[path]) {
          delete quizState[path];
          saveQuizState(quizState);
          displayFileContent(path);
        }
      }
    }
  });
}

export function createFileTree(data, parent, path = "") {
  if (!data) return;

  data.sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name);
    }
    return a.type === "folder" ? -1 : 1;
  });

  data.forEach((item) => {
    const currentPath = path ? `${path}/${item.name}` : item.name;
    if (item.type === "folder") {
      const dirDiv = document.createElement("div");
      dirDiv.className = "dir";

      const currentDirDiv = document.createElement("div");
      currentDirDiv.className = "current-dir";
      currentDirDiv.dataset.path = currentPath;
      currentDirDiv.setAttribute("draggable", true);

      const fileFolderInfo = document.createElement("div");
      fileFolderInfo.className = "file-folder-info";

      const expandButton = document.createElement("button");
      expandButton.className = "svg-button";
      const expandSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      expandSvg.classList.add("exp-icon");
      if (openFolders.includes(currentPath)) {
        expandSvg.classList.add("collapsed");
      }
      const expandUse = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "use",
      );
      expandUse.setAttribute("href", "#right-arrow");
      expandSvg.appendChild(expandUse);
      expandButton.appendChild(expandSvg);

      const folderIcon = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      folderIcon.classList.add("file-folder-icon");
      const folderUse = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "use",
      );
      if (openFolders.includes(currentPath)) {
        folderIcon.classList.add("expanded");
        folderUse.setAttribute("href", "#folder-open");
      } else {
        if (item.children && item.children.length > 0) {
          folderUse.setAttribute("href", "#folder-with-files");
        } else {
          folderUse.setAttribute("href", "#folder");
        }
      }
      folderIcon.appendChild(folderUse);

      const folderName = document.createElement("span");
      folderName.className = "file-folder-name";
      folderName.textContent = item.name;

      fileFolderInfo.appendChild(expandButton);
      fileFolderInfo.appendChild(folderIcon);
      fileFolderInfo.appendChild(folderName);

      const threeDotButton = document.createElement("button");
      threeDotButton.className = "svg-button three-dot-button";
      threeDotButton.setAttribute("aria-label", "Open options");
      const threeDotSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      const threeDotUse = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "use",
      );
      threeDotUse.setAttribute("href", "#three-dot");
      threeDotSvg.appendChild(threeDotUse);
      threeDotButton.appendChild(threeDotSvg);

      currentDirDiv.appendChild(fileFolderInfo);
      currentDirDiv.appendChild(threeDotButton);

      const childDirDiv = document.createElement("div");
      childDirDiv.className = "child-dir";
      if (!openFolders.includes(currentPath)) {
        childDirDiv.classList.add("collapsed");
      }

      dirDiv.appendChild(currentDirDiv);
      dirDiv.appendChild(childDirDiv);

      parent.appendChild(dirDiv);

      createFileTree(item.children, childDirDiv, currentPath);
    } else {
      const fileContainer = document.createElement("div");
      fileContainer.className = "file-container";
      fileContainer.dataset.path = currentPath;
      fileContainer.setAttribute("draggable", true);

      const fileFolderInfo = document.createElement("div");
      fileFolderInfo.className = "file-folder-info";

      const fileIcon = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      fileIcon.classList.add("file-folder-icon");
      if (currentPath === getSelectedItem()) {
        fileIcon.classList.add("active");
        setActiveFileIcon(fileIcon);
      }
      const fileUse = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "use",
      );
      fileUse.setAttribute("href", "#file");
      fileIcon.appendChild(fileUse);

      const fileName = document.createElement("span");
      fileName.className = "file-folder-name";
      fileName.textContent = item.name;

      fileFolderInfo.appendChild(fileIcon);
      fileFolderInfo.appendChild(fileName);

      const threeDotButton = document.createElement("button");
      threeDotButton.className = "svg-button three-dot-button";
      threeDotButton.setAttribute("aria-label", "Open options");
      const threeDotSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      const threeDotUse = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "use",
      );
      threeDotUse.setAttribute("href", "#three-dot");
      threeDotSvg.appendChild(threeDotUse);
      threeDotButton.appendChild(threeDotSvg);

      fileContainer.appendChild(fileFolderInfo);
      fileContainer.appendChild(threeDotButton);

      parent.appendChild(fileContainer);
    }
  });
}

export function closePopupMenu(keepHighlight = false, keepBackdrop = false) {
  if (getPopupMenu()) {
    getPopupMenu().remove();
    setPopupMenu(null);
  }
  const highlightedItem = document.querySelector(".highlighted");
  if (!keepHighlight) {
    if (highlightedItem) {
      highlightedItem.classList.remove("highlighted");
    }
  }
  if (getBackdrop() && !keepBackdrop) {
    getBackdrop().remove();
    setBackdrop(null);
  }
}

export function createPopupMenu(target, isFolder) {
  closePopupMenu();

  const backdrop = document.createElement("div");
  backdrop.className = "popup-backdrop";
  backdrop.addEventListener("click", () => closePopupMenu());
  document.body.appendChild(backdrop);
  setBackdrop(backdrop);

  const highlightedItem = target.closest(
    isFolder ? ".current-dir" : ".file-container",
  );
  highlightedItem.classList.add("highlighted");

  const isRoot = highlightedItem.dataset.path === "root";

  const popupMenu = document.createElement("div");
  popupMenu.className = "popup-menu visible";
  setPopupMenu(popupMenu);

  const ul = document.createElement("ul");
  const rect = target.getBoundingClientRect();

  if (isFolder) {
    const createFile = document.createElement("li");
    createFile.textContent = "Create File";
    createFile.addEventListener("click", () =>
      showCreationPopup("file", highlightedItem.dataset.path, rect),
    );
    ul.appendChild(createFile);

    const createFolder = document.createElement("li");
    createFolder.textContent = "Create Folder";
    createFolder.addEventListener("click", () =>
      showCreationPopup("folder", highlightedItem.dataset.path, rect),
    );
    ul.appendChild(createFolder);
  }

  if (!isRoot) {
    const renameItemLi = document.createElement("li");
    renameItemLi.textContent = "Rename";
    renameItemLi.addEventListener("click", () =>
      showRenamePopup(highlightedItem, rect),
    );
    ul.appendChild(renameItemLi);

    const deleteItemLi = document.createElement("li");
    deleteItemLi.textContent = "Delete";
    deleteItemLi.className = "delete-item";
    deleteItemLi.addEventListener("click", () =>
      showDeleteConfirmationPopup(highlightedItem.dataset.path, isFolder),
    );
    ul.appendChild(deleteItemLi);
  }

  getPopupMenu().appendChild(ul);
  document.body.appendChild(getPopupMenu());

  popupMenu.style.top = `${rect.bottom}px`;
  popupMenu.style.right = `${window.innerWidth - rect.right}px`;
}

export function showCreationPopup(type, parentPath, rect) {
  closePopupMenu(true, true);

  const creationPopup = document.createElement("div");
  creationPopup.className = "creation-popup";

  const label = document.createElement("label");
  label.textContent = type === "file" ? "File Name" : "Folder Name";
  creationPopup.appendChild(label);

  const input = document.createElement("input");
  input.type = "text";
  creationPopup.appendChild(input);

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "button-container";

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  cancelButton.addEventListener("click", () => {
    document.body.removeChild(creationPopup);
    closePopupMenu();
  });
  buttonContainer.appendChild(cancelButton);

  const createButton = document.createElement("button");
  createButton.textContent = "Create";
  createButton.addEventListener("click", (e) => {
    e.preventDefault();
    fileSystem.createFileOrFolder(
      input.value,
      type,
      parentPath,
      errorContainer,
      getDirectory(),
      getContent(),
      uiFunctions,
    );
  });
  buttonContainer.appendChild(createButton);

  creationPopup.appendChild(buttonContainer);

  const errorContainer = document.createElement("div");
  errorContainer.className = "error-container";
  creationPopup.appendChild(errorContainer);

  document.body.appendChild(creationPopup);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      fileSystem.createFileOrFolder(
        input.value,
        type,
        parentPath,
        errorContainer,
        getDirectory(),
        getContent(),
        uiFunctions,
      );
    }
  });

  input.focus();
  if (getBackdrop()) {
    getBackdrop().onclick = () => {
      document.body.removeChild(creationPopup);
      closePopupMenu();
    };
  }
}

export function showDeleteConfirmationPopup(path, isFolder) {
  closePopupMenu(true, true);

  const confirmationPopup = document.createElement("div");
  confirmationPopup.className = "creation-popup delete-confirmation-popup";

  const warningMessage = document.createElement("p");
  warningMessage.textContent = `Are you sure you want to delete this ${
    isFolder ? "folder" : "file"
  }?`;
  warningMessage.className = "text-center";
  confirmationPopup.appendChild(warningMessage);

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "button-container";

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  cancelButton.addEventListener("click", () => {
    document.body.removeChild(confirmationPopup);
    closePopupMenu();
  });
  buttonContainer.appendChild(cancelButton);

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.className = "danger-button";
  deleteButton.addEventListener("click", () => {
    fileSystem.deleteItem(
      path,
      isFolder,
      getDirectory(),
      getContent(),
      uiFunctions,
    );
    document.body.removeChild(confirmationPopup);
    closePopupMenu();
  });
  buttonContainer.appendChild(deleteButton);

  confirmationPopup.appendChild(buttonContainer);

  document.body.appendChild(confirmationPopup);
  if (getBackdrop()) {
    getBackdrop().onclick = () => {
      document.body.removeChild(confirmationPopup);
      closePopupMenu();
    };
  }
}

export function showRenamePopup(itemToRename, rect) {
  closePopupMenu(true, true);

  const renamePopup = document.createElement("div");
  renamePopup.className = "creation-popup";

  const label = document.createElement("label");
  label.textContent = "New Name";
  renamePopup.appendChild(label);

  const input = document.createElement("input");
  input.type = "text";
  const oldName = itemToRename.dataset.path.split("/").pop();
  input.value = oldName;
  renamePopup.appendChild(input);

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "button-container";

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  cancelButton.addEventListener("click", () => {
    document.body.removeChild(renamePopup);
    closePopupMenu();
  });
  buttonContainer.appendChild(cancelButton);

  const renameButton = document.createElement("button");
  renameButton.textContent = "Rename";
  renameButton.addEventListener("click", () => {
    fileSystem.renameItem(
      itemToRename.dataset.path,
      input.value,
      errorContainer,
      getDirectory(),
      getContent(),
      uiFunctions,
    );
  });
  buttonContainer.appendChild(renameButton);

  renamePopup.appendChild(buttonContainer);

  const errorContainer = document.createElement("div");
  errorContainer.className = "error-container";
  renamePopup.appendChild(errorContainer);

  document.body.appendChild(renamePopup);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      fileSystem.renameItem(
        itemToRename.dataset.path,
        input.value,
        errorContainer,
        getDirectory(),
        getContent(),
        uiFunctions,
      );
    }
  });

  input.focus();
  if (getBackdrop()) {
    getBackdrop().onclick = () => {
      document.body.removeChild(renamePopup);
      closePopupMenu();
    };
  }
}

function scrambleQuizAnswers(quizData) {
  quizData.questions.forEach((question) => {
    const correctAnswer = question.answers[question.correct_option];

    const answersToShuffle = [...question.answers];

    const shuffledAnswers = shuffle(answersToShuffle);

    const newCorrectOption = shuffledAnswers.indexOf(correctAnswer);

    question.answers = shuffledAnswers;
    question.correct_option = newCorrectOption;
  });
  return quizData;
}

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;

  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

function copyTextToClipboard(text) {
  return new Promise((resolve) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => resolve(true),
        () => {
          // .error("Clipboard API failed, falling back.");
          resolve(fallbackCopyTextToClipboard(text));
        },
      );
    } else {
      resolve(fallbackCopyTextToClipboard(text));
    }
  });
}

function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    // .error("Fallback copy failed: ", err);
    document.body.removeChild(textArea);
    return false;
  }
}
