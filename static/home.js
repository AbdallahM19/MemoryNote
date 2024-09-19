import { goToSearchPage } from "./search.js";


// Dropdown Functionality
function setupDropdown(buttonId, dropdownId) {
    const button = document.getElementById(buttonId);
    const dropdown = document.getElementById(dropdownId);

    if (button && dropdown) {
        button.addEventListener('click', () => {
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });

        dropdown.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', () => {
                const selectedText = item.textContent.trim();
                button.querySelector('span').textContent = selectedText;
                dropdown.style.display = 'none';

                // Hide all content sections first
                const sections = [
                    'schedule-container',
                    'class_public',
                    'class_private',
                    'class_draft',
                    'class_just',
                    'class_friends',
                    'class_everyone'
                ];

                sections.forEach(sectionId => {
                    const section = document.getElementById(sectionId);
                    if (section) {
                        section.style.display = 'none';
                    }
                });

                if (selectedText === 'Schedule') {
                    document.getElementById('schedule-container').style.display = 'block';
                } else if (selectedText === 'Public') {
                    document.getElementById('class_public').style.display = 'block';
                } else if (selectedText === 'Private') {
                    document.getElementById('class_private').style.display = 'block';
                } else if (selectedText === 'Draft') {
                    document.getElementById('class_draft').style.display = 'block';
                } else if (selectedText === 'Just Me') {
                    document.getElementById('class_just').style.display = 'block';
                } else if (selectedText === 'Friends') {
                    document.getElementById('class_friends').style.display = 'block';
                } else if (selectedText === 'Everyone') {
                    document.getElementById('class_everyone').style.display = 'block';
                }
            });
        });

        document.addEventListener('click', (event) => {
            if (!button.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });
    }
}


// async function fetchData(params) {
//     try {
//         const response = await fetch(`/api/${params}/`, {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//         });
//         const data = await response.json();
//         return data;
//     } catch (error) {
//         console.error('Fetch error:', error);
//         return null;
//     }
// }

// // Search Functionality
// async function searchFunction() {
//     const searchButton = document.getElementById('searchButton');
//     const searchInput = document.getElementById('searchInput');
//     const memoriesResults = document.querySelector('.memories-results .search-results');
//     const usersResults = document.querySelector('.users-results .search-results');
    
//     searchButton.addEventListener('click', async () => {
//         let searchInputValue = searchInput.value.trim();
//         if (searchInputValue) {
//             let memoriesData = await fetchData('memories');
//             let usersData = await fetchData('users');
//             let dataToSend = {
//                 searchQuery: searchInputValue,
//                 memories: memoriesData,
//                 users: usersData
//             }

//             // Navigate to search page
//             fetch(`/search`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Accept': 'application/json',
//                 },
//                 body: JSON.stringify(dataToSend)
//             })
//             .then(response => response.json())
//             .then(data => {
//                 if (data['message'] == 'Register successful') {
//                 } else {
//                     console.error('Error:', data.message);
//                 }
//             })
//             .catch(error => {
//                 console.error('Error:', error);
//             });

//             // Clear previous results
//             memoriesResults.innerHTML = '';
//             usersResults.innerHTML = '';

//             // Display memories results
//             memoriesData.forEach(memory => {
//                 const memoryElement = document.createElement('div');
//                 memoryElement.className = 'search-result-item';
//                 memoryElement.innerHTML = `
//                     <h3>${memory.title}</h3>
//                     <p>${memory.description}</p>
//                     <a href="#" class="view-details memory-detail" data-modal="memory-modal">View Details</a>
//                 `;
//                 memoriesResults.appendChild(memoryElement);
//             });

//             // Display users results
//             usersData.forEach(user => {
//                 const userElement = document.createElement('div');
//                 userElement.className = 'search-result-item';
//                 userElement.innerHTML = `
//                     <h3>${user.name}</h3>
//                     <p>${user.description}</p>
//                     <a href="#" class="view-details user-detail" data-modal="user-modal">View Profile</a>
//                 `;
//                 usersResults.appendChild(userElement);
//             });

//             // Add event listeners for modals
//             document.querySelectorAll('.memory-detail').forEach(element => {
//                 element.addEventListener('click', (event) => {
//                     event.preventDefault();
//                     document.getElementById('memory-modal').style.display = 'block';
//                 });
//             });
            
