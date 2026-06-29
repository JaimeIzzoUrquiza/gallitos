import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
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

type Member = Schema['Member']['type'];

function SetupMessage(props: { onMockMode: () => void }) {
  return (
    <div className="setup-panel">
      <img src="/logo.png" alt="Gallitos" className="app-logo" style={{ height: '80px', marginBottom: '1rem' }} />
      <p style={{ marginTop: '0rem', color: 'var(--text-muted)' }}>
        El backend aún no está conectado. Para probar la base de datos real, genera la configuración local con el sandbox de Amplify.
      </p>
      <code>npx ampx sandbox</code>
      <p style={{ marginBottom: '2rem' }}>
        O bien, puedes explorar el nuevo diseño con datos locales.
      </p>
      <button className="btn btn-primary" onClick={props.onMockMode}>
        Ver Diseño (Modo Local)
      </button>
    </div>
  );
}

type MemberFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ghin: string;
  notes: string;
  isActive: boolean;
  isApproved: boolean;
  role: string;
};

const emptyForm: MemberFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  ghin: '',
  notes: '',
  isActive: true,
  isApproved: true,
  role: 'PLAYER',
};

function memberToForm(m: Member): MemberFormValues {
  return {
    firstName: m.firstName ?? '',
    lastName: m.lastName ?? '',
    email: m.email ?? '',
    phone: m.phone ?? '',
    ghin: m.ghin ?? '',
    notes: m.notes ?? '',
    isActive: m.isActive ?? true,
    isApproved: m.isApproved ?? false,
    role: m.role ?? 'PLAYER',
  };
}

