// Global variables
let courses = [];
const MAX_COURSES = 12; // Maximum number of courses an instructor can create

// Switch between different sections of the portal (register, login, dashboard)
function showSection(section) {
  // Hide all sections and remove active class
  ['registerSection', 'loginSection', 'dashboardSection'].forEach(id => {
    const element = document.getElementById(id);
    element.classList.add('hidden');
    element.classList.remove('section-active');
  });
  
  // Show the requested section with animation
  const activeSection = document.getElementById(section + 'Section');
  activeSection.classList.remove('hidden');
  activeSection.classList.add('section-active');
  
  // Initialize dashboard if that's the section being shown
  if (section === 'dashboard') {
    updateDashboard();
  }
}

// Refresh dashboard with current course data
async function updateDashboard() {
  try {
    const instructor = JSON.parse(localStorage.getItem('instructor') || '{}');
    document.getElementById('instructorName').textContent = instructor.firstName || 'Instructor';

    const response = await fetch(`http://localhost:8000/courses?instructorId=${instructor.userId}`);
    if (!response.ok) throw new Error('Failed to fetch courses');

    courses = await response.json();
    renderCourses();
  } catch (error) {
    console.error('Error updating dashboard:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to load courses. Please try again later.',
      confirmButtonColor: '#4a90e2',
    });
  }
}

// Display all instructor courses as interactive cards
function renderCourses() {
  const courseList = document.getElementById('courseList');
  courseList.innerHTML = '';
  
  courses.forEach((course, index) => {
    const courseBox = document.createElement('div');
    courseBox.className = 'course-box';
    
    // Support both legacy string format and new object format
    const courseName = typeof course === 'string' ? course : course.name;
    const courseImage = typeof course === 'object' && course.imageUrl ? course.imageUrl : null;
    
    // Make card clickable but prevent menu clicks from navigating
    courseBox.onclick = (e) => {
      if (!e.target.closest('.course-menu')) {
        navigateToCourse(courseName, index);
      }
    };
    
    // Create course card with menu options and course image
    courseBox.innerHTML = `
      <div class="course-menu" onclick="event.stopPropagation()">
        <div class="dropdown">
          <div class="menu-icon-wrapper" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="fas fa-ellipsis-v"></i>
          </div>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="#" onclick="renameCourse(${index})">
              <i class="fas fa-edit me-2"></i>Edit Name
            </a></li>
            <li><a class="dropdown-item" href="#" onclick="addCourseImage(${index})">
              <i class="fas fa-image me-2"></i>Add Image
            </a></li>
            <li><a class="dropdown-item text-danger" href="#" onclick="removeCourse(${index})">
              <i class="fas fa-trash me-2"></i>Delete
            </a></li>
          </ul>
        </div>
      </div>
      ${courseImage ? `<img src="${courseImage}" class="course-image" alt="${courseName}">` : '<div class="course-image"></div>'}
      <div class="course-name">${courseName}</div>
    `;
    courseList.appendChild(courseBox);
  });
}

// Create a new course
async function addCourse() {
  const instructor = JSON.parse(localStorage.getItem('instructor') || '{}');

  Swal.fire({
    title: 'Enter Course Name',
    input: 'text',
    inputPlaceholder: 'Course Name',
    showCancelButton: true,
    confirmButtonColor: '#4a90e2',
    inputValidator: (value) => {
      if (!value.trim()) return 'Course name cannot be empty';
    },
  }).then(async (result) => {
    if (result.isConfirmed && result.value.trim() !== '') {
      try {
        const response = await fetch('http://localhost:8000/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseName: result.value.trim(),
            courseCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            instructorId: instructor.userId,
            term: 'Spring 2025', // Example term, replace as needed
          }),
        });

        if (!response.ok) throw new Error('Failed to add course');
        Swal.fire({
          icon: 'success',
          title: 'Course Added',
          confirmButtonColor: '#4a90e2',
        });
        updateDashboard();
      } catch (error) {
        console.error('Error adding course:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to add course. Please try again later.',
          confirmButtonColor: '#4a90e2',
        });
      }
    }
  });
}

