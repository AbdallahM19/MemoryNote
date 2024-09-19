import {
    addActionTodropdownToggle,
    getcommentmemory,
    renderComments
} from "./memory_module.js";


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

            // async function renderComments(comments) {
            //     const commentbody = await Promise.all(comments.map(async (comment) => {
            //         const userData = await fetchUserData(comment['user_id']);
            //         return `
            //             <div class="comment-item" id="comment_${comment['comment_id']}">
            //                 <a href="/profile-user/${userData.id}">
            //                     <img class="commenter-img" src="${userData ? userData['image'] : ''}" alt="Commenter Image">
            //                 </a>
            //                 <div class="comment-content">
            //                     <h5>${userData ? userData['username'] : 'Unknown User'}</h5>
            //                     <h6>${comment['timestamp']}</h6>
            //                     <p>${comment['comment']}</p>
            //                 </div>
            //                 <div class="edit-comment-${comment['comment_id']}" id="edit-comment">
            //                 </div>
            //                 <div class="comment-options">
            //                     <button class="dropdown-btn">⋮</button>
            //                     <div class="dropdown-content">
            //                         <button class="edit-comment" data-id="${comment['comment_id']}">Edit</button>
            //                         <button class="delete-comment" data-id="${comment['comment_id']}">Delete</button>
            //                         <button class="report-comment" data-id="${comment['comment_id']}">Report</button>
            //                     </div>
            //                 </div>
            //             </div>
            //         `;
            //     }));

            //     return commentbody.join('');
            // }

            // Usage
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
                    const comment_div_edit = section.querySelector(`.edit-comment-${commentId}`);
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
                    // Edit comment logic here
                    // const originalContent = document.getElementById(`comment_${commentId}`)
                    //   .querySelector('.comment-content p').textContent;

                    // // Replace with editable textarea
                    // const editTextarea = document.createElement('input');
                    // editTextarea.value = originalContent;

                    // Create submit button
                    // const submitButton = document.createElement('button');
                    // submitButton.textContent = 'Save Changes';
                    // submitButton.onclick = async () => {
                    //     try {
                    //         // Update server with new comment content
                    //         await fetch(`/api/edit-comment/${commentId}`, {
                    //             method: 'PUT',
                    //             headers: { 'Content-Type': 'application/json' },
                    //             body: JSON.stringify({ content: editTextarea.value })
                    //         });

                    //         // Refresh comment display
                    //         const newContent = document.getElementById(`comment_${commentId}`).querySelector('.comment-content p');
                    //         newContent.textContent = editTextarea.value;
                    //     } catch (error) {
                    //         console.error('Error editing comment:', error);
                    //     }
                    // };

                    // Replace original content with editable textarea and submit button
                    // document.getElementById(`comment_${commentId}`).querySelector('.comment-content').innerHTML = `
                    //     <p>${editTextarea.value}</p>
                    //     ${submitButton.outerHTML}
                    // `;
                    
                    // // Hide dropdown options temporarily
                    // event.target.style.display = 'none';
                }

                if (event.target.classList.contains('delete-comment')) {
                    const commentId = event.target.getAttribute('data-id');
                    // Add delete logic here
                    const commentElement = section.querySelector(`[id="comment_${commentId}"]`);
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
            // const dropdownBtns = commentbody.querySelectorAll('.dropdown-btn');
            // dropdownBtns.forEach(btn => {
            //     btn.addEventListener('click', () => {
            //         const dropdownContent = btn.nextElementSibling;
            //         dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
            //     });
            // });

            // const editComments = document.querySelectorAll('.edit-comment');
            // editComments.forEach(editBtn => {
            //     editBtn.addEventListener('click', editComment);
            // });

            // const deleteComments = document.querySelectorAll('.delete-comment');
            // deleteComments.forEach(deleteBtn => {
            //     deleteBtn.addEventListener('click', deleteComment);
            // });

            section.appendChild(comment_div);

            const commentButton = memory_card_div.querySelector('.comment-button');
            commentButton.addEventListener('click', async function(event) {
                event.preventDefault();
                // Open the comment modal specific to this memory
                const commentModal = document.getElementById(`commentsModal_${memory['id']}`);
                commentModal.style.display = 'block';
                commentButton.style.backgroundColor = 'rgb(40, 167, 69)';
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
            // Toggle dropdown visibility on button click
            // document.addEventListener('click', async function (event) {
            //     const target = event.target;

            //     // Dropdown toggle
            //     if (target.classList.contains('dropdown-btn')) {
            //         const dropdownContent = target.nextElementSibling;
            //         dropdownContent.classList.toggle('show');
            //         // Change the icon based on whether the dropdown is visible or hidden
            //         target.innerHTML = target.innerHTML === '⋮' ? '▼' : '⋮';
            //     }

            //     // Edit comment functionality
            //     if (target.classList.contains('edit-comment')) {
            //         event.preventDefault();
            //         const commentId = target.getAttribute('data-id');
            //         const commentTextElement = document.getElementById(`comment_text_${commentId}`);

            //         // Make the comment text editable
            //         const currentComment = commentTextElement.innerText;
            //         commentTextElement.innerHTML = `<input type="text" id="edit_input_${commentId}" value="${currentComment}">`;

            //         // Listen for Enter key to save the edited comment
            //         const editInput = document.getElementById(`edit_input_${commentId}`);
            //         editInput.addEventListener('keydown', async function (event) {
            //             if (event.key === 'Enter') {
            //                 const updatedComment = editInput.value.trim();
            //                 if (updatedComment) {
            //                     commentTextElement.innerText = updatedComment;

            //                     // Optionally, update the comment on the server
            //                     try {
            //                         const response = await fetch(`/api/edit-comment/${commentId}`, {
            //                             method: 'PUT',
            //                             headers: {
            //                                 'Content-Type': 'application/json',
            //                                 'Accept': 'application/json'
            //                             },
            //                             body: JSON.stringify({ comment: updatedComment })
            //                         });

            //                         const result = await response.json();
            //                         if (!response.ok) {
            //                             console.error('Error updating comment:', result.error);
            //                         }
            //                     } catch (error) {
            //                         console.error('An error occurred:', error);
            //                     }
            //                 }
            //             }
            //         });
            //     }

            //     // Delete comment functionality
            //     if (target.classList.contains('delete-comment')) {
            //         event.preventDefault();
            //         const commentId = target.getAttribute('data-id');
            //         const commentElement = document.getElementById(`comment_${commentId}`);

            //         // Optionally, delete the comment from the server
            //         if (confirm("Are you sure you want to delete this comment?")) {
            //             try {
            //                 const response = await fetch(`/api/delete-comment/${commentId}`, {
            //                     method: 'DELETE',
            //                     headers: {
            //                         'Content-Type': 'application/json',
            //                         'Accept': 'application/json'
            //                     }
            //                 });
            //                 const result = await response.json();
                            
            //                 if (!response.ok) {
            //                     console.error('Error deleting comment:', result.error);
            //                 } else {
            //                     // Remove the element from the DOM
            //                     commentElement.remove();
            //                 }
            //             } catch (error) {
            //                 console.error('An error occurred:', error);
            //             }
            //         }
            //     }
            // });

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

            const closeButton = comment_div.querySelector('.close-button-comment');
            closeButton.addEventListener('click', function() {
                const commentModal = document.getElementById(`commentsModal_${memory['id']}`);
                commentModal.style.display = 'none';
                commentButton.style.backgroundColor = '';
            });

            window.addEventListener('click', (event) => {
                const commentModal = document.getElementById(`commentsModal_${memory['id']}`);
                if (event.target === commentModal) {
                    commentModal.style.display = 'none';
                    commentButton.style.backgroundColor = '';
                }
            });

            // Dropdown functionality
            await addActionTodropdownToggle(memory, memory_header_div, memory_card_div);

            // Follow memory functionality
            const followMemoryButton = memory_header_div.querySelector('.follow-memory');
            if (followMemoryButton) {
                if (current_user.following.includes(user['id'])) {
                    followMemoryButton.textContent = 'Unfollow';
                } else {
                    followMemoryButton.textContent = 'Follow'
                }

                followMemoryButton.addEventListener('click', async function(event) {
                    event.preventDefault();

                    try {
                        const response_post = await fetch(`/api/follow/${memory['user_id']}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            }
                        });

                        const result_post = await response_post.json();

                        if (response_post.ok) {
                            followMemoryButton.textContent = result_post.is_following ? 'Unfollow' : 'Follow';
                            console.log('Successfully followed memory');
                        } else {
                            console.error('Failed to follow memory');
                        }
                    } catch (error) {
                        console.error('An error occurred:', error);
                    }
                });
            }

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
});