//             document.querySelectorAll('.user-detail').forEach(element => {
//                 element.addEventListener('click', (event) => {
//                     event.preventDefault();
//                     document.getElementById('user-modal').style.display = 'block';
//                 });
//             });
//         } else {
//             console.log('Please enter a search term.');
//             return;
//         }
//     });
// }

// Modal Functionality
const modal = document.getElementById('addMemoryModal');
const openModalBtn = document.getElementById('openModal');
const resultsDiv = document.querySelector('.imgUploaded');
const inputGroupImage = document.querySelector('.input-group-input-image');
let uploadedImages = [];

if (openModalBtn && modal) {
    openModalBtn.addEventListener('click', () => {
        modal.style.display = 'block'
        // Reset form fields
        document.getElementById('addMemoryForm').reset();
        uploadedImages = [];
        resultsDiv.innerHTML = '';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    modal.addEventListener('submit', function (event) {
        event.preventDefault();
        const memoryTitle = document.getElementById('memoryTitle');
        const memoryContent = document.getElementById('memoryContent');
        const imageUpload = document.getElementById('imageUpload');
        const shareButtonResult = document.getElementById('shareButtonResult').querySelector('span');
        const statusButtonResult = document.getElementById('statusButtonResult').querySelector('span');
        const calendardate = document.getElementById('calendardate');
        const calendartime = document.getElementById('calendartime');

        if (!memoryContent.value.trim()) {
            console.log('Please enter a memory content.');
            return;
        }

        fetch(`/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                title: memoryTitle.value.trim(),
                content: memoryContent.value.trim(),
                image: uploadedImages,
                share: shareButtonResult.textContent,
                status: statusButtonResult.textContent,
                calendar: `${calendardate.value} ${calendartime.value}`,
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message == 'True') {
                console.log('Memory added successfully.');
                modal.style.display = 'none';
                document.getElementById('shareButton').querySelector('span').textContent = 'Just Me';
                document.getElementById('statusButton').querySelector('span').textContent = 'Draft';
                document.getElementById('addMemoryForm').reset();
                uploadedImages = [];
                resultsDiv.innerHTML = '';
            } else {
                console.log('Error adding memory.');
            }
        })
        .catch(error => {
            console.error('Error: adding page:', error);
        });
    });

    inputGroupImage.addEventListener('click', () => {
        const resultsDivs = document.querySelectorAll('.results > div');
        resultsDivs.forEach(div => {
            div.style.display = 'none';
        });
        resultsDiv.style.display = 'flex';
    });

    window.addEventListener('click', (event) => {
        if (
            !resultsDiv.contains(event.target) &&
            event.target !== inputGroupImage &&
            !inputGroupImage.contains(event.target)
        ) {
            resultsDiv.style.display = 'none';
        }
    });

    imageUpload.addEventListener('change', function () {
        const files = Array.from(imageUpload.files);
        const formData = new FormData();

        if (uploadedImages.length + files.length > 8) {
            console.log('You can only upload up to 8 images.');
            return;
        }

        files.forEach(file => {
            formData.append('images', file);
        });

        fetch('/upload-images', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            data.imagePaths.forEach(path => {
                const divElement = document.createElement('div');
                divElement.classList.add('image-div');
                const imgElement = document.createElement('img');
                imgElement.src = path;
                imgElement.classList.add('uploaded-image');
                divElement.appendChild(imgElement);
                resultsDiv.appendChild(divElement);

                // Store the path
                uploadedImages.push(path);
            });
        })
        .catch(error => {
            console.error('Error uploading images:', error);
        });
    });
}

// Character Count Functionality
const memoryContent = document.getElementById('memoryContent');
const charCount = document.getElementById('charCount');

if (memoryContent && charCount) {
    memoryContent.addEventListener('input', () => {
        const length = memoryContent.value.length;
        charCount.textContent = `${length}/500`;
    });
}

// Calendar Functionality
const button = document.getElementById('calendarButton');
const dropdown = document.getElementById('calendar-container');

if (button && dropdown) {
    button.addEventListener('click', () => {
        const resultsDivs = document.querySelectorAll('.results > div');
        resultsDivs.forEach(div => {
            div.style.display = 'none';
        });

        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', (event) => {
        if (!button.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.style.display = 'none';
            document.querySelector('.imgUploaded').style.display = 'flex';
        }
    });
}

// Initialize Functions
document.addEventListener('DOMContentLoaded', async () => {
    setupDropdown('shareButton', 'shareDropdown');
    setupDropdown('statusButton', 'statusDropdown');

    await goToSearchPage();
});