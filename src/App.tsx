import { useCallback, useEffect, useMemo, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { Authenticator, translations } from '@aws-amplify/ui-react';
import { I18n } from 'aws-amplify/utils';
import '@aws-amplify/ui-react/styles.css';
import type { Schema } from '../amplify/data/resource';
import { amplifyReady } from './amplify';
import RegistrationPage from './RegistrationPage';
import './App.css';

// Configurar idioma español para el Authenticator
I18n.putVocabularies(translations);
I18n.setLanguage('es');

const client = generateClient<Schema>();

type Participant = Schema['Participant']['type'];

/**
 * Correos autorizados para entrar al Panel de Administrador.
 * Cualquiera puede iniciar sesión con Cognito, pero solo estos correos
 * podrán ver las inscripciones. Para agregar más admins, añade su correo
 * (en minúsculas) a esta lista.
 */
const ADMIN_EMAILS = ['izzojaime@gmail.com'];

function isAdminEmail(email: string) {
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

function SetupMessage(props: { onMockMode: () => void }) {
  return (
    <div className="setup-panel">
      <img src="/logo.png" alt="Gallitos" className="app-logo" style={{ height: '80px', marginBottom: '1rem' }} />
      <p style={{ marginTop: '0rem', color: 'var(--text-muted)' }}>
        El backend aún no está conectado. Para probar la base de datos real, genera la configuración local con el sandbox de Amplify.
      </p>
      <code>npx ampx sandbox</code>
      <p style={{ marginBottom: '2rem' }}>
        O bien, puedes explorar el panel con datos locales de ejemplo.
      </p>
      <button className="btn btn-primary" onClick={props.onMockMode}>
        Ver Panel (Modo Local)
      </button>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fullName(p: Participant) {
  return [p.firstName, p.paternalLastName, p.maternalLastName].filter(Boolean).join(' ');
}

// ---- DATOS DE EJEMPLO (Modo Local) ----
let mockDb: Participant[] = [
  {
    id: 'p1',
    firstName: 'Eugenio',
    paternalLastName: 'Rodríguez',
    maternalLastName: 'García',
    ghin: '1122334',
    handicapIndex: '8.4',
    phone: '5512345678',
    email: 'eugenio@golf.com',
    createdAt: '2026-06-20T17:30:00.000Z',
    updatedAt: '2026-06-20T17:30:00.000Z',
  } as Participant,
  {
    id: 'p2',
    firstName: 'Alejandro',
    paternalLastName: 'Torres',
    maternalLastName: 'Méndez',
    ghin: '9988776',
    handicapIndex: '14.1',
    phone: '8199887766',
    email: 'alejandro@example.com',
    createdAt: '2026-06-22T09:15:00.000Z',
    updatedAt: '2026-06-22T09:15:00.000Z',
  } as Participant,
];

function ParticipantsAdminPanel(props: { userEmail: string; signOut: () => void; isMock?: boolean }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setListError(null);

    if (props.isMock) {
      await new Promise((r) => setTimeout(r, 500));
      setParticipants([...mockDb]);
      setLoading(false);
      return;
    }

    try {
      const { data, errors } = await client.models.Participant.list();
      if (errors?.length) {
        setListError(errors.map((e) => e.message).join(' '));
        setParticipants([]);
      } else {
        setParticipants((data ?? []).filter(Boolean) as Participant[]);
      }
    } catch {
      setListError('Error cargando las inscripciones.');
    } finally {
      setLoading(false);
    }
  }, [props.isMock]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const sorted = [...participants].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta; // más recientes primero
    });

    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((p) => {
      const blob = [fullName(p), p.ghin, p.email, p.phone, p.handicapIndex]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [participants, search]);

  const deleteParticipant = async (p: Participant) => {
    if (!p.id) return;
    const ok = window.confirm(`¿Eliminar la inscripción de ${fullName(p)}?`);
    if (!ok) return;

    if (props.isMock) {
      mockDb = mockDb.filter((x) => x.id !== p.id);
      await load();
      return;
    }

    const { errors } = await client.models.Participant.delete({ id: p.id });
    if (errors?.length) {
      window.alert(errors.map((e) => e.message).join(' '));
      return;
    }
    await load();
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-brand">
          <img src="/logo.png" alt="Gallitos" className="app-logo" />
          <div>
            <div className="app-subtitle-container">
              <p>Panel de Administrador · Inscripciones</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.35rem', color: '#9ca3af' }}>
                Sesión: {props.userEmail} (Admin)
              </p>
              {props.isMock && (
                <p style={{ fontSize: '0.8rem', marginTop: '0.35rem', color: 'var(--brand-gold)' }}>
                  Modo Local (datos de ejemplo)
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="toolbar">
          <button type="button" className="btn btn-ghost" onClick={() => void load()} disabled={loading}>
            {loading ? '...' : 'Actualizar'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={props.signOut}>
            Salir
          </button>
        </div>
      </header>

      <div className="setup-panel" style={{ margin: '0 0 1.5rem', textAlign: 'left', padding: '1.25rem 1.5rem' }}>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          Total de inscripciones registradas:{' '}
          <strong style={{ color: 'var(--brand-navy)', fontSize: '1.25rem' }}>{participants.length}</strong>
        </p>
      </div>

      <div className="toolbar" style={{ marginBottom: '1.5rem' }}>
        <input
          className="search"
          type="search"
          placeholder="Buscar por nombre, GHIN, correo, teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar inscripciones"
        />
      </div>

      {listError ? <p className="form-error">{listError}</p> : null}

      <div className="card-list">
        {loading ? (
          <p className="empty" style={{ gridColumn: '1 / -1' }}>
            Cargando inscripciones…
          </p>
        ) : filtered.length === 0 ? (
          <p className="empty" style={{ gridColumn: '1 / -1' }}>
            {participants.length === 0
              ? 'Aún no hay inscripciones registradas.'
              : 'No se encontraron resultados para tu búsqueda.'}
          </p>
        ) : (
          filtered.map((p) => (
            <article key={p.id} className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-name">{fullName(p)}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    <span className="badge">GHIN {p.ghin}</span>
                    <span className="badge badge-inactive">HCP {p.handicapIndex}</span>
                  </div>
                </div>
              </div>
              <div className="card-grid">
                <div>
                  <p className="label">Correo</p>
                  <p className="value">{p.email}</p>
                </div>
                <div>
                  <p className="label">Celular</p>
                  <p className="value">{p.phone}</p>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p className="label">Fecha de registro</p>
                  <p className="value" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(p.createdAt)}
                  </p>
                </div>
              </div>
              <div className="card-actions">
                <button type="button" className="btn btn-danger" onClick={() => void deleteParticipant(p)}>
                  Eliminar
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function AccessHeader(props: { signOut: () => void }) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <img src="/logo.png" alt="Gallitos" className="app-logo" />
      </div>
      <div className="toolbar">
        <button className="btn btn-ghost" onClick={props.signOut}>
          Salir de sesión
        </button>
      </div>
    </header>
  );
}

function AdminGate(props: { userEmail: string; signOut: () => void; isMock: boolean }) {
  if (!isAdminEmail(props.userEmail)) {
    return (
      <div className="app-shell">
        <AccessHeader signOut={props.signOut} />
        <div className="setup-panel">
          <h2>Acceso restringido</h2>
          <p style={{ marginTop: '1rem' }}>
            Tu cuenta <strong>{props.userEmail || 'actual'}</strong> no tiene permisos de administrador.
          </p>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
            Si necesitas acceso al panel de inscripciones, contacta al organizador para que agregue tu correo a la
            lista de administradores.
          </p>
        </div>
      </div>
    );
  }

  return <ParticipantsAdminPanel userEmail={props.userEmail} signOut={props.signOut} isMock={props.isMock} />;
}

function isRegistrationPath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return normalized === '/registro' || normalized.endsWith('/registro');
}

export default function App() {
  const [isMock, setIsMock] = useState(false);
  const isRegistrationRoute = isRegistrationPath(window.location.pathname);

  if (isRegistrationRoute) {
    const mockFromQuery = new URLSearchParams(window.location.search).get('mock') === '1';
    return <RegistrationPage isMock={isMock || mockFromQuery || !amplifyReady} />;
  }

  if (!amplifyReady && !isMock) {
    return <SetupMessage onMockMode={() => setIsMock(true)} />;
  }

  // Modo Local: entramos directamente al panel con datos de ejemplo.
  if (isMock) {
    return <ParticipantsAdminPanel userEmail="admin@local" signOut={() => setIsMock(false)} isMock />;
  }

  return (
    <div className="auth-container">
      <div className="auth-logo-header">
        <img src="/logo.png" alt="Gallitos" className="app-logo" />
      </div>
      <Authenticator loginMechanisms={['email']}>
        {({ signOut, user }) => (
          <AdminGate
            userEmail={user?.signInDetails?.loginId ?? ''}
            signOut={signOut ?? (() => {})}
            isMock={false}
          />
        )}
      </Authenticator>
    </div>
  );
}
