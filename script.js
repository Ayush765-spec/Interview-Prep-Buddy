/* ==========================================
   Interview Prep Buddy - JavaScript
   ========================================== */

// Mock Data
const questions = [
  {
    id: 1,
    question: "Tell me about yourself and your background.",
    category: "Behavioral",
    tip: "Focus on relevant experience and keep it under 2 minutes."
  },
  {
    id: 2,
    question: "Why do you want to work at our company?",
    category: "Motivation",
    tip: "Research the company beforehand and mention specific aspects that attract you."
  },
  {
    id: 3,
    question: "Describe a challenging project you worked on and how you overcame obstacles.",
    category: "Behavioral",
    tip: "Use the STAR method: Situation, Task, Action, Result."
  },
  {
    id: 4,
    question: "What are your greatest strengths and weaknesses?",
    category: "Self-Assessment",
    tip: "Be honest but strategic. For weaknesses, mention how you're improving."
  },
  {
    id: 5,
    question: "Where do you see yourself in 5 years?",
    category: "Career Goals",
    tip: "Show ambition while aligning with the role and company growth."
  }
];

// ==========================================
// State
// ==========================================
let currentQuestionIndex = 0;
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let timerInterval = null;
let seconds = 0;
let recognition = null;

// 🔥 FIXED STATE
let transcripts = {};     // { questionId: "answer" }
let transcript = "";      // current question transcript only

// ==========================================
// Initialize
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  updateQuestion();
  initSpeechRecognition();
});

// ==========================================
// Theme Toggle
// ==========================================
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  document.querySelector('.theme-toggle').textContent =
    theme === 'dark' ? '☀️' : '🌙';
}

// ==========================================
// Page Navigation
// ==========================================
function showPage(pageName) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${pageName}`)?.classList.add('active');

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === pageName);
  });

  document.getElementById('mobileMenu')?.classList.remove('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// Question Navigation
// ==========================================
function updateQuestion() {
  const question = questions[currentQuestionIndex];

  document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;
  document.getElementById('totalQuestions').textContent = questions.length;
  document.getElementById('questionCategory').textContent = question.category;
  document.getElementById('questionText').textContent = question.question;
  document.getElementById('questionTip').innerHTML = `💡 Tip: ${question.tip}`;

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  document.getElementById('progressFill').style.width = `${progress}%`;

  document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;

  const isLast = currentQuestionIndex === questions.length - 1;
  document.getElementById('nextBtn').style.display = isLast ? 'none' : 'inline-flex';
  document.getElementById('submitBtn').style.display = isLast ? 'inline-flex' : 'none';

  // 🔥 LOAD SAVED TRANSCRIPT
  const qId = question.id;
  transcript = transcripts[qId] || "";
  updateTranscript();

  document.getElementById('transcriptSection').style.display =
    transcript ? 'block' : 'none';

  resetRecorderUI();
}

function nextQuestion() {
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    updateQuestion();
  }
}

function prevQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    updateQuestion();
  }
}

// ==========================================
// Speech Recognition
// ==========================================
function initSpeechRecognition() {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript + ' ';
        }
      }

      transcript += finalText;
      updateTranscript();
    };

    recognition.onerror = () => stopRecording();
  }
}

// ==========================================
// Recording
// ==========================================
function toggleRecording() {
  isRecording ? stopRecording() : startRecording();
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    isRecording = true;
    transcript = transcripts[questions[currentQuestionIndex].id] || "";
    seconds = 0;

    updateRecordingUI(true);
    timerInterval = setInterval(updateTimer, 1000);

    recognition?.start();

    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.start();

  } catch {
    showToast('Microphone access denied', 'error');
  }
}

function stopRecording() {
  if (!isRecording) return;

  isRecording = false;
  clearInterval(timerInterval);
  recognition?.stop();

  if (mediaRecorder?.state !== 'inactive') {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(t => t.stop());
  }

  // 🔥 SAVE TRANSCRIPT
  const qId = questions[currentQuestionIndex].id;
  transcripts[qId] = transcript;

  updateRecordingUI(false);

  if (transcript.trim()) {
    document.getElementById('transcriptSection').style.display = 'block';
  }

  showToast('Recording saved!', 'success');
}

// ==========================================
// UI Helpers
// ==========================================
function updateRecordingUI(isOn) {
  document.getElementById('recordIcon').textContent = isOn ? '⏹' : '⏺';
  document.getElementById('recordText').textContent =
    isOn ? 'Stop Recording' : 'Start Recording';
  document.querySelector('.status-icon').textContent = isOn ? '🔴' : '🎤';
  document.querySelector('.status-text').textContent =
    isOn ? 'Recording...' : 'Ready to record';
}

function resetRecorderUI() {
  clearInterval(timerInterval);
  seconds = 0;
  document.getElementById('timer').textContent = '00:00';
  updateRecordingUI(false);
}

function updateTimer() {
  seconds++;
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  document.getElementById('timer').textContent = `${m}:${s}`;
}

function updateTranscript() {
  document.getElementById('transcriptText').textContent =
    transcript || 'Your transcribed text will appear here...';
}

function copyTranscript() {
  navigator.clipboard.writeText(transcript);
  showToast('Copied!', 'success');
}

// ==========================================
// Toast
// ==========================================
function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  document.getElementById('toastContainer').appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
