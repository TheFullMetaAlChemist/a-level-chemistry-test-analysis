/**
 * Test Analysis System - Data Loader
 * Handles loading test data from JSON files and populating the UI
 */

// Available tests configuration
const availableTests = [
  {
    id: 'chemistry-c5',
    name: 'Chemistry C5 Chemical Changes',
    file: 'data/chemistry-c5.json'
  },
  // Add more tests here as they become available
  // {
  //   id: 'physics-p2',
  //   name: 'Physics P2 Forces and Motion',
  //   file: 'data/physics-p2.json'
  // }
];

// Current test data
let currentTestData = null;

// DOM Elements
const testSelector = document.getElementById('test-selector');
const loadTestButton = document.getElementById('load-test-button');
const testSelectionSection = document.getElementById('test-selection-section');
const scoreEntrySection = document.getElementById('score-entry-section');
const questionTableBody = document.getElementById('question-table-body');
const testTitle = document.getElementById('test-title');
const testSubtitle = document.getElementById('test-subtitle');

/**
 * Initialize the data loader
 */
function initDataLoader() {
  // Populate test selector
  populateTestSelector();
  
  // Set up event listeners
  loadTestButton.addEventListener('click', loadSelectedTest);
  
  // Set the current date
  document.getElementById('testDate').valueAsDate = new Date();
}

/**
 * Populate the test selector dropdown
 */
function populateTestSelector() {
  testSelector.innerHTML = '';
  
  // Add default option
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Select a test...';
  testSelector.appendChild(defaultOption);
  
  // Add test options
  availableTests.forEach(test => {
    const option = document.createElement('option');
    option.value = test.id;
    option.textContent = test.name;
    testSelector.appendChild(option);
  });
}

/**
 * Load the selected test
 */
function loadSelectedTest() {
  const selectedTestId = testSelector.value;
  
  if (!selectedTestId) {
    alert('Please select a test.');
    return;
  }
  
  const selectedTest = availableTests.find(test => test.id === selectedTestId);
  
  if (!selectedTest) {
    alert('Test not found.');
    return;
  }
  
  // Show loading state
  loadTestButton.textContent = 'Loading...';
  loadTestButton.disabled = true;
  
  // Fetch the test data
  fetch(selectedTest.file)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load test data');
      }
      return response.json();
    })
    .then(data => {
      // Store the test data
      currentTestData = data;
      
      // Populate the UI
      populateTestData(data);
      
      // Hide test selection, show score entry
      testSelectionSection.classList.add('hidden');
      scoreEntrySection.classList.remove('hidden');
      
      // Reset button state
      loadTestButton.textContent = 'Load Test';
      loadTestButton.disabled = false;
      
      // Set up password protection for model answers
      setupModelAnswersProtection(data.teacherPassword || 'teacher123'); // Default password if not specified
    })
    .catch(error => {
      console.error('Error loading test data:', error);
      alert('Error loading test data. Please try again.');
      
      // Reset button state
      loadTestButton.textContent = 'Load Test';
      loadTestButton.disabled = false;
    });
}

/**
 * Populate the UI with test data
 */
function populateTestData(data) {
  // Set test title and subtitle
  testTitle.textContent = data.title || 'Test Analysis';
  testSubtitle.textContent = data.subtitle || '';
  
  // Clear question table
  questionTableBody.innerHTML = '';
  
  // Add questions to the table
  data.questions.forEach(question => {
    const row = document.createElement('tr');
    row.setAttribute('data-spec-code', question.specCode);
    row.setAttribute('data-max', question.marks);
    row.setAttribute('data-ao', question.assessmentObjective);
    
    row.innerHTML = `
      <td>${question.number}</td>
      <td>${question.specCode} - ${question.specDescription}</td>
      <td>${question.marks}</td>
      <td>${question.assessmentObjective}</td>
      <td><input type="number" min="0" max="${question.marks}" step="any" class="score-input" /></td>
    `;
    
    questionTableBody.appendChild(row);
  });
  
  // Set up the analyze button
  const analyzeButton = document.getElementById('analyseButton');
  analyzeButton.onclick = analyseResults;
}

/**
 * Set up the password protection for model answers
 */
function setupModelAnswersProtection(password) {
  // Get the elements
  const passwordContainer = document.getElementById('modelAnswers-password-container');
  const modelAnswersContainer = document.getElementById('modelAnswersContainer');
  const passwordInput = document.getElementById('teacher-password');
  const passwordSubmit = document.getElementById('password-submit');
  const passwordMessage = document.getElementById('password-message');
  
  // Clear any previous password message
  passwordMessage.textContent = '';
  
  // Initially hide model answers and show password protection
  modelAnswersContainer.classList.add('hidden');
  passwordContainer.classList.remove('hidden');
  
  // Check if model answers are already unlocked in this session
  if (sessionStorage.getItem('modelAnswersUnlocked') === 'true') {
    modelAnswersContainer.classList.remove('hidden');
    passwordContainer.classList.add('hidden');
  }
  
  // Set up event listeners
  passwordSubmit.addEventListener('click', function() {
    validatePassword();
  });
  
  passwordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      validatePassword();
    }
  });
  
  function validatePassword() {
    if (passwordInput.value === password) {
      // Password correct - show model answers
      modelAnswersContainer.classList.remove('hidden');
      passwordContainer.classList.add('hidden');
      
      // Store authentication in session storage
      sessionStorage.setItem('modelAnswersUnlocked', 'true');
    } else {
      // Password incorrect - show error
      passwordMessage.textContent = 'Incorrect password. Please try again.';
      passwordContainer.classList.add('password-shake');
      
      // Remove shake animation class after animation completes
      setTimeout(function() {
        passwordContainer.classList.remove('password-shake');
      }, 500);
      
      // Clear the password input
      passwordInput.value = '';
      passwordInput.focus();
    }
  }
}

/**
 * Get the current test data
 */
function getCurrentTestData() {
  return currentTestData;
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', initDataLoader);