function MemberFormModal(props: {
  title: string;
  initial: MemberFormValues;
  isAdmin: boolean;
  onSave: (values: MemberFormValues) => Promise<void>;
  onClose: () => void;
}) {
  const [values, setValues] = useState<MemberFormValues>(props.initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValues(props.initial);
  }, [props.initial]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const fn = values.firstName.trim();
    const ln = values.lastName.trim();
    const gh = values.ghin.trim();
    if (!fn || !ln || !gh) {
      setError('Nombre, apellido y GHIN son obligatorios.');
      return;
    }
    setSaving(true);
    try {
      await props.onSave({
        ...values,
        firstName: fn,
        lastName: ln,
        ghin: gh,
        email: values.email.trim(),
        phone: values.phone.trim(),
        notes: values.notes.trim(),
      });
      props.onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={props.onClose}>
      <div className="modal" role="dialog" aria-labelledby="member-form-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="member-form-title">{props.title}</h2>
        {error ? <p className="form-error">{error}</p> : null}
        <form onSubmit={submit}>
          <div className="form-row">
            <label htmlFor="firstName">Nombre</label>
            <input
              id="firstName"
              value={values.firstName}
              onChange={(e) => setValues((v) => ({ ...v, firstName: e.target.value }))}
              autoComplete="given-name"
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="lastName">Apellido</label>
            <input
              id="lastName"
              value={values.lastName}
              onChange={(e) => setValues((v) => ({ ...v, lastName: e.target.value }))}
              autoComplete="family-name"
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="ghin">GHIN (USGA)</label>
            <input
              id="ghin"
              value={values.ghin}
              onChange={(e) => setValues((v) => ({ ...v, ghin: e.target.value }))}
              inputMode="numeric"
              autoComplete="off"
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="email">Correo (cuenta de acceso)</label>
            <input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
              autoComplete="email"
            />
          </div>
          <div className="form-row">
            <label htmlFor="phone">Teléfono (opcional)</label>
            <input
              id="phone"
              type="tel"
              value={values.phone}
              onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
              autoComplete="tel"
            />
          </div>
          <div className="form-row">
            <label htmlFor="notes">Notas (opcional)</label>
            <textarea
              id="notes"
              value={values.notes}
              onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
            />
          </div>
          <div className="form-row">
            <label className="checkbox-label">
              <input
                 type="checkbox"
                 checked={values.isActive}
                 onChange={(e) => setValues((v) => ({ ...v, isActive: e.target.checked }))}
              />
              <span>Activo en el equipo</span>
            </label>
          </div>
          {props.isAdmin && (
            <>
              <div className="form-row">
                <label className="checkbox-label">
                  <input
                     type="checkbox"
                     checked={values.isApproved}
                     onChange={(e) => setValues((v) => ({ ...v, isApproved: e.target.checked }))}
                  />
                  <span>Registro aprobado</span>
                </label>
              </div>
              <div className="form-row">
                <label htmlFor="role">Rol en plataforma</label>
                <select
                  id="role"
                  value={values.role}
                  onChange={(e) => setValues((v) => ({ ...v, role: e.target.value }))}
                >
                  <option value="PLAYER">Jugador (Acceso Estándar)</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
            </>
          )}
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={props.onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- MOCK DATA DATABASE ----
let mockDb: Member[] = [
  { id: 'm1', firstName: 'Eugenio', lastName: 'Rodríguez', ghin: '1122334', email: 'eugenio@golf.com', phone: '55 1234 5678', isActive: true, isApproved: true, role: 'ADMIN', notes: 'Capitán del equipo', createdAt: '', updatedAt: '' } as Member,
  { id: 'm2', firstName: 'Alejandro', lastName: 'Torres', ghin: '9988776', email: '', phone: '', isActive: true, isApproved: true, role: 'PLAYER', notes: '', createdAt: '', updatedAt: '' } as Member,
  { id: 'm3', firstName: 'Santiago', lastName: 'López', ghin: '4455667', email: 'santiago@example.com', phone: '81 9876 5432', isActive: false, isApproved: true, role: 'PLAYER', notes: 'Ausente esta temporada', createdAt: '', updatedAt: '' } as Member,
  { id: 'm4', firstName: 'Nuevo', lastName: 'Aspirante', ghin: '0000000', email: 'nuevo@example.com', phone: '00 0000 0000', isActive: true, isApproved: false, role: 'PLAYER', notes: 'Requiere aprobación', createdAt: '', updatedAt: '' } as Member,
];

function MembersApp(props: { currentUser: Member; signOut: () => void; isMock?: boolean }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterPending, setFilterPending] = useState(false);
  const [modal, setModal] = useState<
    | { mode: 'create'; form: MemberFormValues }
    | { mode: 'edit'; member: Member; form: MemberFormValues }
    | null
  >(null);

  const isAdmin = props.currentUser.role === 'ADMIN';

  const load = useCallback(async () => {
    setLoading(true);
    setListError(null);
    
    if (props.isMock) {
      await new Promise(r => setTimeout(r, 600));
      setMembers([...mockDb]);
      setLoading(false);
      return;
    }

    try {
      const { data, errors } = await client.models.Member.list();
      if (errors?.length) {
        setListError(errors.map((e) => e.message).join(' '));
        setMembers([]);
      } else {
        setMembers((data ?? []).filter(Boolean) as Member[]);
      }
    } catch (err: unknown) {
      setListError('Error cargando los datos.');
    } finally {
      setLoading(false);
    }
  }, [props.isMock]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    let sorted = [...members].sort((a, b) =>
      (a.lastName ?? '').localeCompare(b.lastName ?? '', 'es', { sensitivity: 'base' }),
    );
    
    if (filterPending) {
      sorted = sorted.filter(m => !m.isApproved);
    }
    
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((m) => {
      const blob = [m.firstName, m.lastName, m.ghin, m.email, m.phone]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [members, search, filterPending]);

  const pendingCount = useMemo(() => members.filter(m => !m.isApproved).length, [members]);

  const createMember = async (values: MemberFormValues) => {
    if (props.isMock) {
      const newM: Member = {
        id: `m${Date.now()}`,
        ...values,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Member;
      mockDb.push(newM);
      await load();
      return;
    }
    
    const emailTrim = values.email.trim();
    const { errors } = await client.models.Member.create({
      firstName: values.firstName,
      lastName: values.lastName,
      ghin: values.ghin,
      phone: values.phone || undefined,
      notes: values.notes || undefined,
      isActive: values.isActive,
      isApproved: values.isApproved,
      role: values.role,
      ...(emailTrim ? { email: emailTrim } : {}),
    });
    if (errors?.length) throw new Error(errors.map((e) => e.message).join(' '));
    await load();
  };

  const updateMember = async (id: string, values: MemberFormValues) => {
    if (props.isMock) {
      const idx = mockDb.findIndex(m => m.id === id);
      if (idx !== -1) {
        mockDb[idx] = { ...mockDb[idx], ...values };
      }
      await load();
      return;
    }

    const emailTrim = values.email.trim();
    const { errors } = await client.models.Member.update({
      id,
      firstName: values.firstName,
      lastName: values.lastName,
      ghin: values.ghin,
      phone: values.phone.trim() || null,
      notes: values.notes.trim() || null,
      isActive: values.isActive,
      isApproved: values.isApproved,
      role: values.role,
      email: emailTrim || null,
    });
    if (errors?.length) throw new Error(errors.map((e) => e.message).join(' '));
    await load();
  };

  const deleteMember = async (m: Member) => {
    if (!m.id) return;
    const ok = window.confirm(`¿Eliminar a ${m.firstName} ${m.lastName}?`);
    if (!ok) return;

    if (props.isMock) {
      mockDb = mockDb.filter(x => x.id !== m.id);
      await load();
      return;
    }

    const { errors } = await client.models.Member.delete({ id: m.id });
    if (errors?.length) {
      window.alert(errors.map((e) => e.message).join(' '));
      return;
    }
    await load();
  };

  const approveMember = async (m: Member) => {
    if (!m.id) return;
    if (props.isMock) {
      const idx = mockDb.findIndex(x => x.id === m.id);
      if (idx !== -1) mockDb[idx] = { ...mockDb[idx], isApproved: true };
      await load();
      return;
    }

    const { errors } = await client.models.Member.update({ id: m.id, isApproved: true });
    if (errors?.length) {
      window.alert(errors[0].message);
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
              <p>Directorio de Integrantes y GHIN</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.35rem', color: '#9ca3af' }}>
                Sesión: {props.currentUser.email} {isAdmin ? '(Admin)' : ''}
              </p>
              {props.isMock && (
                <p style={{ fontSize: '0.8rem', marginTop: '0.35rem', color: 'var(--brand-gold)' }}>
                  Modo Local (Mock Data)
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="toolbar">
          <button type="button" className="btn btn-ghost" onClick={() => void load()} disabled={loading}>
            {loading ? '...' : 'Actualizar'}
          </button>
          {isAdmin && (
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => setModal({ mode: 'create', form: { ...emptyForm } })}
            >
              Invitar / Nuevo
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={props.signOut}>
            Salir
          </button>
        </div>
      </header>

      {isAdmin && pendingCount > 0 && (
        <div className="setup-panel" style={{marginBottom: '1.5rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)'}}>
          <h3 style={{color: '#f59e0b', marginBottom: '0.5rem'}}>Aprobaciones Pendientes</h3>
          <p>Tienes {pendingCount} solicitud(es) de registro pendiente(s) de aprobación.</p>
          <button 
            className="btn btn-primary" 
            style={{marginTop: '1rem', backgroundColor: '#f59e0b'}}
            onClick={() => setFilterPending(!filterPending)}
          >
            {filterPending ? 'Mostrar a todos' : 'Filtrar pendientes'}
          </button>
        </div>
      )}

      <div className="toolbar" style={{ marginBottom: '1.5rem' }}>
        <input
          className="search"
          type="search"
          placeholder="Buscar integrante por nombre, GHIN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar integrantes"
        />
      </div>

      {listError ? <p className="form-error">{listError}</p> : null}

      <div className="card-list">
        {loading ? (
          <p className="empty" style={{ gridColumn: '1 / -1' }}>Cargando información del equipo…</p>
        ) : filtered.length === 0 ? (
          <p className="empty" style={{ gridColumn: '1 / -1' }}>
            {members.length === 0 ? 'No hay integrantes en esta base de datos.' : 'No se encontraron resultados.'}
          </p>
        ) : (
          filtered.map((m) => (
            <article key={m.id} className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-name">
                    {m.firstName} {m.lastName}
                  </h3>
                  <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap'}}>
                    <span className={m.isActive ? 'badge' : 'badge badge-inactive'}>
                      {m.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                    {!m.isApproved && (
                      <span className="badge badge-inactive" style={{backgroundColor: '#b45309', color: '#fff'}}>Pendiente</span>
                    )}
                    {m.role === 'ADMIN' && (
                      <span className="badge" style={{backgroundColor: '#7c3aed', color: '#fff'}}>Admin</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="card-grid">
                <div>
                  <p className="label">GHIN</p>
                  <p className="value" style={{ fontWeight: 600 }}>{m.ghin}</p>
                </div>
                {m.email ? (
                  <div>
                    <p className="label">Correo</p>
                    <p className="value">{m.email}</p>
                  </div>
                ) : null}
                {m.phone ? (
                  <div>
                    <p className="label">Teléfono</p>
                    <p className="value">{m.phone}</p>
                  </div>
                ) : null}
                {m.notes ? (
                  <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                    <p className="label">Notas</p>
                    <p className="value" style={{ color: 'var(--text-muted)' }}>{m.notes}</p>
                  </div>
                ) : null}
              </div>
              <div className="card-actions">
                {(isAdmin || props.currentUser.id === m.id) && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={() =>
                      setModal({
                        mode: 'edit',
                        member: m,
                        form: memberToForm(m),
                      })
                    }
                  >
                    Editar
                  </button>
                )}
                {isAdmin && (
                  <button 
                    type="button" 
                    className="btn btn-danger" 
                    onClick={() => void deleteMember(m)}
                  >
                    Eliminar
                  </button>
                )}
                {(isAdmin && !m.isApproved) && (
                  <button 
                    type="button" 
                    className="btn btn-gold" 
                     onClick={() => void approveMember(m)}
                  >
                    Aprobar
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      {modal?.mode === 'create' ? (
        <MemberFormModal
          title="Nuevo integrante"
          initial={modal.form}
          isAdmin={isAdmin}
          onClose={() => setModal(null)}
          onSave={createMember}
        />
      ) : null}
      {modal?.mode === 'edit' ? (
        <MemberFormModal
          title="Editar integrante"
          initial={modal.form}
          isAdmin={isAdmin}
          onClose={() => setModal(null)}
          onSave={async (values) => {
            if (!modal.member.id) throw new Error('Falta id de registro.');
            await updateMember(modal.member.id, values);
          }}
        />
      ) : null}
    </div>
  );
}

function CompleteRegistration(props: {
  userEmail: string;
  onSaved: () => void;
  isMock: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const first = fd.get('firstName')?.toString().trim() || '';
    const last = fd.get('lastName')?.toString().trim() || '';
    const ghin = fd.get('ghin')?.toString().trim() || '';
    const phone = fd.get('phone')?.toString().trim() || '';

    if (!first || !last || !ghin) {
      setError("Nombre, apellido y GHIN son requeridos.");
      setSaving(false);
      return;
    }

    try {
      if (!props.isMock) {
        // Enforce the first user to be ADMIN automatically, or default to PLAYER
        // If there are zero members in DB, set as ADMIN! 
        const { data: allMembers } = await client.models.Member.list({ limit: 1 });
        const isFirst = allMembers.length === 0;

        const { errors } = await client.models.Member.create({
          firstName: first,
          lastName: last,
          email: props.userEmail,
          ghin,
          phone: phone || undefined,
          isActive: true,
          isApproved: isFirst ? true : false, // Auto-approve the first user
          role: isFirst ? 'ADMIN' : 'PLAYER'
        });
        if (errors?.length) throw new Error(errors[0].message);
      } else {
        mockDb.push({
          id: `m${Date.now()}`,
          firstName: first,
          lastName: last,
          email: props.userEmail,
          ghin,
          phone,
          isActive: true,
          isApproved: false,
          role: 'PLAYER',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as Member);
      }
      props.onSaved();
    } catch (err: any) {
      setError(err.message || 'Error al completar perfil');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="setup-panel">
      <h2>Completa tu registro</h2>
      <p style={{marginBottom: '1.5rem', marginTop: '0.5rem', color: 'var(--text-muted)'}}>
        Bienvenido a Gallitos. Por favor proporciona tus datos para enviar tu solicitud de acceso.
      </p>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={submit} style={{textAlign: 'left', width: '100%', maxWidth: '400px', margin: '0 auto'}}>
        <div className="form-row">
          <label>Nombre</label>
          <input name="firstName" required />
        </div>
         <div className="form-row">
          <label>Apellido</label>
          <input name="lastName" required />
        </div>
         <div className="form-row">
          <label>GHIN</label>
          <input name="ghin" required />
        </div>
         <div className="form-row">
          <label>Teléfono (opcional)</label>
          <input name="phone" />
        </div>
        <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}} disabled={saving}>
          {saving ? 'Enviando...' : 'Enviar Solicitud'}
        </button>
      </form>
    </div>
  )
}

function AuthWrapper(props: { userEmail: string; signOut: () => void; isMock: boolean }) {
  const [currentUser, setCurrentUser] = useState<Member | null | 'not_found'>('not_found');
  const [loading, setLoading] = useState(true);

  const checkUser = useCallback(async () => {
    setLoading(true);
    try {
      if (props.isMock) {
        await new Promise(r => setTimeout(r, 600));
        const found = mockDb.find(m => m.email === props.userEmail);
        setCurrentUser(found || 'not_found');
      } else {
        const { data } = await client.models.Member.list({ filter: { email: { eq: props.userEmail } } });
        let userRecord: Member | null = null;
        
        if (data && data.length > 0) {
          userRecord = data[0] as Member;
        }

        // EMERGENCIA: Si eres tú (dueño), te auto-aprobamos y te damos Rol ADMIN en la sesión
        // Esto soluciona el bloqueo si tu registro ya existía antes de los nuevos cambios.
        if (props.userEmail === 'izzojaime@gmail.com' && userRecord) {
           userRecord.isApproved = true;
           userRecord.role = 'ADMIN';
        }

        setCurrentUser(userRecord || 'not_found');
      }
    } catch(e) {
      console.error(e);
      // fallback
      setCurrentUser('not_found');
    } finally {
      setLoading(false);
    }
  }, [props.isMock, props.userEmail]);

  useEffect(() => {
    void checkUser();
  }, [checkUser]);

  if (loading) {
    return <div className="setup-panel"><h3>Cargando sesión...</h3></div>;
  }

  if (currentUser === 'not_found') {
    return (
      <div className="app-shell">
         <header className="app-header">
           <div className="header-brand">
             <img src="/logo.png" alt="Gallitos" className="app-logo" />
           </div>
           <div className="toolbar">
             <button className="btn btn-ghost" onClick={props.signOut}>Salir de sesión</button>
           </div>
         </header>
         <CompleteRegistration userEmail={props.userEmail} onSaved={checkUser} isMock={props.isMock} />
      </div>
    );
  }

  if (currentUser && !currentUser.isApproved) {
    return (
      <div className="app-shell">
         <header className="app-header">
           <div className="header-brand">
             <img src="/logo.png" alt="Gallitos" className="app-logo" />
           </div>
           <div className="toolbar">
             <button className="btn btn-ghost" onClick={props.signOut}>Salir de sesión</button>
           </div>
         </header>
         <div className="setup-panel">
            <h2>Aprobación Pendiente</h2>
            <p style={{marginTop: '1rem'}}>Hola <strong>{currentUser.firstName}</strong>, tu registro ha sido recibido exitosamente.</p>
            <p style={{marginTop: '1rem'}}>Por seguridad, un administrador debe aprobar tu cuenta para que puedas visualizar la información del equipo.</p>
            <p style={{marginTop: '1rem', color: 'var(--brand-gold)'}}>Recibirás acceso en cuanto seas aprobado.</p>
         </div>
      </div>
    );
  }

  // Approved!
  return <MembersApp currentUser={currentUser!} signOut={props.signOut} isMock={props.isMock} />;
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

  // In Mock mode without Authenticator, we simulate logging in as eugenio (ADMIN)
  if (isMock || (!amplifyReady && isMock)) {
    return (
      <AuthWrapper userEmail="eugenio@golf.com" signOut={() => {}} isMock={true} />
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-logo-header">
        <img src="/logo.png" alt="Gallitos" className="app-logo" />
      </div>
      <Authenticator loginMechanisms={['email']}>
        {({ signOut, user }) => (
          <AuthWrapper 
            userEmail={user?.signInDetails?.loginId ?? ''} 
            signOut={signOut ?? (() => {})} 
            isMock={false} 
          />
        )}
      </Authenticator>
    </div>
  );
}
