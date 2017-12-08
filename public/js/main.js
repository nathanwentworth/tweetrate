var usernameInput = document.getElementById('username')

usernameInput.addEventListener('keydown', loadUser, false)

function loadUser(e) {
  if (e.keyCode === 13) {
    window.location.assign('/users/' + e.target.value)
  }
}
