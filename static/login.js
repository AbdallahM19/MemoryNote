let loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', function (event) {
    event.preventDefault();

    var usernameOremailValue = document.getElementById('username').value;
    var passwordValue = document.getElementById('password').value;

    var dataToSend = {
        "username": usernameOremailValue,
        "password": passwordValue,
    };

    fetch(`/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(dataToSend)
    })
    .then(response => response.json())
    .then(data => {
        if (data['message'] == 'Login successful') {
            window.location.href = '/';
        } else {
            document.getElementById('error').textContent = data.message;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('error').textContent = 'An error occurred';
    });

    // console.log(usernameOremailValue, passwordValue);
});