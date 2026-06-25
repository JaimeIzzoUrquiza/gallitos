import { useState, type FormEvent } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { amplifyReady } from './amplify';
import './RegistrationPage.css';

const client = generateClient<Schema>();

type ParticipantForm = {
  firstName: string;
  paternalLastName: string;
  maternalLastName: string;
  ghin: string;
  handicapIndex: string;
  phone: string;
  email: string;
};

const emptyForm: ParticipantForm = {
  firstName: '',
  paternalLastName: '',
  maternalLastName: '',
  ghin: '',
  handicapIndex: '',
  phone: '',
  email: '',
};

const GHIN_RE = /^\d{7}$/;
const PHONE_RE = /^\d{10}$/;
const HANDICAP_RE = /^(\+\d{1,2}\.\d|\d{1,2}\.\d)$/;
const MAX_HANDICAP = 54.0;

function normalizePhone(value: string) {
  return value.replace(/\D/g, '');
}

function normalizeGhin(value: string) {
  return value.replace(/\D/g, '').slice(0, 7);
}

function sanitizeHandicapInput(value: string) {
  const isPlus = value.startsWith('+');
  const digits = value.replace(/^\+/, '').replace(/[^\d.]/g, '');
  const [whole = '', ...rest] = digits.split('.');
  const fraction = rest.join('').slice(0, 1);
  const wholePart = whole.slice(0, 2);

  if (isPlus && digits === '' && value === '+') {
    return '+';
  }

  let body: string;
  if (!digits.includes('.')) {
    body = wholePart;
  } else {
    body = fraction.length > 0 ? `${wholePart}.${fraction}` : `${wholePart}.`;
  }

  return isPlus ? `+${body}` : body;
}

function validateHandicapIndex(raw: string): string | null {
  if (!HANDICAP_RE.test(raw)) {
    return 'El Handicap Index debe tener hasta 2 dígitos y un decimal (ej. 12.4 o +1.3).';
  }

  const isPlus = raw.startsWith('+');
  const numeric = parseFloat(raw);
  if (Number.isNaN(numeric)) {
    return 'El Handicap Index no es válido.';
  }
  if (!isPlus && numeric > MAX_HANDICAP) {
    return `El Handicap Index no puede ser mayor a ${MAX_HANDICAP}.`;
  }

  return null;
}

function validateForm(values: ParticipantForm): string | null {
  const firstName = values.firstName.trim();
  const paternalLastName = values.paternalLastName.trim();
  const maternalLastName = values.maternalLastName.trim();
  const ghin = normalizeGhin(values.ghin);
  const handicapIndex = values.handicapIndex.trim();
  const phone = normalizePhone(values.phone);
  const email = values.email.trim();

  if (!firstName || !paternalLastName || !maternalLastName) {
    return 'Nombre y apellidos son obligatorios.';
  }
  if (!GHIN_RE.test(ghin)) {
    return 'El GHIN NUMBER debe ser exactamente 7 dígitos numéricos.';
  }
  const handicapError = validateHandicapIndex(handicapIndex);
  if (handicapError) {
    return handicapError;
  }
  if (!PHONE_RE.test(phone)) {
    return 'Ingresa un celular válido de 10 dígitos.';
  }
  if (!email) {
    return 'El correo electrónico es obligatorio.';
  }
  return null;
}

type RegistrationPageProps = {
  isMock?: boolean;
};

export default function RegistrationPage({ isMock = false }: RegistrationPageProps) {
  const [values, setValues] = useState<ParticipantForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = amplifyReady || isMock;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    const payload = {
      firstName: values.firstName.trim(),
      paternalLastName: values.paternalLastName.trim(),
      maternalLastName: values.maternalLastName.trim(),
      ghin: normalizeGhin(values.ghin),
      handicapIndex: values.handicapIndex.trim(),
      phone: normalizePhone(values.phone),
      email: values.email.trim().toLowerCase(),
    };

    try {
      if (isMock) {
        await new Promise((r) => setTimeout(r, 600));
        console.info('[mock] Integrante registrado:', payload);
      } else {
        const { errors } = await client.models.Participant.create(payload, {
          authMode: 'apiKey',
        });
        if (errors?.length) throw new Error(errors[0].message);
      }
      setSubmitted(true);
      setValues(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar el registro.');
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <div className="registration-page">
        <div className="registration-card registration-success">
          <img src="/logo.png" alt="Gallitos" className="registration-logo" />
          <h1>¡Registro recibido!</h1>
          <p>Tus datos fueron enviados correctamente. Gracias por registrarte.</p>
          <button
            type="button"
            className="btn btn-primary registration-submit"
            onClick={() => setSubmitted(false)}
          >
            Registrar otro integrante
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-page">
      <div className="registration-card">
        <img src="/logo.png" alt="Gallitos" className="registration-logo" />
        <h1>Registro de Integrante</h1>

        {!canSubmit ? (
          <div className="registration-offline">
            <p>El registro en línea aún no está disponible. Contacta al organizador del evento.</p>
          </div>
        ) : (
          <>
            {error ? <p className="form-error">{error}</p> : null}
            {isMock ? (
              <p className="registration-mock-badge">Modo local — los datos no se guardan en la nube</p>
            ) : null}

            <form onSubmit={submit} className="registration-form" noValidate>
              <div className="form-row">
                <label htmlFor="firstName">Nombre(s)</label>
                <input
                  id="firstName"
                  name="firstName"
                  value={values.firstName}
                  onChange={(e) => setValues((v) => ({ ...v, firstName: e.target.value }))}
                  autoComplete="given-name"
                  autoCapitalize="words"
                  required
                />
              </div>

              <div className="form-row">
                <label htmlFor="paternalLastName">Apellido paterno</label>
                <input
                  id="paternalLastName"
                  name="paternalLastName"
                  value={values.paternalLastName}
                  onChange={(e) => setValues((v) => ({ ...v, paternalLastName: e.target.value }))}
                  autoComplete="family-name"
                  autoCapitalize="words"
                  required
                />
              </div>

              <div className="form-row">
                <label htmlFor="maternalLastName">Apellido materno</label>
                <input
                  id="maternalLastName"
                  name="maternalLastName"
                  value={values.maternalLastName}
                  onChange={(e) => setValues((v) => ({ ...v, maternalLastName: e.target.value }))}
                  autoComplete="additional-name"
                  autoCapitalize="words"
                  required
                />
              </div>

              <div className="form-row">
                <label htmlFor="ghin">GHIN NUMBER (USGA)</label>
                <input
                  id="ghin"
                  name="ghin"
                  value={values.ghin}
                  onChange={(e) => setValues((v) => ({ ...v, ghin: normalizeGhin(e.target.value) }))}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="7 dígitos"
                  maxLength={7}
                  required
                />
              </div>

              <div className="form-row">
                <label htmlFor="handicapIndex">Handicap Index</label>
                <input
                  id="handicapIndex"
                  name="handicapIndex"
                  value={values.handicapIndex}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, handicapIndex: sanitizeHandicapInput(e.target.value) }))
                  }
                  inputMode="decimal"
                  autoComplete="off"
                  maxLength={5}
                  required
                />
              </div>

              <div className="form-row">
                <label htmlFor="phone">Celular</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  value={values.phone}
                  onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
                  autoComplete="tel"
                  placeholder="10 dígitos"
                  maxLength={15}
                  required
                />
              </div>

              <div className="form-row">
                <label htmlFor="email">Correo electrónico</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  value={values.email}
                  onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                  autoComplete="email"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary registration-submit" disabled={saving}>
                {saving ? 'Enviando…' : 'Enviar registro'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
