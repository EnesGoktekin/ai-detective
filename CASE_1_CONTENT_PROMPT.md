# Case 1 Content Generation Prompt

**Instructions:** Use this prompt with another AI to generate complete Case 1 content for the Detective AI game.

---

## 📋 Task Overview

Create complete content for **Case 1** of a detective game where players investigate crimes by chatting with an AI detective colleague. The AI acts as the detective at the crime scene, and the player asks questions to uncover evidence and solve the case.

---

## 🎯 Required Deliverables

Generate content in the following format:

### 1. CASE METADATA

```json
{
  "title": "[Case title - keep it mysterious and engaging]",
  "description": "[2-3 sentence case description for the case selection menu]"
}
```

### 2. INITIAL PROMPT DATA (JSONB)

This is the complete system instruction for the Chat AI. It must include:

```json
{
  "system_instruction": "[Complete system prompt that defines the AI's role, personality, and behavior. The AI is a detective colleague at the crime scene. Be specific about tone, language capabilities (multilingual support), and how to respond to questions.]",
  
  "initial_scene": "[Detailed description of what the AI sees when they first arrive at the crime scene. This is what the AI will describe to the player at the start of the game. Include: location, victim details, initial observations, atmosphere. Make it vivid and engaging. 3-5 paragraphs.]",
  
  "case_context": {
    "victim_name": "[Name of the victim]",
    "victim_background": "[Brief background about the victim - who they were, occupation, relationships]",
    "crime_type": "[Type of crime - murder, theft, etc.]",
    "location": "[Primary crime scene location]",
    "time_of_crime": "[When the crime occurred]",
    "initial_findings": "[What is immediately obvious at the scene]"
  }
}
```

### 3. SUSPECTS (3-5 characters)

For each suspect, provide:

```json
{
  "name": "[Suspect full name]",
  "backstory": "[DETAILED backstory (5-8 sentences). This is what the AI KNOWS about this suspect. Include: relationship to victim, motive (if guilty), alibi (if innocent), personality, relevant history, suspicious or innocent details. Make it rich enough for the AI to roleplay conversations about this suspect.]",
  "is_guilty": true/false  // Mark ONLY ONE suspect as true
}
```

**Important:** 
- One suspect MUST have `"is_guilty": true`
- Others must have `"is_guilty": false`
- All suspects should have believable motives/connections
- Backstories should give the AI enough information to discuss each suspect naturally

### 4. SUSPECTS_LIST (JSONB for Frontend)

Simple list for the UI:

```json
{
  "suspects": [
    {
      "id": "[Generate a UUID or use 'suspect-1', 'suspect-2', etc.]",
      "name": "[Suspect name - must match the name in SUSPECTS section]"
    }
    // ... repeat for all suspects
  ]
}
```

### 5. SCENE OBJECTS (5-10 interactive objects/locations)

For each object in the crime scene:

```json
{
  "name": "[Object name - e.g., 'Desk', 'Safe', 'Victim's Phone', 'Kitchen Counter']",
  "main_location": "[Where this object is - e.g., 'Office', 'Living Room', 'Bedroom']",
  "initial_description": "[What the AI sees/describes about this object BEFORE the player investigates it. 2-3 sentences. This helps the AI describe the scene naturally.]"
}
```

**Examples:**
- "Desk" in "Office" - A mahogany desk with scattered papers and an open laptop
- "Safe" in "Bedroom" - A small wall safe, currently closed and locked
- "Victim's Phone" in "Living Room" - A smartphone lying on the coffee table, screen cracked

### 6. EVIDENCE LOOKUP (5-8 evidence items)

For each piece of evidence:

```json
{
  "object_id": "[Name of the scene_object that contains this evidence - must match a scene object name above, or null if not tied to a specific object]",
  "display_name": "[Evidence name shown to player - e.g., 'Threatening Letter', 'Financial Records']",
  "description": "[Detailed description of the evidence and why it's important. 2-4 sentences. This is shown when player clicks on unlocked evidence.]",
  "unlock_keywords": [
    "[keyword1]",
    "[keyword2]",
    "[keyword3]"
    // 3-6 keywords/phrases that would logically trigger discovering this evidence
    // Examples: ["search desk", "examine papers", "check documents", "look at letters"]
    // Use natural phrases a player might type
    // Include variations and synonyms
  ],
  "is_required_for_accusation": true/false  
  // Set true for 3-4 critical evidence items
  // Set false for optional/supporting evidence
}
```

