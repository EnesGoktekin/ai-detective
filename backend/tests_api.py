import requests
import json

print("Testing all Cases API endpoints...\n")

# Test 1: Ping
print("1. Testing /api/cases/ping")
response = requests.get('http://localhost:3000/api/cases/ping')
print(f"   Status: {response.status_code}")
print(f"   Response: {response.json()}\n")

# Test 2: Get all cases
print("2. Testing /api/cases (Get all cases)")
response = requests.get('http://localhost:3000/api/cases')
print(f"   Status: {response.status_code}")
data = response.json()
print(f"   Success: {data.get('success')}")
print(f"   Count: {data.get('count')}")
first_case_id = None
if data.get('cases'):
    for case in data['cases']:
        print(f"   - Case {case['case_id']}: {case['title']}")
        if not first_case_id:
            first_case_id = case['case_id']
    print()

# Test 3: Get Case 1 details (using actual UUID)
if not first_case_id:
    print("3. SKIPPED: No cases found\n")
else:
    print(f"3. Testing /api/cases/{first_case_id} (Get case full data)")
    response = requests.get(f'http://localhost:3000/api/cases/{first_case_id}')
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"   Success: {data.get('success')}")
    if data.get('stats'):
        stats = data['stats']
        print(f"   Title: {data.get('case', {}).get('title')}")
        print(f"   Suspects: {stats.get('total_suspects', 0)}")
        print(f"   Scene Objects: {stats.get('total_scene_objects', 0)}")
        print(f"   Evidence: {stats.get('total_evidence', 0)}")
        print(f"   Required Evidence: {stats.get('required_evidence', 0)}\n")
else:
    print(f"   Error: {response.json()}\n")

# Test 4: Test Case data integrity (using actual UUID)
if not first_case_id:
    print("4. SKIPPED: No cases found\n")
else:
    print(f"4. Testing /api/cases/{first_case_id}/test (Data integrity check)")
    response = requests.get(f'http://localhost:3000/api/cases/{first_case_id}/test')
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"   Valid: {data.get('valid')}")
    if data.get('tests'):
        tests = data['tests']
        summary = data.get('summary', {})
        print(f"   Case Title: {data.get('case_title')}")
        print(f"   Tests Passed: {summary.get('passed_tests', 0)}/{summary.get('total_tests', 0)}")
        print(f"   Suspects: {tests.get('suspects_count', 0)}")
        print(f"   Scene Objects: {tests.get('scene_objects_count', 0)}")
        print(f"   Evidence: {tests.get('evidence_count', 0)}")
        print(f"   Guilty Suspect: {data.get('guilty_suspect', 'Unknown')}")
        
        # Show failures
        failed = []
        for key, value in tests.items():
            if value is False:
                failed.append(key)
        if failed:
            print(f"\n   ⚠️  Failed tests ({len(failed)}):")
            for fail in failed[:5]:  # Show first 5
                print(f"      - {fail}")
else:
    print(f"   Error: {response.json()}")

print("\n✅ All tests completed!")
