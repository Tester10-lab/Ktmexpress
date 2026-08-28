import numpy as np
from PIL import Image, ImageFilter

def process_logo(input_path, output_paths):
    img = Image.open(input_path).convert('RGBA')
    arr = np.array(img, dtype=np.float32)
    
    r, g, b, _ = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    
    # White background reference
    bg_val = 254.0
    
    # Calculate distance from white background
    # Whiteness metric: high when R, G, B are all close to 254
    # Max color difference from background:
    diff = np.maximum(np.maximum(bg_val - r, bg_val - g), bg_val - b)
    
    # Thresholds for alpha ramp
    lower_threshold = 12.0  # Completely transparent below this diff
    upper_threshold = 48.0  # Fully opaque above this diff
    
    alpha = np.clip((diff - lower_threshold) / (upper_threshold - lower_threshold), 0.0, 1.0)
    
    # Unmultiply / defringe white background from RGB channels
    # C = alpha * F + (1 - alpha) * W  =>  F = (C - (1 - alpha)*W) / alpha
    safe_alpha = np.maximum(alpha, 1e-4)
    
    r_unmix = np.clip((r - (1.0 - alpha) * bg_val) / safe_alpha, 0, 255)
    g_unmix = np.clip((g - (1.0 - alpha) * bg_val) / safe_alpha, 0, 255)
    b_unmix = np.clip((b - (1.0 - alpha) * bg_val) / safe_alpha, 0, 255)
    
    alpha_255 = (alpha * 255.0).astype(np.uint8)
    
    out_arr = np.dstack([
        r_unmix.astype(np.uint8),
        g_unmix.astype(np.uint8),
        b_unmix.astype(np.uint8),
        alpha_255
    ])
    
    out_img = Image.fromarray(out_arr, mode='RGBA')
    
    # Auto-crop to content bounding box with a clean 10px margin
    bbox = out_img.getbbox()
    if bbox:
        # Pad bbox slightly
        w, h = out_img.size
        pad_x = 12
        pad_y = 12
        crop_box = (
            max(0, bbox[0] - pad_x),
            max(0, bbox[1] - pad_y),
            min(w, bbox[2] + pad_x),
            min(h, bbox[3] + pad_y)
        )
        cropped = out_img.crop(crop_box)
    else:
        cropped = out_img
        
    print(f"Original size: {img.size}, Cropped transparent logo size: {cropped.size}")
    
    for path in output_paths:
        if 'favicon' in path or '192' in path or '512' in path or 'apple' in path:
            # Create square version with centered logo for icons
            max_dim = max(cropped.size) + 40
            square_img = Image.new('RGBA', (max_dim, max_dim), (0, 0, 0, 0))
            offset_x = (max_dim - cropped.size[0]) // 2
            offset_y = (max_dim - cropped.size[1]) // 2
            square_img.paste(cropped, (offset_x, offset_y), cropped)
            
            if 'favicon' in path:
                square_img.resize((128, 128), Image.Resampling.LANCZOS).save(path, 'PNG', optimize=True)
            elif '192' in path:
                square_img.resize((192, 192), Image.Resampling.LANCZOS).save(path, 'PNG', optimize=True)
            elif '512' in path:
                square_img.resize((512, 512), Image.Resampling.LANCZOS).save(path, 'PNG', optimize=True)
            elif 'apple' in path:
                square_img.resize((180, 180), Image.Resampling.LANCZOS).save(path, 'PNG', optimize=True)
        else:
            cropped.save(path, 'PNG', optimize=True)
        print(f"Saved: {path}")

if __name__ == '__main__':
    src = r"C:\Users\Diplon\.gemini\antigravity-ide\brain\1b8f9dc2-96b7-41c5-b197-374fb0c68da9\.user_uploaded\media_1787886637768.jpg"
    targets = [
        r"c:\Users\Diplon\Downloads\Ktmexpress-main (1)\Ktmexpress-main\frontend\src\assets\logo.png",
        r"c:\Users\Diplon\Downloads\Ktmexpress-main (1)\Ktmexpress-main\frontend\public\logo.png",
        r"c:\Users\Diplon\Downloads\Ktmexpress-main (1)\Ktmexpress-main\frontend\public\favicon.png",
        r"c:\Users\Diplon\Downloads\Ktmexpress-main (1)\Ktmexpress-main\frontend\public\apple-touch-icon.png",
        r"c:\Users\Diplon\Downloads\Ktmexpress-main (1)\Ktmexpress-main\frontend\public\pwa-192x192.png",
        r"c:\Users\Diplon\Downloads\Ktmexpress-main (1)\Ktmexpress-main\frontend\public\pwa-512x512.png",
    ]
    process_logo(src, targets)
