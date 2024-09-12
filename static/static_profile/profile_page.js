async function createMemoryCard(memory, user) {
    const userMemories = document.getElementById('userMemories');
    userMemories.innerHTML = '';

    let imagesElements = [];
    const [
        memory_card_div,
        memory_header_div,
        memory_content_div,
        memory_footer_div
    ] = Array.from({ length: 4 }, () => document.createElement('div'));

    const images = Array.isArray(memory.image) ? memory.image : [];

    if (Array.isArray(images) && images.length !== 0) {
        imagesElements = images.map(imgUrl => `
            <div class="memory-image">
                <img src="${imgUrl}" alt="Memory Image" class="memory-image">
            </div>
        `).join('');
    }

    memory_card_div.className = 'memory-card';
    memory_card_div.id = memory['id'];

    memory_header_div.className = 'memory-header';

    const userResponse = await fetch(`/api/current-user`);
    const currentuser = await userResponse.json();
    const liked_list = currentuser['memories']['liked'];

    memory_header_div.innerHTML = `
        <a href="/profile-user/${user['id']}">
            <img src="${user['image']}" alt="Profile Image" class="profile-img">
        </a>
        <div class="user-info">
            <h3 class="username">${user['username']}</h3>
            <p class="memory-date">${memory['timestamp']}</p>
        </div>
    `;

    memory_card_div.appendChild(memory_header_div);

    memory_content_div.className = 'memory-content';
    memory_content_div.innerHTML = `
        <p>${memory['description']}</p>
        <div class="memory-images" style="${images.length === 0 ? 'display: none;' : ''}">
            ${imagesElements}
        </div>
    `;

    memory_card_div.appendChild(memory_content_div);

    let like_memory = liked_list.includes(memory['id']);

    memory_footer_div.className = 'memory-footer';
    memory_footer_div.innerHTML = `
        <button class="action-button like-button" style="${like_memory ? 'background-color: rgb(220, 53, 69);' : ''}">
            <i class="fas fa-heart"></i> ${memory['liked'] > 0 ? memory['liked'] : 'Like'}
        </button>
        <button class="action-button comment-button">
            <i class="fas fa-comment-dots"></i> Comment
        </button>
        <button class="action-button share-button">
            <i class="fas fa-share-alt"></i> Share
        </button>
    `;

    memory_card_div.appendChild(memory_footer_div);

    const comments = Array.isArray(memory['comments']) ? memory['comments'] : [];
    const commentsElements = await renderComments(comments);

    // Create and append the comment modal
    const comment_div = document.createElement('div');
    comment_div.className = 'comment_modal';
    comment_div.id = `commentsModal_${memory['id']}`;
    comment_div.innerHTML = `
        <div class="modal-content-comment">
            <span class="close-button-comment">&times;</span>
            <h2>Comments</h2>
            <input class="commentInput" id="commentInput_${memory['id']}" name="commentInput" placeholder="What's your Comment?">
            <div id="commentsList_${memory['id']}" class="comments-list">
                ${commentsElements}
            </div>
        </div>
    `;

    userMemories.appendChild(comment_div);

    // Share Modal Script
    const share_div = document.createElement('div');
    share_div.className = 'share_modal';
    share_div.id = `shareModal_${memory['id']}`;
    share_div.innerHTML = `
        <div class="modal-content-share">
            <span class="close-button-share">&times;</span>
            <h2>Share Memory</h2>
            <div class="share-options">
                <button class="social-share-button" data-platform="facebook">
                    <i class="fab fa-facebook"></i>
                </button>
                <button class="social-share-button" data-platform="twitter">
                    <i class="fab fa-twitter"></i>
                </button>
                <button class="social-share-button" data-platform="linkedin">
                    <i class="fab fa-linkedin"></i>
                </button>
            </div>
            <div class="share-link">
                <input id="shareLink_${memory['id']}" class="share-link-input" value="${window.location.origin}/memory/${memory['id']}" readonly>
                <button class="copy-button" id="copyButton_${memory['id']}">
                    <i class="fas fa-copy"></i> Copy Link
                </button>
            </div>
        </div>
    `;

    // Append the share modal to the section
    userMemories.appendChild(share_div);

    // Add event listeners
    await addLikeButtonListener(memory, like_memory, memory_card_div, memory_footer_div);
    await addCommentButtonListener(memory, memory_card_div, comment_div);
    await addShareButtonListener(memory, memory_card_div, share_div);

    userMemories.appendChild(memory_card_div);
}

