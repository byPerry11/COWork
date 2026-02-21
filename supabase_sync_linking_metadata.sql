-- 1. Mejorar la función handle_new_user para que sea más robusta y maneje conflictos
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  meta_avatar_url text;
  meta_full_name text;
BEGIN
  -- Extraer metadatos de OAuth (Google, etc.) de forma segura
  meta_avatar_url := new.raw_user_meta_data->>'avatar_url';
  meta_full_name := new.raw_user_meta_data->>'full_name';

  -- Insertar o actualizar el perfil
  -- Esto se ejecutará tanto al crear el usuario como al actualizar sus metadatos (vincular cuenta)
  INSERT INTO public.profiles (
    id, 
    username, 
    color_hex, 
    avatar_url, 
    display_name
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'user_name', new.email), 
    '#3b82f6',
    meta_avatar_url,
    COALESCE(meta_full_name, new.raw_user_meta_data->>'name', new.email)
  )
  ON CONFLICT (id) DO UPDATE SET
    avatar_url = EXCLUDED.avatar_url,
    display_name = EXCLUDED.display_name,
    updated_at = timezone('utc'::text, now());
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Asegurarse de que el trigger se dispare tanto en INSERT como en UPDATE
-- Especialmente útil cuando se vincula una cuenta (cambia raw_user_meta_data)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Verificación de columnas necesarias
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
