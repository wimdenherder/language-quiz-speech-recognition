var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
var SpeechRecognitionEvent =
  SpeechRecognitionEvent || webkitSpeechRecognitionEvent;

var phrasePara = document.querySelector(".phrase");
var resultPara = document.querySelector(".result");
var diagnosticPara = document.querySelector(".output");

var testBtn = document.querySelector("button");

// settings
const nativeLang = "nl-NL"; // app uses this language to ask questions

const testThisLang = "french"; //<<-
const firstSource = false;

const lib = {
  french: {
    phrases: french,
    lang1: "fr-FR",
    lang2: "en-UK",
  },
  spanish: {
    phrases: spanish,
    lang1: "es-ES",
    lang2: "en-UK",
  },
};
const test = lib[testThisLang];

const { phrases, lang1, lang2 } = test;

const sourceLang = firstSource ? lang1 : lang2;
const targetLang = firstSource ? lang2 : lang1;
const sourceKey = firstSource ? "source" : "target";
const targetKey = firstSource ? "target" : "source";

console.log({ targetLang, sourceLang, nativeLang });

function output(text) {
  diagnosticPara.textContent = text;
  diagnosticPara.style.background = "rgba(245, 40, 145, 0.8)";
  window.setTimeout(() => {
    diagnosticPara.style.background = "";
  }, 3000);
}

function randomPhrase() {
  var number = Math.floor(Math.random() * phrases.length);
  return number;
}

const isObject = (obj) =>
  typeof obj === "object" && !Array.isArray(obj) && obj !== null;

// waitTillEnd = true => wait until end of sentence
// waitTillEnd = false => 3 words before end, already jump to next, so that faster after eachother
async function speak(data, waitTillEnd) {
  if (isObject(data)) data = [data];
  for (let i = 0; i < data.length; i++) {
    await speakSentence(data[i].text, data[i].lang, waitTillEnd);
  }
}

async function speakSentence(text, lang, waitTillEnd) {
  return new Promise((resolve, reject) => {
    const lengthSentence = text.split(" ").length;
    let indexWord = 0;
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = synth
      .getVoices()
      .find(
        (voice) =>
          voice.lang.split("-")[0].toLowerCase() ===
          lang.split("-")[0].toLowerCase()
      );
    synth.speak(utterance);
    utterance.onboundary = function (event) {
      indexWord++;
      console.log(
        event.name +
          " boundary reached after " +
          event.elapsedTime +
          " seconds.word index" +
          indexWord
      );

      if (!waitTillEnd && indexWord + 5 >= lengthSentence) {
        console.log("resolve 3 words before end");
        resolve();
      }
    };
    utterance.onend = function (event) {
      console.log(
        "Utterance has finished being spoken after " +
          event.elapsedTime +
          " seconds."
      );
      resolve();
    };
    utterance.onerror = function (event) {
      console.log("Speech synthesis failed: " + event.error);
      reject();
    };
  });
}

async function confirm(text, lang) {
  let { speechResult } = await recognize(lang);
  output(speechResult, "pink");

  if (text === speechResult) {
    return true;
  } else {
    return false;
  }
}

