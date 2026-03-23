import { useState } from 'react';

interface Props {
  onAccept: () => void;
}

export default function GdprConsentModal({ onAccept }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [loading, setLoading]   = useState(false);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    // Considéré comme "lu" si l'utilisateur a scrollé à 80% du contenu
    if (el.scrollTop + el.clientHeight >= el.scrollHeight * 0.8) {
      setScrolled(true);
    }
  }

  async function handleAccept() {
    setLoading(true);
    await onAccept();
    setLoading(false);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        width: '100%', maxWidth: 520,
        background: '#1c1c1e',
        borderRadius: 20,
        border: '1px solid #38383a',
        display: 'flex', flexDirection: 'column',
        maxHeight: '90dvh',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '24px 24px 16px',
          borderBottom: '1px solid #38383a',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 28 }}>📍</span>
            <h2 style={{
              margin: 0,
              fontSize: 18, fontWeight: 700, color: '#fff',
              letterSpacing: '-0.02em',
            }}>
              Information RGPD — Géolocalisation
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
            À lire avant votre première utilisation de l'application Matias.
          </p>
        </div>

        {/* Contenu scrollable */}
        <div
          onScroll={handleScroll}
          style={{
            flex: 1, overflowY: 'auto',
            padding: '20px 24px',
            color: 'rgba(255,255,255,0.8)',
            fontSize: 14, lineHeight: 1.65,
          }}
        >
          <Section title="Responsable du traitement">
            <p>
              <strong style={{ color: '#fff' }}>Yorgios</strong> — représenté par la direction de l'établissement.
            </p>
          </Section>

          <Section title="Données collectées">
            <p>
              Lors de chaque pointage (arrivée / départ), l'application enregistre :
            </p>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Vos <strong style={{ color: '#fff' }}>coordonnées GPS</strong> (latitude, longitude) au moment du pointage</li>
              <li>L'<strong style={{ color: '#fff' }}>horodatage</strong> (date et heure)</li>
              <li>Le <strong style={{ color: '#fff' }}>type d'action</strong> (entrée ou sortie)</li>
            </ul>
          </Section>

          <Section title="Finalité du traitement">
            <p>
              Ces données sont collectées exclusivement pour <strong style={{ color: '#fff' }}>vérifier votre présence sur le lieu de travail</strong> (zone définie autour du restaurant) et calculer vos horaires de présence.
            </p>
            <p style={{ marginTop: 8 }}>
              La géolocalisation est activée <strong style={{ color: '#fff' }}>uniquement au moment du pointage</strong>, et non de façon continue.
            </p>
          </Section>

          <Section title="Base légale">
            <p>
              Le traitement repose sur l'<strong style={{ color: '#fff' }}>intérêt légitime de l'employeur</strong> à contrôler les horaires de travail conformément au contrat de travail (Article 6.1.f du RGPD).
            </p>
          </Section>

          <Section title="Destinataires">
            <p>
              Vos données de pointage sont accessibles uniquement aux personnes habilitées :
              patron, administrateur et manager de l'établissement.
            </p>
            <p style={{ marginTop: 8 }}>
              Aucune donnée n'est transmise à des tiers ni utilisée à des fins commerciales.
            </p>
          </Section>

          <Section title="Durée de conservation">
            <p>
              Les données de pointage sont conservées pendant <strong style={{ color: '#fff' }}>12 mois</strong> à compter de leur enregistrement, puis supprimées.
            </p>
          </Section>

          <Section title="Vos droits (RGPD)">
            <p>Conformément au Règlement Général sur la Protection des Données, vous disposez des droits suivants :</p>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong style={{ color: '#fff' }}>Droit d'accès</strong> — obtenir une copie de vos données</li>
              <li><strong style={{ color: '#fff' }}>Droit de rectification</strong> — corriger des données inexactes</li>
              <li><strong style={{ color: '#fff' }}>Droit à l'effacement</strong> — demander la suppression de vos données</li>
              <li><strong style={{ color: '#fff' }}>Droit d'opposition</strong> — vous opposer au traitement dans certains cas</li>
              <li><strong style={{ color: '#fff' }}>Droit à la limitation</strong> — limiter temporairement le traitement</li>
            </ul>
          </Section>

          <Section title="Exercer vos droits">
            <p>
              Pour exercer vos droits ou poser une question, adressez votre demande directement à la direction du restaurant.
            </p>
            <p style={{ marginTop: 8 }}>
              Vous pouvez également déposer une réclamation auprès de la{' '}
              <strong style={{ color: '#fff' }}>CNIL</strong> (Commission Nationale de l'Informatique et des Libertés) — <span style={{ color: 'rgba(255,255,255,0.5)' }}>www.cnil.fr</span>.
            </p>
          </Section>

          {/* Indicateur de lecture */}
          {!scrolled && (
            <div style={{
              marginTop: 16,
              padding: '10px 14px',
              background: 'rgba(232,118,10,0.1)',
              border: '1px solid rgba(232,118,10,0.3)',
              borderRadius: 10,
              fontSize: 12, color: '#E8760A', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>↓</span>
              Faites défiler pour lire l'intégralité avant d'accepter
            </div>
          )}
        </div>

        {/* Footer — bouton */}
        <div style={{
          padding: '16px 24px 24px',
          borderTop: '1px solid #38383a',
          flexShrink: 0,
        }}>
          <button
            onClick={handleAccept}
            disabled={!scrolled || loading}
            style={{
              width: '100%', height: 52,
              background: scrolled && !loading ? '#E8760A' : 'rgba(232,118,10,0.25)',
              border: 'none', borderRadius: 14,
              fontSize: 15, fontWeight: 700,
              color: scrolled ? '#fff' : 'rgba(255,255,255,0.4)',
              cursor: scrolled && !loading ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              transition: 'background 0.2s, color 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading
              ? <><Spinner /> Enregistrement…</>
              : scrolled
                ? '✓ J\'ai lu et j\'accepte'
                : 'Lisez l\'intégralité pour continuer'
            }
          </button>
          <p style={{
            margin: '10px 0 0', textAlign: 'center',
            fontSize: 11, color: 'rgba(255,255,255,0.25)', lineHeight: 1.4,
          }}>
            L'acceptation est requise pour utiliser l'application Matias.
            Elle n'implique pas de consentement supplémentaire au-delà de votre contrat de travail.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{
        margin: '0 0 8px',
        fontSize: 13, fontWeight: 600,
        color: '#E8760A',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        {title}
      </h3>
      <div style={{ margin: 0, color: 'rgba(255,255,255,0.75)' }}>
        {children}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      width: 14, height: 14, borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff',
      display: 'inline-block',
      animation: 'gdpr-spin 0.7s linear infinite',
    }} />
  );
}
