'use client'

import { Topic } from './page'

type Post = { title: string; excerpt: string; date: string; source: string }

const POSTS: Record<string, Post[]> = {
  'space-news': [
    {
      title: 'James Webb Telescope Captures Early Galaxy Cluster in Unprecedented Detail',
      excerpt: 'Astronomers have released imagery of a galaxy cluster at redshift z≈7, revealing filamentary structure consistent with simulations of the cosmic web at an epoch previously inaccessible to direct observation.',
      date: 'Feb 24, 2026',
      source: 'Space.com',
    },
    {
      title: 'Artemis Programme: Revised Timeline for Next Crewed Lunar Landing',
      excerpt: 'NASA has announced a revised schedule following the latest SLS hardware review, targeting a crewed lunar surface excursion no earlier than late 2027.',
      date: 'Feb 22, 2026',
      source: 'NASA',
    },
    {
      title: 'Mars Sample Return: Joint ESA–NASA Design Milestone Passed',
      excerpt: 'The Mars Sample Return campaign has passed its preliminary design review for the Earth Return Orbiter, clearing the way for detailed design and manufacturing.',
      date: 'Feb 19, 2026',
      source: 'ESA',
    },
  ],
  'life-sciences': [
    {
      title: 'Six-Month ISS Study Reveals New Bone Density Loss Mechanisms',
      excerpt: 'A longitudinal study on twelve crew members has identified a previously undescribed cellular pathway that accelerates osteoclast activity under sustained microgravity, with implications for countermeasure design.',
      date: 'Feb 25, 2026',
      source: 'Nature Medicine',
    },
    {
      title: 'CRISPR Gene Editing Validated Under Simulated Microgravity',
      excerpt: 'Researchers at the University of Florida demonstrate successful Cas9-mediated editing in human cell cultures rotating in a clinostat, marking a step toward in-situ medical intervention on long missions.',
      date: 'Feb 20, 2026',
      source: 'Science Advances',
    },
    {
      title: 'Orbital Crop Yield Surprises Researchers with Accelerated Germination',
      excerpt: 'The VEGGIE-05 payload experiment returned unexpected results: radish varieties germinated 18 % faster aboard the ISS than ground controls, attributed to altered circadian regulation in continuous light.',
      date: 'Feb 16, 2026',
      source: 'NASA',
    },
  ],
  'ai-ml': [
    {
      title: 'Neural Network Identifies 47 Candidate Exoplanets in TESS Archival Data',
      excerpt: 'A transformer-based architecture trained on 14 million light curves has surfaced 47 high-confidence transit signals overlooked by traditional box-least-squares searches, 9 of which fall within the habitable zone.',
      date: 'Feb 26, 2026',
      source: 'arXiv',
    },
    {
      title: 'ESA Moves ML Collision-Avoidance System to Full Operations',
      excerpt: 'The Space Safety Programme\'s machine-learning conjunction assessment tool is now processing the full operational catalogue, handling over 4,000 close-approach assessments per day with a false positive rate below 0.3 %.',
      date: 'Feb 21, 2026',
      source: 'ESA',
    },
    {
      title: 'Consortium Releases Astronomy Foundation Model Pre-trained on Survey Data',
      excerpt: 'AstroFM-2, a 7-billion-parameter model pre-trained on data from SDSS, DES, and Euclid Early Release Observations, is now publicly available and outperforms supervised baselines on six downstream classification tasks.',
      date: 'Feb 18, 2026',
      source: 'arXiv',
    },
  ],
  'space-agencies': [
    {
      title: 'ESA Council Finalises 2026 Budget: Science and Exploration Lead Growth',
      excerpt: 'The ESA Ministerial Council has approved a €8.3 billion budget for 2026, with the Science and Robotic Exploration directorates seeing the largest year-on-year increases following last year\'s Terrae Novae commitments.',
      date: 'Feb 23, 2026',
      source: 'ESA',
    },
    {
      title: 'JAXA Releases Lunar Exploration Roadmap Through 2035',
      excerpt: 'Japan\'s new space exploration policy document outlines three robotic precursor landers, a polar resource characterisation mission, and a crewed surface sortie in partnership with NASA by 2035.',
      date: 'Feb 17, 2026',
      source: 'JAXA',
    },
    {
      title: 'ISRO RLV Technology Demonstrator Completes Fourth Autonomous Landing',
      excerpt: 'The Reusable Launch Vehicle — Technology Demonstrator executed its fourth fully autonomous runway landing, with on-board guidance handling a last-second crosswind correction not present in the flight profile.',
      date: 'Feb 14, 2026',
      source: 'ISRO',
    },
  ],
  'cybersecurity': [
    {
      title: 'NIST Publishes SP 800-213B: Cybersecurity for Satellite Ground Systems',
      excerpt: 'The revised publication addresses the specific threat model of satellite ground stations, covering command authentication, uplink encryption, and supply chain integrity for flight software updates.',
      date: 'Feb 25, 2026',
      source: 'NIST',
    },
    {
      title: 'GPS Spoofing Events in Baltic Region Prompt EASA Advisory',
      excerpt: 'The European Union Aviation Safety Agency has issued a safety information bulletin after a 40 % increase in confirmed GNSS spoofing events over the Eastern Baltic and Gulf of Finland since January.',
      date: 'Feb 20, 2026',
      source: 'EASA',
    },
    {
      title: 'ESA–NASA Joint Paper: Post-Quantum Cryptography for Deep-Space Links',
      excerpt: 'The whitepaper evaluates CRYSTALS-Kyber and FALCON for integration into the CCSDS space data link protocol stack, identifying key exchange latency as the primary constraint for deep-space distances.',
      date: 'Feb 15, 2026',
      source: 'ESA',
    },
  ],
  'materials': [
    {
      title: 'Silica–Carbon Aerogel Composite Outperforms Legacy Space Insulation by 35 %',
      excerpt: 'A team at NASA Glenn has characterised a new aerogel formulation reinforced with carbon nanofibre scaffolding that sustains its thermal performance after 200 thermal vacuum cycles — a critical qualification criterion.',
      date: 'Feb 24, 2026',
      source: 'Materials Today',
    },
    {
      title: 'Self-Healing Polymer Passes 18-Month Space Environment Exposure',
      excerpt: 'A polyurethane network with embedded microencapsulated healing agents survived atomic oxygen flux, UV, and thermal cycling on the ISS Materials International Space Station Experiment platform with 91 % mechanical recovery.',
      date: 'Feb 18, 2026',
      source: 'Nature Materials',
    },
    {
      title: 'ETH Zürich and ESA Print Structural Beams from Simulated Lunar Regolith',
      excerpt: 'Using a binder-jetting process developed at ETH\'s Institute for Building Materials, the team produced interlocking structural members from EAC-1A lunar simulant that meet compressive strength targets for a pressurised habitat subframe.',
      date: 'Feb 12, 2026',
      source: 'ETH Zürich',
    },
  ],
  'space-station': [
    {
      title: 'Starlab Habitat Module Passes NASA Preliminary Design Review',
      excerpt: 'Voyager Space and Airbus have cleared the primary habitat module of Starlab through a rigorous NASA-led PDR, confirming the pressure vessel architecture and life support system interfaces are consistent with certification requirements.',
      date: 'Feb 26, 2026',
      source: 'SpaceNews',
    },
    {
      title: 'ISS Transition Plan Published: Partners Commit to 2030 Deorbit Schedule',
      excerpt: 'NASA and its ISS partners have released a 68-page transition plan confirming operations through December 2030, a phased crew reduction starting 2028, and a controlled guided reentry over the South Pacific.',
      date: 'Feb 22, 2026',
      source: 'NASA',
    },
    {
      title: 'Axiom Module 3 Integration Begins at Kennedy Space Center',
      excerpt: 'Axiom Space has confirmed that its third commercial module has arrived at KSC and entered integration testing ahead of a scheduled Falcon Heavy launch in late 2027.',
      date: 'Feb 19, 2026',
      source: 'Axiom Space',
    },
  ],
  'swiss-uni': [
    {
      title: 'EPFL CleanSpace One Validates Net-Capture in Parabolic Flight Campaign',
      excerpt: 'The CleanSpace One team completed a 40-parabola campaign aboard the Novespace A310, demonstrating net deployment, approach guidance, and closure actuation in 20-second microgravity windows.',
      date: 'Feb 25, 2026',
      source: 'EPFL',
    },
    {
      title: 'ETH Quantum Sensor Achieves Gravitational-Wave-Relevant Sensitivity',
      excerpt: 'A Sr-87 optical lattice clock at ETH\'s Institute for Quantum Electronics has demonstrated strain sensitivity of h < 10⁻¹⁹ /√Hz at 1 Hz — relevant to the frequency band targeted by the proposed LISA successor.',
      date: 'Feb 21, 2026',
      source: 'ETH Zürich',
    },
    {
      title: 'HSLU Design Master Students Present Orbital Habitat Concepts at ESA ESTEC',
      excerpt: 'Six student teams from the Hochschule Luzern\'s Industrial Design programme presented human-centred habitat proposals at an ESA workshop, focusing on circadian lighting, micro-privacy design, and resupply logistics.',
      date: 'Feb 17, 2026',
      source: 'HSLU',
    },
  ],
  'pharmaceuticals': [
    {
      title: 'Microgravity Drug Crystallisation Yields Higher-Purity Protein Structures',
      excerpt: 'A Merck-sponsored ISS payload has produced lysozyme crystals with measurably lower defect density than ground controls, supporting the case for orbital pharmaceutical manufacturing as a viable upstream production pathway.',
      date: 'Feb 26, 2026',
      source: 'Nature Chemistry',
    },
    {
      title: 'CRISPR Therapy for Rare Genetic Disorder Receives EMA Accelerated Review',
      excerpt: 'The European Medicines Agency has granted accelerated assessment to a CRISPR-based treatment for Fanconi anaemia following early-phase trial data showing durable haematopoietic stem cell correction in six of eight patients.',
      date: 'Feb 22, 2026',
      source: 'EMA',
    },
    {
      title: 'AI-Assisted Drug Repurposing Identifies Three Candidates for Radiation Countermeasures',
      excerpt: 'A cross-institutional team using a graph neural network trained on NASA radiation exposure data and clinical trial databases has identified three FDA-approved compounds warranting evaluation as radioprotective agents for deep-space crews.',
      date: 'Feb 17, 2026',
      source: 'Science Translational Medicine',
    },
  ],
  'ssip': [
    {
      title: 'The Exploratorium Is Live — SSIP\'s New Experimental Web Space',
      excerpt: 'The Swiss Space Innovation Platform has launched the Exploratorium, an open platform for experimental tools, interactive data visualisations, and team-driven projects. Access is open to SSIP members and the broader community.',
      date: 'Feb 27, 2026',
      source: 'SSIP',
    },
    {
      title: 'SSIP Annual Conference 2026 — Call for Submissions Now Open',
      excerpt: 'The 2026 SSIP Annual Conference will take place in Lucerne this autumn. Submissions for paper presentations, posters, and half-day workshops are accepted through 15 April via the conference portal.',
      date: 'Feb 20, 2026',
      source: 'SSIP',
    },
    {
      title: 'SSIP Formalises Partnership with CERN IdeaSquare',
      excerpt: 'A collaboration agreement between SSIP and CERN\'s IdeaSquare innovation hub enables joint workshops, student co-working access in Geneva, and shared mentorship resources for Swiss space entrepreneurship projects.',
      date: 'Feb 14, 2026',
      source: 'SSIP',
    },
  ],
}

