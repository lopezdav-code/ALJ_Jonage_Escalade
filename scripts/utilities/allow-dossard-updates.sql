-- Create a function to allow dossard number updates by bypassing the trigger restriction
-- This function can be called to update dossard numbers with admin privileges

CREATE OR REPLACE FUNCTION update_dossard_number_admin(
  p_id BIGINT,
  p_new_numero_dossart INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Set a parameter to bypass the trigger restriction
  PERFORM set_config('app.allow_dossard_update', 'true', false);

  UPDATE competition_registrations
  SET numero_dossart = p_new_numero_dossart
  WHERE id = p_id;

  -- Reset the parameter
  PERFORM set_config('app.allow_dossard_update', 'false', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_dossard_number_admin(BIGINT, INTEGER) TO authenticated;
