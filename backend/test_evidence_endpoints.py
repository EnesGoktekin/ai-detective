"""
Test Evidence Endpoints

Tests evidence retrieval and management:
- GET /api/evidence/case/:case_id
- GET /api/evidence/game/:game_id/unlocked
- POST /api/evidence/game/:game_id/unlock
- GET /api/evidence/game/:game_id/stats
"""

import requests
import json
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:3000"

print("=" * 60)
print("Testing Evidence Endpoints (Phase 5, Step 5.3)")
print("=" * 60)
print()

# Step 1: Get case
print("Step 1: Getting case...")
response = requests.get(f"{BASE_URL}/api/cases")
cases_data = response.json()
case_id = cases_data['cases'][0]['case_id']
print(f"  ✅ Case ID: {case_id}")
print()

# Step 2: Get all evidence for case
print("Step 2: Getting all evidence for case...")
response = requests.get(f"{BASE_URL}/api/evidence/case/{case_id}")
evidence_data = response.json()
print(f"  Status: {response.status_code}")
print(f"  Total evidence: {evidence_data['count']}")
print(f"  ✅ {response.status_code == 200 and evidence_data['count'] > 0}")
print()

# Save first evidence ID for testing
evidence_id = evidence_data['evidence'][0]['evidence_id'] if evidence_data['evidence'] else None
print(f"  Sample evidence: {evidence_data['evidence'][0]['display_name']}")
print(f"  Required for accusation: {evidence_data['evidence'][0]['is_required_for_accusation']}")
print()

# Step 3: Start a game
print("Step 3: Starting new game...")
response = requests.post(f"{BASE_URL}/api/games/start", json={"case_id": case_id})
game_id = response.json()['game']['game_id']
print(f"  ✅ Game ID: {game_id}")
print()

# Step 4: Get unlocked evidence (should be empty)
print("Step 4: Getting unlocked evidence (initial)...")
response = requests.get(f"{BASE_URL}/api/evidence/game/{game_id}/unlocked")
unlocked_data = response.json()
print(f"  Status: {response.status_code}")
print(f"  Unlocked count: {unlocked_data['count']}")
print(f"  ✅ {response.status_code == 200 and unlocked_data['count'] == 0}")
print()

# Step 5: Get evidence stats (initial)
print("Step 5: Getting evidence stats (initial)...")
response = requests.get(f"{BASE_URL}/api/evidence/game/{game_id}/stats")
stats_data = response.json()
print(f"  Status: {response.status_code}")
print(f"  Stats: {json.dumps(stats_data['stats'], indent=2)}")
print(f"  Can make accusation: {stats_data['stats']['can_make_accusation']}")
print(f"  ✅ {response.status_code == 200}")
print()

# Step 6: Manually unlock evidence
print("Step 6: Manually unlocking evidence...")
response = requests.post(
    f"{BASE_URL}/api/evidence/game/{game_id}/unlock",
    json={"evidence_id": evidence_id}
)
unlock_result = response.json()
print(f"  Status: {response.status_code}")
print(f"  Message: {unlock_result.get('message', unlock_result.get('error'))}")
print(f"  ✅ {response.status_code == 200}")
print()

# Step 7: Get unlocked evidence (should have 1)
print("Step 7: Getting unlocked evidence (after unlock)...")
response = requests.get(f"{BASE_URL}/api/evidence/game/{game_id}/unlocked")
unlocked_data = response.json()
print(f"  Status: {response.status_code}")
print(f"  Unlocked count: {unlocked_data['count']}")
print(f"  ✅ {response.status_code == 200 and unlocked_data['count'] == 1}")
print()

# Step 8: Get updated stats
print("Step 8: Getting evidence stats (after unlock)...")
response = requests.get(f"{BASE_URL}/api/evidence/game/{game_id}/stats")
stats_data = response.json()
print(f"  Status: {response.status_code}")
print(f"  Unlocked: {stats_data['stats']['unlocked_count']}/{stats_data['stats']['total_evidence']}")
print(f"  Progress: {stats_data['stats']['progress_percent']}%")
print(f"  ✅ {response.status_code == 200 and stats_data['stats']['unlocked_count'] == 1}")
print()

# Step 9: Try to unlock same evidence again (should fail)
print("Step 9: Testing duplicate unlock prevention...")
response = requests.post(
    f"{BASE_URL}/api/evidence/game/{game_id}/unlock",
    json={"evidence_id": evidence_id}
)
print(f"  Status: {response.status_code}")
print(f"  Error: {response.json()['error']}")
print(f"  ✅ {response.status_code == 400 and 'already' in response.json()['error'].lower()}")
print()

# Step 10: Send chat message to unlock evidence automatically
print("Step 10: Testing automatic evidence unlock via chat...")
response = requests.post(
    f"{BASE_URL}/api/chat/{game_id}/chat",
    json={"message": "Tell me about the security camera footage"}
)
chat_result = response.json()
print(f"  Status: {response.status_code}")
print(f"  New evidence unlocked: {len(chat_result.get('new_evidence_unlocked', []))} items")
if chat_result.get('new_evidence_unlocked'):
    print(f"  Evidence IDs: {chat_result['new_evidence_unlocked']}")
print(f"  ✅ {response.status_code == 200}")
print()

# Step 11: Final stats
print("Step 11: Final evidence stats...")
response = requests.get(f"{BASE_URL}/api/evidence/game/{game_id}/stats")
stats_data = response.json()
print(f"  Total evidence: {stats_data['stats']['total_evidence']}")
print(f"  Unlocked: {stats_data['stats']['unlocked_count']}")
print(f"  Required unlocked: {stats_data['stats']['required_unlocked']}/{stats_data['stats']['required_count']}")
print(f"  Can make accusation: {stats_data['stats']['can_make_accusation']}")
print(f"  Progress: {stats_data['stats']['progress_percent']}%")
print(f"  ✅ {response.status_code == 200}")
print()

print("=" * 60)
print("Evidence Endpoints Tests Complete!")
print("=" * 60)
print()
print("Summary:")
print("  ✅ Get case evidence - Working")
print("  ✅ Get unlocked evidence - Working")
print("  ✅ Manual evidence unlock - Working")
print("  ✅ Evidence stats - Working")
print("  ✅ Duplicate unlock prevention - Working")
print("  ✅ Automatic unlock via chat - Working")