async function addLikeButtonListener(memory, like_memory, memory_card_div, memory_footer_div) {
    const likeButton = memory_footer_div.querySelector('.like-button');
    likeButton.addEventListener('click', async function (event) {
        event.preventDefault();
        like_memory = !like_memory;
        likeButton.style.backgroundColor = like_memory ? 'rgb(220, 53, 69)' : '';
        memory['liked'] = like_memory ? memory['liked'] + 1 : memory['liked'] - 1;
        likeButton.innerHTML = `
            <i class="fas fa-heart"></i> ${memory['liked'] > 0 ? memory['liked'] : 'Like'}
        `;
        await updateLikeStatus(memory_card_div.id);
    });
}

async function addCommentButtonListener(memory, memory_card_div, comment_div) {
    const commentButton = memory_card_div.querySelector('.comment-button');
    commentButton.addEventListener('click', function (event) {
        event.preventDefault();
        const commentModal = document.getElementById(`commentsModal_${memory['id']}`);
        commentModal.style.display = 'block';
        commentButton.style.backgroundColor = 'rgb(40, 167, 69)';
    });

    window.addEventListener('click', (event) => {
        const commentModal = document.getElementById(`commentsModal_${memory['id']}`);
        if (event.target === commentModal) {
            commentModal.style.display = 'none';
            commentButton.style.backgroundColor = 'rgb(33, 33, 33)';
        }
    });

    const closeButton = comment_div.querySelector('.close-button-comment');
    closeButton.addEventListener('click', function() {
        const commentModal = document.getElementById(`commentsModal_${memory['id']}`);
        commentModal.style.display = 'none';
        commentButton.style.backgroundColor = 'rgb(33, 33, 33)';
    });
}

async function renderComments(comments) {
    const commentsElements = await Promise.all(comments.map(async (comment) => {
        const userData = await fetchUserData(comment['user_id']); // Fetch user data
        console.log(userData['image']);

        return `
            <div class="comment-item">
                <img class="commenter-img" src="${userData ? userData['image'] : ''}" alt="Commenter Image">
                <div class="comment-content">
                    <h5>${userData ? userData['username'] : 'Unknown User'}</h5>
                    <h6>${comment['timestamp']}</h6>
                    <p>${comment['comment']}</p>
                </div>
            </div>
        `;
    }));

    return commentsElements.join('');
}

