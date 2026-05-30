from PIL import Image

def embed_lsb(image_path, secret_message, output_path):
    img = Image.open(image_path).convert('RGB')
    pixels = img.load()
    
    # Convert message to binary, add a standard delimiter that stego tools look for (null byte or custom)
    binary_message = ''.join(format(ord(char), '08b') for char in secret_message)
    binary_message += '00000000' # Null byte delimiter for end of string
    
    data_index = 0
    message_length = len(binary_message)
    
    for y in range(img.height):
        for x in range(img.width):
            if data_index < message_length:
                r, g, b = pixels[x, y]
                
                r = (r & ~1) | int(binary_message[data_index])
                data_index += 1
                
                if data_index < message_length:
                    g = (g & ~1) | int(binary_message[data_index])
                    data_index += 1
                    
                if data_index < message_length:
                    b = (b & ~1) | int(binary_message[data_index])
                    data_index += 1
                    
                pixels[x, y] = (r, g, b)
            else:
                break
        if data_index >= message_length:
            break
            
    img.save(output_path)
    print("LSB embedding complete.")

msg = "SUBJECT_ID: A-01 | CLASSIFICATION: PR1DE | AUTH: M4Y4"
embed_lsb('group_photo.png', msg, 'group_photo.png')
