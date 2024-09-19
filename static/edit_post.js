// Function to create the Edit Modal
export function createEditModal(memory) {
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.innerHTML = `
        <div class="modal-content-edit">
            <span class="close-button-edit">&times;</span>
            <h2>Edit Memory</h2>
            <form id="editMemoryForm_${memory.id}">
                <!-- Title -->
                <div class="form-group">
                    <label for="title">Title:</label>
                    <input type="text" id="title" name="title" value="${memory.title || ''}" required>
                </div>

                <!-- Description -->
                <div class="form-group">
                    <label for="description">Description:</label>
                    <textarea id="description" name="description">${memory.description}</textarea>
                </div>

                <!-- Type -->
                <div class="form-group">
                    <label for="type">Type:</label>
                    <select id="type" name="type">
                        <option value="Draft">Draft</option>
                        <option value="Public">Public</option>
                        <option value="Private">Private</option>
                    </select>
                </div>

                <!-- Share -->
                <div class="form-group">
                    <label for="share">Share:</label>
                    <select id="share" name="share">
                        <option value="Just Me">Just Me</option>
                        <option value="Friends">Friends</option>
                        <option value="Everyone">Everyone</option>
                    </select>
                </div>

                <!-- Memory Images -->
                <div class="form-group">
                    <h3>Memory Images:</h3>
                    <div class="memory-images"></div>
                </div>

                <!-- Save Changes -->
                <button type="submit" class="save-changes">Save Changes</button>
            </form>
        </div>
    `;

    
    const typeSelect = modal.querySelector('#type');
    if (memory.type) {
        typeSelect.value = (memory.type);
    } else {
        typeSelect.value = 'draft';
    }

    const shareSelect = modal.querySelector('#share');
    if (memory.share) {
        shareSelect.value = (memory.share);
    } else {
        shareSelect.value = 'just-me';
    }

    // Create container for memory images
    const memoryImagesContainer = modal.querySelector('.memory-images');

    // Display images
    if (memory.image && Array.isArray(memory.image)) {
        memory.image.forEach((imageUrl, index) => {
            const imgElement = document.createElement('img');
            imgElement.src = imageUrl;
            imgElement.alt = `Image ${index + 1}`;
            imgElement.classList.add('memory-image');

            imgElement.addEventListener('load', () => {
                imgElement.style.display = 'block';
            });
            
            imgElement.onerror = () => {
                console.error(`Error loading image: ${imageUrl}`);
                imgElement.remove(); // Remove broken image
            };

            memoryImagesContainer.appendChild(imgElement);
        });
    }

    // Close modal functionality
    const closeButton = modal.querySelector('.close-button-edit');
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
        modal.remove();
    });

    // Submit form and save changes
    const editForm = modal.querySelector(`#editMemoryForm_${memory.id}`);
    editForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const updatedTitle = document.getElementById('title').value;
        const updatedDescription = document.getElementById('description').value;
        const updatedType = document.getElementById('type').value;
        const updatedShare = document.getElementById('share').value;

        const updatedMemoryData = {
            title: updatedTitle,
            description: updatedDescription,
            image: memory['image'],
            type: updatedType,
            share: updatedShare,
        };

        try {
            const response = await fetch(`/api/edit-memory/${memory.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedMemoryData)
            });

            if (response.ok) {
                // Successfully updated memory, now update the UI with new values
                // memory_content_div.querySelector('h2').textContent = updatedTitle;
                // memory_content_div.querySelector('p').textContent = updatedDescription;
                // memory_content_div.querySelector('.memory-images').innerHTML = `
                //     ${updatedImages.map(imgUrl => `
                //         <div class="memory-image">
                //             <img src="${imgUrl}" alt="Memory Image" class="memory-image">
                //         </div>
                //     `).join('')}
                // `;
                modal.style.display = 'none';
                modal.remove(); // Remove modal from DOM after submitting
                console.log('Memory updated successfully');
                window.location.reload();
            } else {
                console.error('Failed to update memory');
            }
        } catch (error) {
            console.error('Error updating memory:', error);
        }
    });

    // Image cropping functionality
    // ----------------------------
    // ----------------------------

    return modal;
}
