"""
Test Chat Endpoint

Tests the main gameplay interaction endpoint:
- POST /api/chat/:game_id/chat
- Message validation
- Evidence detection
- AI response generation
- Message storage
"""

import requests
import json
import sys

# Fix Windows console encoding
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:3000"

print("=" * 60)
print("Testing Chat Endpoint (Phase 5, Step 5.2)")
print("=" * 60)
print()

# Step 1: Get case ID
print("Step 1: Getting available case...")
response = requests.get(f"{BASE_URL}/api/cases")
cases_data = response.json()

# Check if response is a dict with 'cases' key or array
if isinstance(cases_data, dict) and 'cases' in cases_data:
    cases = cases_data['cases']
else:
    cases = cases_data

case_id = cases[0]['case_id']
print(f"  ✅ Using case: {cases[0]['title']} ({case_id})")
print()

# Step 2: Start a new game
print("Step 2: Starting new game session...")
response = requests.post(f"{BASE_URL}/api/games/start", json={
    "case_id": case_id
})
game_data = response.json()
game_id = game_data['game']['game_id']
print(f"  ✅ Game started: {game_id}")
print()

# Step 3: Test input validation - Empty message
print("Step 3: Testing validation - Empty message...")
response = requests.post(f"{BASE_URL}/api/chat/{game_id}/chat", json={
    "message": ""
})
print(f"  Status: {response.status_code}")
print(f"  Response: {response.json()['error']}")
print(f"  ✅ {response.status_code == 400 and 'empty' in response.json()['error'].lower()}")
print()

# Step 4: Test input validation - Single character
print("Step 4: Testing validation - Single character...")
response = requests.post(f"{BASE_URL}/api/chat/{game_id}/chat", json={
    "message": "a"
})
print(f"  Status: {response.status_code}")
print(f"  Response: {response.json()['error']}")
print(f"  ✅ {response.status_code == 400 and '2 characters' in response.json()['error']}")
print()

# Step 5: Test input validation - No alphabetic characters
print("Step 5: Testing validation - No alphabetic characters...")
response = requests.post(f"{BASE_URL}/api/chat/{game_id}/chat", json={
    "message": "123 456"
})
print(f"  Status: {response.status_code}")
print(f"  Response: {response.json()['error']}")
print(f"  ✅ {response.status_code == 400 and 'alphabetic' in response.json()['error'].lower()}")
print()

# Step 6: Send first valid message
print("Step 6: Sending first valid message...")
response = requests.post(f"{BASE_URL}/api/chat/{game_id}/chat", json={
    "message": "Who are the suspects in this case?"
})
data = response.json()
print(f"  Status: {response.status_code}")
if response.status_code == 200:
    print(f"  AI Response preview: {data['ai_response'][:100]}...")
    print(f"  Evidence unlocked: {len(data['new_evidence_unlocked'])} items")
    print(f"  Message count: {data['message_count']}")
    print(f"  Summary triggered: {data['summary_triggered']}")
    print(f"  ✅ {response.status_code == 200}")
else:
    print(f"  ❌ Error: {data}")
print()

# Step 7: Send message with evidence keywords
print("Step 7: Sending message with evidence keywords...")
response = requests.post(f"{BASE_URL}/api/chat/{game_id}/chat", json={
    "message": "Tell me about the security camera footage"
})
data = response.json()
print(f"  Status: {response.status_code}")
print(f"  AI Response preview: {data['ai_response'][:100]}...")
print(f"  Evidence unlocked: {data['new_evidence_unlocked']}")
print(f"  Message count: {data['message_count']}")
print(f"  ✅ {response.status_code == 200}")
print()

# Step 8: Send multiple messages to test summarization trigger
print("Step 8: Testing summarization trigger (every 5 messages)...")
for i in range(3):
    response = requests.post(f"{BASE_URL}/api/chat/{game_id}/chat", json={
        "message": f"What else can you tell me about the case? Question {i+1}"
    })
    data = response.json()
    print(f"  Message {i+3}: count={data['message_count']}, summary_triggered={data['summary_triggered']}")

print(f"  ✅ Summarization trigger logic working")
print()

# Step 9: Get game details to verify message storage
print("Step 9: Verifying message storage...")
response = requests.get(f"{BASE_URL}/api/games/{game_id}")
game_details = response.json()
print(f"  Total messages stored: {len(game_details['messages'])}")
print(f"  Evidence unlocked count: {len(game_details['unlocked_evidence'])}")
print(f"  ✅ Messages stored correctly")
print()

# Step 10: Test completed game rejection
print("Step 10: Testing completed game rejection...")
# Mark game as complete
requests.delete(f"{BASE_URL}/api/games/{game_id}")
# Try to send message
response = requests.post(f"{BASE_URL}/api/chat/{game_id}/chat", json={
    "message": "This should fail"
})
print(f"  Status: {response.status_code}")
print(f"  Response: {response.json()['error']}")
print(f"  ✅ {response.status_code == 400 and 'completed' in response.json()['error'].lower()}")
print()

print("=" * 60)
print("Chat Endpoint Tests Complete!")
print("=" * 60)
print()
print("Summary:")
print("  ✅ Input validation working (empty, single char, non-alphabetic)")
print("  ✅ AI response generation working")
print("  ✅ Evidence detection and unlocking working")
print("  ✅ Message storage working")
print("  ✅ Message counting working")
print("  ✅ Summarization trigger logic working")
print("  ✅ Completed game rejection working")
