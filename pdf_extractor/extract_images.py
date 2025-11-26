import fitz  # PyMuPDF
import os

# Configuration
PDF_PATH = r"C:\Users\a138672\Downloads\JEUX en ESCALADE (1).pdf"
OUTPUT_DIR = r"C:\Users\a138672\Downloads\Jeux_Escalade_Image"
START_PAGE_INDEX = 19  # Page 20 (0-indexed)

def extract_images():
    # Ensure output directory exists
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"Created output directory: {OUTPUT_DIR}")

    # Open the PDF
    try:
        doc = fitz.open(PDF_PATH)
        print(f"Opened PDF: {PDF_PATH}")
    except Exception as e:
        print(f"Error opening PDF: {e}")
        return

    image_counter = 1

    # Iterate through pages starting from the specified index
    for page_index in range(START_PAGE_INDEX, len(doc)):
        page = doc[page_index]
        page_num = page_index + 1
        print(f"Processing page {page_num}...")

        # Get page dimensions
        r = page.rect
        
        # Define the left half rectangle
        # x0, y0, x1, y1
        left_rect = fitz.Rect(r.x0, r.y0, (r.x0 + r.x1) / 2, r.y1)
        
        try:
            # Get pixmap of the left half
            pix = page.get_pixmap(clip=left_rect)
            
            # Construct filename
            # User requested: fichePeda_jeux_{numero de la numerisation}
            # We use image_counter as the number
            filename = f"fichePeda_jeux_{image_counter}.png"
            filepath = os.path.join(OUTPUT_DIR, filename)
            
            # Save image
            pix.save(filepath)
            
            print(f"    Saved: {filename}")
            image_counter += 1
            
        except Exception as e:
            print(f"    Error processing page {page_num}: {e}")

    print(f"Extraction complete. Saved {image_counter - 1} images.")
    
    # List generated files for verification
    if os.path.exists(OUTPUT_DIR):
        files = os.listdir(OUTPUT_DIR)
        print(f"Files in {OUTPUT_DIR}:")
        for f in files[:10]:
            print(f" - {f}")
        if len(files) > 10:
            print(f" ... and {len(files) - 10} more.")

if __name__ == "__main__":
    extract_images()
