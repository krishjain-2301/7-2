from PIL import Image, PngImagePlugin
import sys

def add_metadata(image_path, key, value):
    try:
        img = Image.open(image_path)
        metadata = PngImagePlugin.PngInfo()
        metadata.add_text(key, value)
        img.save(image_path, "PNG", pnginfo=metadata)
        print(f"Successfully added metadata {key}: {value} to {image_path}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    add_metadata("boat_house.png", "Author", "Maya")
