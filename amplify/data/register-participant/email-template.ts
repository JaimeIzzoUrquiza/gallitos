export type RegistrationEmailData = {
  firstName: string;
  paternalLastName: string;
  maternalLastName: string;
  ghin: string;
  handicapIndex: string;
  phone: string;
  email: string;
  logoUrl?: string;
};

function fullName(data: RegistrationEmailData) {
  return [data.firstName, data.paternalLastName, data.maternalLastName].filter(Boolean).join(' ');
}

function formatPhone(phone: string) {
  if (phone.length === 10) {
    return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
  }
  return phone;
}

export function buildRegistrationEmailSubject(data: RegistrationEmailData) {
  return `Confirmación de registro — ${data.firstName}`;
}

export function buildRegistrationEmailText(data: RegistrationEmailData) {
  const name = fullName(data);
  return [
    `Hola ${data.firstName},`,
    '',
    'Tu registro como integrante de Gallitos fue recibido correctamente.',
    '',
    'Resumen de tu inscripción:',
    `- Nombre: ${name}`,
    `- GHIN: ${data.ghin}`,
    `- Handicap Index: ${data.handicapIndex}`,
    `- Celular: ${formatPhone(data.phone)}`,
    `- Correo: ${data.email}`,
    '',
    'Gracias por registrarte.',
    '',
    '— Equipo Gallitos',
  ].join('\n');
}

export function buildRegistrationEmailHtml(data: RegistrationEmailData) {
  const name = fullName(data);
  const logoBlock = data.logoUrl
    ? `<img src="${data.logoUrl}" alt="Gallitos" width="120" height="auto" style="display:block;margin:0 auto 20px;max-height:80px;width:auto;" />`
    : `<p style="margin:0 0 20px;font-size:28px;font-weight:700;color:#192b4d;letter-spacing:-0.02em;">Gallitos</p>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmación de registro</title>
</head>
<body style="margin:0;padding:0;background:#eef1f6;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(180deg,#eef1f6 0%,#f5f6f8 40%);padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.05);overflow:hidden;">
          <tr>
            <td style="padding:32px 28px 24px;text-align:center;">
              ${logoBlock}
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#192b4d;line-height:1.25;">¡Registro recibido!</h1>
              <p style="margin:0;font-size:15px;line-height:1.5;color:#6b7280;">
                Hola <strong style="color:#192b4d;">${escapeHtml(data.firstName)}</strong>, tus datos fueron enviados correctamente. Gracias por registrarte.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 18px;background:#f8fafc;border-bottom:1px dashed #e5e7eb;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Nombre</p>
                    <p style="margin:0;font-size:15px;font-weight:600;color:#192b4d;">${escapeHtml(name)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 18px;border-bottom:1px dashed #e5e7eb;">
                    <span style="display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;padding:4px 10px;border-radius:9999px;background:rgba(195,155,84,0.15);color:#a17823;margin-right:8px;">GHIN ${escapeHtml(data.ghin)}</span>
                    <span style="display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;padding:4px 10px;border-radius:9999px;background:#f1f5f9;color:#6b7280;">HCP ${escapeHtml(data.handicapIndex)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 18px;border-bottom:1px dashed #e5e7eb;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Correo</p>
                    <p style="margin:0;font-size:15px;font-weight:500;color:#111827;">${escapeHtml(data.email)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Celular</p>
                    <p style="margin:0;font-size:15px;font-weight:500;color:#111827;">${escapeHtml(formatPhone(data.phone))}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;border-top:1px solid #e5e7eb;text-align:center;background:#fcfcfd;">
              <p style="margin:0;font-size:13px;line-height:1.5;color:#6b7280;">
                Conserva este correo como comprobante de tu inscripción.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">Equipo Gallitos</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
