import { createEditModal } from "./edit_post.js";


export async function createMemoryCard(memory, user) {
    const userMemories = document.getElementById('userMemories');
    // userMemories.innerHTML = '';

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
    const current_user = await userResponse.json();
    const liked_list = current_user['memories']['liked'];

    memory_header_div.innerHTML = `
        <div class="header-left">
            <a href="/profile-user/${user['id']}">
                <img src="${user['image']}" alt="Profile Image" class="profile-img">
            </a>
            <div class="user-info">
                <h3 class="username">${user['username']}</h3>
                <p class="memory-date">${memory['timestamp']}</p>
            </div>
        </div>
        <div class="dropdown-container">
            <button class="dropdown-toggle"><i class="fas fa-ellipsis-v"></i></button>
            <div class="dropdown-menu">
                ${ current_user['id'] === memory['user_id']
                    ? `
                        <button class="edit-memory">Edit</button>
                        <button class="delete-memory">Delete</button>
                        <button class="report-memory">Report</button>
                    `
                    : `
                        <button class="follow-memory">Follow</button>
                        <button class="report-memory">Report</button>
                    `
                }
            </div>
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

    const comments = await getcommentmemory(memory['id']);
    const commentbody = comments ? await renderComments(comments) : "";

    // Create and append the comment modal
    const comment_div = document.createElement('div');
    comment_div.className = 'comment_modal';
    comment_div.id = `commentsModal_${memory['id']}`;
    comment_div.innerHTML = `
                <div class="modal-content-comment">
                    <span class="close-button-comment">&times;</span>
                    <h2>Comments</h2>
                    <div class="input-container">
                        <input class="commentInput" id="commentInput_${memory['id']}" name="commentInput" placeholder="What's your Comment?">
                        <button id="postCommentButton_${memory['id']}" class="post-comment-btn">Post</button>
                    </div>
                    <div id="commentsList_${memory['id']}" class="comments-list">
                        ${commentbody === "" ? '<p>No comments yet!</p>' : commentbody}
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
    await addCommentButtonListener(memory, memory_card_div, comment_div, current_user);
    await addShareButtonListener(memory, memory_card_div, share_div);
    await addActionTodropdownToggle(memory, memory_header_div, memory_card_div);

    userMemories.appendChild(memory_card_div);
}

