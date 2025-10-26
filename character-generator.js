async function getCompositeImageAsDataURL(dollImage, dollContainer) {
    const canvas = document.createElement('canvas');
    const dollRect = dollImage.getBoundingClientRect();
    const dollNaturalWidth = dollImage.naturalWidth || dollImage.offsetWidth;
    const dollNaturalHeight = dollImage.naturalHeight || dollImage.offsetHeight;

    canvas.width = dollNaturalWidth;
    canvas.height = dollNaturalHeight;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(dollImage, 0, 0, dollNaturalWidth, dollNaturalHeight);
    
    const wornItemWrappers = Array.from(dollContainer.querySelectorAll('.worn-item-wrapper'));
    for (const wrapper of wornItemWrappers) {
        const item = wrapper.querySelector('.worn-item');
        if (!item) continue;
        
        const itemScaleX = wrapper.offsetWidth / dollRect.width;
        const itemScaleY = wrapper.offsetHeight / dollRect.height;
        const targetX = (parseFloat(wrapper.style.left) / dollRect.width) * dollNaturalWidth;
        const targetY = (parseFloat(wrapper.style.top) / dollRect.height) * dollNaturalHeight;
        const targetWidth = itemScaleX * dollNaturalWidth;
        const targetHeight = itemScaleY * dollNaturalHeight;

        ctx.drawImage(item, targetX, targetY, targetWidth, targetHeight);
    }
    
    return canvas.toDataURL('image/png');
}

function buildPrompt(dollImage, dollContainer) {
    const gender = dollImage.src.includes('female') ? 'female' : 'male';
    const wornItems = Array.from(dollContainer.querySelectorAll('.worn-item'));
    const clothingDescriptions = {};
    
    wornItems.forEach(item => {
        if (item.dataset.itemType) {
            clothingDescriptions[item.dataset.itemType] = item.alt;
        }
    });

    const categories = ['hair', 'hat', 'shirt', 'pants', 'shoes'];
    const clothingList = categories.map(category => {
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        if (clothingDescriptions[category]) {
            return `${categoryName}: ${clothingDescriptions[category]}`;
        }
        
        switch (category) {
            case 'shirt':
                return `${categoryName}: a plain, form-fitting t-shirt the same color as their skin`;
            case 'pants':
                return `${categoryName}: plain shorts the same color as their skin`;
            case 'hair':
                return `${categoryName}: bald`;
            case 'shoes':
                return `${categoryName}: barefoot`;
            default:
                return `${categoryName}: none`;
        }
    }).join('. ');
    
    return `Generate a full-body character portrait based on the provided paper doll image. The character is a ${gender}. The final image should be in a friendly, cartoon art style suitable for a game. Keep the character in a similar T-pose. Character details: ${clothingList}.`;
}

export async function generateCharacter(dollImage, dollContainer) {
    const imageDataUrl = await getCompositeImageAsDataURL(dollImage, dollContainer);
    const promptText = buildPrompt(dollImage, dollContainer);
    
    const result = await websim.imageGen({
        prompt: promptText,
        image_inputs: [{ url: imageDataUrl }],
        aspect_ratio: "2:3",
    });
    
    return result.url;
}