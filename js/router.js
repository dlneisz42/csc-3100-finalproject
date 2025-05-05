
function navigateTo(view) {
  fetch(`html/${view}`)
    .then(response => response.text())
    .then(html => {
      document.getElementById('app').innerHTML = html;
    })
    .catch(err => console.error('Error loading view:', err));
}

window.addEventListener('DOMContentLoaded', () => {
  // Load default view or keep empty
});
