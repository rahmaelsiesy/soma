#!/usr/bin/env python3
"""Generate Soma PWA icons (192x192 and 512x512) using Pillow."""

import os
import math

try:
    from PIL import Image, ImageDraw, ImageFont
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

def draw_rounded_rect(draw, xy, radius, fill):
    """Draw a rounded rectangle."""
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill)

def make_icon(size, output_path):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background rounded rect
    radius = int(size * 0.22)
    bg_color = (28, 28, 34, 255)  # #1c1c22
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=bg_color)

    # Draw "S" letter in gold #d4a44c
    gold = (212, 164, 76, 255)
    font_size = int(size * 0.58)
    
    # Try to load Inter or fall back to default
    font = None
    font_paths = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
        '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',
        '/usr/share/fonts/truetype/ubuntu/Ubuntu-B.ttf',
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                font = ImageFont.truetype(fp, font_size)
                break
            except Exception:
                continue
    
    if font is None:
        # Use default bitmap font, scale manually
        font = ImageFont.load_default()

    # Measure text
    bbox = draw.textbbox((0, 0), 'S', font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    
    # Center
    tx = (size - tw) // 2 - bbox[0]
    ty = (size - th) // 2 - bbox[1]
    # Slight vertical nudge
    ty = int(size * 0.5 - th / 2 - bbox[1] + size * 0.02)
    tx = int(size / 2 - tw / 2 - bbox[0])

    draw.text((tx, ty), 'S', font=font, fill=gold)

    # Save as PNG (convert RGBA to RGB with bg)
    final = Image.new('RGB', (size, size), (20, 20, 24))
    final.paste(img, mask=img.split()[3])
    final.save(output_path, 'PNG', optimize=True)
    print(f'Saved {output_path} ({size}x{size})')


if not HAS_PIL:
    # Fallback: generate simple SVG-based PNG using pure Python struct
    # We'll create a minimal PNG by hand for a simple icon
    import struct
    import zlib

    def create_simple_png(size, output_path):
        """Create a minimal PNG with a dark background and gold S using pure Python."""
        # We'll use a simple approach: create pixel data
        # Background: #1c1c22, letter area: #d4a44c
        
        bg = (28, 28, 34)
        gold = (212, 164, 76)
        
        width = height = size
        pixels = []
        
        # Simple "S" shape defined as relative coordinates
        # Scale from a 10x12 grid
        S_PIXELS = set()
        # Top bar
        for x in range(2, 8): S_PIXELS.add((x, 1))
        # Top-left vertical
        for y in range(1, 5): S_PIXELS.add((1, y))
        # Middle bar
        for x in range(2, 8): S_PIXELS.add((x, 5))
        # Right vertical lower
        for y in range(5, 9): S_PIXELS.add((8, y))
        # Bottom bar
        for x in range(2, 8): S_PIXELS.add((x, 9))
        # Bottom-left
        for y in range(6, 9): S_PIXELS.add((1, y))
        
        grid_size = 10
        cell = size // (grid_size + 2)
        offset_x = (size - cell * grid_size) // 2
        offset_y = (size - cell * (grid_size + 1)) // 2
        
        for y in range(height):
            row = []
            for x in range(width):
                # Compute rounded rect mask
                r = int(size * 0.22)
                in_bg = True
                if x < r and y < r:
                    in_bg = (x - r)**2 + (y - r)**2 <= r*r
                elif x > size - r - 1 and y < r:
                    in_bg = (x - (size - r - 1))**2 + (y - r)**2 <= r*r
                elif x < r and y > size - r - 1:
                    in_bg = (x - r)**2 + (y - (size - r - 1))**2 <= r*r
                elif x > size - r - 1 and y > size - r - 1:
                    in_bg = (x - (size - r - 1))**2 + (y - (size - r - 1))**2 <= r*r
                
                if not in_bg:
                    row.extend([20, 20, 24])
                    continue
                
                # Check if in S glyph
                gx = (x - offset_x) // cell
                gy = (y - offset_y) // cell
                if (gx, gy) in S_PIXELS:
                    row.extend(gold)
                else:
                    row.extend(bg)
            pixels.append(bytes(row))
        
        def png_chunk(name, data):
            chunk = name + data
            return struct.pack('>I', len(data)) + chunk + struct.pack('>I', zlib.crc32(chunk) & 0xffffffff)
        
        # IHDR
        ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
        
        # IDAT
        raw_data = b''
        for row in pixels:
            raw_data += b'\x00' + row
        compressed = zlib.compress(raw_data, 9)
        
        png = b'\x89PNG\r\n\x1a\n'
        png += png_chunk(b'IHDR', ihdr)
        png += png_chunk(b'IDAT', compressed)
        png += png_chunk(b'IEND', b'')
        
        with open(output_path, 'wb') as f:
            f.write(png)
        print(f'Saved {output_path} ({size}x{size}) [pure Python fallback]')
    
    output_dir = os.path.dirname(os.path.abspath(__file__))
    create_simple_png(192, os.path.join(output_dir, 'icon-192.png'))
    create_simple_png(512, os.path.join(output_dir, 'icon-512.png'))

else:
    output_dir = os.path.dirname(os.path.abspath(__file__))
    make_icon(192, os.path.join(output_dir, 'icon-192.png'))
    make_icon(512, os.path.join(output_dir, 'icon-512.png'))

print('Done.')
