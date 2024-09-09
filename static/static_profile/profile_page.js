// Function to create a memory element
function createMemory(memory) {
    const memoryElement = document.createElement('div');
    memoryElement.className = 'memory';

    const header = document.createElement('div');
    header.className = 'memory-header';
    header.innerHTML = `<h3>${memory.title}</h3>`;
    memoryElement.appendChild(header);

    const body = document.createElement('div');
    body.className = 'memory-body';
    
    const image = document.createElement('img');
    image.src = memory.image || '../static/uploads/default-memory-image.jpg';
    image.alt = memory.title;
    body.appendChild(image);

    const description = document.createElement('p');
    description.textContent = memory.description;
    body.appendChild(description);

    memoryElement.appendChild(body);

    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-button';
    editBtn.innerHTML = `
        <img src="../static/uploads/edit.png" alt="Edit">
        <span>Edit</span>
    `;
    buttonGroup.appendChild(editBtn);

    const shareBtn = document.createElement('button');
    shareBtn.className = 'share-button';
    shareBtn.innerHTML = `
        <img src="../static/uploads/share.png" alt="Share">
        <span>Share</span>
    `;
    buttonGroup.appendChild(shareBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-button';
    deleteBtn.innerHTML = `
        <img src="../static/uploads/bin.png" alt="Delete">
        <span>Delete</span>
    `;
    buttonGroup.appendChild(deleteBtn);

    memoryElement.appendChild(buttonGroup);

    return memoryElement;
}

async function editBio() {
    const bioStyle = document.querySelector('.profile-right');
    const newInfo = document.querySelector('.new-info');

    bioStyle.style.display = 'none';
    newInfo.style.display = 'flex';

    const saveBtn = document.getElementById('save-btn');
    saveBtn.addEventListener('click', async (event) => {
        event.preventDefault();

        const fullName = document.getElementById('fullName').value;
        const userBio = document.getElementById('userBioedit').value;
        const userName = document.getElementById('userName').value;

        if (userName.trim() === '') {
            console.log('Please enter your username');
            return;
        }

        try {
            const response = await fetch('/api/profile-update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullname: fullName,
                    userbio: userBio,
                    username: userName
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Success:', result);
        } catch (error) {
            console.error('Error sending bio data:', error);
            return;
        }

        document.getElementById('username').textContent = userName;
        document.getElementById('userBio').textContent = userBio;
        document.getElementById('userMemories').querySelector('h2')
          .textContent = fullName ? `${fullName} Memories` : 'Memories';;

        bioStyle.style.display = '';
        newInfo.style.display = 'none';
    });
}

document.addEventListener('DOMContentLoaded', function(event) {
    const userProfile = document.getElementById('userProfile');

    // Fetch user data
    fetch('/api/current-user')
    .then(response => response.json())
    .then(data => {
        console.log(data);
        const user = data;
        if (user) {
            const memoriesContainer = document.getElementById('memoriesContainer');

            const imageProfile = userProfile.querySelector('.profile-pic');
            imageProfile.src = user.image;

            // Update user profile information
            const username = document.getElementById('username');
            username.textContent = user.username;

            const userBio = document.getElementById('userBio');
            userBio.textContent = user.description || 'No bio available';

            const followerCount = document.getElementById('followerCount');
            followerCount.textContent = user.followerscount;

            const followingCount = document.getElementById('followingCount');
            followingCount.textContent = user.followingcount;

            document.getElementById('userMemories').querySelector('h2')
              .textContent = user.fullname ? `${user.fullname} Memories` : 'Memories';

            // Display memories
            if (Array.isArray(user.memories)) {
                user.memories.forEach(memory => {
                    const memoryElement = createMemory(memory);
                    memoriesContainer.appendChild(memoryElement);
                });
            }

            // Add event listeners to buttons
            document.querySelectorAll('.button-group button').forEach(btn => {
                btn.addEventListener('click', handleButtonClick);
            });

            function handleButtonClick(event) {
                const target = event.target;
                if (target.classList.contains('edit-button')) {
                    console.log('Edit clicked!');
                } else if (target.classList.contains('share-button')) {
                    console.log('Share clicked!');
                } else if (target.classList.contains('delete-button')) {
                    console.log('Delete clicked!');
                }
            }
        } else {
            console.error('Invalid user data received');
        }
    })
    .catch(
        error => console.error('Error fetching user data:', error)
    );

    const buttoneditbio = userProfile.querySelector('.edit-bio-btn');
    buttoneditbio.addEventListener('click', editBio);
});