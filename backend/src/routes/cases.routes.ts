import { Router, Request, Response } from 'express';
import { supabase } from '../utils/database';

const router = Router();

/**
 * GET /api/cases/ping
 * Simple test endpoint
 */
router.get('/ping', (_req: Request, res: Response) => {
  res.json({ message: 'Cases router is working!' });
  return;
});

/**
 * GET /api/cases
 * Get all cases
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { data: cases, error } = await supabase
      .from('cases')
      .select('case_id, title, description, suspects_list, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching cases:', error);
      return res.status(500).json({
        error: 'Failed to fetch cases',
        details: error.message,
      });
    }

    return res.json({
      success: true,
      count: cases?.length || 0,
      cases: cases || [],
    });
  } catch (error) {
    console.error('Error in cases endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/cases/:case_id
 * Get complete case data with all relationships
 */
router.get('/:case_id', async (req: Request, res: Response) => {
  try {
    const { case_id } = req.params;

    // Fetch case
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('case_id', case_id)
      .single();

    if (caseError || !caseData) {
      return res.status(404).json({
        error: 'Case not found',
        details: caseError?.message || 'No case with this ID',
      });
    }

    // Fetch suspects
    const { data: suspects, error: suspectsError } = await supabase
      .from('suspects')
      .select('suspect_id, name, backstory, is_guilty, created_at')
      .eq('case_id', case_id)
      .order('created_at', { ascending: true });

    if (suspectsError) {
      console.error('Error fetching suspects:', suspectsError);
    }

    // Fetch scene objects
    const { data: sceneObjects, error: objectsError } = await supabase
      .from('scene_objects')
      .select('*')
      .eq('case_id', case_id)
      .order('created_at', { ascending: true });

    if (objectsError) {
      console.error('Error fetching scene objects:', objectsError);
    }

    // Fetch evidence
    const { data: evidence, error: evidenceError } = await supabase
      .from('evidence_lookup')
      .select('*')
      .eq('case_id', case_id)
      .order('created_at', { ascending: true });

    if (evidenceError) {
      console.error('Error fetching evidence:', evidenceError);
    }

    return res.json({
      success: true,
      case: caseData,
      suspects: suspects || [],
      scene_objects: sceneObjects || [],
      evidence: evidence || [],
      stats: {
        total_suspects: suspects?.length || 0,
        total_scene_objects: sceneObjects?.length || 0,
        total_evidence: evidence?.length || 0,
        required_evidence: evidence?.filter((e) => e.is_required_for_accusation).length || 0,
      },
    });
  } catch (error) {
    console.error('Error in case detail endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/cases/:case_id/test
 * Test case data integrity and structure
 */
router.get('/:case_id/test', async (req: Request, res: Response) => {
  try {
    const { case_id } = req.params;

    // Fetch all related data
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('case_id', case_id)
      .single();

    if (caseError || !caseData) {
      return res.status(404).json({
        success: false,
        error: 'Case not found',
      });
    }

    const { data: suspects } = await supabase
      .from('suspects')
      .select('*')
      .eq('case_id', case_id);

    const { data: sceneObjects } = await supabase
      .from('scene_objects')
      .select('*')
      .eq('case_id', case_id);

    const { data: evidence } = await supabase
      .from('evidence_lookup')
      .select('*')
      .eq('case_id', case_id);

    // Run validation tests
    const tests = {
      case_exists: !!caseData,
      has_title: !!caseData.title,
      has_description: !!caseData.description,
      has_initial_prompt_data: !!caseData.initial_prompt_data,
      initial_prompt_has_system_instruction: !!caseData.initial_prompt_data?.system_instruction,
      initial_prompt_has_initial_scene: !!caseData.initial_prompt_data?.initial_scene,
      initial_prompt_has_case_context: !!caseData.initial_prompt_data?.case_context,
      has_suspects_list: !!caseData.suspects_list,
      suspects_list_is_array: Array.isArray(caseData.suspects_list?.suspects),
      suspects_count: suspects?.length || 0,
      suspects_min_count: (suspects?.length || 0) >= 3,
      suspects_max_count: (suspects?.length || 0) <= 5,
      has_guilty_suspect: suspects?.some((s) => s.is_guilty === true) || false,
      only_one_guilty_suspect: suspects?.filter((s) => s.is_guilty === true).length === 1,
      all_suspects_have_backstory: suspects?.every((s) => !!s.backstory) || false,
      scene_objects_count: sceneObjects?.length || 0,
      scene_objects_min_count: (sceneObjects?.length || 0) >= 5,
      scene_objects_max_count: (sceneObjects?.length || 0) <= 10,
      evidence_count: evidence?.length || 0,
      evidence_min_count: (evidence?.length || 0) >= 5,
      evidence_max_count: (evidence?.length || 0) <= 8,
      has_required_evidence: evidence?.some((e) => e.is_required_for_accusation) || false,
      required_evidence_count: evidence?.filter((e) => e.is_required_for_accusation).length || 0,
      min_required_evidence: (evidence?.filter((e) => e.is_required_for_accusation).length || 0) >= 3,
      all_evidence_have_keywords: evidence?.every((e) => e.unlock_keywords && e.unlock_keywords.length > 0) || false,
      all_evidence_have_min_keywords: evidence?.every((e) => e.unlock_keywords && e.unlock_keywords.length >= 3) || false,
    };

    const allTestsPassed = Object.values(tests).every((test) => {
      if (typeof test === 'boolean') return test;
      if (typeof test === 'number') return test > 0;
      return true;
    });

    return res.json({
      success: allTestsPassed,
      case_id,
      case_title: caseData.title,
      tests,
      summary: {
        total_tests: Object.keys(tests).length,
        passed_tests: Object.values(tests).filter((t) => t === true || (typeof t === 'number' && t > 0)).length,
        failed_tests: Object.values(tests).filter((t) => t === false || (typeof t === 'number' && t === 0)).length,
      },
      guilty_suspect: suspects?.find((s) => s.is_guilty === true)?.name || 'Not found',
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
