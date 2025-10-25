#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script for the Accusation endpoint
Tests win/loss scenarios, validation, and game completion
"""

import sys
import requests
import json

# Configure UTF-8 output for Windows
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = 'http://localhost:3000/api'

def test_accusation_endpoint():
    """Test the accusation endpoint with multiple scenarios"""
    
    print("🧪 Testing Accusation Endpoint")
    print("=" * 60)
    
    # Step 1: Get available cases
    print("\n📋 Step 1: Get available cases...")
    response = requests.get(f'{BASE_URL}/cases')
    if response.status_code != 200:
        print(f"❌ Failed to get cases: {response.status_code}")
        return
    
    cases_data = response.json()
    if not cases_data.get('cases') or len(cases_data['cases']) == 0:
        print("❌ No cases found")
        return
    
    case = cases_data['cases'][0]
    case_id = case['case_id']
    print(f"✅ Found case: {case['title']}")
    
    # Step 2: Create a new game session
    print("\n🎮 Step 2: Create new game session...")
    response = requests.post(
        f'{BASE_URL}/games/start',
        json={'case_id': case_id}
    )
    if response.status_code != 201:
        print(f"❌ Failed to create game: {response.status_code}")
        print(response.text)
        return
    
    game_data = response.json()
    game_id = game_data['game']['game_id']
    print(f"✅ Game created: {game_id}")
    
    # Step 3: Get case details to find suspects and guilty suspect
    print("\n🔍 Step 3: Get case details...")
    response = requests.get(f'{BASE_URL}/cases/{case_id}')
    if response.status_code != 200:
        print(f"❌ Failed to get case details: {response.status_code}")
        return
    
    case_details = response.json()
    suspects = case_details.get('suspects', [])
    
    if not suspects or len(suspects) < 2:
        print("❌ Not enough suspects in case")
        return
    
    # Find guilty and innocent suspects from is_guilty field
    guilty_suspect = None
    innocent_suspect = None
    
    for suspect in suspects:
        if suspect.get('is_guilty', False):
            guilty_suspect = suspect
        elif innocent_suspect is None:
            innocent_suspect = suspect
    
    if not guilty_suspect or not innocent_suspect:
        print("❌ Could not identify guilty and innocent suspects")
        return
    
    guilty_suspect_id = guilty_suspect['suspect_id']
    
    print(f"✅ Found {len(suspects)} suspects")
    print(f"   Guilty: {guilty_suspect['name']} ({guilty_suspect_id})")
    print(f"   Innocent: {innocent_suspect['name']} ({innocent_suspect['suspect_id']})")
    
    # Step 4: Test accusation without required evidence (should fail)
    print("\n❌ Step 4: Test accusation WITHOUT required evidence...")
    response = requests.post(
        f'{BASE_URL}/accusation/{game_id}',
        json={'accused_suspect_id': guilty_suspect_id}
    )
    if response.status_code == 400:
        error_data = response.json()
        if 'missing required evidence' in error_data.get('error', '').lower():
            print(f"✅ Correctly rejected: {error_data['error']}")
            print(f"   Missing: {error_data.get('missing_count', 0)} / {error_data.get('total_required', 0)} required")
        else:
            print(f"⚠️ Got 400 but different error: {error_data.get('error')}")
    else:
        print(f"❌ Expected 400, got {response.status_code}")
        print(response.text)
    
    # Step 5: Unlock all required evidence
    print("\n🔓 Step 5: Unlock all required evidence...")
    response = requests.get(f'{BASE_URL}/evidence/case/{case_id}')
    if response.status_code != 200:
        print(f"❌ Failed to get evidence list: {response.status_code}")
        return
    
    evidence_data = response.json()
    all_evidence = evidence_data.get('evidence', [])
    required_evidence = [e for e in all_evidence if e.get('is_required_for_accusation')]
    
    print(f"   Total evidence: {len(all_evidence)}")
    print(f"   Required evidence: {len(required_evidence)}")
    
    # Unlock each required evidence item
    for evidence in required_evidence:
        evidence_id = evidence['evidence_id']
        display_name = evidence.get('display_name', 'Unknown')
        
        response = requests.post(
            f'{BASE_URL}/evidence/game/{game_id}/unlock',
            json={'evidence_id': evidence_id}
        )
        if response.status_code == 200:
            print(f"   ✅ Unlocked: {display_name}")
        else:
            print(f"   ❌ Failed to unlock: {display_name}")
    
    # Step 6: Verify all required evidence is unlocked
    print("\n📊 Step 6: Verify evidence stats...")
    response = requests.get(f'{BASE_URL}/evidence/game/{game_id}/stats')
    if response.status_code != 200:
        print(f"❌ Failed to get stats: {response.status_code}")
        return
    
    stats_data = response.json()
    stats = stats_data.get('stats', {})
    print(f"✅ Stats retrieved:")
    print(f"   Progress: {stats.get('progress_percent', 0)}%")
    print(f"   Unlocked: {stats.get('unlocked_count', 0)} / {stats.get('total_evidence', 0)}")
    print(f"   Can accuse: {stats.get('can_make_accusation', False)}")
    
    if not stats.get('can_make_accusation'):
        print("❌ Still cannot make accusation even after unlocking")
        return
    
    # Step 7: Test WRONG accusation (accuse innocent suspect)
    print("\n❌ Step 7: Test WRONG accusation...")
    response = requests.post(
        f'{BASE_URL}/accusation/{game_id}',
        json={'accused_suspect_id': innocent_suspect['suspect_id']}
    )
    if response.status_code != 200:
        print(f"❌ Request failed: {response.status_code}")
        print(response.text)
        return
    
    result_data = response.json()
    result = result_data.get('result', {})
    
    if result.get('is_correct') == False and result.get('game_over') == True:
        print(f"✅ Wrong accusation handled correctly:")
        print(f"   Message: {result.get('message')}")
        print(f"   Accused: {result['accused_suspect']['name']}")
        print(f"   Guilty: {result['guilty_suspect']['name']}")
        print(f"   Game over: {result.get('game_over')}")
    else:
        print(f"❌ Wrong accusation result unexpected:")
        print(json.dumps(result, indent=2))
    
    # Step 8: Test accusation on completed game (should fail)
    print("\n🚫 Step 8: Test accusation on COMPLETED game...")
    response = requests.post(
        f'{BASE_URL}/accusation/{game_id}',
        json={'accused_suspect_id': guilty_suspect_id}
    )
    if response.status_code == 400:
        error_data = response.json()
        if 'already completed' in error_data.get('error', '').lower():
            print(f"✅ Correctly rejected: {error_data['error']}")
        else:
            print(f"⚠️ Got 400 but different error: {error_data.get('error')}")
    else:
        print(f"❌ Expected 400, got {response.status_code}")
    
    # Step 9: Create NEW game for correct accusation test
    print("\n🎮 Step 9: Create new game for CORRECT accusation test...")
    response = requests.post(
        f'{BASE_URL}/games/start',
        json={'case_id': case_id}
    )
    if response.status_code != 201:
        print(f"❌ Failed to create game: {response.status_code}")
        return
    
    game_data = response.json()
    game_id_2 = game_data['game']['game_id']
    print(f"✅ New game created: {game_id_2}")
    
    # Step 10: Unlock all required evidence for new game
    print("\n🔓 Step 10: Unlock required evidence for new game...")
    for evidence in required_evidence:
        evidence_id = evidence['evidence_id']
        response = requests.post(
            f'{BASE_URL}/evidence/game/{game_id_2}/unlock',
            json={'evidence_id': evidence_id}
        )
    print(f"✅ Unlocked {len(required_evidence)} required evidence items")
    
    # Step 11: Test CORRECT accusation (accuse guilty suspect)
    print("\n✅ Step 11: Test CORRECT accusation...")
    response = requests.post(
        f'{BASE_URL}/accusation/{game_id_2}',
        json={'accused_suspect_id': guilty_suspect_id}
    )
    if response.status_code != 200:
        print(f"❌ Request failed: {response.status_code}")
        print(response.text)
        return
    
    result_data = response.json()
    result = result_data.get('result', {})
    
    if result.get('is_correct') == True and result.get('game_over') == True:
        print(f"✅ Correct accusation handled correctly:")
        print(f"   Message: {result.get('message')}")
        print(f"   Accused: {result['accused_suspect']['name']}")
        print(f"   Guilty: {result['guilty_suspect']['name']}")
        print(f"   Evidence collected: {result.get('evidence_collected')} / {result.get('total_evidence')}")
        print(f"   Game over: {result.get('game_over')}")
    else:
        print(f"❌ Correct accusation result unexpected:")
        print(json.dumps(result, indent=2))
    
    # Step 12: Test invalid suspect_id
    print("\n🚫 Step 12: Test invalid suspect_id...")
    response = requests.post(
        f'{BASE_URL}/games/start',
        json={'case_id': case_id}
    )
    game_id_3 = response.json()['game']['game_id']
    
    # Unlock evidence
    for evidence in required_evidence:
        requests.post(
            f'{BASE_URL}/evidence/game/{game_id_3}/unlock',
            json={'evidence_id': evidence['evidence_id']}
        )
    
    # Try with fake UUID
    response = requests.post(
        f'{BASE_URL}/accusation/{game_id_3}',
        json={'accused_suspect_id': '00000000-0000-0000-0000-000000000000'}
    )
    if response.status_code == 400:
        error_data = response.json()
        if 'suspect not found' in error_data.get('error', '').lower():
            print(f"✅ Correctly rejected: {error_data['error']}")
        else:
            print(f"⚠️ Got 400 but different error: {error_data.get('error')}")
    else:
        print(f"❌ Expected 400, got {response.status_code}")
    
    # Step 13: Test missing accused_suspect_id
    print("\n🚫 Step 13: Test missing accused_suspect_id...")
    response = requests.post(
        f'{BASE_URL}/accusation/{game_id_3}',
        json={}
    )
    if response.status_code == 400:
        error_data = response.json()
        if 'missing' in error_data.get('error', '').lower():
            print(f"✅ Correctly rejected: {error_data['error']}")
        else:
            print(f"⚠️ Got 400 but different error: {error_data.get('error')}")
    else:
        print(f"❌ Expected 400, got {response.status_code}")
    
    print("\n" + "=" * 60)
    print("✅ All accusation endpoint tests completed!")
    print("=" * 60)

if __name__ == '__main__':
    try:
        test_accusation_endpoint()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to backend server")
        print("   Make sure the server is running on http://localhost:3000")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
