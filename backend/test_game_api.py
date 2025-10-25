import requests
import json

print("Testing Game Session Management API...\n")

BASE_URL = "http://localhost:3000/api"

# Step 1: Get a case to start game with
print("1. Getting available cases...")
response = requests.get(f"{BASE_URL}/cases")
cases = response.json().get('cases', [])
if not cases:
    print("❌ No cases available!")
    exit(1)

case = cases[0]
case_id = case['case_id']
print(f"   Using case: {case['title']} ({case_id})\n")

# Step 2: Start a new game
print("2. Starting new game session...")
response = requests.post(f"{BASE_URL}/games/start", json={'case_id': case_id})
print(f"   Status: {response.status_code}")
if response.status_code == 201:
    game_data = response.json()
    print(f"   Success: {game_data.get('success')}")
    game = game_data.get('game', {})
    game_id = game.get('game_id')
    print(f"   Game ID: {game_id}")
    print(f"   Completed: {game.get('is_completed')}\n")
else:
    print(f"   ❌ Error: {response.json()}\n")
    exit(1)

# Step 3: Get game details
print("3. Fetching game session details...")
response = requests.get(f"{BASE_URL}/games/{game_id}")
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"   Success: {data.get('success')}")
    game = data.get('game', {})
    stats = data.get('stats', {})
    print(f"   Case: {game.get('case_title')}")
    print(f"   Completed: {game.get('is_completed')}")
    print(f"   Messages: {stats.get('total_messages', 0)}")
    print(f"   Evidence Found: {stats.get('evidence_found', 0)}\n")
else:
    print(f"   ❌ Error: {response.json()}\n")

# Step 4: End game session
print("4. Ending game session...")
response = requests.delete(f"{BASE_URL}/games/{game_id}")
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"   Success: {data.get('success')}")
    print(f"   Message: {data.get('message')}\n")
else:
    print(f"   ❌ Error: {response.json()}\n")

# Step 5: Verify game ended
print("5. Verifying game status...")
response = requests.get(f"{BASE_URL}/games/{game_id}")
if response.status_code == 200:
    data = response.json()
    game = data.get('game', {})
    print(f"   Completed: {game.get('is_completed')}")
    print(f"   Last Updated: {game.get('last_updated') is not None}\n")

print("✅ All game session tests completed!")
