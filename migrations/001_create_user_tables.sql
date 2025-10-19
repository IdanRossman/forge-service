-- Migration: Create user account tables
-- Description: Adds characters and character_equipment tables for user data storage
-- Run this in your Supabase SQL Editor

-- =============================================================================
-- CHARACTERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  job TEXT NOT NULL,
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 300),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick user lookups
CREATE INDEX idx_characters_user_id ON characters(user_id);

-- Enable Row Level Security
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own characters
CREATE POLICY "Users can view their own characters"
  ON characters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own characters"
  ON characters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own characters"
  ON characters FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own characters"
  ON characters FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- CHARACTER EQUIPMENT TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS character_equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  slot_name TEXT NOT NULL,
  equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,

  -- Starforce tracking
  current_starforce INTEGER DEFAULT 0 CHECK (current_starforce >= 0 AND current_starforce <= 25),
  target_starforce INTEGER DEFAULT 0 CHECK (target_starforce >= 0 AND target_starforce <= 25),

  -- Potential tracking (stat lines as text)
  current_potential TEXT,
  target_potential TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_character_slot UNIQUE(character_id, slot_name),
  CONSTRAINT valid_slot_name CHECK (
    slot_name IN (
      'hat', 'top', 'bottom', 'weapon', 'secondary',
      'gloves', 'shoes', 'cape', 'shoulder', 'belt',
      'face_accessory', 'eye_accessory', 'earring',
      'ring1', 'ring2', 'ring3', 'ring4',
      'pendant1', 'pendant2', 'emblem', 'badge', 'heart', 'pocket'
    )
  )
);

-- Indexes for quick lookups
CREATE INDEX idx_character_equipment_character_id ON character_equipment(character_id);
CREATE INDEX idx_character_equipment_equipment_id ON character_equipment(equipment_id);

-- Enable Row Level Security
ALTER TABLE character_equipment ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access equipment for their own characters
CREATE POLICY "Users can view their own character equipment"
  ON character_equipment FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = character_equipment.character_id
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert equipment for their own characters"
  ON character_equipment FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = character_equipment.character_id
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update equipment for their own characters"
  ON character_equipment FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = character_equipment.character_id
      AND characters.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = character_equipment.character_id
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete equipment for their own characters"
  ON character_equipment FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = character_equipment.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for characters table
CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for character_equipment table
CREATE TRIGGER update_character_equipment_updated_at
  BEFORE UPDATE ON character_equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE characters IS 'User-owned MapleStory characters';
COMMENT ON TABLE character_equipment IS 'Equipment instances equipped on characters with starforce/potential tracking';
COMMENT ON COLUMN character_equipment.current_potential IS 'Current potential stat lines as text (e.g., "+33% boss damage")';
COMMENT ON COLUMN character_equipment.target_potential IS 'Target potential stat lines as text (e.g., "+40% boss damage, +12% STR")';
