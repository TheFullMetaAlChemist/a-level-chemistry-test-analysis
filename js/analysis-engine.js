/**
 * Test Analysis System - Analysis Engine
 * Handles analyzing test scores and displaying results
 */

// Global variables for follow-up questions navigation
let currentFollowUpIndex = 0;
let followUpArray = [];

/**
 * Main function to analyze results
 */
function analyseResults() {
  // Get current test data
  const testData = getCurrentTestData();
  
  if (!testData) {
    alert('No test data available. Please select a test first.');
    return;
  }
  
  // --- Calculate Total Score ---
  let totalObtained = 0;
  let totalPossible = 0;
  
  // --- Process Specification Performance ---
  const performance = {};
  const rows = document.querySelectorAll("#specTable tbody tr");
  rows.forEach(row => {
    const specCode = row.getAttribute("data-spec-code");
    const maxMark = parseFloat(row.getAttribute("data-max"));
    const scoreInput = row.querySelector("input.score-input");
    const score = parseFloat(scoreInput.value) || 0;
    
    totalObtained += score;
    totalPossible += maxMark;
    
    if (!performance[specCode]) {
      performance[specCode] = { obtained: 0, total: 0 };
    }
    performance[specCode].obtained += score;
    performance[specCode].total += maxMark;
  });
  
  // Calculate total percentage
  const totalPercentage = (totalObtained / totalPossible) * 100;
  
  // Display total score
  document.getElementById("totalScore").innerHTML = `
    <p>You scored <strong>${totalObtained}</strong> out of <strong>${totalPossible}</strong> marks.</p>
    <p>Overall percentage: <strong>${totalPercentage.toFixed(1)}%</strong></p>
  `;
  
  // Display grade
  const grade = getGrade(totalPercentage);
  const gradeDisplay = document.getElementById("gradeDisplay");
  gradeDisplay.textContent = grade;
  gradeDisplay.style.background = getGradeColor(grade);
  document.getElementById("gradePercentage").textContent = `${totalPercentage.toFixed(1)}%`;
  
  // Build an array for specification performance with percentages
  const performanceArray = [];
  for (let spec in performance) {
    const data = performance[spec];
    const percentage = (data.obtained / data.total) * 100;
    performanceArray.push({ 
      specCode: spec, 
      percentage: percentage,
      obtained: data.obtained,
      total: data.total
    });
  }
  
  // --- Display Specification Performance Summary ---
  // Sorted descending (highest percentage first)
  performanceArray.sort((a, b) => b.percentage - a.percentage);
  const summaryContainer = document.getElementById("summaryContainer");
  summaryContainer.innerHTML = "";
  
  performanceArray.forEach(item => {
    const div = document.createElement("div");
    div.className = "summary-row";
    div.style.borderLeftColor = getPerformanceColor(item.percentage);
    
    // Find the specification descriptor
    const specItem = testData.specifications.find(spec => spec.code === item.specCode);
    const descriptor = specItem ? specItem.description : '';
    
    div.innerHTML = `
      <div class="progress-container">
        <div class="progress-label">${item.specCode}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${item.percentage}%; background-color: ${getPerformanceColor(item.percentage)};"></div>
        </div>
        <div class="progress-text">${item.percentage.toFixed(0)}%</div>
      </div>
      <div><small>${descriptor}</small></div>
    `;
    summaryContainer.appendChild(div);
  });
  
  // --- Process Assessment Objective (AO) Performance ---
  const aoPerformance = {};
  rows.forEach(row => {
    const ao = row.getAttribute("data-ao");
    const maxMark = parseFloat(row.getAttribute("data-max"));
    const scoreInput = row.querySelector("input.score-input");
    const score = parseFloat(scoreInput.value) || 0;
    
    if (!aoPerformance[ao]) {
      aoPerformance[ao] = { obtained: 0, total: 0 };
    }
    aoPerformance[ao].obtained += score;
    aoPerformance[ao].total += maxMark;
  });
  
  // Build an array for AO performance in the order AO1, AO2, AO3
  const aoOrder = ["AO1", "AO2", "AO3"];
  const aoArray = [];
  aoOrder.forEach(ao => {
    if (aoPerformance[ao]) {
      const data = aoPerformance[ao];
      const percentage = (data.obtained / data.total) * 100;
      aoArray.push({ ao: ao, percentage: percentage });
    }
  });
  
  // --- Display AO Performance Summary ---
  const aoContainer = document.getElementById("aoContainer");
  aoContainer.innerHTML = "";
  
  aoArray.forEach(item => {
    // Descriptors for AO
    let aoDescriptor = "";
    if(item.ao === "AO1") { aoDescriptor = "Recall and Knowledge"; }
    else if(item.ao === "AO2") { aoDescriptor = "Application and Understanding"; }
    else if(item.ao === "AO3") { aoDescriptor = "Analysis and Evaluation"; }
    
    const aoDiv = document.createElement("div");
    aoDiv.className = "progress-container";
    aoDiv.innerHTML = `
      <div class="progress-label">${item.ao}</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${item.percentage}%;"></div>
      </div>
      <div class="progress-text">${item.percentage.toFixed(0)}%</div>
    `;
    aoContainer.appendChild(aoDiv);
    
    const descriptorDiv = document.createElement("div");
    descriptorDiv.innerHTML = `<small>${aoDescriptor}</small>`;
    aoContainer.appendChild(descriptorDiv);
    
    // Add some spacing
    const spacerDiv = document.createElement("div");
    spacerDiv.style.height = "10px";
    aoContainer.appendChild(spacerDiv);
  });
  
  // --- Generate Revision Recommendations ---
  // Sort in ascending order (weakest topics first)
  const recommendationsArray = performanceArray.slice().sort((a, b) => a.percentage - b.percentage);
  const recommendationsContainer = document.getElementById("recommendationsContainer");
  recommendationsContainer.innerHTML = "";
  
  // Take the weakest 3 topics (or all if less than 3)
  const topRecommendations = recommendationsArray.slice(0, Math.min(3, recommendationsArray.length));
  
  topRecommendations.forEach(item => {
    const recData = testData.revisionRecommendations.find(rec => rec.specCode === item.specCode);
    
    if (recData) {
      const div = document.createElement("div");
      div.className = "recommendation";
      
      let resourcesList = "";
      recData.resources.forEach(resource => {
        resourcesList += `<li>${resource}</li>`;
      });
      
      div.innerHTML = `
        <h4>${recData.title} (${item.specCode}: ${item.percentage.toFixed(0)}%)</h4>
        <p>${recData.content}</p>
        <h5>Suggested Resources:</h5>
        <ul>${resourcesList}</ul>
      `;
      
      recommendationsContainer.appendChild(div);
    }
  });
  
  // --- Setup Follow-Up Questions ---
  // Store the weakest-to-strongest sorted array for follow-up questions
  followUpArray = recommendationsArray
    .filter(item => testData.followUpQuestions.some(q => q.specCode === item.specCode))
    .map(item => item.specCode);
  
  if (followUpArray.length > 0) {
    // Reset to first question
    currentFollowUpIndex = 0;
    
    // Setup navigation controls
    const followUpNavigation = document.getElementById("followUpNavigation");
    followUpNavigation.classList.remove("hidden");
    
    // Show first question
    showFollowUpQuestion(currentFollowUpIndex);
  }
  
  // --- Set up Model Answers ---
  const modelAnswersContainer = document.getElementById("modelAnswersContainer");
  modelAnswersContainer.innerHTML = "";
  
  testData.modelAnswers.forEach(item => {
    const div = document.createElement("div");
    div.className = "model-answer";
    
    let tipsList = "";
    item.tips.forEach(tip => {
      tipsList += `<li>${tip}</li>`;
    });
    
    div.innerHTML = `
      <h4>${item.question}</h4>
      <p><strong>Model Answer:</strong> ${item.answer}</p>
      <div class="tip-box">
        <h5>Examiner Tips:</h5>
        <ul>${tipsList}</ul>
      </div>
    `;
    
    modelAnswersContainer.appendChild(div);
  });
  
  // Show the results section
  document.getElementById("results-section").classList.remove("hidden");
  
  // Scroll to results
  document.getElementById("results-section").scrollIntoView({ behavior: "smooth" });
}

