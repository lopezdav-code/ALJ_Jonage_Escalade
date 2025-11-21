-- Create a function to allow dossard number updates by bypassing the trigger restriction
-- This function can be called to update dossard numbers with admin privileges

CREATE OR REPLACE FUNCTION update_dossard_number_admin(
  p_id BIGINT,
  p_new_numero_dossart VARCHAR
)
RETURNS VOID AS $$
BEGIN
  UPDATE competition_registrations
  SET numero_dossart = p_new_numero_dossart
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_dossard_number_admin(BIGINT, VARCHAR) TO authenticated;
