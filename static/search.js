import {createMemoryCard} from './memory_module.js'


export async function goToSearchPage() {
    // Search Functionality
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');

    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === "Enter") {
            handleSearch();
        }
    });

    // Function to handle the search action
    function handleSearch() {
        let searchInputValue = searchInput.value.trim();
        if (searchInputValue) {
            window.location.href = `/search?query=${encodeURIComponent(searchInputValue)}`;
        } else {
            console.log('Please enter a search term.');
        }
    }
}


async function get_memories_and_users(query) {
    try {
        const queryResponse = await fetch(`/api/query?query=${encodeURIComponent(query)}`);
        if (!queryResponse.ok) {
            throw new Error(`HTTP error! status: ${queryResponse.status}`);
        }

        const data = await queryResponse.json();
        return data;
    } catch (error) {
        console.error('Error fetching query data:', error);
    }
}


async function displayUserData(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const userData = await response.json();

        // Update modal content
        const modalContent = document.getElementById('userModal');
        const userInfoDiv = modalContent.querySelector('.user-info');
        const userImageDiv = modalContent.querySelector('.user-image');

        userInfoDiv.innerHTML = `
            <h2>${userData.username}</h2>
            <p>${userData.description}</p>
        `;
        userImageDiv.innerHTML = `
            <img src="${userData.image}" alt="Profile Picture">
        `;

        modalContent.style.display = 'block';

        // Add close button functionality
        const closeButton = modalContent.querySelector('.close-button');
        closeButton.addEventListener('click', () => {
            modalContent.style.display = 'none';
        });

        // Add event listener for viewing other user profiles
        const viewProfileLinks = document.querySelectorAll('.view-details.user-detail');
        viewProfileLinks.forEach(link => {
            link.addEventListener('click', async (event) => {
                event.preventDefault();
                const targetUserId = link.getAttribute('data-user-id');
                await displayUserData(targetUserId);
            });
        });

        // Close modal on click outside
        window.addEventListener('click', (event) => {
            if ((event.target === modalContent || 
                 event.target.classList.contains('close-button')) && 
                 modalContent !== null) {
                modalContent.style.display = 'none';
            }
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        alert('An error occurred while loading the user profile.');
    }
}


function createUserSearchResults(user) {
    const userResult = document.createElement('div');
    userResult.className = 'user-search-result';

    const userProfile = document.createElement('div');
    userProfile.className = 'user-profile';

    const profilePicture = document.createElement('img');
    profilePicture.className = 'profile-picture';
    profilePicture.alt = `Profile picture for ${user.username}`;
    profilePicture.src = user.image ? user.image : 'default-profile-picture.jpg';

    const userInfo = document.createElement('div');
    userInfo.className = 'user-info'; // New container for username and bio

    const username = document.createElement('h3');
    username.className = 'username';
    username.textContent = user.username;

    const bio = document.createElement('p');
    bio.className = 'bio';
    bio.textContent = user.bio ? user.bio : 'No bio available';

    userInfo.appendChild(username);
    userInfo.appendChild(bio); // Append bio and username to userInfo div
    userProfile.appendChild(profilePicture);
    userProfile.appendChild(userInfo); // Append userInfo to userProfile

    const viewProfileLink = document.createElement('a');
    viewProfileLink.className = 'view-profile';
    viewProfileLink.setAttribute('href', `/profile-user/${user.id}`);
    viewProfileLink.setAttribute('data-user-id', user.id);
    viewProfileLink.innerHTML = '<i class="fas fa-user"></i> View Profile';

    userResult.appendChild(userProfile);
    userResult.appendChild(viewProfileLink);

    return userResult;
}


document.addEventListener('DOMContentLoaded', async (event) => {
    event.preventDefault();

    await goToSearchPage();

    // -------------------------------------
    // Modal for Memories
    // -------------------------------------

    const query = window.location.href.split('=')[1];
    const searchResultsContainer = document.querySelector('.memories_container');
    if (searchResultsContainer) {
        searchResultsContainer.querySelector('h1').textContent = query ? `${query} Results` : 'Search Results';
    }

    let currentUser = {};
    let userId = '';

    // Fetch current user data
    const currentUserResponse = await fetch('/api/current-user');
    if (!currentUserResponse.ok) {
        throw new Error(`HTTP error! status: ${currentUserResponse.status}`);
    }
    currentUser = await currentUserResponse.json();

    if (currentUser) {
        // console.log(document.querySelector('.profile').querySelector('a').innerHTML);
        document.querySelector('.profile').querySelector('a').innerHTML = `
            <img src="${ currentUser.image }" alt="Profile Image">
        `;
    };

    userId = currentUser.id;

    let memories_and_users = await get_memories_and_users(query);

    let memories = memories_and_users.memories;
    let users = memories_and_users.users;

    await memories.forEach(async (memory) => {
        try {
            if (memory.user_id === userId) {
                createMemoryCard(memory, currentUser);
            } else {
                const response = await fetch(`/api/users/${memory.user_id}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const userData = await response.json();
                createMemoryCard(memory, userData);
            }
        } catch (error) {
            console.error(`Error processing memory ${memory.id}:`, error);
        }
    });

    // const memoryModal = document.getElementById('memoryModal');
    // const photos = memoryModal ? memoryModal.querySelector('.photos') : null;

    // if (memoryModal) {
    //     const memoryDetailLinks = document.querySelectorAll('.view-details.memory-detail');
    //     memoryDetailLinks.forEach(link => {
    //         link.addEventListener('click', async (event) => {
    //             event.preventDefault();
    //             const memoryId = link.getAttribute('data-memory-id');
    //             try {
    //                 const response = await fetch(`/api/memories/${memoryId}`);
    //                 const data = await response.json();
    //                 memoryModal.querySelector('h2').textContent = data.title;
    //                 memoryModal.querySelector('p').textContent = data.description;
    //                 photos.innerHTML = ''; // Clear any existing images
    //                 if (data.image) {
    //                     if (photos.getElementsByTagName('img').length == 0) {
    //                         const image = data.image;
    //                         for (let index = 0; index < image.length; index++) {
    //                             const divElement = document.createElement('div');
    //                             const element = image[index];
    //                             const photo = document.createElement('img');
    //                             photo.setAttribute('src', element);
    //                             divElement.appendChild(photo);
    //                             photos.appendChild(divElement);
    //                         }
    //                     }
    //                 }
    //                 memoryModal.style.display = 'block';
    //             } catch (error) {
    //                 console.error('Error fetching memory details:', error);
    //             }
    //         });
    //     });
    // }

    // window.addEventListener('click', (event) => {
    //     if ((event.target === memoryModal || event.target.classList.contains('close-button')) && memoryModal != null) {
    //         memoryModal.style.display = 'none';
    //         // memoryModal.querySelectorAll('img').forEach(p => {
    //         //     p.style.display = 'none';
    //         // })
    //     };
    // });

    // -------------------------------------
    // Modal for Users
    // -------------------------------------
    if (searchResultsContainer) {
        const usersResults = searchResultsContainer.querySelector('.users-results');
        const searchResult = usersResults.querySelector('.search-results');

        searchResult.innerHTML = '';

        await users.forEach(async (user) => {
            try {
                if (users && users.length > 0) {
                    const userResult = createUserSearchResults(user);
                    searchResult.appendChild(userResult);
                } else {
                    console.log('No users found.');
                    const noUsersMessage = document.createElement('p');
                    noUsersMessage.textContent = 'No users available.';
                    searchResultsContainer.appendChild(noUsersMessage);
                }
            } catch {
                console.error('Error creating user search results:', error);
                const errorMessage = document.createElement('p');
                errorMessage.textContent = 'An error occurred while loading user data.';
                searchResult.appendChild(errorMessage);
            }
        });
    }
    // users.forEach((user) => {
    //     const userItem = document.createElement('div');
    //     userItem.className = 'search-result-item';

    //     const link = document.createElement('a');
    //     link.className = 'view-details user-detail';
    //     link.href = '#';
    //     link.dataset.userId = user.id;
    //     link.textContent = user.username;

    //     userItem.appendChild(link);

    //     searchResultsContainer.appendChild(userItem);
    // });

    // if (userModal) {
    //     const userDetailLinks = document.querySelectorAll('.view-details.user-detail');
    //     userDetailLinks.forEach(link => {
    //         link.addEventListener('click', async (event) => {
    //             event.preventDefault();
    //             const userId = link.getAttribute('data-user-id');
    //             const response = await fetch(`/api/users/${userId}`);
    //             try {
    //                 const data = await response.json();
    //                 img_d.innerHTML = ''; // Clear any existing images
    //                 if (data.image) {
    //                     if (img_d.getElementsByTagName('img').length == 0) {
    //                         const divElement = document.createElement('div');
    //                         const photo = document.createElement('img');
    //                         photo.setAttribute('src', data.image);
    //                         divElement.appendChild(photo);
    //                         img_d.appendChild(divElement);
    //                     } else {
    //                         img_d.querySelector('img').setAttribute('src', data.image)
    //                     }
    //                 }
    //                 userModal.querySelector('h2').textContent = data.username;
    //                 userModal.querySelector('p').textContent = data.description;
    //                 userModal.style.display = 'block';
    //             } catch (error) {
    //                 console.error('Error:', error);
    //             }
    //         });
    //     });
    // }

    // window.addEventListener('click', (event) => {
    //     if ((event.target === userModal || event.target.classList.contains('close-button')) && userModal != null) {
    //         userModal.style.display = 'none';
    //     };
    // });
});