export async function addLikeButtonListener(memory, like_memory, memory_card_div, memory_footer_div) {
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

export async function addCommentButtonListener(memory, memory_card_div, comment_div, current_user) {
    const commentButton = memory_card_div.querySelector('.comment-button');
    commentButton.addEventListener('click', function (event) {
        event.preventDefault();
        const commentModal = document.getElementById(`commentsModal_${memory['id']}`);
        commentModal.style.display = 'block';
        commentButton.style.backgroundColor = 'rgb(40, 167, 69)';
        // Add event listeners
        comment_div.addEventListener('click', async (event) => {
            if (event.target.classList.contains('dropdown-btn')) {
                const dropdownContent = event.target.nextElementSibling;
                document.querySelectorAll('.dropdown-content').forEach(content => {
                    if (content !== dropdownContent) {
                        content.style.display = 'none';
                    }
                });
                dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
            }

            // Handle edit button click
            if (event.target.classList.contains('edit-comment')) {
                const commentId = event.target.getAttribute('data-id');
                const comment_div_edit = comment_div.querySelector(`.edit-comment-${commentId}`);
                const commentItem = comment_div_edit.parentElement;
                
                // Hide original comment content and options
                const commentContent = commentItem.querySelector('.comment-content');
                const commentText = commentContent.querySelector('p').textContent;
                commentContent.style.display = 'none';
                commentItem.querySelector('.comment-options').style.display = 'none';

                // Show the edit textarea and save button
                comment_div_edit.style.display = 'flex';
                comment_div_edit.innerHTML = `
                    <h5>${commentContent.querySelector('h5').textContent}</h5>
                    <textarea class="edit-comment-input">${commentText}</textarea>
                    <button class="save-comment-btn" data-id="${commentId}">Save</button>
                    <button class="cancel-edit-btn" data-id="${commentId}">Cancel</button>
                `;

                // Handle save button click
                const saveButton = comment_div_edit.querySelector('.save-comment-btn');
                saveButton.addEventListener('click', async () => {
                    const newCommentText = comment_div_edit.querySelector('.edit-comment-input').value;
                    
                    try {
                        // Send updated comment to the server
                        const response = await fetch(`/api/comments/${commentId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ comment: newCommentText })
                        });

                        if (response.ok) {
                            // Update comment content in the DOM
                            commentContent.querySelector('p').textContent = newCommentText;

                            // Restore the original view
                            commentContent.style.display = 'block';
                            commentItem.querySelector('.comment-options').style.display = 'block';
                            comment_div_edit.style.display = 'none';
                        } else {
                            console.error('Failed to update comment:', await response.json());
                        }
                    } catch (error) {
                        console.error('Error updating comment:', error);
                    }
                });

                // Handle cancel button click
                const cancelButton = comment_div_edit.querySelector('.cancel-edit-btn');
                cancelButton.addEventListener('click', () => {
                    // Restore original view without making changes
                    commentContent.style.display = 'block';
                    commentItem.querySelector('.comment-options').style.display = 'block';
                    comment_div_edit.style.display = 'none';
                });
            }

            if (event.target.classList.contains('delete-comment')) {
                const commentId = event.target.getAttribute('data-id');
                // Add delete logic here
                const commentElement = comment_div.querySelector(`[id="comment_${commentId}"]`);
                console.log(commentElement);
                if (commentElement) {
                    commentElement.remove();
                    
                    // Optionally, send a request to the server to mark the comment as deleted
                    fetch(`/api/comments/${commentId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        // No body needed for DELETE requests
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('Comment successfully deleted:', data['message']);
                    })
                    .catch(error => {
                        console.error('Error deleting comment:', error);
                    });
                } else {
                    console.error('Comment element not found');
                }
            }

            if (event.target.classList.contains('report-comment')) {
                const commentId = event.target.getAttribute('data-id');
                // Add report logic here
                console.log(`Report ID: ${commentId}`);
            }
        });
    });

    const postCommentButton = document.getElementById(`postCommentButton_${memory['id']}`);
    postCommentButton.addEventListener('click', async function (event) {
        event.preventDefault();

        const commentInput = document.getElementById(`commentInput_${memory['id']}`).value;
    
        if (commentInput.trim() === '') {
            alert('Please enter a comment before posting.');
            return;
        }

        let newComment = '';
        // Optionally, you can send the new comment to the server
        try {
            const response = await fetch(`/api/comments/memory/${memory['id']}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    comment: commentInput
                })
            });

            newComment = await response.json();

            if (!response.ok) {
                console.error('Error posting comment:', newComment.error);
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }

        // Add new comment to the comments list
        const newCommentElement = `
            <div class="comment-item">
                <img class="commenter-img" src="${current_user['image']}" alt="Commenter Image">
                <div class="comment-content">
                    <h5>${current_user['username']}</h5>
                    <h6>${newComment.timestamp}</h6>
                    <p>${newComment.comment}</p>
                </div>
                <div class="comment-options">
                    <button class="dropdown-btn">⋮</button>
                    <div class="dropdown-content">
                        <button class="edit-comment">Edit</button>
                        <button class="delete-comment">Delete</button>
                        <button class="report-comment">Report</button>
                    </div>
                </div>
            </div>
        `;

        const commentsList = document.getElementById(`commentsList_${memory['id']}`);
        commentsList.insertAdjacentHTML('beforeend', newCommentElement);

        // Clear the input field after posting
        document.getElementById(`commentInput_${memory['id']}`).value = '';
    });

    window.addEventListener('click', (event) => {
        const commentModal = document.getElementById(`commentsModal_${memory['id']}`);
        if (event.target === commentModal) {
            commentModal.style.display = 'none';
            commentButton.style.backgroundColor = '';
        }
    });

    const closeButton = comment_div.querySelector('.close-button-comment');
    closeButton.addEventListener('click', function() {
        const commentModal = document.getElementById(`commentsModal_${memory['id']}`);
        commentModal.style.display = 'none';
        commentButton.style.backgroundColor = '';
    });
}

export async function renderComments(comments) {
    const commentbody = await Promise.all(comments.map(async (comment) => {
        const userData = await fetchUserData(comment['user_id']);
        return `
            <div class="comment-item" id="comment_${comment['comment_id']}">
                <a href="/profile-user/${userData.id}">
                    <img class="commenter-img" src="${userData ? userData['image'] : ''}" alt="Commenter Image">
                </a>
                <div class="comment-content">
                    <h5>${userData ? userData['username'] : 'Unknown User'}</h5>
                    <h6>${comment['timestamp']}</h6>
                    <p>${comment['comment']}</p>
                </div>
                <div class="edit-comment-${comment['comment_id']}" id="edit-comment">
                </div>
                <div class="comment-options">
                    <button class="dropdown-btn">⋮</button>
                    <div class="dropdown-content">
                        <button class="edit-comment" data-id="${comment['comment_id']}">Edit</button>
                        <button class="delete-comment" data-id="${comment['comment_id']}">Delete</button>
                        <button class="report-comment" data-id="${comment['comment_id']}">Report</button>
                    </div>
                </div>
            </div>
        `;
    }));

    return commentbody.join('');
}

// export async function renderComments(comments) {
//     const commentsElements = await Promise.all(comments.map(async (comment) => {
//         const userData = await fetchUserData(comment['user_id']); // Fetch user data
//         console.log(userData['image']);

//         return `
//             <div class="comment-item">
//                 <img class="commenter-img" src="${userData ? userData['image'] : ''}" alt="Commenter Image">
//                 <div class="comment-content">
//                     <h5>${userData ? userData['username'] : 'Unknown User'}</h5>
//                     <h6>${comment['timestamp']}</h6>
//                     <p>${comment['comment']}</p>
//                 </div>
//             </div>
//         `;
//     }));

//     return commentsElements.join('');
// }

export async function fetchUserData(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`);
        const userData = await response.json();
        return userData;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null; // Handle error case
    }
}

export async function addShareButtonListener(memory, memory_card_div, share_div) {
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
        shareButton.style.backgroundColor = '';
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
            shareButton.style.backgroundColor = '';
        }
    });
}

export async function updateLikeStatus(memoryId) {
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



export async function addActionTodropdownToggle (memory, memory_header_div, memory_card_div) {
    // Dropdown functionality
    const dropdownToggle = memory_header_div.querySelector('.dropdown-toggle');
    const dropdownMenu = memory_header_div.querySelector('.dropdown-menu');

    dropdownToggle.addEventListener('click', function(event) {
        event.stopPropagation();
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', function() {
        dropdownMenu.style.display = 'none';
    });

    // Edit memory functionality
    const editMemoryButton = memory_header_div.querySelector('.edit-memory');
    if (editMemoryButton) {
        editMemoryButton.addEventListener('click', function (event) {
            event.preventDefault();

            const editModal = createEditModal(memory);
            document.body.appendChild(editModal);
            editModal.style.display = 'block';
        });
    }

    // Delete memory functionality
    const deleteMemoryButton = memory_header_div.querySelector('.delete-memory');
    if (deleteMemoryButton) {
        deleteMemoryButton.addEventListener('click', async function(event) {
            event.preventDefault();

            console.log('Delete memory:', memory['id']);
            try {
                const response = await fetch(`/api/edit-memory/${memory['id']}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                const result = await response.json();

                if (response.ok) {
                    memory_card_div.remove();
                } else {
                    console.error('Error deleting memory:', result.error);
                }
            } catch (error) {
                console.error('An error occurred:', error);
            }
        });
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

export async function editBio(pastFullname, pastBio, pastUsername) {
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


export async function changeImageProfile(userId) {
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
export async function toggleFollow(userId) {
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


export async function createProfile(user) {
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

export async function getcommentmemory(memory_id) {
    const response = await fetch(`/api/comments/memory/${memory_id}`);
    return await response.json();
}

export async function editComment(comment_id) {
    const originalContent = document.getElementById(`comment_${comment_id}`).querySelector('.comment-content p').textContent;
    
    // Open modal for editing
    const editModal = document.createElement('div');
    editModal.className = 'edit-modal';
    editModal.innerHTML = `
        <div class="modal-content-edit">
            <span class="close-button">&times;</span>
            <input type="text" id="editInput_${comment_id}" value="${originalContent}">
            <button id="saveEditButton_${comment_id}">Save Edit</button>
        </div>
    `;
    
    document.body.appendChild(editModal);

    // Add event listener to close button
    editModal.querySelector('.close-button').addEventListener('click', () => {
        document.body.removeChild(editModal);
    });

    // Add event listener to save button
    editModal.querySelector('#saveEditButton_' + comment_id).addEventListener('click', async () => {
        const editedContent = editModal.querySelector('#editInput_' + comment_id).value.trim();

        if (editedContent === '') {
            alert('Please enter a comment before saving.');
            return;
        }

        try {
            const response = await fetch(`/api/comments/${comment_id}/edit`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    id: comment_id,
                    comment: editedContent
                })
            });

            const updatedComment = await response.json();

            if (!response.ok) {
                console.error('Error updating comment:', updatedComment.error);
            } else {
                document.getElementById(`comment_${comment_id}`).querySelector('.comment-content p').textContent = editedContent;
                document.body.removeChild(editModal);
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
    });
}

export async function deleteComment(event) {
    const button = event.target;
    const commentId = button.dataset.id;

    if (confirm('Are you sure you want to delete this comment?')) {
        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    id: commentId
                })
            });

            const deletedComment = await response.json();

            if (!response.ok) {
                console.error('Error deleting comment:', deletedComment.error);
            } else {
                document.getElementById(`comment_${commentId}`).remove();
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
    }
}
