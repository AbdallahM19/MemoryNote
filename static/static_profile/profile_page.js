import {
    createMemoryCard,
    editBio,
    changeImageProfile,
    toggleFollow,
    createProfile,
} from '../memory_module.js';

import { goToSearchPage } from '../search.js';


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

    await goToSearchPage();
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