async function testSpeech() {
  testBtn.disabled = true;
  testBtn.textContent = "Test in progress";

  var quiz = phrases[randomPhrase()];
  let phrase = quiz[sourceKey];
  let translation = quiz[targetKey];
  // To ensure case consistency while checking with the returned output text
  if (!phrase) return testSpeech();
  phrase = phrase.toLowerCase();
  phrasePara.textContent = phrase;
  resultPara.textContent = "In " + testThisLang + "?";
  resultPara.style.background = "rgba(0,0,0,0.2)";

  await speak({ text: phrase, lang: sourceLang });

  let { speechResult } = await recognize(targetLang);

  output(speechResult);
  speechResult = speechResult.toLowerCase().trim();
  translation = translation.toLowerCase().trim();

  if (speechResult === translation) {
    const data = [
      { text: "Dat is correct. ", lang: nativeLang },
      { text: translation, lang: targetLang },
    ];
    const msg = data.reduce((a, b) => {
      return a + b.text;
    }, "");
    resultPara.textContent = msg;
    resultPara.style.background = "lime";
    await speak(data);
    return testSpeech();
  }
  if (almostEqual(speechResult, translation)) {
    const data = [
      { text: "Bijna. Zeg eens na: ", lang: nativeLang },
      { text: translation + "?", lang: targetLang },
    ];
    const msg = data.reduce((a, b) => {
      return a + b.text;
    }, "");
    resultPara.textContent = msg;
    resultPara.style.background = "orange";
    await speak(data, true);
    const confirmed = await confirm(translation, targetLang);
    if (confirmed) {
      await speak({ text: "Top. dat is goed", lang: nativeLang });
    } else {
      await speak({ text: "Niet goed", lang: nativeLang });
    }
    return window.setTimeout(testSpeech, 3000);
  } else {
    const data = [
      { text: "Niet goed. Het moet zijn: ", lang: nativeLang },
      { text: translation, lang: targetLang },
      { text: " Zeg het eens na.", lang: nativeLang },
    ];
    const msg = data.reduce((a, b) => {
      return a + b.text;
    }, "");
    resultPara.textContent = msg;
    resultPara.style.background = "red";
    await speak(data, true);
    const confirmed = await confirm(translation, targetLang);
    if (confirmed) {
      await speak({ text: "Top. dat is goed", lang: nativeLang });
    } else {
      await speak({ text: "Niet goed", lang: nativeLang });
    }
    return window.setTimeout(testSpeech, 3000);
  }
}

function almostEqual(a, b) {
  console.log("almostEqual");
  const currentSimilarity = similarity(a, b);
  console.log({ currentSimilarity });
  return currentSimilarity > 0.3;
}

function similarity(s1, s2) {
  var longer = s1;
  var shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  var longerLength = longer.length;
  if (longerLength == 0) {
    return 1.0;
  }
  return (
    (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength)
  );
}

function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  var costs = new Array();
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i;
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0) costs[j] = j;
      else {
        if (j > 0) {
          var newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

async function recognize(lang) {
  return new Promise((resolve, reject) => {
    var recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = async function (event) {
      var speechResult = event.results[0][0].transcript.toLowerCase();
      confidence = event.results[0][0].confidence;
      resolve({ confidence, speechResult, event });
      console.log({
        type: "SpeechRecognition.onresult",
        confidence,
        speechResult,
        event: event,
      });
    };

    recognition.onspeechend = function () {
      recognition.stop();
      testBtn.disabled = false;
      testBtn.textContent = "Start new test";
      console.log({ type: "SpeechRecognition.onspeechend", event: event });
    };

    recognition.onerror = function (event) {
      testBtn.disabled = false;
      testBtn.textContent = "Start new test";
      output("Error occurred in recognition: " + event.error, "lightred");
      console.log({ type: "SpeechRecognition.onerror", event: event });
    };

    recognition.onaudiostart = function (event) {
      //Fired when the user agent has started to capture audio.
      console.log("SpeechRecognition.onaudiostart");
    };

    recognition.onaudioend = function (event) {
      //Fired when the user agent has finished capturing audio.
      console.log({ type: "SpeechRecognition.onaudioend", event: event });
    };

    recognition.onend = function (event) {
      //Fired when the speech recognition service has disconnected.
      console.log({ type: "SpeechRecognition.onend", event: event });
    };

    recognition.onnomatch = function (event) {
      //Fired when the speech recognition service returns a final result with no significant recognition. This may involve some degree of recognition, which doesn't meet or exceed the confidence threshold.
      console.log({ type: "SpeechRecognition.onnomatch", event: event });
    };

    recognition.onsoundstart = function (event) {
      //Fired when any sound — recognisable speech or not — has been detected.
      console.log("SpeechRecognition.onsoundstart");
    };

    recognition.onsoundend = function (event) {
      //Fired when any sound — recognisable speech or not — has stopped being detected.
      console.log({ type: "SpeechRecognition.onsoundend", event: event });
    };

    recognition.onspeechstart = function (event) {
      //Fired when sound that is recognised by the speech recognition service as speech has been detected.
      console.log("SpeechRecognition.onspeechstart");
    };
    recognition.onstart = function (event) {
      //Fired when the speech recognit ion service has begun listening to incoming audio with intent to recognize grammars associated with the current SpeechRecognition.
      console.log("SpeechRecognition.onstart");
    };
  });
}

testBtn.addEventListener("click", testSpeech);
