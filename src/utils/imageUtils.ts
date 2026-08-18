/**
 * Helper to compress and resize an uploaded image file on the client side using HTML5 Canvas
 * Converts the image to a lightweight JPEG Data URL (max dimension 600px, 85% quality)
 */
export async function compressImageFile(file: File, maxDimension: number = 600, quality: number = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => {
        // Fallback to original data url
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export interface CulinaryPreset {
  id: string;
  name: string;
  category: string;
  url: string;
}

export const CULINARY_IMAGE_PRESETS: CulinaryPreset[] = [
  {
    id: 'pizza-margherita',
    name: 'Artisan Pizza',
    category: 'Pizza',
    url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'pasta-bolognese',
    name: 'Fresh Pasta',
    category: 'Pasta',
    url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281292?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'truffle-burrata',
    name: 'Burrata / Salad',
    category: 'Appetizer',
    url: 'https://images.unsplash.com/photo-1592417817098-8f3d69109854?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'crispy-calamari',
    name: 'Fried Calamari / Seafood',
    category: 'Seafood',
    url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'prime-steak',
    name: 'Grilled Steak / Meat',
    category: 'Mains',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'pan-seared-fish',
    name: 'Grilled Fish / Fillet',
    category: 'Seafood',
    url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'tiramisu-dessert',
    name: 'Tiramisu / Dessert',
    category: 'Dessert',
    url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'chocolate-cake',
    name: 'Chocolate Fondant',
    category: 'Dessert',
    url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'aperol-spritz',
    name: 'Cocktail / Spritz',
    category: 'Beverage',
    url: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'cocktail-glass',
    name: 'Classic Negroni / Bar',
    category: 'Beverage',
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'fresh-lemonade',
    name: 'Fresh Juice / Lemonade',
    category: 'Beverage',
    url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'buffet-tray',
    name: 'Catering Buffet Trays',
    category: 'Catering',
    url: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80',
  },
];
