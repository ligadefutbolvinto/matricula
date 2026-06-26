-- =====================================================================
-- SQL Script: Crear Función obtener_nomina_historica en Supabase
-- =====================================================================
-- Instrucciones:
-- 1. Copia todo el contenido de este archivo.
-- 2. Ve a tu panel de Supabase -> SQL Editor.
-- 3. Crea una nueva consulta (New Query), pega este código y haz clic en "Run".
-- =====================================================================

CREATE OR REPLACE FUNCTION obtener_nomina_historica(target_equipo_id bigint)
RETURNS TABLE (
  ci varchar,
  nombres varchar,
  apellidos varchar,
  fecha_nacimiento date,
  año int,
  categoria_jugador varchar,
  condicion_pase varchar,
  equipo_id bigint,
  equipo_propietario_id bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_records AS (
    -- Obtener la última participación de cada jugador en toda la base de datos (MAX de año)
    SELECT DISTINCT ON (hp.jugador_ci)
      hp.jugador_ci,
      hp.equipo_id,
      hp.año,
      hp.categoria_jugador,
      hp.condicion_pase,
      hp.equipo_propietario_id
    FROM historial_participacion hp
    ORDER BY hp.jugador_ci, hp.año DESC
  )
  -- Unir con los datos biográficos de los jugadores y filtrar por el club de pertenencia
  SELECT 
    j.ci::varchar,
    j.nombres::varchar,
    j.apellidos::varchar,
    j.fecha_nacimiento::date,
    lr.año,
    lr.categoria_jugador::varchar,
    lr.condicion_pase::varchar,
    lr.equipo_id,
    lr.equipo_propietario_id
  FROM latest_records lr
  JOIN jugadores j ON lr.jugador_ci = j.ci
  WHERE 
    -- Caso 1: El jugador jugó regularmente en el club y no está a préstamo
    (lr.equipo_id = target_equipo_id AND (lr.condicion_pase IS NULL OR lr.condicion_pase <> 'prestamo'))
    -- Caso 2: El jugador pertenece al club pero está prestado en otro equipo (retorno automático)
    OR lr.equipo_propietario_id = target_equipo_id;
END;
$$ LANGUAGE plpgsql;
