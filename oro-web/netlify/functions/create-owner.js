const SUPABASE_URL = process.env.SUPABASE_URL || "https://guguwtfrvmhhvgeiyhhf.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(statusCode, body) {
  return { statusCode, headers, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST") return json(405, { error: "Método no permitido." });
  if (!SERVICE_ROLE_KEY) return json(500, { error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en Netlify." });

  const authHeader = event.headers?.authorization || event.headers?.Authorization || "";
  if (!authHeader.startsWith("Bearer ")) return json(401, { error: "Sesión de administración requerida." });
  const accessToken = authHeader.slice(7);

  let input;
  try { input = JSON.parse(event.body || "{}"); }
  catch { return json(400, { error: "Solicitud inválida." }); }

  const unit_id = Number(input.unit_id);
  const nombre = String(input.nombre || "").trim();
  const apellido = String(input.apellido || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const password = String(input.password || "");

  if (!Number.isInteger(unit_id) || !nombre || !apellido || !email || password.length < 8) {
    return json(400, { error: "Completá unidad, nombre, apellido, correo y una contraseña de al menos 8 caracteres." });
  }

  const serviceHeaders = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json"
  };

  try {
    // Verificamos que quien llama sea un usuario autenticado.
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${accessToken}`
      }
    });
    const authUser = await authResponse.json().catch(() => null);
    if (!authResponse.ok || !authUser?.id) return json(401, { error: "La sesión no es válida." });

    // Verificamos el rol admin directamente en profiles.
    const adminProfileResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(authUser.id)}&select=rol`,
      { headers: serviceHeaders }
    );
    const adminProfiles = await adminProfileResponse.json().catch(() => []);
    if (!adminProfileResponse.ok || adminProfiles?.[0]?.rol !== "admin") {
      return json(403, { error: "No tenés permisos para crear propietarios." });
    }

    // Evitamos crear una segunda cuenta para una unidad ya ocupada.
    const occupiedResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?unit_id=eq.${unit_id}&select=id`,
      { headers: serviceHeaders }
    );
    const occupied = await occupiedResponse.json().catch(() => []);
    if (!occupiedResponse.ok) return json(500, { error: "No se pudo verificar la unidad." });
    if (occupied.length) return json(409, { error: "Esa unidad ya tiene un usuario asociado." });

    // Creamos el usuario en Supabase Auth desde el servidor.
    const createUserResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: serviceHeaders,
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { nombre, apellido, unidad_id: unit_id }
      })
    });
    const createdUser = await createUserResponse.json().catch(() => null);

    if (!createUserResponse.ok || !createdUser?.id) {
      const message = createdUser?.msg || createdUser?.message || createdUser?.error_description || "No se pudo crear el usuario.";
      return json(createUserResponse.status === 422 ? 409 : 400, { error: message });
    }

    // Creamos el perfil propietario.
    const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: "POST",
      headers: { ...serviceHeaders, "Prefer": "return=minimal" },
      body: JSON.stringify({
        id: createdUser.id,
        unit_id,
        nombre,
        apellido,
        rol: "propietario"
      })
    });

    if (!profileResponse.ok) {
      // Rollback: si el perfil no pudo crearse, eliminamos el usuario recién creado.
      await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${createdUser.id}`, {
        method: "DELETE",
        headers: serviceHeaders
      });
      const detail = await profileResponse.text();
      console.error("Error creando profile:", detail);
      return json(500, { error: "El usuario se creó pero no pudimos asociarlo a la unidad. No se dejó una cuenta incompleta." });
    }

    return json(200, { ok: true, user_id: createdUser.id, unit_id });
  } catch (error) {
    console.error("create-owner error:", error);
    return json(500, { error: "Error interno al crear el propietario." });
  }
};