interface Props {
  topic: Topic
  onBack: () => void
}

export default function BlogView({ topic, onBack }: Props) {
  const posts = POSTS[topic.id] ?? []

  return (
    <div
      className="w-full h-full overflow-y-auto"
      style={{ background: '#0a0705' }}
    >
      {/* Grain */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          opacity: 0.1,
          mixBlendMode: 'overlay',
          zIndex: 1,
        }}
      />
      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 88% 82% at 50% 50%, transparent 30%, rgba(2,1,0,0.88) 100%)',
          zIndex: 1,
        }}
      />

      <div className="relative max-w-2xl mx-auto px-8 py-12" style={{ zIndex: 2 }}>

        {/* Back link */}
        <button
          onClick={onBack}
          className="mb-10 transition-opacity hover:opacity-50"
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: '14px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(200,155,50,0.55)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ← back to the cards
        </button>

        {/* Header */}
        <div className="mb-10">
          <p style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: '13px',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'rgba(200,155,50,0.35)',
            marginBottom: '0.5rem',
          }}>
            palabras &mdash; the exploratorium
          </p>
          <h1 style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: 'clamp(32px, 5vw, 51px)',
            fontWeight: 'bold',
            color: 'rgba(220,185,100,0.92)',
            lineHeight: 1.1,
            marginBottom: '1rem',
          }}>
            {topic.label}
          </h1>
          <div style={{ height: '1px', background: 'rgba(180,130,40,0.2)' }}/>
        </div>

        {/* Post list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {posts.map((post, i) => (
            <article
              key={i}
              style={{
                borderLeft: '2px solid rgba(180,130,40,0.22)',
                paddingLeft: '1.5rem',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.5rem',
              }}>
                <span style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '12px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(200,155,50,0.55)',
                }}>
                  {post.source}
                </span>
                <span style={{ color: 'rgba(200,155,50,0.25)', fontSize: '12px' }}>·</span>
                <span style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '12px',
                  color: 'rgba(200,155,50,0.45)',
                }}>
                  {post.date}
                </span>
              </div>
              <h2 style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: '22px',
                fontWeight: 'bold',
                color: 'rgba(230,195,115,0.9)',
                lineHeight: 1.35,
                marginBottom: '0.6rem',
                cursor: 'default',
              }}>
                {post.title}
              </h2>
              <p style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: '17px',
                lineHeight: 1.75,
                color: 'rgba(200,170,100,0.6)',
              }}>
                {post.excerpt}
              </p>
            </article>
          ))}
        </div>

        {/* Placeholder note */}
        <div style={{
          marginTop: '3.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(180,130,40,0.15)',
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: '13px',
          fontStyle: 'italic',
          textAlign: 'center',
          color: 'rgba(200,155,50,0.3)',
        }}>
          placeholder content &mdash; live feeds coming soon
        </div>
      </div>
    </div>
  )
}
