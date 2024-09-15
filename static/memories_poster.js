
        document.addEventListener('DOMContentLoaded', async (event) => {
            event.preventDefault();

            const body = document.querySelector('body');
            const script = document.querySelector('script');
            const section = document.createElement('section');

            section.className = 'memories_container';
            body.insertBefore(section, script);

            try {
                const response = await fetch('/api/get-memories', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    }
                });

                const data = await response.json();

                for (const memory of data) {
                    const [
                        memory_card_div,
                        memory_header_div,
                        memory_content_div,
                        memory_footer_div
                    ] = Array.from({length: 4}, () => document.createElement('div'));

                    const images = Array.isArray(memory.image) ? memory.image : [];
                    const imagesElements = images.map(imgUrl => `
                        <div class="memory-image">
                            <img src="${imgUrl}" alt="Memory Image" class="memory-image">
                        </div>
                    `).join('');

                    memory_card_div.className = 'memory-card';
                    memory_card_div.id = memory['id'];

                    memory_header_div.className = 'memory-header';

                    // Fetch user data synchronously using async/await
                    const userResponse = await fetch(`/api/users/${memory['user_id']}/`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                        }
                    });

                    const currentUserResponse = await fetch(`/api/current-user`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                        }
                    });

                    const user = await userResponse.json();
                    const current_user = await currentUserResponse.json();
                    const liked_list = current_user['memories']['liked'];

                    memory_header_div.innerHTML = `
                    <div class="header-left">
                        <img src="${user['image']}" alt="Profile Image" class="profile-img">
                        <div class="user-info">
                            <h3 class="username">${user['username']}</h3>
                            <p class="memory-date">${memory['timestamp']}</p>
                        </div>
                    </div>
                    <div class="dropdown-container">
                        <button class="dropdown-toggle"><i class="fas fa-ellipsis-v"></i></button>
                        <div class="dropdown-menu">
                            <button class="edit-memory">Edit</button>
                            <button class="delete-memory">Delete</button>
                            <button class="follow-memory">Follow</button>
                            <button class="report-memory">Report</button>
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

                    const likeButton = memory_footer_div.querySelector('.like-button');
                    likeButton.addEventListener('click', async function(event) {
                        event.preventDefault();

                        // Update like_memory state and button appearance
                        like_memory = !like_memory;
                        likeButton.style.backgroundColor = like_memory ? 'rgb(220, 53, 69)' : '';

                        // Update likes count based on like_memory state
                        memory['liked'] = like_memory ? memory['liked'] + 1 : memory['liked'] - 1;
                        likeButton.innerHTML = `
                            <i class="fas fa-heart"></i> ${memory['liked'] > 0 ? memory['liked'] : 'Like'}
                        `;
                        // Handle the like button click event here
                        try {
                            const response = await fetch(`/api/users/like/${memory_card_div.id}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            });

                            const result = await response.json();

                            if (!response.ok && result.message !== 'true') {
                                console.error('Error liking memory:', result.error);
                            }
                        } catch (error) {
                            console.error('An error occurred:', error);
                        }
                    });

                    async function renderComments(comments) {
                        const commentsElements = await Promise.all(comments.map(async (comment) => {
                            const userData = await fetchUserData(comment['user_id']); // Fetch user data
                            
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

                    // Usage
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

                    section.appendChild(comment_div);

                    const commentButton = memory_card_div.querySelector('.comment-button');
                    commentButton.addEventListener('click', async function(event) {
                        event.preventDefault();
                        // Open the comment modal specific to this memory
                        const commentModal = document.getElementById(`commentsModal_${memory['id']}`);
                        commentModal.style.display = 'block';
                        commentButton.style.backgroundColor = 'rgb(40, 167, 69)';
                    });

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
                                <div class="share-link">
                                <input id="shareLink_${memory['id']}" class="share-link-input" value="${window.location.origin}/memory/${memory['id']}" readonly>
                                <button class="copy-button" id="copyButton_${memory['id']}">
                                    <i class="fas fa-copy"></i> Copy Link
                                </button>
                            </div>
                        </div>
                    `;

                    // Append the share modal to the section
                    section.appendChild(share_div);

                    // Share button event listener
                    const shareButton = memory_card_div.querySelector('.share-button');
                    shareButton.addEventListener('click', async function(event) {
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

                    const closeButton = comment_div.querySelector('.close-button-comment');
                    closeButton.addEventListener('click', function() {
                        const commentModal = document.getElementById(`commentsModal_${memory['id']}`);
                        commentModal.style.display = 'none';
                        commentButton.style.backgroundColor = 'rgb(33, 33, 33)';
                    });

                    window.addEventListener('click', (event) => {
                        const commentModal = document.getElementById(`commentsModal_${memory['id']}`);
                        if (event.target === commentModal) {
                            commentModal.style.display = 'none';
                            commentButton.style.backgroundColor = 'rgb(33, 33, 33)';
                        }
                    });

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
                    editMemoryButton.addEventListener('click', function(event) {
                        event.preventDefault();
                        // Implement edit functionality here
                        console.log('Edit memory:', memory['id']);
                    });

                    // Delete memory functionality
                    const deleteMemoryButton = memory_header_div.querySelector('.delete-memory');
                    deleteMemoryButton.addEventListener('click', async function(event) {
                        event.preventDefault();
                        try {
                            const response = await fetch(`/api/delete-memory/${memory['id']}`, {
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

                    // Follow memory functionality
                    const followMemoryButton = memory_header_div.querySelector('.follow-memory');
                    followMemoryButton.addEventListener('click', async function(event) {
                        event.preventDefault();
                        try {
                            const response = await fetch(`/api/follow-memory/${memory['id']}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            });

                            const result = await response.json();

                            if (response.ok) {
                                console.log('Successfully followed memory');
                            } else {
                                console.error('Failed to follow memory');
                            }
                        } catch (error) {
                            console.error('An error occurred:', error);
                        }
                    });

                    // Report memory functionality
                    const reportMemoryButton = memory_header_div.querySelector('.report-memory');
                    reportMemoryButton.addEventListener('click', async function(event) {
                        event.preventDefault();
                        try {
                            const response = await fetch(`/api/report-memory/${memory['id']}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            });

                            const result = await response.json();

                            if (response.ok) {
                                console.log('Memory reported successfully');
                            } else {
                                console.error('Failed to report memory');
                            }
                        } catch (error) {
                            console.error('An error occurred:', error);
                        }
                    });

                    section.appendChild(memory_card_div);
                }
            } catch (error) {
                console.error('Error:', error);
            }

            async function fetchUserData(userId) {
                try {
                    const response = await fetch(`/api/users/${userId}`);
                    const userData = await response.json();
                    return userData;
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    return null; // Handle error case
                }
            }
        });
        
