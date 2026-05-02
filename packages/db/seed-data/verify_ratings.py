import json
import os

dir = r"C:\X\ARSENAL\_DEV_SPACE\@PROJECTS\SUPERPROMPT\packages\db\seed-data"

files = [
    "Business.json","Education.json","Coding.json","Productivity.json",
    "Human-Resources.json","E-Commerce.json","Finance.json","Photography.json",
    "Design.json","Customer-Service.json","Art.json","Lawyers.json","Architecture.json",
    "SEO.json","Solopreneurs.json","Real-Estate.json","Writing.json"
]

total_rated = 0
total_prompts = 0

for f in files:
    try:
        data = json.load(open(os.path.join(dir,f), encoding="utf-8"))
        rated = sum(1 for i in data if "rating" in i)
        print(f"{f.replace('.json',''):20} {rated:4}/{len(data):4}")
        total_rated += rated
        total_prompts += len(data)
    except Exception as e:
        print(f"{f}: Error - {e}")

print(f"\nTOTAL: {total_rated}/{total_prompts} rated")