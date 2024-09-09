document.addEventListener('DOMContentLoaded', () => {
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

    // Modal for Memories
    const memoryModal = document.getElementById('memoryModal');
    const photos = memoryModal ? memoryModal.querySelector('.photos') : null;
    
    if (memoryModal) {
        const memoryDetailLinks = document.querySelectorAll('.view-details.memory-detail');
        memoryDetailLinks.forEach(link => {
            link.addEventListener('click', async (event) => {
                event.preventDefault();
                const memoryId = link.getAttribute('data-memory-id');
                try {
                    const response = await fetch(`/api/memories/${memoryId}`);
                    const data = await response.json();
                    memoryModal.querySelector('h2').textContent = data.title;
                    memoryModal.querySelector('p').textContent = data.description;
                    photos.innerHTML = ''; // Clear any existing images
                    if (data.image) {
                        if (photos.getElementsByTagName('img').length == 0) {
                            const image = data.image;
                            for (let index = 0; index < image.length; index++) {
                                const divElement = document.createElement('div');
                                const element = image[index];
                                const photo = document.createElement('img');
                                photo.setAttribute('src', element);
                                divElement.appendChild(photo);
                                photos.appendChild(divElement);
                            }
                        }
                    }
                    memoryModal.style.display = 'block';
                } catch (error) {
                    console.error('Error fetching memory details:', error);
                }
            });
        });
    }

    window.addEventListener('click', (event) => {
        if ((event.target === memoryModal || event.target.classList.contains('close-button')) && memoryModal != null) {
            memoryModal.style.display = 'none';
            // memoryModal.querySelectorAll('img').forEach(p => {
            //     p.style.display = 'none';
            // })
        };
    });

    // Modal for Users
    const userModal = document.getElementById('userModal');
    const img_d = userModal ? userModal.querySelector('.photos') : null;
    
    if (userModal) {
        const userDetailLinks = document.querySelectorAll('.view-details.user-detail');
        userDetailLinks.forEach(link => {
            link.addEventListener('click', async (event) => {
                event.preventDefault();
                const userId = link.getAttribute('data-user-id');
                const response = await fetch(`/api/users/${userId}`);
                try {
                    const data = await response.json();
                    img_d.innerHTML = ''; // Clear any existing images
                    if (data.image) {
                        if (img_d.getElementsByTagName('img').length == 0) {
                            const divElement = document.createElement('div');
                            const photo = document.createElement('img');
                            photo.setAttribute('src', data.image);
                            divElement.appendChild(photo);
                            img_d.appendChild(divElement);
                        } else {
                            img_d.querySelector('img').setAttribute('src', data.image)
                        }
                    }
                    userModal.querySelector('h2').textContent = data.username;
                    userModal.querySelector('p').textContent = data.description;
                    userModal.style.display = 'block';
                } catch (error) {
                    console.error('Error:', error);
                }
            });
        });
    }

    window.addEventListener('click', (event) => {
        if ((event.target === userModal || event.target.classList.contains('close-button')) && userModal != null) {
            userModal.style.display = 'none';
        };
    });
});