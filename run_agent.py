import os
import json
import random
import requests

# 1. Configuration & Inputs
TARGET_IMAGE = os.environ.get("TARGET_IMAGE_URL")
DATA_FILE = "data.json"

if not TARGET_IMAGE:
    print("Error: No target image URL provided.")
    exit(1)

print(f"Processing viral image: {TARGET_IMAGE}")

# 2. Agent 1: Reverse-Engineer Image to Prompt (Free Hugging Face Vision API)
# We use a public model to generate a highly detailed prompt from your image URL
print("Analyzing image and reverse-engineering prompt...")
HF_MODEL_URL = "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large"
response = requests.post(HF_MODEL_URL, json={"inputs": TARGET_IMAGE})

if response.status_code == 200:
    raw_caption = response.json()[0].get("generated_text", "Aesthetic portrait")
else:
    raw_caption = "Aesthetic cinematic street portrait"

# Enhance the caption into a Midjourney/SD structured prompt style
generated_prompt = (
    f"Ultra-realistic cinematic portrait of {raw_caption}. "
    f"Photorealistic, sharp focus, volumetric lighting, highly detailed, "
    f"8k resolution, photorealistic, cinematic composition, depth of field."
)

print(f"Generated Prompt: {generated_prompt}")

# 3. Agent 2: Generate Similar Image (Free Pollinations.ai API)
# Pollinations.ai provides high-quality AI images instantly with no login or key required
encoded_prompt = requests.utils.quote(generated_prompt)
new_image_url = f"https://image.pollinations.ai/p/{encoded_prompt}?width=1024&height=1024&nologo=true"

# 4. Agent 3: Format and Update data.json
# Load current database
with open(DATA_FILE, "r") as f:
    data = json.load(f)

# Find the highest ID and increment it
existing_ids = [int(item["id"]) for item in data if item["id"].isdigit()]
next_id = str(max(existing_ids) + 1) if existing_ids else "1"

# Generate an aesthetic random Tag
tags_pool = ["Vibe", "Elegance", "Contrast", "Chroma", "Vivid", "Noir", "Lumina"]
chosen_tag = f"{random.choice(tags_pool)} {next_id}"

# Build the new entry matching your exact schema structure
new_entry = {
    "tag": chosen_tag,
    "image": new_image_url,
    "prompt": generated_prompt,
    "status": "featured",
    "id": next_id
}

# Prepend or append to your list
data.insert(0, new_entry)  # Prepend so it shows up as the newest on top

# Write changes back to data.json
with open(DATA_FILE, "w") as f:
    json.dump(data, f, indent=4)

print(f"Successfully added Entry #{next_id} to data.json!")
