// Student Portal JavaScript with Email Verification

// Register Form Handler
document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const studentData = {
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    email: document.getElementById('email').value,
    password: document.getElementById('password').value,
    discord: document.getElementById('discordId').value || '',
    teams: document.getElementById('teamsId').value || '',
    phone: document.getElementById('phone').value || '',
    role: 'student',
  };

  try {
    const response = await fetch('http://localhost:8000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData),
    });

    const data = await response.json();

    if (response.ok) {
      Swal.fire({
        icon: 'success',
        title: 'Registration Successful',
        text: 'Please check your email to verify your account before logging in.',
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

// Login Form Handler
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
      localStorage.setItem('student', JSON.stringify(data));
      localStorage.setItem('studentLoggedIn', true);

      Swal.fire({
        icon: 'success',
        title: 'Login Successful',
        confirmButtonColor: '#4a90e2',
      }).then(() => {
        showSection('dashboard');
        document.getElementById('studentName').textContent = `${data.firstName} ${data.lastName}`;
      });
    } else {
      if (data.needsVerification) {
        Swal.fire({
          icon: 'warning',
          title: 'Email Not Verified',
          text: 'Please check your email for a verification link.',
          showCancelButton: true,
          confirmButtonText: 'Resend Verification Email',
          cancelButtonText: 'OK',
          confirmButtonColor: '#4a90e2',
        }).then((result) => {
          if (result.isConfirmed) {
            resendVerificationEmail(email);
          }
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

// Resend verification email
async function resendVerificationEmail(email) {
  try {
    const response = await fetch('http://localhost:8000/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok) {
      Swal.fire({
        icon: 'success',
        title: 'Verification Email Sent',
        text: 'Please check your email inbox for the verification link.',
        confirmButtonColor: '#4a90e2',
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: data.error || 'Failed to resend verification email.',
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
}

// Sign out function
function signout() {
  Swal.fire({
    icon: 'warning', 
    title: 'Sign Out?', 
    text: 'Are you sure you want to sign out?',
    showCancelButton: true, 
    confirmButtonText: 'Yes, sign out', 
    confirmButtonColor: '#e74c3c'
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem('studentLoggedIn');
      localStorage.removeItem('student');
      showSection('login');
    }
  });
}

// Review submission handler
document.getElementById('submitReview').addEventListener('click', async function () {
  const teammateName = document.querySelector('#reviewForm textarea:nth-of-type(1)').value;
  const publicFeedback = document.querySelector('#reviewForm textarea:nth-of-type(3)').value;
  const privateFeedback = document.querySelector('#reviewForm textarea:nth-of-type(4)').value;
  const grade = document.getElementById('teammateGrade').value;
  const ratingInputs = document.querySelectorAll('#reviewForm select');

  if (!teammateName || !publicFeedback || !privateFeedback || !grade) {
    Swal.fire({ icon: 'error', title: 'Incomplete', text: 'Please complete all required fields.' });
    return;
  }

  const ratings = Array.from(ratingInputs).map((select) => ({
    question: select.previousElementSibling?.textContent || 'Rating',
    value: select.value,
  }));

  const reviewData = {
    teammateName,
    publicFeedback,
    privateFeedback,
    grade,
    ratings,
  };

  try {
    const response = await fetch('http://localhost:8000/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData),
    });

    if (response.ok) {
      Swal.fire({ icon: 'success', title: 'Review Submitted', showConfirmButton: false, timer: 1500 });
      document.getElementById('reviewForm').reset();
    } else {
      const data = await response.json();
      Swal.fire({ icon: 'error', title: 'Error', text: data.error || 'Failed to submit review.' });
    }
  } catch (error) {
    console.error('Error:', error);
    Swal.fire({ icon: 'error', title: 'Connection Error', text: 'Could not connect to the server.' });
  }
});

// Show appropriate section
function showSection(section) {
  ['registerSection', 'loginSection', 'dashboardSection'].forEach(id => {
    const el = document.getElementById(id);
    el.classList.add('hidden');
    el.classList.remove('section-active');
  });
  const sectionEl = document.getElementById(section + 'Section');
  sectionEl.classList.remove('hidden');
  sectionEl.classList.add('section-active');
}

// Initialize the page
window.onload = function() {
  if (localStorage.getItem('studentLoggedIn')) {
    showSection('dashboard');
    
    // Display student name if available
    const storedStudent = JSON.parse(localStorage.getItem('student'));
    if (storedStudent) {
      document.getElementById('studentName').textContent = 
        `${storedStudent.firstName} ${storedStudent.lastName}`;
    }
  } else {
    showSection('register');
  }
};