/**
 * Function to show a specific follow-up question
 */
function showFollowUpQuestion(index) {
  if (index < 0 || index >= followUpArray.length) return;
  
  const testData = getCurrentTestData();
  if (!testData) return;
  
  const specCode = followUpArray[index];
  const followUpContainer = document.getElementById("followUpContainer");
  followUpContainer.innerHTML = "";
  
  const data = testData.followUpQuestions.find(q => q.specCode === specCode);
  
  if (data) {
    // Create a container for this follow-up question
    const questionDiv = document.createElement("div");
    questionDiv.className = "follow-up";
    
    let innerHTML = `<h4>${specCode}</h4>`;
    innerHTML += `<p><em>${data.intro}</em></p>`;
    
    // For each part (a, b, c) generate a sub-section
    const parts = data.parts;
    for (let part in parts) {
      const partData = parts[part];
      innerHTML += `<div class="part">
        <p><strong>${part})</strong> ${partData.question}</p>
        <textarea placeholder="Type your answer here..."></textarea>
        <div class="toggle-buttons no-print">
          <button onclick="toggleSubDisplay(this, 'hint', '${specCode}', '${part}')">Show Hint</button>
          <button onclick="toggleSubDisplay(this, 'answer', '${specCode}', '${part}')">Show Answer</button>
        </div>
        <div id="sub-hint-${specCode}-${part}" class="hidden no-print">${partData.hint}</div>
        <div id="sub-answer-${specCode}-${part}" class="hidden no-print">${partData.answer}</div>
        <div class="print-only model-answer-print">
          <strong>Model Answer:</strong> ${partData.answer}
        </div>
      </div>`;
    }
    
    questionDiv.innerHTML = innerHTML;
    followUpContainer.appendChild(questionDiv);
    
    // Update the question counter
    document.getElementById("questionCounter").textContent = `Question ${index + 1} of ${followUpArray.length}`;
    
    // Update button states
    document.getElementById("prevQuestion").disabled = index === 0;
    document.getElementById("nextQuestion").disabled = index === followUpArray.length - 1;
  }
}

