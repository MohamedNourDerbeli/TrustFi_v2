-- Create template_counter table to track next available template ID
CREATE TABLE IF NOT EXISTS template_counter (
  id INT PRIMARY KEY DEFAULT 1,
  next_template_id INT8 NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert initial row
INSERT INTO template_counter (id, next_template_id) 
VALUES (1, 1)
ON CONFLICT (id) DO NOTHING;

-- Create function to get and increment template ID
CREATE OR REPLACE FUNCTION get_next_template_id()
RETURNS INT8 AS $$
DECLARE
  next_id INT8;
BEGIN
  UPDATE template_counter 
  SET next_template_id = next_template_id + 1,
      updated_at = NOW()
  WHERE id = 1
  RETURNING next_template_id - 1 INTO next_id;
  
  RETURN next_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE template_counter ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the counter
CREATE POLICY "Anyone can view template counter" ON template_counter
  FOR SELECT USING (true);

-- Only allow updates through the function (no direct updates)
CREATE POLICY "No direct updates to template counter" ON template_counter
  FOR UPDATE USING (false);

-- Add comment
COMMENT ON TABLE template_counter IS 'Tracks the next available template ID for auto-generation';
