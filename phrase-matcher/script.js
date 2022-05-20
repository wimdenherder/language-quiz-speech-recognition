var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
var SpeechRecognitionEvent =
  SpeechRecognitionEvent || webkitSpeechRecognitionEvent;

var phrases = list; //list.js

var phrasePara = document.querySelector(".phrase");
var resultPara = document.querySelector(".result");
var diagnosticPara = document.querySelector(".output");

var testBtn = document.querySelector("button");

// settings
const lang1 = "ru-RU";
const lang2 = "nl-NL";
const firstSource = false;
const mainLang = lang2;

const sourceLang = firstSource ? lang1 : lang2;
const targetLang = firstSource ? lang2 : lang1;
const sourceKey = firstSource ? "source" : "target";
const targetKey = firstSource ? "target" : "source";

function randomPhrase() {
  var number = Math.floor(Math.random() * phrases.length);
  return number;
}

async function speak(text, language) {
  return new Promise((resolve, reject) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = synth
      .getVoices()
      .find(
        (voice) =>
          voice.lang.split("-")[0].toLowerCase() ===
          language.split("-")[0].toLowerCase()
      );
    synth.speak(utterance);
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

async function testSpeech() {
  testBtn.disabled = true;
  testBtn.textContent = "Test in progress";

  var quiz = phrases[randomPhrase()];
  let phrase = quiz[sourceKey];
  let translation = quiz[targetKey];
  // To ensure case consistency while checking with the returned output text
  phrase = phrase.toLowerCase();
  phrasePara.textContent = phrase;
  resultPara.textContent = "In nederlands?";
  resultPara.style.background = "rgba(0,0,0,0.2)";
  diagnosticPara.textContent = "...diagnostic messages";

  await speak(phrase, sourceLang);

  // probably is grammar to big:
  // var grammar =
  //   "#JSGF V1.0; grammar phrase; public <phrase> = " +
  //   list.map((x) => x.target).join(" | ") +
  //   ";";
  // var grammar =
  //   "#JSGF V1.0; grammar colors; public <color> = aqua | azure | beige | bisque | black | blue | brown | chocolate | coral | crimson | cyan | fuchsia | ghostwhite | gold | goldenrod | gray | green | indigo | ivory | khaki | lavender | lime | linen | magenta | maroon | moccasin | navy | olive | orange | orchid | peru | pink | plum | purple | red | salmon | sienna | silver | snow | tan | teal | thistle | tomato | turquoise | violet | white | yellow ;";
  // console.log({ grammar });
  var recognition = new SpeechRecognition();
  // var speechRecognitionList = new SpeechGrammarList();
  // speechRecognitionList.addFromString(grammar, 1);
  // recognition.grammars = speechRecognitionList;
  recognition.lang = targetLang;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  const noAnswer = ["ik weet het niet", "ik weet niet"];

  recognition.start();

  function almostEqual(a, b) {
    console.log("almostEqual");
    const currentSimilarity = similarity(a, b);
    console.log({ currentSimilarity });
    return currentSimilarity > 0.6;
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

  recognition.onresult = async function (event) {
    // The SpeechRecognitionEvent results property returns a SpeechRecognitionResultList object
    // The SpeechRecognitionResultList object contains SpeechRecognitionResult objects.
    // It has a getter so it can be accessed like an array
    // The first [0] returns the SpeechRecognitionResult at position 0.
    // Each SpeechRecognitionResult object contains SpeechRecognitionAlternative objects that contain individual results.
    // These also have getters so they can be accessed like arrays.
    // The second [0] returns the SpeechRecognitionAlternative at position 0.
    // We then return the transcript property of the SpeechRecognitionAlternative object
    var speechResult = event.results[0][0].transcript.toLowerCase();
    diagnosticPara.textContent = "Speech received: " + speechResult + ".";
    speechResult = speechResult.toLowerCase().trim();
    speechResult = speechResult.replace(/ over$/, "");
    translation = translation.toLowerCase().trim();

    if (speechResult === translation) {
      const msg = "Dat is correct!";
      resultPara.textContent = msg;
      resultPara.style.background = "lime";
      await speak(msg, mainLang);
      return testSpeech();
    }
    if (almostEqual(speechResult, translation)) {
      const message = [
        { lang: maingLang, text: "Bijna goed. Je zei" },
        { lang: sourceLang, text: speechResult },
        { lang: maingLang, text: "Bijna goed. Je zei" },
        { lang: maingLang, text: "Bijna goed. Je zei" },
        { lang: maingLang, text: "Bijna goed. Je zei" },
      ];

      `Bijna goed. Je zei `;
      const msg2 = speechResult;
      const msg3 = `, maar `;
      const msg4 = " betekent ";
      const msg5 = translation;
      resultPara.textContent = `${msg} ${phrase} ${msg2}.`;
      resultPara.style.background = "orange";
      await speak(msg, mainLang);
      await speak(phrase, sourceLang);
      await speak(msg2, mainLang);
      return window.setTimeout(testSpeech, 3000);
    } else {
      const msg = `Het is niet ${speechResult}`;
      const msg2 = " betekent " + translation;
      resultPara.textContent = `${msg}. ${phrase} ${msg2}.`;
      resultPara.style.background = "red";
      await speak(msg, mainLang);
      await speak(phrase, sourceLang);
      await speak(msg2, mainLang);
      return window.setTimeout(testSpeech, 3000);
    }
    console.log("Confidence: " + event.results[0][0].confidence);
  };

  recognition.onspeechend = function () {
    recognition.stop();
    testBtn.disabled = false;
    testBtn.textContent = "Start new test";
  };

  recognition.onerror = function (event) {
    testBtn.disabled = false;
    testBtn.textContent = "Start new test";
    diagnosticPara.textContent =
      "Error occurred in recognition: " + event.error;
  };

  recognition.onaudiostart = function (event) {
    //Fired when the user agent has started to capture audio.
    console.log("SpeechRecognition.onaudiostart");
  };

  recognition.onaudioend = function (event) {
    //Fired when the user agent has finished capturing audio.
    console.log("SpeechRecognition.onaudioend");
  };

  recognition.onend = function (event) {
    //Fired when the speech recognition service has disconnected.
    console.log("SpeechRecognition.onend");
  };

  recognition.onnomatch = function (event) {
    //Fired when the speech recognition service returns a final result with no significant recognition. This may involve some degree of recognition, which doesn't meet or exceed the confidence threshold.
    console.log("SpeechRecognition.onnomatch");
  };

  recognition.onsoundstart = function (event) {
    //Fired when any sound — recognisable speech or not — has been detected.
    console.log("SpeechRecognition.onsoundstart");
  };

  recognition.onsoundend = function (event) {
    //Fired when any sound — recognisable speech or not — has stopped being detected.
    console.log("SpeechRecognition.onsoundend");
  };

  recognition.onspeechstart = function (event) {
    //Fired when sound that is recognised by the speech recognition service as speech has been detected.
    console.log("SpeechRecognition.onspeechstart");
  };
  recognition.onstart = function (event) {
    //Fired when the speech recognition service has begun listening to incoming audio with intent to recognize grammars associated with the current SpeechRecognition.
    console.log("SpeechRecognition.onstart");
  };
}

testBtn.addEventListener("click", testSpeech);
