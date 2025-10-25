"""
Simple Chat Test - Debug version
"""

import requests
import json
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:3000"

# Get case
print("Getting case...")
response = requests.get(f"{BASE_URL}/api/cases")
cases_data = response.json()
case_id = cases_data['cases'][0]['case_id']
print(f"Case ID: {case_id}\n")

# Start game
print("Starting game...")
response = requests.post(f"{BASE_URL}/api/games/start", json={"case_id": case_id})
game_id = response.json()['game']['game_id']
print(f"Game ID: {game_id}\n")

# Send message
print("Sending message...")
response = requests.post(
    f"{BASE_URL}/api/chat/{game_id}/chat",
    json={"message": "Who are the suspects?"}
)

print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")
