document.addEventListener('DOMContentLoaded', function () {
    let registerForm = document.getElementById('registerForm');
    let errored = document.getElementById('error');
    let passwordChecker = document.getElementById('password');
    let confirmPassword = document.getElementById('confirmPassword');
    let borders = document.querySelectorAll(".border");
    let day = document.getElementById("day");
    let month = document.getElementById("month");
    let year = document.getElementById("year");
    let currentDate = new Date();


    registerForm.addEventListener('submit', function (event) {
        event.preventDefault();

        let dayValue = parseInt(day.value);
        let monthValue = parseInt(month.value);
        let yearValue = parseInt(year.value);

        if (dayValue <= 0 || dayValue > 31) {
            errored.textContent = `1 Day => 31 Day Not (${day.value})`;
            return
        } else if (monthValue < 1 || monthValue > 12) {
            errored.textContent = `1 Month => 12 Month Not (${month.value})`;
            return
        } else if (yearValue < 1900 || yearValue > currentDate.getFullYear() - 5) {
            errored.textContent = `1900 Year => ${currentDate.getFullYear() - 5} Year`;
            return
        }

        let dataToSend = {
            "fullname": document.getElementById("fullName").value,
            "username": document.getElementById("username").value,
            "email": document.getElementById("email").value,
            "dob": `${yearValue}-${monthValue}-${dayValue}`,
            "password": document.getElementById("password").value,
            "confirmpass": document.getElementById("confirmPassword").value,
        };

        let regex = /^([a-z]+)((([a-z]+)|(_[a-z]+))?(([0-9]+)|(_[0-9]+))?)*@([a-z]+).([a-z]+)$/ig;
        let validEmail = dataToSend["email"].match(regex);

        if (validEmail == null || validEmail.length != 1 || validEmail[0] != dataToSend["email"]) {
            console.log("Invalid email");
            errored.textContent = "Invalid email";
            return;
        }

        if (dataToSend.password != dataToSend.confirmpass) {
            console.log("Invalid password");
            errored.textContent = "Invalid confirm password";
            return;
        }

        fetch(`/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(dataToSend)
        })
        .then(response => response.json())
        .then(data => {
            if (data['message'] == 'Register successful') {
                window.location.href = '/';
            } else {
                errored.textContent = data.message;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            errored.textContent = 'An error occurred';
        });

        // console.log(usernameOremailValue, passwordValue);
    });

    function moveToNext(inputField) {
        var nextSibling = inputField.nextElementSibling;
        if (nextSibling && nextSibling.tagName === 'INPUT') {
            nextSibling.focus();
        } else if (inputField.id === 'year') {
            document.getElementById("username").focus();
        }
    }

    day.addEventListener('input', function() {
        let selectedDay = day.value;
        let valueDay = parseInt(selectedDay);
        if (valueDay >= 0 && valueDay <= 31) {
            if ((valueDay >= 4) || (valueDay <= 9 && valueDay != 0 && selectedDay.length === 2)) {
                moveToNext(this);
            }
        }
    });

    month.addEventListener('input', function() {
        let selectedMonth = month.value;
        let valueMonth = parseInt(selectedMonth);
        if (valueMonth >= 0 && valueMonth <= 12) {
            if ((valueMonth >= 1 && selectedMonth.length === 2) || (valueMonth >= 2)) {
                moveToNext(this);
            }
        }
    });

    year.addEventListener('input', function() {
        let selectedYear = parseInt(year.value);
        if (selectedYear >= 1900 && selectedYear <= (currentDate.getFullYear()) - 5) {
            moveToNext(this);
        }
    });

    passwordChecker.addEventListener('input', function () {
        const passwordValue = passwordChecker.value;
        const veryWeak = /^([a-z]|[A-Z]|[0-9]){1,3}$/;
        const regexWeak = /^([a-zA-Z]|[A-Z0-9]|[a-z0-9]){4,6}$/;
        const regexMedium = /^[a-zA-Z0-9]{7,10}$/;
        const regexStrong = /^[a-zA-Z0-9!@#$%^&*_]{8,12}$/;
        const veryStrong = /^[a-zA-Z0-9.%$#@!&*_ ]{12,}$/;

        if (passwordValue) {
            if (veryWeak.test(passwordValue)) {
                borders[0].style.backgroundColor = 'rgb(255, 100, 92)';
                borders[1].style.backgroundColor = 'rgb(133, 133, 133)';
                borders[2].style.backgroundColor = 'rgb(133, 133, 133)';
                borders[3].style.backgroundColor = 'rgb(133, 133, 133)';
            } else if (regexWeak.test(passwordValue)) {
                borders[0].style.backgroundColor = 'orange';
                borders[1].style.backgroundColor = 'orange';
                borders[2].style.backgroundColor = 'rgb(133, 133, 133)';
                borders[3].style.backgroundColor = 'rgb(133, 133, 133)';
            } else if (regexMedium.test(passwordValue)) {
                borders[0].style.backgroundColor = 'yellow';
                borders[1].style.backgroundColor = 'yellow';
                borders[2].style.backgroundColor = 'yellow';
                borders[3].style.backgroundColor = 'rgb(133, 133, 133)';
            } else if (regexStrong.test(passwordValue)) {
                borders[0].style.backgroundColor = 'lightgreen';
                borders[1].style.backgroundColor = 'lightgreen';
                borders[2].style.backgroundColor = 'lightgreen';
                borders[3].style.backgroundColor = 'lightgreen';
            } else if (veryStrong.test(passwordValue)) {
                borders[0].style.backgroundColor = 'green';
                borders[1].style.backgroundColor = 'green';
                borders[2].style.backgroundColor = 'green';
                borders[3].style.backgroundColor = 'green';
            }
        } else {
            borders.forEach(border => border.style.backgroundColor = 'rgb(133, 133, 133)');
        }
    });

    confirmPassword.addEventListener('input', function () {
        let confirmPasswordValue = confirmPassword.value;
        let bordercon = document.querySelector('.bordercon');

        if (confirmPasswordValue === passwordChecker.value && confirmPasswordValue){
            bordercon.style.backgroundColor = 'green';
        } else if (confirmPasswordValue !== passwordChecker.value && confirmPasswordValue) {
            bordercon.style.backgroundColor = 'red';
        } else {
            bordercon.style.backgroundColor = 'rgb(133, 133, 133)';
        }
    });
});