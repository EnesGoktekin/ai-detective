import requests
import json

print("Testing AI System Implementation...\n")

BASE_URL = "http://localhost:3000/api"

# First, get a case to work with
print("1. Getting case data...")
response = requests.get(f"{BASE_URL}/cases")
cases = response.json().get('cases', [])
if not cases:
    print("❌ No cases available!")
    exit(1)

case_id = cases[0]['case_id']
print(f"   Using case: {cases[0]['title']}\n")

# Get full case data for AI context
print("2. Fetching complete case data...")
response = requests.get(f"{BASE_URL}/cases/{case_id}")
if response.status_code != 200:
    print(f"❌ Failed to get case data: {response.status_code}")
    exit(1)

case_data = response.json()
print(f"   ✅ Got case with {len(case_data.get('suspects', []))} suspects")
print(f"   ✅ Got {len(case_data.get('scene_objects', []))} scene objects")
print(f"   ✅ Got {len(case_data.get('evidence', []))} evidence items\n")

# Test evidence detection
print("3. Testing Evidence Detection Logic...")
print("   Testing with mock messages containing keywords...\n")

# This would test the evidence-detection.ts utility
# For now, we'll test via API once chat endpoint is ready
print("   ⏭️  Evidence detection will be tested via chat endpoint\n")

# Test AI prompt generation
print("4. Testing AI Prompt Test Endpoint...")
test_prompt = "Describe the crime scene to me."
response = requests.post(
    f"{BASE_URL}/ai/prompt",
    json={"prompt": test_prompt}
)

if response.status_code == 200:
    ai_response = response.json()
    print(f"   ✅ AI responded successfully")
    print(f"   Response preview: {ai_response.get('response', '')[:100]}...\n")
else:
    print(f"   ❌ AI test failed: {response.status_code}\n")

# Summary of what we validated
print("=" * 60)
print("AI SYSTEM IMPLEMENTATION - VALIDATION SUMMARY")
print("=" * 60)
print("\n✅ Phase 4 Components Created:")
print("   - Chat AI Service (generateChatResponse)")
print("   - Summarizing AI Service (generateConversationSummary)")
print("   - Evidence Detection Logic (keyword matching)")
print("   - AI Context Manager (message & summary management)")
print("   - Summary Trigger Logic (every 5 messages)")
print("\n⏭️  Next Step: Create Chat Endpoint to integrate all components")
print("\nNOTE: Full integration testing will happen after chat endpoint is created.")
print("      This will test:")
print("      - Sending user messages")
print("      - AI generating responses using case context")
print("      - Evidence auto-unlocking from conversations")
print("      - Summary generation after 5 messages")
print("      - Message history retrieval")