/**
 * Function to show the next follow-up question
 */
function showNextQuestion() {
  if (currentFollowUpIndex < followUpArray.length - 1) {
    currentFollowUpIndex++;
    showFollowUpQuestion(currentFollowUpIndex);
  }
}

/**
 * Function to show the previous follow-up question
 */
function showPreviousQuestion() {
  if (currentFollowUpIndex > 0) {
    currentFollowUpIndex--;
    showFollowUpQuestion(currentFollowUpIndex);
  }
}

/**
 * Toggle function for sub-question hint/answer display
 */
function toggleSubDisplay(button, type, spec, part) {
  const element = document.getElementById(`sub-${type}-${spec}-${part}`);
  element.classList.toggle("hidden");
  
  if (element.classList.contains("hidden")) {
    button.textContent = type === "hint" ? "Show Hint" : "Show Answer";
  } else {
    button.textContent = type === "hint" ? "Hide Hint" : "Hide Answer";
  }
}

/**
 * Function to interpolate a color between red (low) and green (high)
 */
function getPerformanceColor(percentage) {
  // For gradient: red (0%) -> amber (50%) -> green (100%)
  let r, g;
  if (percentage < 50) {
    // Red to amber
    r = 255;
    g = Math.round(200 + (percentage / 50) * 55); // 200 -> 255
  } else {
    // Amber to green
    r = Math.round(255 - ((percentage - 50) / 50) * 155); // 255 -> 100
    g = 255;
  }
  const b = 100;
  return `rgb(${r},${g},${b})`;
}

