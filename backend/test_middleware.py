#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script for Request Validation and Error Handling Middleware
Tests validation rules, error responses, and edge cases
"""

import sys
import requests
import json

# Configure UTF-8 output for Windows
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = 'http://localhost:3000/api'

def test_middleware():
    """Test validation and error handling middleware"""
    
    print("🧪 Testing Middleware (Validation & Error Handling)")
    print("=" * 60)
    
    # Test 1: Invalid UUID in URL parameter
    print("\n🔍 Test 1: Invalid UUID in game_id...")
    response = requests.post(
        f'{BASE_URL}/chat/invalid-uuid/chat',
        json={'message': 'Test message'}
    )
    if response.status_code == 400 or response.status_code == 404:
        print(f"✅ Correctly rejected invalid UUID (Status: {response.status_code})")
        if response.status_code == 400:
            print(f"   Error: {response.json().get('error', 'Unknown')}")
    else:
        print(f"❌ Expected 400/404, got {response.status_code}")
    
    # Test 2: Missing required field in body
    print("\n🔍 Test 2: Missing message field in chat...")
    response = requests.get(f'{BASE_URL}/cases')
    if response.status_code == 200:
        cases = response.json().get('cases', [])
        if cases:
            # Create game first
            game_response = requests.post(
                f'{BASE_URL}/games/start',
                json={'case_id': cases[0]['case_id']}
            )
            if game_response.status_code == 201:
                game_id = game_response.json()['game']['game_id']
                
                # Try chat without message
                response = requests.post(
                    f'{BASE_URL}/chat/{game_id}/chat',
                    json={}
                )
                if response.status_code == 400:
                    error_data = response.json()
                    print(f"✅ Correctly rejected missing field")
                    print(f"   Error: {error_data.get('error', 'Unknown')}")
                else:
                    print(f"❌ Expected 400, got {response.status_code}")
    
    # Test 3: Empty message
    print("\n🔍 Test 3: Empty message...")
    response = requests.get(f'{BASE_URL}/cases')
    if response.status_code == 200:
        cases = response.json().get('cases', [])
        if cases:
            game_response = requests.post(
                f'{BASE_URL}/games/start',
                json={'case_id': cases[0]['case_id']}
            )
            if game_response.status_code == 201:
                game_id = game_response.json()['game']['game_id']
                
                response = requests.post(
                    f'{BASE_URL}/chat/{game_id}/chat',
                    json={'message': '   '}
                )
                if response.status_code == 400:
                    error_data = response.json()
                    print(f"✅ Correctly rejected empty message")
                    print(f"   Error: {error_data.get('error', 'Unknown')}")
                else:
                    print(f"❌ Expected 400, got {response.status_code}")
    
    # Test 4: Single character message
    print("\n🔍 Test 4: Single character message...")
    response = requests.get(f'{BASE_URL}/cases')
    if response.status_code == 200:
        cases = response.json().get('cases', [])
        if cases:
            game_response = requests.post(
                f'{BASE_URL}/games/start',
                json={'case_id': cases[0]['case_id']}
            )
            if game_response.status_code == 201:
                game_id = game_response.json()['game']['game_id']
                
                response = requests.post(
                    f'{BASE_URL}/chat/{game_id}/chat',
                    json={'message': 'a'}
                )
                if response.status_code == 400:
                    error_data = response.json()
                    print(f"✅ Correctly rejected single character")
                    print(f"   Error: {error_data.get('error', 'Unknown')}")
                else:
                    print(f"❌ Expected 400, got {response.status_code}")
    
    # Test 5: Message with invalid characters (numbers, symbols)
    print("\n🔍 Test 5: Message with invalid characters...")
    response = requests.get(f'{BASE_URL}/cases')
    if response.status_code == 200:
        cases = response.json().get('cases', [])
        if cases:
            game_response = requests.post(
                f'{BASE_URL}/games/start',
                json={'case_id': cases[0]['case_id']}
            )
            if game_response.status_code == 201:
                game_id = game_response.json()['game']['game_id']
                
                response = requests.post(
                    f'{BASE_URL}/chat/{game_id}/chat',
                    json={'message': 'Test123!@#'}
                )
                if response.status_code == 400:
                    error_data = response.json()
                    print(f"✅ Correctly rejected invalid characters")
                    print(f"   Error: {error_data.get('error', 'Unknown')}")
                else:
                    print(f"❌ Expected 400, got {response.status_code}")
    
    # Test 6: Valid message (should pass validation)
    print("\n🔍 Test 6: Valid message...")
    response = requests.get(f'{BASE_URL}/cases')
    if response.status_code == 200:
        cases = response.json().get('cases', [])
        if cases:
            game_response = requests.post(
                f'{BASE_URL}/games/start',
                json={'case_id': cases[0]['case_id']}
            )
            if game_response.status_code == 201:
                game_id = game_response.json()['game']['game_id']
                
                response = requests.post(
                    f'{BASE_URL}/chat/{game_id}/chat',
                    json={'message': 'Who are the suspects?'}
                )
                if response.status_code == 200:
                    print(f"✅ Valid message accepted")
                    print(f"   AI Response received")
                else:
                    print(f"⚠️ Got status {response.status_code}")
                    print(f"   Response: {response.text[:100]}")
    
    # Test 7: 404 for non-existent route
    print("\n🔍 Test 7: Non-existent route (404 handler)...")
    response = requests.get(f'{BASE_URL}/nonexistent/route')
    if response.status_code == 404:
        error_data = response.json()
        print(f"✅ 404 handler working")
        print(f"   Error: {error_data.get('error', 'Unknown')}")
        print(f"   Path: {error_data.get('path', 'Unknown')}")
    else:
        print(f"❌ Expected 404, got {response.status_code}")
    
    # Test 8: Invalid JSON in body
    print("\n🔍 Test 8: Invalid JSON in request body...")
    try:
        response = requests.post(
            f'{BASE_URL}/games/start',
            data='{"invalid json',
            headers={'Content-Type': 'application/json'}
        )
        if response.status_code == 400:
            error_data = response.json()
            print(f"✅ Invalid JSON rejected")
            print(f"   Error: {error_data.get('error', 'Unknown')}")
        else:
            print(f"⚠️ Got status {response.status_code}")
    except Exception as e:
        print(f"⚠️ Request failed: {e}")
    
    # Test 9: Missing case_id in game start
    print("\n🔍 Test 9: Missing case_id in game start...")
    response = requests.post(
        f'{BASE_URL}/games/start',
        json={}
    )
    if response.status_code == 400:
        error_data = response.json()
        print(f"✅ Missing field correctly rejected")
        print(f"   Error: {error_data.get('error', 'Unknown')}")
    else:
        print(f"❌ Expected 400, got {response.status_code}")
    
    # Test 10: Invalid UUID in accusation suspect_id
    print("\n🔍 Test 10: Invalid UUID in accused_suspect_id...")
    response = requests.get(f'{BASE_URL}/cases')
    if response.status_code == 200:
        cases = response.json().get('cases', [])
        if cases:
            game_response = requests.post(
                f'{BASE_URL}/games/start',
                json={'case_id': cases[0]['case_id']}
            )
            if game_response.status_code == 201:
                game_id = game_response.json()['game']['game_id']
                
                response = requests.post(
                    f'{BASE_URL}/accusation/{game_id}',
                    json={'accused_suspect_id': 'not-a-uuid'}
                )
                if response.status_code == 400:
                    error_data = response.json()
                    print(f"✅ Invalid UUID rejected")
                    print(f"   Error: {error_data.get('error', 'Unknown')}")
                else:
                    print(f"❌ Expected 400, got {response.status_code}")
    
    print("\n" + "=" * 60)
    print("✅ Middleware tests completed!")
    print("=" * 60)

if __name__ == '__main__':
    try:
        test_middleware()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to backend server")
        print("   Make sure the server is running on http://localhost:3000")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