**Important:**
- At least 3-4 evidence items MUST have `"is_required_for_accusation": true`
- Evidence should logically point to the guilty suspect
- Keywords should be natural phrases players might use
- Include both obvious and subtle evidence
- Link evidence to scene_objects when appropriate

---

## 🎨 Content Guidelines

### Story Requirements:
1. **Genre:** Murder mystery, theft, or other crime suitable for investigation
2. **Complexity:** Medium difficulty for MVP
3. **Setting:** Clear, well-defined location (mansion, office, apartment, etc.)
4. **Victim:** Well-developed character with connections to all suspects
5. **Solution:** Logical and discoverable through evidence

### Suspect Design:
- Each suspect should have a clear connection to the victim
- Mix of strong and weak motives
- Alibis that can be questioned
- Realistic personalities and backgrounds
- Guilty suspect should be discoverable but not obvious

### Scene Objects:
- Include variety: furniture, personal items, technology, documents
- Objects should make sense for the location
- Some objects contain evidence, others are just for atmosphere
- Describe objects in a way that makes them searchable

### Evidence Design:
- **Critical Evidence** (required): Directly implicates the guilty party
- **Supporting Evidence:** Provides context and red herrings
- **Discovery Flow:** Evidence should be discoverable in a natural progression
- **Keywords:** Use varied, natural language that players would actually type
  - Good: ["search desk", "look through papers", "check drawers", "examine documents"]
  - Bad: ["desk", "papers"] (too simple)

### AI Personality (for system_instruction):
- Professional but friendly detective colleague
- Multilingual (can respond in any language player uses)
- Stays in character as someone physically at the scene
- Describes what they see, smell, notice
- Answers questions about suspects, objects, and observations
- Does NOT directly tell the player who is guilty
- Encourages investigation and critical thinking

---

## 📝 Output Format

Please provide the complete content in **JSON format** structured like this:

```json
{
  "case_metadata": {
    "title": "...",
    "description": "..."
  },
  
  "initial_prompt_data": {
    "system_instruction": "...",
    "initial_scene": "...",
    "case_context": { ... }
  },
  
  "suspects": [
    {
      "name": "...",
      "backstory": "...",
      "is_guilty": false
    },
    // ... more suspects
  ],
  
  "suspects_list": {
    "suspects": [
      {"id": "suspect-1", "name": "..."},
      // ... more
    ]
  },
  
  "scene_objects": [
    {
      "name": "...",
      "main_location": "...",
      "initial_description": "..."
    },
    // ... more objects
  ],
  
  "evidence_lookup": [
    {
      "object_id": "...",  // or null
      "display_name": "...",
      "description": "...",
      "unlock_keywords": ["...", "..."],
      "is_required_for_accusation": true
    },
    // ... more evidence
  ]
}
```

---

## ✅ Quality Checklist

Before submitting, verify:

- [ ] Exactly ONE suspect has `"is_guilty": true`
- [ ] All suspect names in suspects_list match suspects section
- [ ] 3-5 suspects total
- [ ] 5-10 scene objects
- [ ] 5-8 evidence items
- [ ] At least 3-4 evidence items have `"is_required_for_accusation": true`
- [ ] All evidence has 3-6 unlock keywords
- [ ] Evidence keywords are natural phrases (not single words)
- [ ] Scene objects are detailed enough for AI to describe
- [ ] System instruction defines AI personality clearly
- [ ] Initial scene is vivid and engaging (3-5 paragraphs)
- [ ] Case is solvable through logical investigation
- [ ] All object_id references in evidence match scene_object names (or are null)

---

## 🎯 Example Theme Ideas (choose one or create your own)

1. **Mansion Murder:** Wealthy victim, family drama, inheritance motives
2. **Corporate Crime:** Office setting, business rivalry, financial secrets
3. **Art Gallery Theft:** Missing valuable item, suspects with access
4. **University Mystery:** Professor or student victim, academic rivalries
5. **Restaurant Crime:** Chef/owner victim, culinary competition, secrets

---

**Generate complete, detailed Case 1 content following all specifications above. Make it engaging, logical, and ready for implementation in a detective game database.**
