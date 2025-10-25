/**
 * Database Type Definitions
 * Generated from Supabase schema
 * Last updated: October 25, 2025
 */

// ============================================================================
// CONNECTION TYPES
// ============================================================================

export interface DatabaseConfig {
  url: string;
  key: string;
}

export interface DatabaseInfo {
  url: string;
  connected: boolean;
}

export interface DatabaseTestResult {
  status: 'connected' | 'disconnected' | 'error';
  database: DatabaseInfo;
  message: string;
  timestamp: string;
  error?: string;
}

// ============================================================================
// STATIC TABLES (Case Definition)
// ============================================================================

/**
 * Cases Table
 * Main case definitions and AI initial context
 */
export interface Case {
  case_id: string; // UUID
  title: string;
  description: string;
  initial_prompt_data: {
    system_instruction: string;
    initial_scene: string;
    case_context: Record<string, any>;
  };
  suspects_list: {
    suspects: Array<{
      id: string;
      name: string;
    }>;
  };
  created_at: string; // ISO 8601 timestamp
}

/**
 * Suspects Table
 * Suspect profiles with truth-blind flag
 */
export interface Suspect {
  suspect_id: string; // UUID
  case_id: string; // Foreign key to cases
  name: string;
  backstory: string;
  is_guilty: boolean; // Truth-blind flag
  created_at: string; // ISO 8601 timestamp
}

/**
 * Scene Objects Table
 * Physical, interactive locations/objects in crime scene
 */
export interface SceneObject {
  object_id: string; // UUID
  case_id: string; // Foreign key to cases
  name: string;
  main_location: string;
  initial_description: string;
  created_at: string; // ISO 8601 timestamp
}

/**
 * Evidence Lookup Table
 * Defines all potential clues for game progression
 */
export interface EvidenceLookup {
  evidence_id: string; // UUID
  case_id: string; // Foreign key to cases
  object_id: string | null; // Foreign key to scene_objects (nullable)
  display_name: string;
  description: string;
  unlock_keywords: string[]; // Array of keywords for discovery
  is_required_for_accusation: boolean; // Default: true
  created_at: string; // ISO 8601 timestamp
}

// ============================================================================
// DYNAMIC TABLES (Game State)
// ============================================================================

/**
 * Games Table
 * Session hub tracking overall game progress and AI context
 */
export interface Game {
  game_id: string; // UUID
  case_id: string; // Foreign key to cases
  current_summary: string | null; // AI context summary (nullable)
  message_count: number; // Triggers summarizing AI every 5 messages
  is_completed: boolean; // Default: false
  final_outcome: {
    accused_suspect_id?: string;
    is_correct?: boolean;
    completed_at?: string;
    [key: string]: any;
  } | null;
  created_at: string; // ISO 8601 timestamp
  last_updated: string; // ISO 8601 timestamp
}

/**
 * Messages Table
 * Full, ordered chat history
 */
export interface Message {
  message_id: string; // UUID
  game_id: string; // Foreign key to games
  sequence_number: number; // Ordering (mandatory)
  sender: 'user' | 'ai'; // Check constraint
  content: string;
  created_at: string; // ISO 8601 timestamp
}

/**
 * Evidence Unlocked Table
 * Tracks player discovery status
 */
export interface EvidenceUnlocked {
  id: string; // UUID
  game_id: string; // Foreign key to games
  evidence_id: string; // Foreign key to evidence_lookup
  unlocked_at: string; // ISO 8601 timestamp
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Case List Response
 * Used for case selection menu
 */
export interface CaseListItem {
  case_id: string;
  title: string;
  description: string;
  suspects_list: Case['suspects_list'];
}

/**
 * Game Session Response
 * Used for loading game state
 */
export interface GameSession {
  game_id: string;
  case: Case;
  current_summary: string | null;
  message_count: number;
  is_completed: boolean;
  messages: Message[];
  unlocked_evidence: Array<EvidenceLookup & { unlocked_at: string }>;
  suspects: Suspect[];
}

/**
 * Chat Response
 * Response from chat endpoint
 */
export interface ChatResponse {
  message_id: string;
  ai_content: string;
  newly_unlocked_evidence: EvidenceLookup[];
  sequence_number: number;
  created_at: string;
}

/**
 * Accusation Response
 * Response from accusation endpoint
 */
export interface AccusationResponse {
  is_correct: boolean;
  accused_suspect: Suspect;
  correct_suspect: Suspect;
  final_outcome: Game['final_outcome'];
  game_id: string;
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Create Game Request
 */
export interface CreateGameRequest {
  case_id: string;
}

/**
 * Send Message Request
 */
export interface SendMessageRequest {
  game_id: string;
  content: string;
}

/**
 * Make Accusation Request
 */
export interface MakeAccusationRequest {
  game_id: string;
  accused_suspect_id: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Database Insert Types (without auto-generated fields)
 */
export type CaseInsert = Omit<Case, 'case_id' | 'created_at'>;
export type SuspectInsert = Omit<Suspect, 'suspect_id' | 'created_at'>;
export type SceneObjectInsert = Omit<SceneObject, 'object_id' | 'created_at'>;
export type EvidenceLookupInsert = Omit<EvidenceLookup, 'evidence_id' | 'created_at'>;
export type GameInsert = Omit<Game, 'game_id' | 'created_at' | 'last_updated'>;
export type MessageInsert = Omit<Message, 'message_id' | 'created_at'>;
export type EvidenceUnlockedInsert = Omit<EvidenceUnlocked, 'id' | 'unlocked_at'>;

/**
 * Database Update Types (all fields optional except ID)
 */
export type GameUpdate = Partial<Omit<Game, 'game_id' | 'created_at'>> & {
  game_id: string;
};

/**
 * Query Filter Types
 */
export interface GameFilters {
  case_id?: string;
  is_completed?: boolean;
  created_after?: string;
  created_before?: string;
}

export interface MessageFilters {
  game_id: string;
  sender?: 'user' | 'ai';
  limit?: number;
  offset?: number;
}

export interface EvidenceFilters {
  case_id?: string;
  is_required_for_accusation?: boolean;
  object_id?: string;
}
