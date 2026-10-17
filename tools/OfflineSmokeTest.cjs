const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const offlineJavaScript = fs.readFileSync(path.join(root, "offline-data.js"), "utf8");

const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1])
  .filter(source => source.trim());

for (const source of inlineScripts) new Function(source);

if (/https?:\/\//i.test(html + offlineJavaScript)) {
  throw new Error("External URL found in offline runtime files");
}

const dataContext = {window: {}};
vm.createContext(dataContext);
vm.runInContext(offlineJavaScript, dataContext);
const offlineFiles = dataContext.window.BBX_OFFLINE_FILES;

const expectedFiles = [
  "settings/page_text.txt",
  "settings/staff.txt",
  "questions/anime_easy.txt",
  "questions/anime_hard.txt",
  "questions/bey_easy.txt",
  "questions/bey_hard.txt"
];

for (const relativePath of expectedFiles) {
  const source = fs.readFileSync(path.join(root, ...relativePath.split("/")), "utf8");
  if (offlineFiles[relativePath] !== source) {
    throw new Error(`Embedded data mismatch: ${relativePath}`);
  }
}

const parserStart = html.indexOf("const QUESTION_TYPES=");
const parserEnd = html.indexOf("function parsePageText", parserStart);
if (parserStart < 0 || parserEnd < 0) throw new Error("Question parser not found");

const parserContext = {};
vm.createContext(parserContext);
vm.runInContext(
  `${html.slice(parserStart, parserEnd)}\nthis.parseQuestions=parse;this.shuffleQuestions=shuffle;`,
  parserContext
);

const questionFiles = expectedFiles.filter(file => file.startsWith("questions/"));
const questions = questionFiles.flatMap(file => parserContext.parseQuestions(offlineFiles[file]));

if (!questions.length) throw new Error("Question bank is empty");

for (const category of ["動畫", "陀螺"]) {
  for (const difficulty of ["簡單", "困難"]) {
    const pool = questions.filter(q => q.category === category && q.difficulty === difficulty);
    if (pool.length < 10) throw new Error(`${category}/${difficulty} has fewer than 10 questions`);
    if (parserContext.shuffleQuestions(pool).slice(0, 10).length !== 10) {
      throw new Error(`${category}/${difficulty} general mode draw failed`);
    }
  }
}

const viewStart = html.indexOf("function shuffledQuestionView");
const viewEnd = html.indexOf("\nfunction render()", viewStart);
if (viewStart < 0 || viewEnd < 0) throw new Error("Shuffle view function not found");

vm.runInContext(
  `${html.slice(viewStart, viewEnd)}\nthis.makeQuestionView=shuffledQuestionView;`,
  parserContext
);

for (const question of questions.filter(q => q.type === "image-choice")) {
  const view = parserContext.makeQuestionView(question);
  if (view.answer < 0 || !view.choices[view.answer].isCorrect) {
    throw new Error(`Image-choice correct answer lost after shuffle: ${question.question}`);
  }
  if (view.optionImages[view.answer] !== view.choices[view.answer].image) {
    throw new Error(`Image-choice correct image mismatch: ${question.question}`);
  }
}

for (const question of questions) {
  const imagePaths = [
    ...question.promptImages.map(item => item.src),
    ...question.optionImages.filter(Boolean)
  ];

  for (const relativePath of imagePaths) {
    const imagePath = path.join(root, ...relativePath.split("/"));
    if (!fs.existsSync(imagePath)) throw new Error(`Missing image: ${relativePath}`);
  }
}

const fetchStart = html.indexOf("async function fetchTextFile");
const fetchEnd = html.indexOf("\nasync function load()", fetchStart);
if (fetchStart < 0 || fetchEnd < 0) throw new Error("Offline loader not found");

const fetchContext = {
  window: {BBX_OFFLINE_FILES: offlineFiles},
  location: {protocol: "file:"},
  fetch() {
    throw new Error("Network fetch was attempted in file mode");
  }
};
vm.createContext(fetchContext);
vm.runInContext(`${html.slice(fetchStart, fetchEnd)}\nthis.readOfflineFile=fetchTextFile;`, fetchContext);

const fullscreenGuardStart = html.indexOf("function isStandaloneApp");
const fullscreenGuardEnd = html.indexOf("\nfunction isFullscreenAvailable", fullscreenGuardStart);
if (fullscreenGuardStart < 0 || fullscreenGuardEnd < 0) {
  throw new Error("Standalone fullscreen guard not found");
}

function fullscreenRequestFor({displayModeStandalone, navigatorStandalone}) {
  const fullscreenContext = {
    window: {
      matchMedia() {
        return {matches: displayModeStandalone};
      },
      navigator: {standalone: navigatorStandalone}
    },
    document: {
      documentElement: {requestFullscreen() {}},
      fullscreenEnabled: true,
      webkitFullscreenEnabled: false
    }
  };
  vm.createContext(fullscreenContext);
  vm.runInContext(
    `${html.slice(fullscreenGuardStart, fullscreenGuardEnd)}\nthis.getRequest=getFullscreenRequest;`,
    fullscreenContext
  );
  return fullscreenContext.getRequest();
}

if (fullscreenRequestFor({displayModeStandalone: true, navigatorStandalone: false}) !== null) {
  throw new Error("Fullscreen API must be disabled in display-mode standalone");
}
if (fullscreenRequestFor({displayModeStandalone: false, navigatorStandalone: true}) !== null) {
  throw new Error("Fullscreen API must be disabled in iPadOS standalone mode");
}
if (typeof fullscreenRequestFor({displayModeStandalone: false, navigatorStandalone: false}) !== "function") {
  throw new Error("Fullscreen API must remain available in a supported browser tab");
}

Promise.all(expectedFiles.map(file => fetchContext.readOfflineFile(file)))
  .then(results => {
    if (results.some((text, index) => text !== offlineFiles[expectedFiles[index]])) {
      throw new Error("Offline loader returned unexpected content");
    }

    console.log("JavaScript syntax: OK");
    console.log("External network references: NONE");
    console.log("Embedded TXT files: 6/6 MATCH");
    console.log(`Question bank: ${questions.length} questions`);
    console.log("General 10-question pools: OK");
    console.log("Image references: OK");
    console.log("Image-choice shuffled answer/image binding: OK");
    console.log("file:// loader without fetch(): OK");
    console.log("iPad PWA standalone fullscreen guard: OK");
  })
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
