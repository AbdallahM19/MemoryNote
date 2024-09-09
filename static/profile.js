// Modal for Profile
const profileModal = document.getElementById('profileModal');
const profileButton = document.querySelector('.profile-button');
const closeButton = profileModal.querySelector('.close-button');
const editButton = profileModal.querySelector('.edit-button');
const saveButton = profileModal.querySelector('.save-button');
let image_value = '';
let image_path = '';

profileButton.addEventListener('click', (event) => {
    event.preventDefault();

    fetch('/api/profile', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        image_value = data.image;
        profileModal.querySelector('.profile-image').src = data.image;
        profileModal.querySelector('.full-name').textContent = data.fullName;
        profileModal.querySelector('.username').textContent = data.username;
        profileModal.querySelector('.email').textContent = data.email;
        profileModal.style.display = 'block';
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

closeButton.addEventListener('click', () => {
    profileModal.style.display = 'none';
    profileModal.querySelector('.profile-view').style.display = 'block';
    profileModal.querySelector('.profile-edit').style.display = 'none';
});

editButton.addEventListener('click', () => {
    profileModal.querySelector('.profile-view').style.display = 'none';
    profileModal.querySelector('.profile-edit').style.display = 'block';
    profileModal.querySelector('.edit-profile-image').src = image_value;
});

const photo_profile = document.getElementById('profileImageInput').querySelector('.edit-profile-image');

profileImageInput.addEventListener('change', () => {
    if (profileImageInput.files.length > 0) {
        const formData = new FormData();
        formData.append('images', profileImageInput.files[0]);
        fetch('/upload-images', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            image_path = data.imagePaths[0];
            profileModal.querySelector('.edit-profile-image').src = image_path;
        })
        .catch(error => {
            console.error('Error uploading images:', error);
        });
    }
});

saveButton.addEventListener('click', () => {
    const updatedProfile = {
        fullname: document.getElementById('editFullName').value,
        username: document.getElementById('editUsername').value,
        email: document.getElementById('editEmail').value,
        password: document.getElementById('editPassword').value,
        image: image_path || image_value,
    };

    // Assuming you have an API endpoint to update profile
    fetch('/api/profile', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProfile),
    })
    .then(response => response.json())
    .then(data => {
        profileModal.querySelector('.profile-image').src = image_path;
        profileModal.querySelector('.full-name').textContent = data.fullName;
        profileModal.querySelector('.username').textContent = data.username;
        profileModal.querySelector('.email').textContent = data.email;
        profileModal.querySelector('.profile-view').style.display = 'block';
        profileModal.querySelector('.profile-edit').style.display = 'none';
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

window.addEventListener('click', (event) => {
    if (event.target === profileModal) {
        profileModal.style.display = 'none';
        profileModal.querySelector('.profile-view').style.display = 'block';
        profileModal.querySelector('.profile-edit').style.display = 'none';
    }
});