// Delete a course
async function removeCourse(index) {
  const course = courses[index];

  Swal.fire({
    title: 'Remove Course?',
    text: 'Are you sure you want to remove this course?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e74c3c',
    cancelButtonColor: '#4a90e2',
    confirmButtonText: 'Yes, remove it',
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await fetch(`http://localhost:8000/courses/${course.courseId}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete course');
        Swal.fire({
          icon: 'success',
          title: 'Course Removed',
          confirmButtonColor: '#4a90e2',
        });
        updateDashboard();
      } catch (error) {
        console.error('Error removing course:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to remove course. Please try again later.',
          confirmButtonColor: '#4a90e2',
        });
      }
    }
  });
}

// Add an image to a course
function addCourseImage(index) {
  Swal.fire({
    title: 'Add Course Image',
    html: `
      <p>Enter an image URL or select an image file</p>
      <input type="text" id="imageUrl" class="swal2-input" placeholder="Image URL">
      <p class="mt-3">- OR -</p>
      <input type="file" id="imageFile" class="form-control" accept="image/*">
    `,
    showCancelButton: true,
    confirmButtonText: 'Add Image',
    background: '#f4f6f9',
    confirmButtonColor: '#4a90e2',
    preConfirm: () => {
      const imageUrl = document.getElementById('imageUrl').value;
      const imageFile = document.getElementById('imageFile').files[0];
      
      if (!imageUrl && !imageFile) {
        Swal.showValidationMessage('Please enter an image URL or select a file');
        return false;
      }
      
      // Convert file to data URL if file is selected
      if (imageFile) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(imageFile);
        });
      }
      
      return imageUrl;
    }
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      // Convert string course to object if needed
      if (typeof courses[index] === 'string') {
        courses[index] = { name: courses[index] };
      }
      
      courses[index].imageUrl = result.value;
      localStorage.setItem('instructorCourses', JSON.stringify(courses));
      updateDashboard();
    }
  });
}

// Convert legacy course data format to new object format
function migrateCourseData() {
  const storedCourses = JSON.parse(localStorage.getItem('instructorCourses') || '[]');
  const migratedCourses = storedCourses.map(course => {
    if (typeof course === 'string') {
      return { name: course };
    }
    return course;
  });
  
  // Only save if changes were made
  if (JSON.stringify(storedCourses) !== JSON.stringify(migratedCourses)) {
    localStorage.setItem('instructorCourses', JSON.stringify(migratedCourses));
  }
  
  return migratedCourses;
}

// Navigate to course details page
function navigateToCourse(courseName, index) {
  // Store selected course index for the destination page
  localStorage.setItem('selectedCourseIndex', index);
  
  // Create URL with encoded course parameters
  const url = `course-details.html?name=${encodeURIComponent(courseName)}&id=${index}`;
  
  window.location.href = url;
}

// Rename an existing course
async function renameCourse(index) {
  const course = courses[index];

  Swal.fire({
    title: 'Rename Course',
    input: 'text',
    inputValue: course.courseName,
    inputPlaceholder: 'New Course Name',
    showCancelButton: true,
    confirmButtonColor: '#4a90e2',
    inputValidator: (value) => {
      if (!value.trim()) return 'Course name cannot be empty';
    },
  }).then(async (result) => {
    if (result.isConfirmed && result.value.trim() !== '') {
      try {
        const response = await fetch(`http://localhost:8000/courses/${course.courseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseName: result.value.trim(), courseCode: course.courseCode, term: course.term }),
        });

        if (!response.ok) throw new Error('Failed to rename course');
        Swal.fire({
          icon: 'success',
          title: 'Course Renamed',
          confirmButtonColor: '#4a90e2',
        });
        updateDashboard();
      } catch (error) {
        console.error('Error renaming course:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to rename course. Please try again later.',
          confirmButtonColor: '#4a90e2',
        });
      }
    }
  });
}

// ===== Authentication System =====

