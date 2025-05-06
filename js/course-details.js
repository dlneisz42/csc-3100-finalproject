let _courseData;
let _COURSE_DATA_KEY;
let _renderTeams;
let _renderStudents;

document.addEventListener('DOMContentLoaded', function() {
  // Load course information from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const courseName = urlParams.get('name');
  const courseId = urlParams.get('id');
  
  const COURSE_DATA_KEY = `course_${courseId}_data`;
  _COURSE_DATA_KEY = COURSE_DATA_KEY; // Save reference
  
  // Initialize or retrieve course data from localStorage
  let courseData = JSON.parse(localStorage.getItem(COURSE_DATA_KEY) || '{"students":[], "teams":[], "reviews":[]}');
  _courseData = courseData; // Save reference
  
  if (!courseData.reviews) {
    courseData.reviews = [];
    localStorage.setItem(COURSE_DATA_KEY, JSON.stringify(courseData));
  }
  
  // Update page title and header with course name
  document.getElementById('courseTitle').textContent = courseName || 'Course Details';
  document.title = `${courseName || 'Course'} - Details`;
  
  // Display course image if available
  if (courseId !== null) {
    const courses = JSON.parse(localStorage.getItem('instructorCourses') || '[]');
    const course = courses[courseId];
    
    if (course && course.imageUrl) {
      const imageContainer = document.getElementById('courseImageContainer');
      const img = document.createElement('img');
      img.src = course.imageUrl;
      img.alt = courseName;
      img.className = 'course-image-banner';
      imageContainer.appendChild(img);
    }
  }
  
  // ===== Join Code Functionality =====
  const generateCodeBtn = document.getElementById('generateCodeBtn');
  const copyCodeBtn = document.getElementById('copyCodeBtn');
  const joinCodeDisplay = document.getElementById('joinCode');
  
  // Generate random course join code
  generateCodeBtn.addEventListener('click', function() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 9; i++) {
      if (i === 3 || i === 6) {
        code += '-';
      }
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    joinCodeDisplay.textContent = code;
    
    // Save generated code to course data
    if (courseId !== null) {
      const courses = JSON.parse(localStorage.getItem('instructorCourses') || '[]');
      if (courses[courseId]) {
        if (typeof courses[courseId] === 'string') {
          courses[courseId] = { name: courses[courseId] };
        }
        courses[courseId].joinCode = code;
        localStorage.setItem('instructorCourses', JSON.stringify(courses));
      }
    }
  });
  
  // Copy join code to clipboard
  copyCodeBtn.addEventListener('click', function() {
    const code = joinCodeDisplay.textContent;
    navigator.clipboard.writeText(code).then(() => {
      Swal.fire({
        toast: true,
        position: 'top',
        icon: 'success',
        title: 'Code copied to clipboard!',
        showConfirmButton: false,
        timer: 2000
      });
    });
  });
  
  // Display existing join code if available
  if (courseId !== null) {
    const courses = JSON.parse(localStorage.getItem('instructorCourses') || '[]');
    const course = courses[courseId];
    if (course && course.joinCode) {
      joinCodeDisplay.textContent = course.joinCode;
    }
  }
  
  // ===== Student Management =====
  
  // Display student list with team assignments
  function renderStudents() {
    const tableBody = document.getElementById('studentTableBody');
    const noStudentsMessage = document.getElementById('noStudentsMessage');
    
    tableBody.innerHTML = '';
    
    if (courseData.students.length === 0) {
      noStudentsMessage.style.display = 'block';
    } else {
      noStudentsMessage.style.display = 'none';
      
      courseData.students.forEach((student, index) => {
        const tr = document.createElement('tr');
        
        // Determine student's team assignment
        let teamName = 'Unassigned';
        for (const team of courseData.teams) {
          if (team.members.includes(index)) {
            teamName = team.name;
            break;
          }
        }
        
        tr.innerHTML = `
          <td>${student.id}</td>
          <td>${student.name}</td>
          <td>${student.email}</td>
          <td>${teamName}</td>
          <td>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-primary edit-student" data-index="${index}"><i class="fas fa-edit"></i></button>
              <button class="btn btn-outline-danger remove-student" data-index="${index}"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        `;
        
        tableBody.appendChild(tr);
      });
      
      // Set up edit and delete buttons for each student
      document.querySelectorAll('.edit-student').forEach(button => {
        button.addEventListener('click', function() {
          const index = parseInt(this.dataset.index);
          editStudent(index);
        });
      });
      
      document.querySelectorAll('.remove-student').forEach(button => {
        button.addEventListener('click', function() {
          const index = parseInt(this.dataset.index);
          removeStudent(index);
        });
      });
    }
  }
  _renderStudents = renderStudents; // Save reference
  
  // ===== Team Management =====
  
  // Display teams with their members
  function renderTeams() {
    const teamContainer = document.getElementById('teamContainer');
    teamContainer.innerHTML = '';
    
    if (courseData.teams.length === 0) {
      const noTeamsMessage = document.createElement('div');
      noTeamsMessage.className = 'col-12 text-center p-4';
      noTeamsMessage.innerHTML = `
        <i class="fas fa-users fa-2x text-muted mb-3"></i>
        <p class="text-muted">No teams have been created yet.</p>
      `;
      teamContainer.appendChild(noTeamsMessage);
      return;
    }
    
    // Create a card for each team
    courseData.teams.forEach((team, teamIndex) => {
      const teamCard = document.createElement('div');
      teamCard.className = 'col-md-6 col-lg-4 mb-4';
      teamCard.innerHTML = `
        <div class="card team-card h-100">
          <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 class="mb-0">${team.name}</h5>
            <div class="dropdown">
              <button class="btn btn-sm btn-light" data-bs-toggle="dropdown"><i class="fas fa-ellipsis-v"></i></button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item rename-team" href="#" data-index="${teamIndex}"><i class="fas fa-edit me-2"></i>Rename</a></li>
                <li><a class="dropdown-item delete-team" href="#" data-index="${teamIndex}"><i class="fas fa-trash me-2"></i>Delete</a></li>
              </ul>
            </div>
          </div>
          <div class="card-body">
            <h6 class="card-subtitle mb-3 text-muted"><i class="fas fa-user-friends me-2"></i>${team.members.length} Members</h6>
            <ul class="list-group">
              ${team.members.map(memberIndex => {
                const student = courseData.students[memberIndex];
                return `
                  <li class="list-group-item d-flex justify-content-between align-items-center">
                    ${student.name}
                    <button class="btn btn-sm btn-outline-danger remove-from-team" data-student-index="${memberIndex}"><i class="fas fa-user-minus"></i></button>
                  </li>
                `;
              }).join('')}
            </ul>
            <div class="mt-3">
              <button class="btn btn-sm btn-outline-primary w-100 add-to-team" onclick="addStudentToTeam('${team.name}')"><i class="fas fa-user-plus me-2"></i>Add Student</button>
            </div>
          </div>
        </div>
      `;
      
      teamContainer.appendChild(teamCard);
    });
    
    // Set up event listeners for team management buttons
    document.querySelectorAll('.delete-team').forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        const index = parseInt(this.dataset.index);
        removeTeam(index);
      });
    });
    
    document.querySelectorAll('.rename-team').forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        const index = parseInt(this.dataset.index);
        renameTeam(index);
      });
    });
    
    document.querySelectorAll('.remove-from-team').forEach(button => {
      button.addEventListener('click', function() {
        const studentIndex = parseInt(this.dataset.studentIndex);
        removeFromTeam(studentIndex);
      });
    });
  }
  _renderTeams = renderTeams; // Save reference
  
  // ===== Add Student Functionality =====
  document.getElementById('saveStudentBtn').addEventListener('click', function() {
    const studentId = document.getElementById('studentId').value.trim();
    const studentName = document.getElementById('studentName').value.trim();
    const studentEmail = document.getElementById('studentEmail').value.trim();
    
    // Input validation
    if (!studentId || !studentName || !studentEmail) {
      return Swal.fire({
        icon: 'error',
        title: 'Missing Information',
        text: 'Please fill in all required fields.'
      });
    }
    
    // Check for duplicate student IDs
    const idExists = courseData.students.some(student => student.id === studentId);
    if (idExists) {
      return Swal.fire({
        icon: 'error',
        title: 'Duplicate Student ID',
        text: 'A student with this ID already exists.'
      });
    }
    
    // Add new student to course data
    courseData.students.push({
      id: studentId,
      name: studentName,
      email: studentEmail
    });
    
    localStorage.setItem(COURSE_DATA_KEY, JSON.stringify(courseData));
    
    // Close modal and refresh UI
    const modal = bootstrap.Modal.getInstance(document.getElementById('addStudentModal'));
    modal.hide();
    
    document.getElementById('addStudentForm').reset();
    
    renderStudents();
    
    Swal.fire({
      icon: 'success',
      title: 'Student Added',
      text: `${studentName} has been added to the course.`
    });
  });
  
  // Remove a student from the course and update team assignments
  function removeStudent(index) {
    Swal.fire({
      title: 'Remove Student?',
      text: `Are you sure you want to remove ${courseData.students[index].name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove'
    }).then((result) => {
      if (result.isConfirmed) {
        // Remove student from any teams and adjust indices
        courseData.teams.forEach(team => {
          const memberIndex = team.members.indexOf(index);
          if (memberIndex !== -1) {
            team.members.splice(memberIndex, 1);
          }
          
          team.members = team.members.map(memberIdx => {
            if (memberIdx > index) return memberIdx - 1;
            return memberIdx;
          });
        });
        
        courseData.students.splice(index, 1);
        
        localStorage.setItem(COURSE_DATA_KEY, JSON.stringify(courseData));
        
        renderStudents();
        renderTeams();
        
        Swal.fire(
          'Removed!',
          'The student has been removed.',
          'success'
        );
      }
    });
  }
  
  // Edit student information
  function editStudent(index) {
    const student = courseData.students[index];
    
    Swal.fire({
      title: 'Edit Student',
      html: `
        <div class="mb-3">
          <label class="form-label">Student ID</label>
          <input id="edit-id" class="form-control" value="${student.id}">
        </div>
        <div class="mb-3">
          <label class="form-label">Name</label>
          <input id="edit-name" class="form-control" value="${student.name}">
        </div>
        <div class="mb-3">
          <label class="form-label">Email</label>
          <input id="edit-email" class="form-control" value="${student.email}">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Save Changes',
      focusConfirm: false,
      preConfirm: () => {
        const id = document.getElementById('edit-id').value.trim();
        const name = document.getElementById('edit-name').value.trim();
        const email = document.getElementById('edit-email').value.trim();
        
        if (!id || !name || !email) {
          Swal.showValidationMessage('Please fill in all fields');
          return false;
        }
        
        const idExists = courseData.students.some((s, i) => i !== index && s.id === id);
        if (idExists) {
          Swal.showValidationMessage('A student with this ID already exists');
          return false;
        }
        
        return { id, name, email };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        courseData.students[index] = {
          id: result.value.id,
          name: result.value.name,
          email: result.value.email
        };
        
        localStorage.setItem(COURSE_DATA_KEY, JSON.stringify(courseData));
        
        renderStudents();
        
        Swal.fire(
          'Updated!',
          'Student information has been updated.',
          'success'
        );
      }
    });
  }
  
  // ===== Team Creation =====
  const createTeamBtn = document.getElementById('createTeamBtn');
  if (createTeamBtn) {
    createTeamBtn.addEventListener('click', function() {
      Swal.fire({
        title: 'Create New Team',
        input: 'text',
        inputLabel: 'Team Name',
        inputPlaceholder: 'Enter team name',
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value.trim()) {
            return 'Team name cannot be empty';
          }
          
          const teamExists = courseData.teams.some(team => team.name === value.trim());
          if (teamExists) {
            return 'A team with this name already exists';
          }
        }
      }).then((result) => {
        if (result.isConfirmed) {
          // Create a new team with empty members array
          courseData.teams.push({
            name: result.value.trim(),
            members: []
          });
          
          localStorage.setItem(COURSE_DATA_KEY, JSON.stringify(courseData));
          
          renderTeams();
          
          Swal.fire(
            'Team Created!',
            `${result.value} has been created.`,
            'success'
          );
        }
      });
    });
  }
  
  // Delete a team
  function removeTeam(index) {
    Swal.fire({
      title: 'Delete Team?',
      text: `Are you sure you want to delete team "${courseData.teams[index].name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete'
    }).then((result) => {
      if (result.isConfirmed) {
        courseData.teams.splice(index, 1);
        
        localStorage.setItem(COURSE_DATA_KEY, JSON.stringify(courseData));
        
        renderTeams();
        
        Swal.fire(
          'Deleted!',
          'The team has been deleted.',
          'success'
        );
      }
    });
  }
  
  // Rename a team
  function renameTeam(index) {
    const team = courseData.teams[index];
    
    Swal.fire({
      title: 'Rename Team',
      input: 'text',
      inputValue: team.name,
      inputLabel: 'New Team Name',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value.trim()) {
          return 'Team name cannot be empty';
        }
        
        const teamExists = courseData.teams.some((t, i) => i !== index && t.name === value.trim());
        if (teamExists) {
          return 'A team with this name already exists';
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        team.name = result.value.trim();
        
        localStorage.setItem(COURSE_DATA_KEY, JSON.stringify(courseData));
        
        renderTeams();
        renderStudents(); // Update student view to show new team name
        
        Swal.fire(
          'Renamed!',
          `Team has been renamed to "${result.value}".`,
          'success'
        );
      }
    });
  }
  
  // Remove student from their team
  function removeFromTeam(studentIndex) {
    // Find which team the student belongs to
    let teamIndex = -1;
    let memberIndex = -1;
    
    courseData.teams.forEach((team, tIndex) => {
      const mIndex = team.members.indexOf(studentIndex);
      if (mIndex !== -1) {
        teamIndex = tIndex;
        memberIndex = mIndex;
      }
    });
    
    if (teamIndex === -1) return;
    
    const team = courseData.teams[teamIndex];
    const student = courseData.students[studentIndex];
    
    Swal.fire({
      title: 'Remove from Team?',
      text: `Are you sure you want to remove ${student.name} from ${team.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove'
    }).then((result) => {
      if (result.isConfirmed) {
        team.members.splice(memberIndex, 1);
        
        localStorage.setItem(COURSE_DATA_KEY, JSON.stringify(courseData));
        
        renderTeams();
        renderStudents();
        
        Swal.fire(
          'Removed!',
          `${student.name} has been removed from ${team.name}.`,
          'success'
        );
      }
    });
  }
  
  // Add student to a team
  function addStudentToTeam(teamName) {
    const teamIndex = courseData.teams.findIndex(team => team.name === teamName);
    if (teamIndex === -1) return;
    
    // Find unassigned students
    const unassignedStudents = courseData.students.filter((student, index) => {
      return !courseData.teams.some(team => team.members.includes(index));
    });
    
    if (unassignedStudents.length === 0) {
      return Swal.fire({
        icon: 'info',
        title: 'No Unassigned Students',
        text: 'All students are already assigned to teams.'
      });
    }
    
    // Create dropdown of unassigned students
    const options = unassignedStudents.map((student, i) => {
      const studentIndex = courseData.students.indexOf(student);
      return `<option value="${studentIndex}">${student.name} (${student.id})</option>`;
    }).join('');
    
    Swal.fire({
      title: `Add Student to ${teamName}`,
      html: `
        <select id="studentSelect" class="form-select">
          <option value="" disabled selected>Select a student</option>
          ${options}
        </select>
      `,
      showCancelButton: true,
      confirmButtonText: 'Add to Team',
      preConfirm: () => {
        const select = document.getElementById('studentSelect');
        if (!select.value) {
          Swal.showValidationMessage('Please select a student');
          return false;
        }
        return select.value;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const studentIndex = parseInt(result.value);
        
        courseData.teams[teamIndex].members.push(studentIndex);
        
        localStorage.setItem(COURSE_DATA_KEY, JSON.stringify(courseData));
        
        renderTeams();
        renderStudents();
        
        Swal.fire(
          'Added!',
          `${courseData.students[studentIndex].name} has been added to ${teamName}.`,
          'success'
        );
      }
    });
  }
  
  // ===== Auto-assign students to teams =====
  const autoAssignBtn = document.getElementById('autoAssignBtn');
  if (autoAssignBtn) {
    autoAssignBtn.addEventListener('click', function() {
      if (courseData.teams.length === 0) {
        return Swal.fire({
          icon: 'error',
          title: 'No Teams',
          text: 'Please create at least one team first.'
        });
      }
      
      Swal.fire({
        title: 'Auto-Assign Students',
        html: `
          <p>This will randomly assign unassigned students to teams.</p>
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="balanceTeams" checked>
            <label class="form-check-label" for="balanceTeams">Balance team sizes</label>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Assign Students'
      }).then((result) => {
        if (result.isConfirmed) {
          const balanceTeams = document.getElementById('balanceTeams').checked;
          
          // Find students not currently in a team
          const unassignedStudentIndices = courseData.students
            .map((_, index) => index)
            .filter(index => !courseData.teams.some(team => team.members.includes(index)));
          
          if (unassignedStudentIndices.length === 0) {
            return Swal.fire({
              icon: 'info',
              title: 'No Unassigned Students',
              text: 'All students are already assigned to teams.'
            });
          }
          
          // Randomize student order for assignment
          for (let i = unassignedStudentIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [unassignedStudentIndices[i], unassignedStudentIndices[j]] = 
            [unassignedStudentIndices[j], unassignedStudentIndices[i]];
          }
          
          if (balanceTeams) {
            // Assign to teams with fewest members first
            while (unassignedStudentIndices.length > 0) {
              let minTeamIndex = 0;
              let minTeamSize = courseData.teams[0].members.length;
              
              for (let i = 1; i < courseData.teams.length; i++) {
                if (courseData.teams[i].members.length < minTeamSize) {
                  minTeamIndex = i;
                  minTeamSize = courseData.teams[i].members.length;
                }
              }
              
              courseData.teams[minTeamIndex].members.push(unassignedStudentIndices.pop());
            }
          } else {
            // Round-robin distribution
            unassignedStudentIndices.forEach((studentIndex, i) => {
              const teamIndex = i % courseData.teams.length;
              courseData.teams[teamIndex].members.push(studentIndex);
            });
          }
          
          localStorage.setItem(COURSE_DATA_KEY, JSON.stringify(courseData));
          
          renderTeams();
          renderStudents();
          
          Swal.fire(
            'Assigned!',
            `${unassignedStudentIndices.length} students have been assigned to teams.`,
            'success'
          );
        }
      });
    });
  }
  
  // ===== Student search filtering =====
  const studentSearch = document.getElementById('studentSearch');
  studentSearch.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const tableRows = document.querySelectorAll('#studentTableBody tr');
    
    tableRows.forEach(row => {
      const text = row.textContent.toLowerCase();
      if (text.includes(searchTerm)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  });
  
  // ===== Peer Review System =====
  initPeerReviews();
  
  function initPeerReviews() {
    document.getElementById('assignReviewBtn').addEventListener('click', showAssignReviewModal);
    document.getElementById('saveReviewBtn').addEventListener('click', assignReview);
    renderReviews();
  }
  
  // Open modal to create a new peer review assignment
  function showAssignReviewModal() {
    populateTemplatesDropdown();
    populateTeamsDropdown();
    
    const modal = new bootstrap.Modal(document.getElementById('assignReviewModal'));
    modal.show();
  }
  
  // Load available review templates into dropdown
  function populateTemplatesDropdown() {
    const dropdown = document.getElementById('reviewTemplate');
    dropdown.innerHTML = '<option value="" selected disabled>Choose a template...</option>';
    
    const templates = JSON.parse(localStorage.getItem('instructorReviewTemplates') || '[]');
    
    if (templates.length === 0) {
      dropdown.innerHTML += `
        <option value="" disabled>No templates available. Create one in the instructor portal.</option>
      `;
      return;
    }
    
    templates.forEach((template, index) => {
      dropdown.innerHTML += `<option value="${index}">${template.name}</option>`;
    });
  }
  
  // Load course teams into dropdown
  function populateTeamsDropdown() {
    const dropdown = document.getElementById('reviewTeam');
    dropdown.innerHTML = '<option value="" selected>All Teams (Peer Review)</option>';
    
    courseData.teams.forEach((team, index) => {
      dropdown.innerHTML += `<option value="${index}">${team.name}</option>`;
    });
  }
  
  // Create a new peer review assignment
  function assignReview() {
    const reviewName = document.getElementById('reviewName').value.trim();
    const templateIndex = document.getElementById('reviewTemplate').value;
    const teamIndex = document.getElementById('reviewTeam').value;
    
    // Validation
    if (!reviewName) {
      return Swal.fire({
        icon: 'error',
        title: 'Missing Information',
        text: 'Please enter a name for this review.'
      });
    }
    
    if (!templateIndex) {
      return Swal.fire({
        icon: 'error',
        title: 'Missing Information',
        text: 'Please select a review template.'
      });
    }
    
    // Verify template exists
    const templates = JSON.parse(localStorage.getItem('instructorReviewTemplates') || '[]');
    const template = templates[templateIndex];
    
    if (!template) {
      return Swal.fire({
        icon: 'error',
        title: 'Template Error',
        text: 'The selected template could not be found.'
      });
    }
    
    // Create review object
    const review = {
      name: reviewName,
      templateIndex: parseInt(templateIndex),
      teamIndex: teamIndex ? parseInt(teamIndex) : null,
      dateAssigned: new Date().toISOString(),
      status: 'Assigned',
      anonymousFeedback: document.getElementById('anonymousFeedback')?.checked || false,
      responses: []
    };
    
    courseData.reviews.push(review);
    
    localStorage.setItem(COURSE_DATA_KEY, JSON.stringify(courseData));
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('assignReviewModal'));
    modal.hide();
    
    document.getElementById('assignReviewForm').reset();
    
    renderReviews();
    
    Swal.fire({
      icon: 'success',
      title: 'Review Assigned',
      text: `"${reviewName}" has been assigned successfully.`
    });
  }
  
  // Display all peer reviews for the course
  function renderReviews() {
    const container = document.getElementById('reviewsContainer');
    const noReviewsMessage = document.getElementById('noReviewsMessage');
    
    if (!courseData.reviews || courseData.reviews.length === 0) {
      container.innerHTML = '';
      container.appendChild(noReviewsMessage);
      return;
    }
    
    if (noReviewsMessage) {
      noReviewsMessage.style.display = 'none';
    }
    
    // Sort by date (newest first)
    const sortedReviews = [...courseData.reviews].sort((a, b) => {
      return new Date(b.dateAssigned) - new Date(a.dateAssigned);
    });
    
    container.innerHTML = '';
    
    sortedReviews.forEach((review, index) => {
      const reviewCard = document.createElement('div');
      reviewCard.className = 'card mb-3';
      
      // Get template info
      const templates = JSON.parse(localStorage.getItem('instructorReviewTemplates') || '[]');
      const template = templates[review.templateIndex] || { name: 'Unknown Template' };
      
      // Get team info if specific team
      let teamInfo = 'All Teams';
      if (review.teamIndex !== null && courseData.teams[review.teamIndex]) {
        teamInfo = courseData.teams[review.teamIndex].name;
      }
      
      // Response statistics
      const responseCount = review.responses ? review.responses.length : 0;
      const totalStudents = courseData.students.length;
      
      reviewCard.innerHTML = `
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h5 class="card-title">${review.name}</h5>
              <p class="card-text text-muted mb-1">
                <small>Assigned: ${formatDate(review.dateAssigned)}</small>
              </p>
              <p class="card-text mb-1">
                <span class="badge bg-secondary me-2">Template: ${template.name}</span>
                <span class="badge bg-secondary">Team: ${teamInfo}</span>
              </p>
              <div class="mt-2">
                <span class="badge ${getStatusColor(review.status)}">${review.status}</span>
                <span class="badge bg-info ms-2">${responseCount}/${totalStudents} Responses</span>
              </div>
            </div>
            <div class="btn-group">
              <button class="btn btn-outline-primary btn-sm view-results" onclick="viewReviewResults(${index})"><i class="fas fa-chart-bar me-1"></i>View Results</button>
              <button class="btn btn-outline-danger btn-sm delete-review" onclick="deleteReview(${index})"><i class="fas fa-trash me-1"></i>Delete</button>
            </div>
          </div>
        </div>
      `;
      
      container.appendChild(reviewCard);
    });
  }
  
  // Format ISO date to readable format
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  }
  
  // Get appropriate badge color based on review status
  function getStatusColor(status) {
    switch (status) {
      case 'Assigned': return 'bg-warning';
      case 'In Progress': return 'bg-primary';
      case 'Completed': return 'bg-success';
      default: return 'bg-secondary';
    }
  }
  
  // Show review results in modal
  function viewReviewResults(index) {
    const review = courseData.reviews[index];
    if (!review) return;
    
    const templates = JSON.parse(localStorage.getItem('instructorReviewTemplates') || '[]');
    const template = templates[review.templateIndex];
    
    if (!template) {
      return Swal.fire({
        icon: 'error',
        title: 'Template Error',
        text: 'The template for this review could not be found.'
      });
    }
    
    // Build results summary UI
    let resultsHtml = `
      <div class="text-start">
        <h5 class="mb-3">Response Summary</h5>
        <p class="text-muted mb-4">
          ${review.responses ? review.responses.length : 0} responses out of ${courseData.students.length} students
        </p>
    `;
    
    if (!review.responses || review.responses.length === 0) {
      resultsHtml += `
        <div class="alert alert-info">
          <i class="fas fa-info-circle me-2"></i>No responses have been submitted yet.
        </div>
      `;
    } else {
      resultsHtml += `<div class="results-container">`;
      
      resultsHtml += `
        <div class="alert alert-success">
          <i class="fas fa-check-circle me-2"></i>${review.responses.length} responses received. Detailed results will be shown here.
        </div>
      `;
      
      resultsHtml += `</div>`;
    }
    
    resultsHtml += `</div>`;
    
    Swal.fire({
      title: review.name,
      html: resultsHtml,
      width: 800,
      confirmButtonText: 'Close'
    });
  }
  
  // Delete a peer review
  function deleteReview(index) {
    const review = courseData.reviews[index];
    if (!review) return;
    
    Swal.fire({
      title: 'Delete Review?',
      text: `Are you sure you want to delete "${review.name}"? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it'
    }).then((result) => {
      if (result.isConfirmed) {
        courseData.reviews.splice(index, 1);
        
        localStorage.setItem(COURSE_DATA_KEY, JSON.stringify(courseData));
        
        renderReviews();
        
        Swal.fire(
          'Deleted!',
          'The review has been deleted.',
          'success'
        );
      }
    });
  }
  
  // Initialize page UI
  renderStudents();
  renderTeams();
});

// ===== Export functions for use in HTML onclick attributes =====
window.addStudentToTeam = function(teamName) {
  const teamIndex = _courseData.teams.findIndex(team => team.name === teamName);
  if (teamIndex === -1) return;
  
  // Find unassigned students
  const unassignedStudents = _courseData.students.filter((student, index) => {
    return !_courseData.teams.some(team => team.members.includes(index));
  });
  
  if (unassignedStudents.length === 0) {
    return Swal.fire({
      icon: 'info',
      title: 'No Unassigned Students',
      text: 'All students are already assigned to teams.'
    });
  }
  
  // Create dropdown of unassigned students
  const options = unassignedStudents.map((student, i) => {
    const studentIndex = _courseData.students.indexOf(student);
    return `<option value="${studentIndex}">${student.name} (${student.id})</option>`;
  }).join('');
  
  Swal.fire({
    title: `Add Student to ${teamName}`,
    html: `
      <select id="studentSelect" class="form-select">
        <option value="" disabled selected>Select a student</option>
        ${options}
      </select>
    `,
    showCancelButton: true,
    confirmButtonText: 'Add to Team',
    preConfirm: () => {
      const select = document.getElementById('studentSelect');
      if (!select.value) {
        Swal.showValidationMessage('Please select a student');
        return false;
      }
      return select.value;
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const studentIndex = parseInt(result.value);
      
      _courseData.teams[teamIndex].members.push(studentIndex);
      
      localStorage.setItem(_COURSE_DATA_KEY, JSON.stringify(_courseData));
      
      _renderTeams();
      _renderStudents();
      
      Swal.fire(
        'Added!',
        `${_courseData.students[studentIndex].name} has been added to ${teamName}.`,
        'success'
      );
    }
  });
};

window.viewReviewResults = function(index) {
  const event = new CustomEvent('viewReviewResults', { detail: { index } });
  document.dispatchEvent(event);
};

window.deleteReview = function(index) {
  const event = new CustomEvent('deleteReview', { detail: { index } });
  document.dispatchEvent(event);
};

// Connect global functions to the actual implementation
document.addEventListener('viewReviewResults', function(e) {
  // Handled inside DOMContentLoaded
});

document.addEventListener('deleteReview', function(e) {
  // Handled inside DOMContentLoaded
});