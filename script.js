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

// State
let currentQuestionIndex = 0;
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let timerInterval = null;
let seconds = 0;
let recognition = null;
let transcript = "";

// Initialize
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
  const themeToggle = document.querySelector('.theme-toggle');
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ==========================================
// Mobile Menu
// ==========================================
function toggleMobileMenu() {
  const mobileMenu = document.getElementById('mobileMenu');
  mobileMenu.classList.toggle('active');
}

// ==========================================
// Page Navigation
// ==========================================
function showPage(pageName) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  // Show selected page
  const targetPage = document.getElementById(`page-${pageName}`);
  if (targetPage) {
    targetPage.classList.add('active');
  }

  // Update nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.page === pageName) {
      link.classList.add('active');
    }
  });

  // Close mobile menu
  document.getElementById('mobileMenu').classList.remove('active');

  // Scroll to top
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
  
  // Update progress bar
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  document.getElementById('progressFill').style.width = `${progress}%`;
  
  // Update buttons
  document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;
  
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  document.getElementById('nextBtn').style.display = isLastQuestion ? 'none' : 'inline-flex';
  document.getElementById('submitBtn').style.display = isLastQuestion ? 'inline-flex' : 'none';
  
  // Reset recorder
  resetRecorder();
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
// Voice Recording
// ==========================================
function initSpeechRecognition() {
  // TODO: Implement proper speech recognition with Whisper API
  // For now, using Web Speech API as fallback
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      
      transcript = finalTranscript || interimTranscript;
      updateTranscript();
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      showToast('Speech recognition error. Please try again.', 'error');
      stopRecording();
    };
  }
}

function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

async function startRecording() {
  try {
    // Request microphone permission
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    isRecording = true;
    transcript = "";
    seconds = 0;
    
    // Update UI
    const recordBtn = document.getElementById('recordBtn');
    recordBtn.classList.add('recording');
    document.getElementById('recordIcon').textContent = '⏹';
    document.getElementById('recordText').textContent = 'Stop Recording';
    
    document.querySelector('.status-icon').textContent = '🔴';
    document.querySelector('.status-text').textContent = 'Recording...';
    
    // Start timer
    timerInterval = setInterval(updateTimer, 1000);
    
    // Start speech recognition
    if (recognition) {
      recognition.start();
    }
    
    // Start media recorder for audio file (optional)
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };
    
    mediaRecorder.start();
    
    showToast('Recording started!', 'success');
    
  } catch (error) {
    console.error('Error accessing microphone:', error);
    showToast('Could not access microphone. Please allow microphone permissions.', 'error');
  }
}

function stopRecording() {
  isRecording = false;
  
  // Update UI
  const recordBtn = document.getElementById('recordBtn');
  recordBtn.classList.remove('recording');
  document.getElementById('recordIcon').textContent = '⏺';
  document.getElementById('recordText').textContent = 'Start Recording';
  
  document.querySelector('.status-icon').textContent = '✅';
  document.querySelector('.status-text').textContent = 'Recording complete';
  
  // Stop timer
  clearInterval(timerInterval);
  
  // Stop speech recognition
  if (recognition) {
    recognition.stop();
  }
  
  // Stop media recorder
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
  }
  
  // Show transcript section if we have content
  if (transcript.trim()) {
    document.getElementById('transcriptSection').style.display = 'block';
    updateTranscript();
  }
  
  showToast('Recording saved!', 'success');
}

function resetRecorder() {
  isRecording = false;
  seconds = 0;
  transcript = "";
  clearInterval(timerInterval);
  
  document.getElementById('timer').textContent = '00:00';
  document.getElementById('recordIcon').textContent = '⏺';
  document.getElementById('recordText').textContent = 'Start Recording';
  document.querySelector('.status-icon').textContent = '🎤';
  document.querySelector('.status-text').textContent = 'Ready to record';
  document.getElementById('transcriptSection').style.display = 'none';
  
  const recordBtn = document.getElementById('recordBtn');
  recordBtn.classList.remove('recording');
}

function updateTimer() {
  seconds++;
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  document.getElementById('timer').textContent = `${mins}:${secs}`;
}

function updateTranscript() {
  const transcriptText = document.getElementById('transcriptText');
  transcriptText.textContent = transcript || 'Your transcribed text will appear here...';
}

function copyTranscript() {
  if (transcript) {
    navigator.clipboard.writeText(transcript).then(() => {
      showToast('Transcript copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Failed to copy transcript.', 'error');
    });
  }
}

// ==========================================
// Toast Notifications
// ==========================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ==========================================
// TODO: Backend API Integration
// ==========================================
// TODO: Implement connection to FastAPI backend
// API endpoints to implement:
// - POST /api/transcribe - Send audio for Whisper transcription
// - POST /api/analyze - Send transcript for NLP analysis
// - GET /api/questions - Fetch interview questions from database
// - POST /api/feedback - Store user feedback and responses

async function sendToBackend(audioBlob) {
  // TODO: Implement API call to backend
  // const formData = new FormData();
  // formData.append('audio', audioBlob);
  // const response = await fetch('/api/transcribe', {
  //   method: 'POST',
  //   body: formData
  // });
  // return response.json();
  console.log('TODO: Send audio to backend for processing');
}

async function getAIFeedback(transcript) {
  // TODO: Implement API call to get AI feedback
  // const response = await fetch('/api/analyze', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ transcript })
  // });
  // return response.json();
  console.log('TODO: Get AI feedback from backend');
}