// Replace the existing registration event listener
document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const userData = {
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    email: document.getElementById('email').value,
    password: document.getElementById('password').value,
    role: 'instructor',
  };

  try {
    const response = await fetch('http://localhost:8000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (response.ok) {
      Swal.fire({
        icon: 'success',
        title: 'Registration Successful',
        text: 'Please check your email to verify your account.',
        confirmButtonColor: '#4a90e2',
      }).then(() => showSection('login'));
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: data.error || 'An error occurred during registration.',
        confirmButtonColor: '#4a90e2',
      });
    }
  } catch (error) {
    console.error('Error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Connection Error',
      text: 'Could not connect to the server. Please try again later.',
      confirmButtonColor: '#4a90e2',
    });
  }
});

// Replace the existing login event listener
document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch('http://localhost:8000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('instructor', JSON.stringify(data));
      localStorage.setItem('instructorLoggedIn', true);

      Swal.fire({
        icon: 'success',
        title: 'Login Successful',
        confirmButtonColor: '#4a90e2',
      }).then(() => showSection('dashboard'));
    } else {
      if (data.needsVerification) {
        Swal.fire({
          icon: 'warning',
          title: 'Email Not Verified',
          text: 'Please check your email for a verification link.',
          confirmButtonColor: '#4a90e2',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: data.error || 'Invalid email or password.',
          confirmButtonColor: '#4a90e2',
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Connection Error',
      text: 'Could not connect to the server. Please try again later.',
      confirmButtonColor: '#4a90e2',
    });
  }
});

// Add a new function to handle resending verification emails
async function resendVerificationEmail(email) {
  try {
    const response = await fetch('http://localhost:8000/resend-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      Swal.fire({
        icon: 'success',
        title: 'Verification Email Sent',
        text: 'Please check your email inbox for the verification link.',
        background: '#f4f6f9',
        confirmButtonColor: '#4a90e2'
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: data.error || 'Failed to resend verification email.',
        background: '#f4f6f9',
        confirmButtonColor: '#4a90e2'
      });
    }
  } catch (error) {
    console.error('Error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Connection Error',
      text: 'Could not connect to the server. Please try again later.',
      background: '#f4f6f9',
      confirmButtonColor: '#4a90e2'
    });
  }
}

// Handle instructor sign out
function signout() {
  Swal.fire({ 
    icon: 'warning', 
    title: 'Sign Out?', 
    text: 'Are you sure you want to sign out?',
    showCancelButton: true, 
    confirmButtonText: 'Yes, sign out',
    background: '#f4f6f9',
    confirmButtonColor: '#e74c3c',
    cancelButtonColor: '#4a90e2'
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem('instructorLoggedIn');
      showSection('login');
    }
  });
}

// ===== Review Templates Management =====
let reviewTemplates = [];
let currentTemplateIndex = -1; // -1 means new template

// Open the templates management modal
function showTemplatesModal() {
  // Load existing templates
  reviewTemplates = JSON.parse(localStorage.getItem('instructorReviewTemplates') || '[]');
  
  // Show modal dialog
  const modal = new bootstrap.Modal(document.getElementById('templatesModal'));
  modal.show();
  
  renderTemplatesList();
  
  // Hide editor view initially
  document.getElementById('templateEditor').style.display = 'none';
}

