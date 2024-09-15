// Create the form div
const editFormDiv = document.createElement('div');
editFormDiv.className = 'edit-form';

// Build the form HTML
editFormDiv.innerHTML = `
    <form id="editForm_${memory['id']}">
        <label for="title_${memory['id']}">Title:</label>
        <input type="text" id="title_${memory['id']}" name="title" value="${memory['title'] || ''}" />
        <label for="description_${memory['id']}">Description:</label>
        <textarea id="description_${memory['id']}" name="description">${memory['description'] || ''}</textarea>
        <label for="images_${memory['id']}">Images:</label>
        <input type="file" id="images_${memory['id']}" name="images" multiple />
        <button type="submit" class="save-button">Save</button>
        <button type="button" class="cancel-button">Cancel</button>
    </form>
`;

// Append the form to the memory card div
memory_card_div.appendChild(editFormDiv);

// Add event listener for form submission
const editForm = document.getElementById(`editForm_${memory['id']}`);
editForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    // Get the updated data from the form
    const formData = new FormData();
    Object.entries(editForm.elements).forEach(([name, element]) => {
        if (element.name) {
            formData.append(element.name, element.value);
        }
    });
    const title = formData.get('title');
    const description = formData.get('description');
    const imagesFiles = editForm.querySelector(`#images_${memory['id']}`).files;

    // If images are uploaded, we need to handle file uploads
    let images = [];
    if (imagesFiles.length > 0) {
        // Upload images to the server and get the image URLs
        const imageUploadFormData = new FormData();
        for (const file of imagesFiles) {
            imageUploadFormData.append('images', file);
        }
        try {
            const uploadResponse = await fetch('/upload-images', {
                method: 'POST',
                body: imageUploadFormData
            });
            const uploadResult = await uploadResponse.json();
            images = uploadResult.imagePaths;
        } catch (uploadError) {
            console.error('Error uploading images:', uploadError);
            return;
        }
    } else {
        images = memory['image'];
    }

    // Prepare the data to send in the PUT request
    const updatedMemoryData = {
        title: title,
        description: description,
        image: images
    };

    // Send PUT request to update the memory
    try {
        const updateResponse = await fetch(`/api/memories/${memory['id']}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(updatedMemoryData)
        });
        const updateResult = await updateResponse.json();

        if (updateResponse.ok) {
            // Update the memory content with the new data
            memory['title'] = title;
            memory['description'] = description;
            memory['image'] = images;

            // Update the UI
            updateMemoryContent(memory, memory_content_div, memory_header_div);

            // Remove the edit form
            memory_card_div.removeChild(editFormDiv);

            // Show the memory content
            memory_content_div.style.display = 'block';
        } else {
            console.error('Error updating memory:', updateResult.error);
        }
    } catch (updateError) {
        console.error('An error occurred while updating the memory:', updateError);
    }
});

// Add event listener for cancel button
const cancelButton = editForm.querySelector('.cancel-button');
cancelButton.addEventListener('click', function() {
    // Remove the edit form
    memory_card_div.removeChild(editFormDiv);

    // Show the memory content
    memory_content_div.style.display = 'block';
});

function updateMemoryContent(memory, memory_content_div, memory_header_div) {
    let imagesElements = [];
    const images = Array.isArray(memory.image) ? memory.image : [];

    if (Array.isArray(images) && images.length !== 0) {
        imagesElements = images.map(imgUrl => `
            <div class="memory-image">
                <img src="${imgUrl}" alt="Memory Image" class="memory-image">
            </div>
        `).join('');
    }

    // Update the memory content
    memory_content_div.innerHTML = `
        <p>${memory['description']}</p>
        <div class="memory-images" style="${images.length === 0 ? 'display: none;' : ''}">
            ${imagesElements}
        </div>
    `;

    // Update the title in the header if necessary
    if (memory_header_div) {
        memory_header_div.querySelector('.memory-title').textContent = memory['title'];
    }
}

// Event listener for edit button
const editMemoryButton = memory_footer_div.querySelector('.edit-memory');
editMemoryButton.addEventListener('click', function(event) {
    event.preventDefault();
    // Hide the memory content
    memory_content_div.style.display = 'none';
    // Create and display the edit form
    showEditForm(memory, memory_card_div, memory_content_div);
});