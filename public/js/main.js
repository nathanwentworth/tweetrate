var usernameInput = document.getElementById('username')

usernameInput.addEventListener('keydown', loadUser, false)

function loadUser(e) {
  if (e.keyCode === 13) {
    // console.log(e.target.value)
    window.location.assign('/users/' + e.target.value)
  }
}