async function addShareButtonListener(memory, memory_card_div, share_div) {
    const shareButton = memory_card_div.querySelector('.share-button');
    shareButton.addEventListener('click', function (event) {
        event.preventDefault();
        const shareModal = document.getElementById(`shareModal_${memory['id']}`);
        shareModal.style.display = 'block';
        shareButton.style.backgroundColor = 'rgb(0, 123, 255)';
    });

    // Close share modal
    const closeButtonShare = share_div.querySelector('.close-button-share');
    closeButtonShare.addEventListener('click', function() {
        const shareModal = document.getElementById(`shareModal_${memory['id']}`);
        shareModal.style.display = 'none';
        shareButton.style.backgroundColor = 'rgb(33, 33, 33)';
    });

    // Copy link to clipboard functionality
    const copyButton = document.getElementById(`copyButton_${memory['id']}`);
    copyButton.addEventListener('click', function() {
        const shareLinkInput = document.getElementById(`shareLink_${memory['id']}`);
        shareLinkInput.select();
        document.execCommand('copy');
        copyButton.innerHTML = 'Copied!';
        setTimeout(() => {
            copyButton.innerHTML = `<i class="fas fa-copy"></i> Copy Link`;
        }, 2000);
    });

    // Share buttons functionality
    const socialButtons = share_div.querySelectorAll('.social-share-button');
    socialButtons.forEach(button => {
        button.addEventListener('click', function() {
            const platform = this.getAttribute('data-platform');
            const shareLink = document.getElementById(`shareLink_${memory['id']}`).value;

            let shareUrl = '';
            if (platform === 'facebook') {
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`;
            } else if (platform === 'twitter') {
                shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}`;
            } else if (platform === 'linkedin') {
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`;
            }

            // Open the share link in a new window
            window.open(shareUrl, '_blank');
        });
    });

    window.addEventListener('click', (event) => {
        const shareModal = document.getElementById(`shareModal_${memory['id']}`);
        if (event.target === shareModal) {
            shareModal.style.display = 'none';
            shareButton.style.backgroundColor = 'rgb(33, 33, 33)';
        }
    });
}

async function updateLikeStatus(memoryId) {
    try {
        const response = await fetch(`/api/users/like/${memoryId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        const result = await response.json();
        if (!response.ok) {
            console.error('Error liking memory:', result.error);
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
}


// Function to create a memory element
// function createMemory(memory) {
//     const memoryElement = document.createElement('div');
//     memoryElement.className = 'memory';

//     const header = document.createElement('div');
//     header.className = 'memory-header';
//     header.innerHTML = `<h3>${memory.title}</h3>`;
//     memoryElement.appendChild(header);

//     const body = document.createElement('div');
//     body.className = 'memory-body';
    
//     const image = document.createElement('img');
//     image.src = memory.image || '../static/uploads/default-memory-image.jpg';
//     image.alt = memory.title;
//     body.appendChild(image);

//     const description = document.createElement('p');
//     description.textContent = memory.description;
//     body.appendChild(description);

//     memoryElement.appendChild(body);

//     const buttonGroup = document.createElement('div');
//     buttonGroup.className = 'button-group';
    
//     const editBtn = document.createElement('button');
//     editBtn.className = 'edit-button';
//     editBtn.innerHTML = `
//         <img src="../static/uploads/edit.png" alt="Edit">
//         <span>Edit</span>
//     `;
//     buttonGroup.appendChild(editBtn);

//     const shareBtn = document.createElement('button');
//     shareBtn.className = 'share-button';
//     shareBtn.innerHTML = `
//         <img src="../static/uploads/share.png" alt="Share">
//         <span>Share</span>
//     `;
//     buttonGroup.appendChild(shareBtn);

//     const deleteBtn = document.createElement('button');
//     deleteBtn.className = 'delete-button';
//     deleteBtn.innerHTML = `
//         <img src="../static/uploads/bin.png" alt="Delete">
//         <span>Delete</span>
//     `;
//     buttonGroup.appendChild(deleteBtn);

//     memoryElement.appendChild(buttonGroup);

//     return memoryElement;
// }

async function editBio(pastFullname, pastBio, pastUsername) {
    const bioStyle = document.querySelector('.profile-right');
    const newInfo = document.querySelector('.new-info');
    const fullNameEle = document.getElementById('fullName');
    const userBioEle = document.getElementById('userBioedit');
    const userNameEle = document.getElementById('userName');

    fullNameEle.value = pastFullname;
    userBioEle.textContent = pastBio;
    userNameEle.value = pastUsername;

    bioStyle.style.display = 'none';
    newInfo.style.display = 'flex';

    const saveBtn = document.getElementById('save-btn');
    saveBtn.addEventListener('click', async (event) => {
        event.preventDefault();

        const fullName = fullNameEle.value;
        const userBio = userBioEle.value;
        const userName = userNameEle.value;

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
            console.log('Success:', result.message);
        } catch (error) {
            console.error('Error sending bio data:', error);
            return;
        }

        document.getElementById('username').textContent = userName;
        document.getElementById('userBio').textContent = userBio;

        bioStyle.style.display = '';
        newInfo.style.display = 'none';
    });
}


async function changeImageProfile(userId) {
    const imageUploader = userProfile.querySelector('.image-uploader');
    const inputOverlay = userProfile.querySelector('.input-overlay input[type="file"]');
    const imageUpload = document.getElementById('image-upload');

    // Upload new image
    imageUpload.addEventListener('change', function(event) {
        const file = this.files[0];

        const formData = new FormData();
        formData.append('id', userId);
        formData.append('image', file);

        fetch('/upload-images', {
            method: 'PUT',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // Update the image
            imageUploader.querySelector('.profile-pic').src = `${data.imageUrl}`;
        })
        .catch(error => console.log('Error uploading image:', error));
    });
}


// JavaScript for Follow/Unfollow Toggle
async function toggleFollow(userId) {
    const followBtn = document.getElementById('followButton');
    const followercount = document.getElementById('followerCount');
    const followingcount = document.getElementById('followingCount');

    try {
        // First, fetch the current follow status (GET)
        const response = await fetch(`/api/follow/${userId}`);
        if (!response.ok) throw new Error('Failed to get follow status.');

        const result = await response.json();
        let isFollowing = result.is_following;

        // Update button text based on follow status
        followBtn.textContent = isFollowing ? 'Following' : 'Follow';
        followBtn.classList.toggle('following-button', isFollowing);

        // Add click event to toggle follow/unfollow (POST)
        followBtn.addEventListener('click', async () => {
            const postResponse = await fetch(`/api/follow/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!postResponse.ok) throw new Error('Failed to follow/unfollow.');

            const postResult = await postResponse.json();
            isFollowing = postResult.is_following;

            // Update button UI based on the new follow status
            followBtn.textContent = isFollowing ? 'Following' : 'Follow';
            followBtn.classList.toggle('following-button', isFollowing);
            if (followBtn.textContent == 'Following') {
                followercount.textContent = parseInt(followercount.textContent) + 1;
            } else {
                followercount.textContent = parseInt(followercount.textContent) - 1;
            }
        });
        followBtn.style.display = 'flex';
    } catch (error) {
        console.error('Error:', error);
    }
}


async function createProfile(user) {
    const userProfile = document.getElementById('userProfile');

    userProfile.innerHTML = `
        <div class="profile-container">
            <div class="profile-left">
                <div class="image-uploader">
                    <div class="image-container">
                        <img src="${user.image}" alt="User Image" class="profile-pic">
                        <img src="../static/uploads/edit.png" alt="Edit Icon" class="edit-icon">
                    </div>
                    <div class="input-overlay">
                        <input type="file" id="image-upload" name="profile_picture" accept="image/*">
                    </div>
                </div>
                <button class="edit-bio-btn" id="ButtonBioedit">Edit Bio</button>
                <button id="followButton" class="follow-button">Follow</button>
            </div>
            <div class="new-info">
                <label for="fullName">Full Name:</label>
                <input type="text" id="fullName" placeholder="Full Name">
                <label for="userName">Username:</label>
                <input type="text" id="userName" placeholder="Username">
                <label for="userBioedit">Bio:</label>
                <textarea id="userBioedit" placeholder="Bio">${user.description}</textarea>
                <button class="save-btn" id="save-btn" type="button">Save Data</button>
            </div>
            <div class="profile-right">
                <h1 id="username">${user.username}</h1>
                <div class="bio">
                    <p id="userBio">${user.description}</p>
                </div>
                <div class="follower-following-info">
                    <p><strong>Followers:</strong> <span id="followerCount">${user.followerscount}</span></p>
                    <p><strong>Following:</strong> <span id="followingCount">${user.followingcount}</span></p>
                </div>
            </div>
        </div>
    `;
    userProfile.querySelector('#fullName').value = user['fullname'];
    userProfile.querySelector('#userName').value = user['username'];
}


document.addEventListener('DOMContentLoaded', async function(event) {
    const userProfile = document.getElementById('userProfile');

    let user = {};

    // Fetch current user data
    const currentUserResponse = await fetch('/api/current-user');
    if (!currentUserResponse.ok) {
        throw new Error(`HTTP error! status: ${currentUserResponse.status}`);
    }
    user = await currentUserResponse.json();

    const currentUrl = window.location.href;
    const list_url = currentUrl.split('/');
    let userId = list_url[list_url.length - 1];

    if (user.id === parseInt(userId) || userId === 'profile-user') {
        console.log(user);
        await createProfile(user);

        const buttoneditbio = userProfile.querySelector('.edit-bio-btn');
        buttoneditbio.addEventListener('click', async() => {
            await editBio(
                user.fullname, user.description, user.username
            );
        });

        await changeImageProfile(user.id);
    } else if (user.id !== parseInt(userId)) {
        const response = await fetch(`/api/users/${userId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        user = await response.json();
        console.log(user);

        await createProfile(user);
        userProfile.querySelector('.input-overlay').style.display = 'none';
        userProfile.querySelector('.image-container')
            .querySelector('.edit-icon').style.display = 'none';
        userProfile.querySelector('#ButtonBioedit').style.display = 'none';
        await toggleFollow(user.id);
    } else {
        console.log('Invalid user ID provided');
    }

    const response = await fetch(`/api/memory/user/${user.id}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const memories = await response.json();
    await memories.forEach(memory => {
        createMemoryCard(memory, user);
    });
    // if (userId == 'profile-user' || userId === currentUser.id) {
    //     // Fetch user data
    //     user = currentUser;
    //     console.log(user);

    //     if (user) {
    //         await createProfile(user);
    //         // // Change image profile
    //         // imageProfile.src = user ? user.image : '../uploads/usericon.png';
    //         // username.textContent = user.username;
    //         // userBio.textContent = user.description || 'No bio available';
    //         // followerCount.textContent = user.followerscount;
    //         // followingCount.textContent = user.followingcount;
    //         // document.getElementById('userMemories').querySelector('h2')
    //         // .textContent = user.fullname ? `${user.fullname} Memories` : 'Memories';

    //         // Display memories
    //         if (Array.isArray(user.memories)) {
    //             user.memories.forEach(memory => {
    //                 const memoryElement = createMemory(memory);
    //                 memoriesContainer.appendChild(memoryElement);
    //             });
    //         }

    //         // Add event listeners to buttons
    //         document.querySelectorAll('.button-group button').forEach(btn => {
    //             btn.addEventListener('click', handleButtonClick);
    //         });

    //         function handleButtonClick(event) {
    //             const target = event.target;
    //             if (target.classList.contains('edit-button')) {
    //                 console.log('Edit clicked!');
    //             } else if (target.classList.contains('share-button')) {
    //                 console.log('Share clicked!');
    //             } else if (target.classList.contains('delete-button')) {
    //                 console.log('Delete clicked!');
    //             }
    //         }
    //     } else {
    //         console.error('Invalid user data received');
    //     }

    //     const buttoneditbio = userProfile.querySelector('.edit-bio-btn');
    //     buttoneditbio.addEventListener('click', () => {
    //         editBio(user.fullname, user.description, user.username)
    //     });

    //     changeImageProfile();
    // } else if (Number.isInteger(userId)) {
    //     const response = await fetch(`/api/users/${userId}`);
    //     if (!response.ok) {
    //         throw new Error(`HTTP error! status: ${response.status}`);
    //     }

    //     user = await response.json();
    //     if (user) {
    //         // Display memories
    //         console.log('User data:', user);
            
    //         imageProfile.src = user ? user.image : '../uploads/usericon.png';
    //         username.textContent = user.username;
    //         userBio.textContent = user.description || 'No bio available';
    //         followerCount.textContent = user.followerscount;
    //         followingCount.textContent = user.followingcount;
    //         document.getElementById('userMemories').querySelector('h2')
    //           .textContent = user.fullname ? `${user.fullname} Memories` : 'Memories';

    //         // // toggle visibility
    //         const editIcon = document.querySelector('.edit-icon');
    //         const inputOverlay = document.querySelector('.input-overlay');
    //         const newInfo = document.querySelector('.new-info');
    //         const ButtonBioedit = document.getElementById('ButtonBioedit');

    //         editIcon.style.display = editIcon.style.display === 'none' ? '' : 'none';
    //         inputOverlay.style.display = inputOverlay.style.display === 'none' ? '' : 'none';
    //         newInfo.style.display = newInfo.style.display === 'none' ? 'flex' : 'none';
    //         ButtonBioedit.style.display = 'none';
    //         // ButtonBioedit.className = 'followButton';
    //         // ButtonBioedit.textContent = user.following ? 'Following' : 'Follow';

    //         // Call the toggleFollow function to set up the follow/unfollow button
    //         await toggleFollow(user.id);
    //     }
    // } else {
    //     console.log('Invalid user ID provided');
    // }
});
