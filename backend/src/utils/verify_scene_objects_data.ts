/**
 * Scene Objects Data Verification Utility
 * 
 * This script checks scene_objects.initial_description for hint/spoiler content
 * that might cause AI hallucinations.
 * 
 * Run with: npx ts-node src/utils/verify_scene_objects_data.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

// Keywords that might indicate hints/spoilers in descriptions
const HINT_KEYWORDS = [
  // Action verbs
  'check', 'examine', 'look', 'search', 'open', 'inspect',
  
  // Suggestive words
  'seems', 'appears', 'looks like', 'might be', 'could be',
  'full', 'empty', 'heavy', 'light',
  
  // Evidence-related
  'pocket', 'drawer', 'inside', 'underneath', 'behind',
  'hidden', 'secret', 'locked', 'unlocked',
  
  // Specific items (potential spoilers)
  'chain', 'necklace', 'medallion', 'ring', 'watch',
  'handkerchief', 'note', 'letter', 'document',
  'key', 'weapon', 'blood', 'stain'
];

interface SceneObjectAnalysis {
  case_title: string;
  object_name: string;
  location: string;
  description: string;
  description_length: number;
  hint_words_found: string[];
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
}

async function analyzeSceneObjects() {
  console.log('🔍 Scene Objects Data Verification\n');
  console.log('Fetching all scene objects from database...\n');

  // Fetch all scene objects with case info
  const { data: sceneObjects, error } = await supabase
    .from('scene_objects')
    .select(`
      object_id,
      case_id,
      name,
      main_location,
      initial_description,
      cases (
        title
      )
    `)
    .order('case_id', { ascending: true });

  if (error) {
    console.error('❌ Error fetching scene objects:', error);
    return;
  }

  if (!sceneObjects || sceneObjects.length === 0) {
    console.log('⚠️ No scene objects found in database');
    return;
  }

  console.log(`Found ${sceneObjects.length} scene objects\n`);
  console.log('═'.repeat(100));

  const analyses: SceneObjectAnalysis[] = [];

  for (const obj of sceneObjects) {
    const description = obj.initial_description || '';
    const descriptionLower = description.toLowerCase();

    // Find hint keywords in description
    const hintsFound = HINT_KEYWORDS.filter(keyword => 
      descriptionLower.includes(keyword.toLowerCase())
    );

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let recommendation = 'Description looks clean';

    if (hintsFound.length >= 3) {
      riskLevel = 'HIGH';
      recommendation = 'URGENT: Remove hints/spoilers from description';
    } else if (hintsFound.length >= 1) {
      riskLevel = 'MEDIUM';
      recommendation = 'REVIEW: Consider simplifying description';
    }

    const caseTitle = (obj.cases && Array.isArray(obj.cases) && obj.cases[0]) 
      ? obj.cases[0].title 
      : (obj.cases && !Array.isArray(obj.cases)) 
        ? (obj.cases as any).title 
        : 'Unknown Case';

    const analysis: SceneObjectAnalysis = {
      case_title: caseTitle,
      object_name: obj.name,
      location: obj.main_location,
      description: description,
      description_length: description.length,
      hint_words_found: hintsFound,
      risk_level: riskLevel,
      recommendation: recommendation,
    };

    analyses.push(analysis);

    // Print analysis
    const riskIcon = 
      riskLevel === 'HIGH' ? '🔴' : 
      riskLevel === 'MEDIUM' ? '🟡' : 
      '🟢';

    console.log(`\n${riskIcon} ${analysis.object_name} (${analysis.case_title})`);
    console.log(`   Location: ${analysis.location}`);
    console.log(`   Description: "${analysis.description}"`);
    console.log(`   Length: ${analysis.description_length} chars`);
    
    if (hintsFound.length > 0) {
      console.log(`   ⚠️  Hint words found: ${hintsFound.join(', ')}`);
      console.log(`   📋 Risk Level: ${riskLevel}`);
      console.log(`   💡 ${recommendation}`);
    }

    console.log('─'.repeat(100));
  }

  // Summary
  console.log('\n' + '═'.repeat(100));
  console.log('\n📊 SUMMARY REPORT\n');

  const highRisk = analyses.filter(a => a.risk_level === 'HIGH');
  const mediumRisk = analyses.filter(a => a.risk_level === 'MEDIUM');
  const lowRisk = analyses.filter(a => a.risk_level === 'LOW');

  console.log(`Total Objects Analyzed: ${analyses.length}`);
  console.log(`🔴 High Risk: ${highRisk.length}`);
  console.log(`🟡 Medium Risk: ${mediumRisk.length}`);
  console.log(`🟢 Low Risk: ${lowRisk.length}`);

  if (highRisk.length > 0) {
    console.log('\n🔴 HIGH RISK OBJECTS (URGENT ACTION REQUIRED):\n');
    highRisk.forEach(obj => {
      console.log(`   - ${obj.object_name} (${obj.case_title})`);
      console.log(`     Hints: ${obj.hint_words_found.join(', ')}`);
      console.log(`     Description: "${obj.description}"`);
      console.log('');
    });
  }

  if (mediumRisk.length > 0) {
    console.log('\n🟡 MEDIUM RISK OBJECTS (REVIEW RECOMMENDED):\n');
    mediumRisk.forEach(obj => {
      console.log(`   - ${obj.object_name} (${obj.case_title})`);
      console.log(`     Hints: ${obj.hint_words_found.join(', ')}`);
      console.log(`     Description: "${obj.description}"`);
      console.log('');
    });
  }

  // Recommendations
  console.log('\n📝 RECOMMENDATIONS:\n');
  
  if (highRisk.length > 0) {
    console.log('1. URGENT: Update scene_objects.initial_description for high-risk objects');
    console.log('   - Remove action verbs (check, examine, search)');
    console.log('   - Remove suggestive words (seems, appears, full, heavy)');
    console.log('   - Keep descriptions neutral and factual');
    console.log('   - Example: "A heavy coat. Pockets seem full." → "A winter coat hanging on a rack."\n');
  }

  if (mediumRisk.length > 0 || highRisk.length > 0) {
    console.log('2. REVIEW: AI prompt currently sends initial_description to AI');
    console.log('   - Consider removing this field from AI context');
    console.log('   - Or use a separate "ai_safe_description" field');
    console.log('   - File: backend/src/services/gemini.service.ts (Line ~110)\n');
  }

  console.log('3. MONITORING: Add logging to track scene objects in AI prompts');
  console.log('   - File: backend/src/routes/chat.routes.ts');
  console.log('   - Add SCENE_OBJECTS_CHECK logging similar to AI_PROMPT_PREVIEW\n');

  console.log('═'.repeat(100));
}

// Run analysis
analyzeSceneObjects()
  .then(() => {
    console.log('\n✅ Analysis complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  });