/**
 * Function to determine grade based on percentage
 */
function getGrade(percentage) {
  if (percentage >= 90) return 9;
  if (percentage >= 80) return 8;
  if (percentage >= 70) return 7;
  if (percentage >= 60) return 6;
  if (percentage >= 50) return 5;
  if (percentage >= 40) return 4;
  if (percentage >= 30) return 3;
  if (percentage >= 20) return 2;
  if (percentage >= 10) return 1;
  return "U";
}

/**
 * Function to get color for grade display
 */
function getGradeColor(grade) {
  if (grade >= 7) return "linear-gradient(135deg, #43a047, #2e7d32)"; // Green for 7-9
  if (grade >= 4) return "linear-gradient(135deg, #fb8c00, #ef6c00)"; // Amber for 4-6
  return "linear-gradient(135deg, #e53935, #c62828)"; // Red for 1-3 and U
}

/**
 * Function to open tab content
 */
function openTab(evt, tabName) {
  // Hide all tab content
  const tabContent = document.getElementsByClassName("tab-content");
  for (let i = 0; i < tabContent.length; i++) {
    tabContent[i].classList.remove("active");
  }
  
  // Remove active class from all tab buttons
  const tabButtons = document.getElementsByClassName("tab-button");
  for (let i = 0; i < tabButtons.length; i++) {
    tabButtons[i].classList.remove("active");
  }
  
  // Show the selected tab content and mark button as active
  document.getElementById(tabName).classList.add("active");
  evt.currentTarget.classList.add("active");
  
  // Special handling for follow-up questions tab
  if (tabName === "followUpTab" && followUpArray.length > 0) {
    showFollowUpQuestion(currentFollowUpIndex);
  }
}

/**
 * Prepare all follow-up questions for printing
 * This ensures all questions are loaded even if the user hasn't navigated to them
 */
function prepareFollowUpQuestionsForPrint() {
  const followUpContainer = document.getElementById("followUpContainer");
  const testData = getCurrentTestData();
  
  // Only proceed if we have test data
  if (!testData || !testData.followUpQuestions) return;
  
  // Clear the container
  followUpContainer.innerHTML = "";
  
  // Add each follow-up question to the container
  followUpArray.forEach((specCode, index) => {
    const data = testData.followUpQuestions.find(q => q.specCode === specCode);
    
    if (data) {
      // Create a container for this follow-up question
      const questionDiv = document.createElement("div");
      questionDiv.className = "follow-up";
      questionDiv.setAttribute('data-spec-code', specCode);
      
      let innerHTML = `<h4>${specCode}</h4>`;
      innerHTML += `<p><em>${data.intro}</em></p>`;
      
      // For each part (a, b, c) generate a sub-section
      const parts = data.parts;
      for (let part in parts) {
        const partData = parts[part];
        innerHTML += `<div class="part">
          <p><strong>${part})</strong> ${partData.question}</p>
          <textarea placeholder="Type your answer here..."></textarea>
          <div class="toggle-buttons no-print">
            <button onclick="toggleSubDisplay(this, 'hint', '${specCode}', '${part}')">Show Hint</button>
            <button onclick="toggleSubDisplay(this, 'answer', '${specCode}', '${part}')">Show Answer</button>
          </div>
          <div id="sub-hint-${specCode}-${part}" class="hidden no-print">${partData.hint}</div>
          <div id="sub-answer-${specCode}-${part}" class="hidden no-print">${partData.answer}</div>
          <div class="print-only model-answer-print">
            <strong>Model Answer:</strong> ${partData.answer}
          </div>
        </div>`;
      }
      
      questionDiv.innerHTML = innerHTML;
      followUpContainer.appendChild(questionDiv);
    }
  });
  
  // Update the navigation controls
  if (followUpArray.length > 0) {
    document.getElementById("followUpNavigation").classList.remove("hidden");
    document.getElementById("questionCounter").textContent = `Questions: ${followUpArray.length} total`;
  }
}