// Display list of existing review templates
function renderTemplatesList() {
  const container = document.getElementById('templatesContainer');
  const noTemplatesMessage = document.getElementById('noTemplatesMessage');
  
  // Show message if no templates exist
  if (reviewTemplates.length === 0) {
    container.innerHTML = '';
    container.appendChild(noTemplatesMessage);
    return;
  }
  
  // Hide the no templates message
  noTemplatesMessage.remove();
  
  // Display each template as a card
  container.innerHTML = '';
  
  reviewTemplates.forEach((template, index) => {
    const templateCard = document.createElement('div');
    templateCard.className = 'card mb-3';
    
    const questionCount = template.questions ? template.questions.length : 0;
    
    templateCard.innerHTML = `
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h5 class="card-title">${template.name}</h5>
            <p class="card-text text-muted">${template.description || 'No description'}</p>
            <div class="badge bg-info text-white">${questionCount} question${questionCount !== 1 ? 's' : ''}</div>
          </div>
          <div class="btn-group">
            <button class="btn btn-outline-primary btn-sm edit-template" data-index="${index}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm delete-template" data-index="${index}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    
    container.appendChild(templateCard);
  });
  
  // Add event listeners for template actions
  document.querySelectorAll('.edit-template').forEach(button => {
    button.addEventListener('click', function() {
      const index = parseInt(this.dataset.index);
      editTemplate(index);
    });
  });
  
  document.querySelectorAll('.delete-template').forEach(button => {
    button.addEventListener('click', function() {
      const index = parseInt(this.dataset.index);
      deleteTemplate(index);
    });
  });
}

// Create new template button handler
document.getElementById('createTemplateBtn').addEventListener('click', function() {
  showTemplateEditor();
});

// Show template editor for creating or editing templates
function showTemplateEditor(templateIndex = -1) {
  currentTemplateIndex = templateIndex;
  
  // Display the editor
  document.getElementById('templateEditor').style.display = 'block';
  
  // Set appropriate title
  document.getElementById('editorTitle').textContent = 
    templateIndex === -1 ? 'Create New Template' : 'Edit Template';
  
  if (templateIndex === -1) {
    // Clear form for new template
    document.getElementById('templateName').value = '';
    document.getElementById('templateDescription').value = '';
    document.getElementById('questionsList').innerHTML = '';
    document.getElementById('noQuestionsMessage').style.display = 'block';
  } else {
    // Populate form with existing template data
    const template = reviewTemplates[templateIndex];
    document.getElementById('templateName').value = template.name || '';
    document.getElementById('templateDescription').value = template.description || '';
    
    // Display existing questions
    renderQuestions(template.questions || []);
  }
}

// Render the list of questions for a template
function renderQuestions(questions) {
  const questionsList = document.getElementById('questionsList');
  const noQuestionsMessage = document.getElementById('noQuestionsMessage');
  
  if (!questions || questions.length === 0) {
    questionsList.innerHTML = '';
    noQuestionsMessage.style.display = 'block';
    return;
  }
  
  noQuestionsMessage.style.display = 'none';
  questionsList.innerHTML = '';
  
  // Add each question to the editor
  questions.forEach((question, index) => {
    addQuestionToEditor(question.type, question);
  });
}

// Add a new question to the template being edited
function addQuestion(type) {
  document.getElementById('noQuestionsMessage').style.display = 'none';
  
  // Create a new question of specified type
  addQuestionToEditor(type);
  
  // Highlight newly added question briefly
  const questionsList = document.getElementById('questionsList');
  const lastQuestion = questionsList.lastElementChild;
  
  if (lastQuestion) {
    lastQuestion.classList.add('border-primary');
    setTimeout(() => {
      lastQuestion.classList.remove('border-primary');
    }, 800);
  }
}

// Add a question element to the template editor
function addQuestionToEditor(type, questionData = null) {
  // Clone the appropriate template based on question type
  const template = document.getElementById(`${type}QuestionTemplate`);
  const questionElement = template.content.cloneNode(true).firstElementChild;
  
  // Set existing data if provided
  if (questionData) {
    // Set common fields
    questionElement.querySelector('.question-text').value = questionData.text || '';
    
    // Set type-specific fields
    if (type === 'likert') {
      questionElement.querySelector('.scale-min').value = questionData.min || 1;
      questionElement.querySelector('.scale-max').value = questionData.max || 5;
      questionElement.querySelector('.scale-low-label').value = questionData.lowLabel || '';
      questionElement.querySelector('.scale-high-label').value = questionData.highLabel || '';
    } else if (type === 'multiple') {
      const optionsContainer = questionElement.querySelector('.options-container');
      optionsContainer.innerHTML = ''; // Clear default options
      
      // Add each option
      if (questionData.options && questionData.options.length > 0) {
        questionData.options.forEach((option, index) => {
          addOptionToQuestion(optionsContainer, index + 1, option);
        });
      } else {
        // Add at least two empty options
        addOptionToQuestion(optionsContainer, 1);
        addOptionToQuestion(optionsContainer, 2);
      }
    } else if (type === 'short') {
      questionElement.querySelector('.answer-type').value = questionData.answerType || 'single';
    }
  }
  
  // Add delete question handler
  questionElement.querySelector('.remove-question').addEventListener('click', function() {
    questionElement.remove();
    
    // Show "no questions" message if this was the last question
    if (document.querySelectorAll('.question-card').length === 0) {
      document.getElementById('noQuestionsMessage').style.display = 'block';
    }
  });
  
  // Add type-specific event handlers
  if (type === 'multiple') {
    const addOptionBtn = questionElement.querySelector('.add-option');
    const optionsContainer = questionElement.querySelector('.options-container');
    
    addOptionBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const optionCount = optionsContainer.querySelectorAll('.option-input').length;
      addOptionToQuestion(optionsContainer, optionCount + 1);
    });
    
    // Set up delete option handlers
    questionElement.querySelectorAll('.remove-option').forEach(button => {
      setupRemoveOptionListener(button, optionsContainer);
    });
  }
  
  // Add the question to the editor
  document.getElementById('questionsList').appendChild(questionElement);
  
  // Scroll to the new question
  questionElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Set up event listener for removing options from multiple choice questions
function setupRemoveOptionListener(button, container) {
  button.addEventListener('click', function(e) {
    e.preventDefault();
    const optionInput = this.closest('.option-input');
    
    // Prevent removing last option
    if (container.querySelectorAll('.option-input').length <= 1) {
      return;
    }
    
    optionInput.remove();
    
    // Re-number remaining options
    container.querySelectorAll('.option-input').forEach((input, idx) => {
      input.querySelector('.input-group-text').textContent = idx + 1;
    });
  });
}

// Add an option to a multiple choice question
function addOptionToQuestion(container, number, value = '') {
  const optionInput = document.createElement('div');
  optionInput.className = 'input-group mb-2 option-input';
  optionInput.innerHTML = `
    <span class="input-group-text">${number}</span>
    <input type="text" class="form-control" placeholder="Option text" value="${value}">
    <button class="btn btn-outline-danger remove-option">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Set up remove button handler
  const removeBtn = optionInput.querySelector('.remove-option');
  setupRemoveOptionListener(removeBtn, container);
  
  container.appendChild(optionInput);
  
  // Focus the new input field
  setTimeout(() => {
    optionInput.querySelector('input').focus();
  }, 50);
}

// Initialize handlers for the question type dropdown
document.addEventListener('DOMContentLoaded', function() {
  // Map dropdown items to their respective functions
  const questionTypeButtons = {
    'addLikertBtn': () => addQuestion('likert'),
    'addMultipleBtn': () => addQuestion('multiple'),
    'addShortBtn': () => addQuestion('short')
  };
  
  // Use event delegation for dropdown clicks
  document.addEventListener('click', function(e) {
    const buttonId = e.target.id || (e.target.closest('.dropdown-item')?.id);
    if (questionTypeButtons[buttonId]) {
      e.preventDefault();
      questionTypeButtons[buttonId]();
    }
  });
  
  // Initialize create template button
  const createTemplateBtn = document.getElementById('createTemplateBtn');
  if (createTemplateBtn) {
    createTemplateBtn.addEventListener('click', function() {
      showTemplateEditor();
    });
  }
});

// Save the current template
function saveTemplate() {
  // Validate template name
  const templateName = document.getElementById('templateName').value.trim();
  if (!templateName) {
    return Swal.fire({
      icon: 'error',
      title: 'Missing Information',
      text: 'Please enter a template name',
      background: '#f4f6f9',
      confirmButtonColor: '#4a90e2'
    });
  }
  
  // Validate that questions exist
  const questionCards = document.querySelectorAll('.question-card');
  if (questionCards.length === 0) {
    return Swal.fire({
      icon: 'error',
      title: 'No Questions',
      text: 'Please add at least one question to your template',
      background: '#f4f6f9',
      confirmButtonColor: '#4a90e2'
    });
  }
  
  // Create template object
  const template = {
    name: templateName,
    description: document.getElementById('templateDescription').value.trim(),
    questions: []
  };
  
  // Process each question
  questionCards.forEach(card => {
    const questionType = card.dataset.type;
    const questionText = card.querySelector('.question-text').value.trim();
    
    if (!questionText) {
      return; // Skip questions without text
    }
    
    const question = {
      type: questionType,
      text: questionText
    };
    
    // Add type-specific properties
    if (questionType === 'likert') {
      question.min = parseInt(card.querySelector('.scale-min').value) || 1;
      question.max = parseInt(card.querySelector('.scale-max').value) || 5;
      question.lowLabel = card.querySelector('.scale-low-label').value.trim();
      question.highLabel = card.querySelector('.scale-high-label').value.trim();
    } else if (questionType === 'multiple') {
      question.options = [];
      card.querySelectorAll('.option-input input[type="text"]').forEach(input => {
        const optionText = input.value.trim();
        if (optionText) {
          question.options.push(optionText);
        }
      });
      
      // Validate multiple choice questions have at least 2 options
      if (question.options.length < 2) {
        return Swal.fire({
          icon: 'error',
          title: 'Invalid Question',
          text: 'Multiple choice questions must have at least two options',
          background: '#f4f6f9',
          confirmButtonColor: '#4a90e2'
        });
      }
    } else if (questionType === 'short') {
      question.answerType = card.querySelector('.answer-type').value;
    }
    
    template.questions.push(question);
  });
  
  // Ensure at least one valid question exists
  if (template.questions.length === 0) {
    return Swal.fire({
      icon: 'error',
      title: 'Invalid Template',
      text: 'Please provide at least one complete question',
      background: '#f4f6f9',
      confirmButtonColor: '#4a90e2'
    });
  }
  
  // Save as new or update existing template
  if (currentTemplateIndex === -1) {
    reviewTemplates.push(template);
  } else {
    reviewTemplates[currentTemplateIndex] = template;
  }
  
  localStorage.setItem('instructorReviewTemplates', JSON.stringify(reviewTemplates));
  
  Swal.fire({
    icon: 'success',
    title: 'Template Saved',
    background: '#f4f6f9',
    confirmButtonColor: '#4a90e2'
  }).then(() => {
    document.getElementById('templateEditor').style.display = 'none';
    renderTemplatesList();
  });
}

// Cancel template editing
function cancelTemplateEdit() {
  // Check for unsaved changes
  const templateName = document.getElementById('templateName').value.trim();
  const hasQuestions = document.querySelectorAll('.question-card').length > 0;
  
  if (templateName || hasQuestions) {
    Swal.fire({
      title: 'Discard Changes?',
      text: 'Any unsaved changes will be lost.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#4a90e2',
      confirmButtonText: 'Yes, discard',
      background: '#f4f6f9'
    }).then((result) => {
      if (result.isConfirmed) {
        document.getElementById('templateEditor').style.display = 'none';
      }
    });
  } else {
    document.getElementById('templateEditor').style.display = 'none';
  }
}

// Edit an existing template
function editTemplate(index) {
  showTemplateEditor(index);
}

// Delete a template
function deleteTemplate(index) {
  Swal.fire({
    title: 'Delete Template?',
    text: 'This action cannot be undone.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e74c3c',
    cancelButtonColor: '#4a90e2',
    confirmButtonText: 'Yes, delete it',
    background: '#f4f6f9'
  }).then((result) => {
    if (result.isConfirmed) {
      reviewTemplates.splice(index, 1);
      localStorage.setItem('instructorReviewTemplates', JSON.stringify(reviewTemplates));
      renderTemplatesList();
    }
  });
}

// Show appropriate section on page load
window.onload = function() {
  if (localStorage.getItem('instructorLoggedIn')) showSection('dashboard');
  else showSection('register');
}

/*Commented by Copilot */