'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

type RouteCard = {
  id: string;
  title: string;
  range: string;
  summit: string;
  meta: string;
  distance: string;
  elevation: string;
  duration: string;
  description: string[];
  imageUrl: string;
};

type GlowCard = {
  id: string;
  title: string;
  description: string;
  borderGradient: string;
  glowColor: string;
  icon: 'apple' | 'figma' | 'framer';
};

type AiStackCard = {
  id: string;
  title: string;
  subtitle: string;
  symbol: string;
  tint: string;
  glow: string;
};

type JobCard = {
  id: string;
  rate: string;
  title: string;
  company: string;
  badge: string;
  bg: string;
};

type ThreatCard = {
  id: string;
  imageUrl: string;
  chip: string;
  title?: string;
  summary?: string;
  action?: string;
  imageOnly?: boolean;
};

type MonochromePromptCard = {
  id: string;
  theme: 'light' | 'dark';
  titleLines: string[];
  category: string;
  previewTop: string;
  previewBottom: string;
};

const ROUTES: RouteCard[] = [
  {
    id: 'embercrest',
    title: 'Embercrest Ridge',
    range: 'Silverpine Mountains',
    summit: 'Embercrest Summit Trail',
    meta: '1869 by Helen Rowe & Elias Mendez',
    distance: '12.4km',
    elevation: '870m',
    duration: '4h 45m',
    description: [
      'Embercrest Ridge rises boldly from the heart of the Silverpine Mountains, its sun-warmed cliffs glowing with rich crimson and amber tones during golden hour.',
      'From its summit, hikers are rewarded with panoramic views that stretch for miles across the surrounding wilderness. Steeped in local legend and natural beauty, Embercrest is both a challenging ascent and a spiritual escape into the high country.',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'frostspire',
    title: 'Frostspire Range',
    range: 'Silverpine Mountains',
    summit: 'Frostspire Summit Route',
    meta: '1908 by R. Kessler & Mina Ford',
    distance: '10.1km',
    elevation: '940m',
    duration: '5h 05m',
    description: [
      'Frostspire cuts a jagged line across an alpine horizon, wrapped in permanent snow and bright winter light. Winds here can shift quickly, demanding both preparation and patience.',
      'The upper route rewards climbers with clear glacial vistas and a serene silence that makes every step feel deliberate and unforgettable.',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
  },
];

const GLOW_CARDS: GlowCard[] = [
  {
    id: 'apple',
    title: 'Apple',
    description: "All my hardware is Apple. It's simple, reliable, and keeps my workflow smooth.",
    borderGradient: 'linear-gradient(135deg, #ff6ba8 0%, #ff6f70 50%, #ffb04b 100%)',
    glowColor: 'rgba(255, 114, 88, 0.58)',
    icon: 'apple',
  },
  {
    id: 'figma',
    title: 'Figma',
    description: 'My main tool for designing and prototyping ideas quickly and clearly.',
    borderGradient: 'linear-gradient(135deg, #95f3ff 0%, #45b8ff 45%, #13dcff 100%)',
    glowColor: 'rgba(52, 171, 255, 0.6)',
    icon: 'figma',
  },
  {
    id: 'framer',
    title: 'Framer',
    description: 'I use Framer to add interactions and turn designs into real, working sites.',
    borderGradient: 'linear-gradient(135deg, #4f6cff 0%, #a551ff 52%, #ea74ff 100%)',
    glowColor: 'rgba(170, 93, 255, 0.62)',
    icon: 'framer',
  },
];

const AI_STACK_CARDS: AiStackCard[] = [
  {
    id: 'openai',
    title: 'OpenAI GPT-4o',
    subtitle: 'High quality general reasoning and multimodal output for production applications.',
    symbol: '◎',
    tint: 'from-cyan-300/30 via-cyan-400/10 to-transparent',
    glow: 'rgba(95, 216, 255, 0.45)',
  },
  {
    id: 'meta',
    title: 'Meta Llama 3',
    subtitle: 'Open weights optimized for rapid fine-tuning and flexible deployment patterns.',
    symbol: '∞',
    tint: 'from-blue-400/30 via-indigo-500/12 to-transparent',
    glow: 'rgba(105, 145, 255, 0.45)',
  },
  {
    id: 'mistral',
    title: 'Mistral Mixtral 8x7B',
    subtitle: 'Sparse Mixture-of-Experts model balancing speed, quality, and throughput.',
    symbol: 'M',
    tint: 'from-orange-300/32 via-amber-300/12 to-transparent',
    glow: 'rgba(255, 176, 94, 0.45)',
  },
  {
    id: 'perplexity',
    title: 'Perplexity Sonar',
    subtitle: 'Search-grounded responses designed for current information and citations.',
    symbol: '✧',
    tint: 'from-teal-300/30 via-emerald-300/10 to-transparent',
    glow: 'rgba(94, 238, 215, 0.42)',
  },
  {
    id: 'anthropic',
    title: 'Anthropic Claude',
    subtitle: 'Long-context assistant focused on safer responses and careful instruction following.',
    symbol: 'AI',
    tint: 'from-rose-300/28 via-orange-300/10 to-transparent',
    glow: 'rgba(255, 170, 130, 0.42)',
  },
];

const JOB_CARDS: JobCard[] = [
  {
    id: 'ui-1',
    rate: '$120/hr',
    title: 'Senior UI\nDeveloper',
    company: 'Senior UI Developer',
    badge: 'NIKE',
    bg: '#ece8f1',
  },
  {
    id: 'be-1',
    rate: '$150/hr',
    title: 'Senior\nBackend\nEngineer',
    company: 'Senior Backend Engineer',
    badge: 'G',
    bg: '#efe9dc',
  },
  {
    id: 'az-1',
    rate: '$125-145/hr',
    title: 'Azure Data\nEngineer',
    company: 'Azure Data Engineer',
    badge: 'A',
    bg: '#edf0e4',
  },
  {
    id: 'az-2',
    rate: '$125-145/hr',
    title: 'Azure Data\nEngineer',
    company: 'Azure Data Engineer',
    badge: 'A',
    bg: '#efefe3',
  },
  {
    id: 'be-2',
    rate: '$150/hr',
    title: 'Senior\nBackend\nEngineer',
    company: 'Senior Backend Engineer',
    badge: 'G',
    bg: '#e8ecf3',
  },
  {
    id: 'ui-2',
    rate: '$120/hr',
    title: 'Senior UI\nDeveloper',
    company: 'Senior UI Developer',
    badge: 'NIKE',
    bg: '#eee7ec',
  },
];

const THREAT_CARDS: ThreatCard[] = [
  {
    id: 't1',
    imageUrl:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    chip: '2 CVEs • Medium',
    title: 'Palo Alto Releases Patch for PAN-OS DoS Flaw — Update Immediately',
    summary:
      'Palo Alto Networks has disclosed a high-severity vulnerability impacting PAN-OS software that could cause a denial-of-service condition.',
    action: 'Analyse Vulnerability',
  },
  {
    id: 't2',
    imageUrl:
      'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&q=80',
    chip: 'Image',
    imageOnly: true,
  },
  {
    id: 't3',
    imageUrl:
      'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1200&q=80',
    chip: '2 TTPs • High',
    title: 'A cyber attack hit Japan Airlines delaying ticket sales for flights',
    summary:
      'A cyberattack hit Japan Airlines causing the suspension of ticket sales for flights departing on Thursday.',
    action: 'Analyse Tactics',
  },
  {
    id: 't4',
    imageUrl:
      'https://images.unsplash.com/photo-1633265486064-086b219458ec?auto=format&fit=crop&w=1200&q=80',
    chip: '9 CVEs • Mixed',
    title: 'Emerging Threats & Vulnerabilities to Prepare for in 2025',
    summary:
      'Recent disclosures highlight conditions susceptible to denial-of-service and exploitation in production environments.',
    action: 'Analyse Vulnerability',
  },
  {
    id: 't5',
    imageUrl:
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
    chip: '4 CVEs • High',
    title: 'FICORA and Kaiten Botnets Exploit Old D-Link Vulnerabilities for Global Attacks',
    summary:
      'Botnet attacks lead to remote exploitation from legacy exposed services, with campaigns spreading quickly.',
    action: 'Analyse Vulnerabilities',
  },
];

const MONOCHROME_PROMPT_CARDS: MonochromePromptCard[] = [
  {
    id: 'professional-email-responder',
    theme: 'light',
    titleLines: ['Professional', 'Email', 'Responder'],
    category: 'Business Communications',
    previewTop:
      'Write a clear and professional reply to the message below. Confirm the main request, provide a concise response, and keep the tone polite and solution-focused.',
    previewBottom:
      'If information is missing, add a short clarifying question at the end. Keep the response under 180 words and avoid overly formal language.',
  },
  {
    id: 'blog-post-writer',
    theme: 'dark',
    titleLines: ['Blog Post', 'Writer'],
    category: 'Productivity',
    previewTop:
      'Create a practical blog post with a strong hook, three actionable sections, and a short conclusion. Use plain language, examples, and readable subheadings.',
    previewBottom:
      'Target busy professionals who want quick results. Keep the article scannable with short paragraphs and end with one clear next step.',
  },
];

function BrandIcon({ icon }: { icon: GlowCard['icon'] }) {
  if (icon === 'apple') {
    return (
      <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M13.3 3.2C14.2 2.1 14.8 0.7 14.7 0C13.3 0.1 11.8 0.9 10.9 2C10.1 3 9.4 4.4 9.6 5.7C11.1 5.8 12.5 5 13.3 3.2Z" fill="white" />
        <path d="M18.3 17.6C17.8 18.7 17.5 19.1 16.9 20C16 21.2 14.8 22.7 13.3 22.7C11.9 22.7 11.6 21.8 9.8 21.8C8.1 21.8 7.7 22.8 6.3 22.8C4.8 22.8 3.7 21.5 2.7 20.2C-0.1 16.5 -0.4 12.1 1.4 9.4C2.7 7.4 4.8 6.2 6.8 6.2C8.4 6.2 9.4 7.2 10.7 7.2C12 7.2 12.8 6.2 14.6 6.2C16.4 6.2 18.2 7.2 19.5 8.8C15.1 11.2 15.8 17.4 18.3 17.6Z" fill="white" />
      </svg>
    );
  }

  if (icon === 'figma') {
    return (
      <svg width="18" height="26" viewBox="0 0 18 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="5" cy="5" r="5" fill="white" />
        <circle cx="13" cy="5" r="5" fill="white" opacity="0.92" />
        <circle cx="5" cy="13" r="5" fill="white" opacity="0.96" />
        <circle cx="13" cy="13" r="5" fill="white" opacity="0.88" />
        <circle cx="5" cy="21" r="5" fill="white" opacity="0.85" />
      </svg>
    );
  }

  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M2 2H12L8.8 7.2H2V2Z" fill="white" />
      <path d="M8.2 8.5H18V18.2H8.2L11.5 13.4L8.2 8.5Z" fill="white" />
    </svg>
  );
}

export default function TestCardsPage() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    embercrest: true,
    frostspire: false,
  });
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    const updateViewportWidth = () => {
      setViewportWidth(window.innerWidth);
    };

    updateViewportWidth();
    window.addEventListener('resize', updateViewportWidth);

    return () => {
      window.removeEventListener('resize', updateViewportWidth);
    };
  }, []);

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getArtboardScale = (designWidth: number) => {
    const horizontalPadding = viewportWidth && viewportWidth < 640 ? 24 : 48;
    const availableWidth = viewportWidth ? Math.max(280, viewportWidth - horizontalPadding) : designWidth;

    return Math.min(1, availableWidth / designWidth);
  };

  const monochromeStacked = viewportWidth > 0 && viewportWidth < 1100;
  const monochromeDesignWidth = monochromeStacked ? 520 : 1060;
  const monochromeDesignHeight = monochromeStacked ? 1868 : 924;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#e6e6e6] px-6 py-12">
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center">
        {ROUTES.map((route) => {
          const isExpanded = expanded[route.id];

          return (
            <article
              key={route.id}
              className={`w-full max-w-[340px] rounded-[34px] bg-[#f8f8f7] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.10)] transition-all duration-300 ${
                isExpanded ? 'pb-5' : 'pb-3'
              }`}
            >
              <div
                className="relative h-56 overflow-hidden rounded-[26px]"
                style={{
                  backgroundImage: `url(${route.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

                <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4">
                  <div className="text-white">
                    <p className="text-sm font-semibold tracking-wide">{route.title}</p>
                    <p className="text-[11px] text-white/80">{route.range}</p>
                  </div>

                  <button
                    className="rounded-full bg-white/20 px-7 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/30"
                    type="button"
                  >
                    Start Route
                  </button>
                </div>
              </div>

              {isExpanded ? (
                <div className="px-3 pt-4 text-[#242424]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-[15px] font-semibold leading-tight">{route.summit}</h2>
                      <p className="text-[11px] text-[#8a8a8a]">{route.meta}</p>
                    </div>
                    <div className="grid h-14 w-20 place-items-center rounded-2xl border border-[#e8e8e8] bg-[#f3f3f3]">
                      <svg width="54" height="28" viewBox="0 0 54 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M2 16C8 8 11 6 17 6C23 6 24 14 30 14C35 14 37 10 42 10C46 10 49 13 52 18" stroke="#282828" strokeWidth="1.8" strokeLinecap="round" />
                        <circle cx="17" cy="6" r="2.2" fill="#282828" />
                        <circle cx="30" cy="14" r="2.2" fill="#282828" />
                        <circle cx="52" cy="18" r="2.2" fill="#282828" />
                      </svg>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-3 border-y border-[#ececec] py-3 text-center">
                    <div>
                      <p className="text-[13px] font-semibold">{route.distance}</p>
                      <p className="text-[10px] text-[#8a8a8a]">Distance</p>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold">{route.elevation}</p>
                      <p className="text-[10px] text-[#8a8a8a]">Elevation</p>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold">{route.duration}</p>
                      <p className="text-[10px] text-[#8a8a8a]">Duration</p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-3 text-[11px] leading-relaxed text-[#606060]">
                    {route.description.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>

                  <button
                    aria-label="Collapse details"
                    className="mt-3 grid w-full place-items-center py-1 text-[#262626]"
                    onClick={() => toggle(route.id)}
                    type="button"
                  >
                    <ChevronUp className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <button
                  aria-label="Expand details"
                  className="grid w-full place-items-center py-3 text-[#262626]"
                  onClick={() => toggle(route.id)}
                  type="button"
                >
                  <ChevronDown className="h-5 w-5" />
                </button>
              )}
            </article>
          );
        })}
      </section>

      <section className="mx-auto mt-20 w-full max-w-6xl rounded-[28px] bg-[#050507] px-6 py-12 md:px-10 md:py-16">
        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-6 md:flex-row md:gap-7">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[340px] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(31,108,214,0.35) 0%, rgba(5,5,7,0) 68%)',
            }}
            aria-hidden="true"
          />

          {GLOW_CARDS.map((card) => (
            <article key={card.id} className="relative w-full max-w-[252px]">
              <div
                className="pointer-events-none absolute -inset-5 rounded-[30px] blur-[32px]"
                style={{ background: card.glowColor }}
                aria-hidden="true"
              />

              <div
                className="relative rounded-[24px] p-[2.4px]"
                style={{ background: card.borderGradient }}
              >
                <div className="relative h-[326px] rounded-[22px] bg-[linear-gradient(180deg,#16161a_0%,#121318_100%)] p-6 shadow-[0_18px_42px_rgba(0,0,0,0.6)]">
                  <div className="mb-16 text-white">
                    <BrandIcon icon={card.icon} />
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <h3 className="text-[34px] font-semibold leading-none tracking-[-0.02em]">
                      {card.title}
                    </h3>
                    <p className="mt-3 text-[18px] leading-[1.42] text-white/72">
                      {card.description}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-14 flex w-full justify-center">
          <button
            type="button"
            className="group relative h-[74px] w-full max-w-[360px] rounded-full bg-transparent p-[3px]"
          >
            <span
              className="pointer-events-none absolute -inset-8 rounded-full opacity-0 blur-2xl transition duration-500 group-hover:opacity-100"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,0,132,0.55) 0%, rgba(66,133,255,0.45) 56%, rgba(0,0,0,0) 76%)',
              }}
              aria-hidden="true"
            />

            <span
              className="absolute inset-0 rounded-full transition duration-500 group-hover:animate-[hue-spin_2.2s_linear_infinite]"
              style={{
                background:
                  'linear-gradient(90deg, #ff0f8c 0%, #6f38ff 45%, #16c7ff 100%)',
                boxShadow:
                  '0 0 28px rgba(255, 15, 140, 0.28), 0 0 32px rgba(22, 199, 255, 0.26)',
              }}
              aria-hidden="true"
            />

            <span className="absolute inset-[3px] rounded-full bg-[#050507]" aria-hidden="true" />

            <span className="relative z-10 inline-flex h-full w-full items-center justify-center text-[30px] font-medium uppercase tracking-[0.24em] text-[#7f838f] transition duration-300 group-hover:text-white">
              Hover Me
            </span>
          </button>
        </div>
      </section>

      <section className="mx-auto mt-20 w-full max-w-6xl px-1 sm:px-4">
        <div
          className="mx-auto w-full overflow-hidden"
          style={{
            maxWidth: '760px',
            height: `${980 * getArtboardScale(760)}px`,
          }}
        >
          <article
            className="relative min-h-[980px] w-[760px] overflow-hidden rounded-[26px] bg-[#e9eaef] shadow-[0_20px_60px_rgba(58,74,148,0.16)]"
            style={{
              transform: `scale(${getArtboardScale(760)})`,
              transformOrigin: 'top left',
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(233,234,239,1) 0%, rgba(233,234,239,0.95) 44%, rgba(129,115,255,0.58) 60%, rgba(84,122,255,0.84) 78%, rgba(112,216,255,0.9) 100%)',
              }}
              aria-hidden="true"
            />

            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%]"
              style={{
                backgroundImage:
                  'linear-gradient(31deg, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(-31deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
                backgroundSize: '46px 46px',
              }}
              aria-hidden="true"
            />

            <div className="relative z-10 flex min-h-[980px] flex-col px-8 pb-10 pt-8 sm:px-11 sm:pb-12 sm:pt-10 text-[#eef0ff]">
              <div className="text-[40px] leading-none text-[#a5a9ba]">
                <p className="font-normal">Design</p>
                <p className="font-semibold">Inspiration</p>
              </div>

              <div className="mt-12 text-[#1f2552]">
                <p className="text-[142px] font-medium leading-[0.84] tracking-[-0.045em]">Thank</p>
                <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-4">
                  <p className="text-[132px] font-medium leading-[0.83] tracking-[-0.045em] text-[#8c79f4]">You!</p>
                  <div className="pb-4 uppercase leading-[0.92] tracking-[-0.025em] text-[#7062d8]">
                    <p className="text-[60px] font-semibold">Follow</p>
                    <p className="text-[60px] font-semibold">For More</p>
                  </div>
                </div>

                <div className="ml-[468px] mt-[-236px] text-[#8489ab]">
                  <span className="text-[60px]">✦</span>
                  <span className="ml-1 text-[40px]">✦</span>
                </div>
              </div>

              <div className="mt-[194px] space-y-1 uppercase leading-[0.92] tracking-[-0.03em] text-[#edf1ff]">
                <p className="text-[72px] font-medium">Favorite</p>
                <p className="text-[72px] font-medium">User Interface</p>
                <p className="text-[72px] font-medium text-[#a7aee9]">Typefaces</p>
              </div>

              <div className="mt-9 inline-flex w-fit items-center rounded-full border border-[#e4e6ff]/60 px-5 py-2.5 text-[30px] font-medium text-[#e6e8ff]">
                @ Vasil Enev
              </div>

              <div className="mt-auto grid grid-cols-2 items-end gap-6 pt-14 uppercase leading-[0.9] tracking-[-0.02em] text-[#f0f3ff]">
                <div>
                  <p className="text-[56px] font-semibold">For Your</p>
                  <p className="text-[56px] font-semibold">Next Projects</p>
                </div>
                <div className="text-right">
                  <p className="text-[56px] font-semibold">Save It</p>
                  <p className="text-[56px] font-semibold">For Later</p>
                </div>
              </div>

              <div className="mt-14 flex items-end justify-between text-[#dce2ff] uppercase leading-[0.9] tracking-[-0.02em]">
                <div>
                  <p className="text-[36px] font-semibold">Favorite</p>
                  <p className="text-[36px] font-semibold">UI Typefaces</p>
                </div>
                <div className="text-center">
                  <p className="text-[36px] font-semibold">2025</p>
                  <p className="text-[36px] font-semibold">May</p>
                </div>
                <div className="grid h-[62px] w-[62px] place-items-center rounded-2xl border border-[#e5ebff]/70">
                  <svg width="30" height="34" viewBox="0 0 30 34" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M8 4.5H22C23.9 4.5 25.5 6.1 25.5 8V28.5L15 22.8L4.5 28.5V8C4.5 6.1 6.1 4.5 8 4.5Z" stroke="#E6EDFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto mt-20 w-full max-w-6xl px-1 sm:px-4">
        <div
          className="mx-auto w-full overflow-hidden"
          style={{
            maxWidth: '760px',
            height: `${980 * getArtboardScale(760)}px`,
          }}
        >
          <div
            className="relative h-[980px] w-[760px]"
            style={{
              transform: `scale(${getArtboardScale(760)})`,
              transformOrigin: 'top left',
            }}
          >
            <div className="pointer-events-none absolute bottom-[44px] left-[54px] h-[850px] w-[620px] rounded-[46px] bg-[#d9d9db] opacity-70" />
            <div className="pointer-events-none absolute bottom-[26px] left-[26px] h-[900px] w-[680px] rounded-[52px] bg-[#ececee] opacity-95" />

            <article className="relative z-10 h-[920px] w-[760px] rounded-[54px] bg-[#f6f6f8] p-[14px] shadow-[0_30px_70px_rgba(107,110,132,0.24)]">
              <div className="relative h-full overflow-hidden rounded-[42px] border border-white/60 bg-[#ececf4]">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(120% 100% at 20% 100%, #4bb6ff 0%, #5f56ff 30%, #7e37e1 52%, #ff7fa6 74%, #f6d6cf 100%)',
                  }}
                  aria-hidden="true"
                />

                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(70% 50% at 68% 28%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.08) 55%, rgba(255,255,255,0) 100%)',
                  }}
                  aria-hidden="true"
                />

                <div className="pointer-events-none absolute left-[-36px] top-[46px] grid h-[150px] w-[150px] place-items-center rounded-full bg-[#f2f2f5] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]">
                  <div className="grid h-[112px] w-[112px] place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#6ce4ff_0%,#4fb6ff_34%,#6a52ff_72%,#5e31c8_100%)] shadow-[0_10px_28px_rgba(57,64,167,0.4)]">
                    <span className="text-[42px] text-white">✦</span>
                  </div>
                </div>

                <div className="relative z-10 flex h-full flex-col px-12 pb-12 pt-12 text-white">
                  <div className="flex items-start justify-end gap-10 text-right text-[33px] leading-[1] text-white/78">
                    <div>
                      <p className="font-semibold text-white/92">Gilroy</p>
                      <p>Radomir Tinkov</p>
                    </div>
                    <div>
                      <p className="font-semibold text-white/92">Yellowtail</p>
                      <p>Google Font</p>
                    </div>
                  </div>

                  <div className="mt-44 max-w-[560px]">
                    <h2 className="text-[88px] font-semibold leading-[0.9] tracking-[-0.03em] text-[#f5f6ff]">
                      Unveiling
                      <br />
                      the New Era of
                      <span className="ml-4 align-middle text-[96px] italic font-medium tracking-[-0.02em] text-[#fff1f7]">
                        Mastery
                      </span>
                    </h2>

                    <p className="mt-8 max-w-[560px] text-[52px] leading-[1.02] tracking-[-0.02em] text-white/78">
                      Explore the forefront of design innovation as we unveil a new era of mastery and excellence.
                    </p>
                  </div>

                  <div className="mt-auto flex items-end justify-between">
                    <div className="rounded-[999px] border border-white/35 bg-white/14 px-6 py-5 backdrop-blur-sm">
                      <div className="flex items-center gap-5">
                        <div className="grid h-[84px] w-[84px] place-items-center rounded-full bg-[radial-gradient(circle_at_34%_30%,#7ff0ff_0%,#58c3ff_40%,#5f66ff_100%)] text-[52px] font-semibold text-white">
                          02
                        </div>
                        <div className="leading-[0.95] text-white/90">
                          <p className="text-[23px] uppercase tracking-[0.07em] text-white/70">Sans Serif</p>
                          <p className="text-[51px] font-semibold">Gilroy</p>
                        </div>
                        <div className="leading-[0.95] text-white/90">
                          <p className="text-[23px] uppercase tracking-[0.07em] text-white/70">Script</p>
                          <p className="text-[51px] font-semibold">Yellowtail</p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-8 mr-1 rounded-l-[28px] rounded-r-[14px] bg-[#f5f5f8] px-5 py-3 text-[40px] font-semibold tracking-[-0.02em] text-[#5f4cbc]">
                      @ Vasil Enev
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 w-full max-w-6xl px-1 sm:px-4">
        <div
          className="mx-auto w-full overflow-hidden"
          style={{
            maxWidth: '760px',
            height: `${750 * getArtboardScale(760)}px`,
          }}
        >
        <article
          className="relative h-[750px] w-[760px] overflow-hidden rounded-[30px] bg-[#e9e9ec] shadow-[0_20px_70px_rgba(78,80,108,0.2)]"
          style={{
            transform: `scale(${getArtboardScale(760)})`,
            transformOrigin: 'top left',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'repeating-linear-gradient(to right, transparent 0, transparent 76px, rgba(80,80,96,0.1) 76px, rgba(80,80,96,0.1) 78px)',
            }}
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%]"
            style={{
              background:
                'radial-gradient(120% 100% at 92% 100%, rgba(162,72,255,0.92) 0%, rgba(193,139,255,0.58) 26%, rgba(224,195,255,0.3) 52%, rgba(233,233,236,0.02) 100%)',
            }}
            aria-hidden="true"
          />

          <div className="pointer-events-none absolute bottom-0 right-0 h-[62%] w-[72%] opacity-80" aria-hidden="true">
            <div className="grid h-full w-full grid-cols-8 gap-[2px] p-3">
              {Array.from({ length: 80 }).map((_, index) => {
                const active = index > 22;
                return (
                  <span
                    key={`tile-${index}`}
                    className={`rounded-[14px] ${
                      active
                        ? 'bg-[rgba(236,225,255,0.18)] backdrop-blur-[1px]'
                        : 'bg-transparent'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <div className="relative z-10 flex h-full flex-col px-10 pb-12 pt-12 sm:px-14 sm:pt-14">
            <div className="text-[56px] font-semibold uppercase leading-[0.88] tracking-[-0.03em] text-[#8f63ff]">
              <p>New</p>
              <p>Post</p>
            </div>

            <div className="mt-8 leading-[0.88] tracking-[-0.045em]">
              <p className="text-[104px] font-medium text-[#121317]">Design</p>
              <p className="mt-2 text-[104px] font-medium text-[#3a3b43]">inspiration</p>

              <div className="mt-2 flex items-end gap-2">
                <p className="text-[98px] font-medium text-[#9e62ff]">websites</p>
                <div className="mb-6 text-[#b185ff]">
                  <span className="text-[40px]">✦</span>
                  <span className="ml-1 text-[24px]">✦</span>
                </div>
              </div>
            </div>

            <div className="mt-5 inline-flex w-fit -rotate-[6deg] items-center rounded-full border border-white/80 bg-[#f2f2f5]/85 px-6 py-2.5 text-[40px] font-semibold text-[#8f63ff] shadow-[0_8px_18px_rgba(113,116,152,0.18)]">
              @ Vasil Enev
            </div>

            <div className="mt-28 max-w-[430px] text-[66px] leading-[0.95] tracking-[-0.03em] text-[#66676f]">
              <p>My go-to inspiration</p>
              <p>sources, beyond</p>
              <p>Instagram</p>
            </div>

            <div className="mt-auto flex items-end justify-between gap-6">
              <div className="leading-[0.9] tracking-[-0.03em]">
                <p className="text-[70px] font-medium text-[#25262d]">Design</p>
                <p className="text-[70px] font-medium text-[#70717b]">Resources</p>
              </div>

              <button
                type="button"
                className="mb-6 inline-flex items-center gap-4 rounded-full border border-white/80 bg-[#f2f2f5]/92 px-8 py-5 text-[54px] font-semibold leading-none tracking-[-0.02em] text-[#8f63ff] shadow-[0_10px_22px_rgba(120,106,178,0.25)]"
              >
                <span>Tap to view</span>
                <span className="grid h-[52px] w-[52px] place-items-center rounded-full bg-[linear-gradient(135deg,#bf85ff_0%,#8f63ff_100%)] text-[36px] text-white">
                  →
                </span>
              </button>
            </div>
          </div>
        </article>
        </div>
      </section>

      <section className="mx-auto mt-20 w-full max-w-6xl px-1 sm:px-4">
        <div
          className="mx-auto w-full overflow-hidden"
          style={{
            maxWidth: '760px',
            height: `${750 * getArtboardScale(760)}px`,
          }}
        >
        <article
          className="relative h-[750px] w-[760px] overflow-hidden rounded-[28px] bg-[#ededee] shadow-[0_20px_64px_rgba(95,96,112,0.18)]"
          style={{
            transform: `scale(${getArtboardScale(760)})`,
            transformOrigin: 'top left',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'repeating-linear-gradient(to right, rgba(255,255,255,0) 0, rgba(255,255,255,0) 82px, rgba(148,148,156,0.08) 82px, rgba(148,148,156,0.08) 84px)',
            }}
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[69%]"
            style={{
              background:
                'radial-gradient(110% 108% at 92% 96%, rgba(255,90,28,0.95) 0%, rgba(255,121,58,0.72) 26%, rgba(255,182,88,0.46) 48%, rgba(237,237,238,0.04) 86%)',
            }}
            aria-hidden="true"
          />

          <div className="pointer-events-none absolute bottom-0 right-0 h-[72%] w-[58%] opacity-85" aria-hidden="true">
            <div className="grid h-full w-full grid-cols-6 gap-[2px] p-2">
              {Array.from({ length: 84 }).map((_, index) => {
                const row = Math.floor(index / 6);
                const lit = row >= 1;
                return (
                  <span
                    key={`orange-tile-${index}`}
                    className={lit ? 'rounded-[8px] bg-[rgba(255,188,140,0.24)]' : 'rounded-[8px] bg-transparent'}
                  />
                );
              })}
            </div>
          </div>

          <div className="relative z-10 flex h-full flex-col px-10 pb-11 pt-10 sm:px-12">
            <div className="flex items-start justify-between text-[#2d2f35]">
              <p className="text-[42px] font-semibold leading-none tracking-[-0.03em]">
                <span className="mr-2 inline-block h-0 w-0 border-b-[16px] border-l-[22px] border-r-[8px] border-b-[#f15b28] border-l-transparent border-r-transparent align-middle" />
                ROBIZ
                <br />
                SOLUTIONS
              </p>
              <div className="text-right text-[44px] font-medium uppercase leading-[0.9] tracking-[-0.03em] opacity-80" />
            </div>

            <div className="mt-28 leading-[0.84] tracking-[-0.045em]">
              <p className="text-[126px] font-medium text-[#0f1014]">Fix Your</p>
              <p className="mt-3 text-[108px] font-medium text-[#f05a28]">Instagram's Bio</p>

              <div className="mt-8 flex justify-end pr-6">
                <button
                  type="button"
                  className="inline-flex items-center gap-4 rounded-full border border-[#d6d6d9]/90 bg-[#f3f3f4]/95 px-7 py-3 text-[38px] font-medium tracking-[-0.02em] text-[#33353b] shadow-[0_6px_16px_rgba(113,113,126,0.15)]"
                >
                  <span>Read the caption</span>
                  <span className="grid h-[48px] w-[48px] place-items-center rounded-full bg-[#f05a28] text-white">
                    <ChevronDown className="h-6 w-6" />
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-64 max-w-[430px] leading-[0.92] tracking-[-0.03em] text-[#3d4047]">
              <p className="text-[62px] font-medium">Our guide to fixing your</p>
              <p className="mt-2 text-[62px] font-medium text-[#f05a28]">Instagram's bio</p>
            </div>

            <div className="mt-auto flex items-end justify-between uppercase leading-[0.9] tracking-[-0.03em]">
              <div>
                <p className="text-[70px] font-semibold text-[#131417]">Design</p>
                <p className="text-[70px] font-semibold text-[#131417]">Inspiration</p>
                <p className="mt-16 text-[42px] font-semibold text-white">Design</p>
                <p className="text-[42px] font-semibold text-white">Resources</p>
              </div>

              <div className="text-right text-white">
                <p className="text-[48px] font-semibold">2025</p>
                <p className="text-[48px] font-semibold">August</p>
              </div>
            </div>
          </div>
        </article>
        </div>
      </section>

      <section className="mx-auto mt-20 w-full max-w-6xl px-1 sm:px-4">
        <div
          className="mx-auto w-full overflow-hidden"
          style={{
            maxWidth: '760px',
            height: `${500 * getArtboardScale(760)}px`,
          }}
        >
        <article
          className="relative h-[500px] w-[760px] overflow-hidden rounded-[28px] bg-[#05070d] shadow-[0_26px_70px_rgba(9,12,22,0.55)]"
          style={{
            transform: `scale(${getArtboardScale(760)})`,
            transformOrigin: 'top left',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(58% 65% at 50% 24%, rgba(80,95,176,0.38) 0%, rgba(9,11,20,0.06) 68%, rgba(5,7,13,1) 100%)',
            }}
            aria-hidden="true"
          />

          <div className="relative h-full w-full">
            {AI_STACK_CARDS.map((card, index) => {
              const rotate = [-22, -11, 0, 11, 22][index];
              const left = ['-8%', '11%', '30%', '49%', '68%'][index];
              const top = [94, 74, 58, 74, 94][index];
              const z = [10, 20, 30, 20, 10][index];

              return (
                <div
                  key={card.id}
                  className="absolute"
                  style={{ left, top, zIndex: z, transform: `rotate(${rotate}deg)` }}
                >
                  <div
                    className="pointer-events-none absolute -inset-2 rounded-[26px] blur-2xl"
                    style={{ background: card.glow }}
                    aria-hidden="true"
                  />

                  <div className="relative h-[320px] w-[190px] overflow-hidden rounded-[22px] border border-white/15 bg-gradient-to-b from-[#101522] to-[#0a0d15] p-4 shadow-[0_10px_36px_rgba(0,0,0,0.58)]">
                    <div className={`absolute inset-0 bg-gradient-to-b ${card.tint}`} aria-hidden="true" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(255,255,255,0.14),transparent_45%)]" aria-hidden="true" />

                    <div className="relative z-10">
                      <div className="text-[44px] font-semibold leading-none text-white/90">
                        {card.symbol}
                      </div>

                      <h3 className="mt-20 text-[26px] font-semibold leading-[0.95] tracking-[-0.02em] text-white">
                        {card.title}
                      </h3>
                      <p className="mt-3 text-[15px] leading-[1.2] text-white/70">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
        </div>
      </section>

      <section className="mx-auto mt-20 w-full max-w-6xl px-1 sm:px-4">
        <article className="relative mx-auto overflow-hidden rounded-[28px] bg-[#f3d9a6] p-8 shadow-[0_18px_50px_rgba(130,100,45,0.22)]">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 24px 24px, rgba(245,226,180,0.95) 0, rgba(245,226,180,0.95) 24px, transparent 25px)',
              backgroundSize: '96px 96px',
              opacity: 0.7,
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {JOB_CARDS.map((card) => (
              <article
                key={card.id}
                className="rounded-[12px] border border-[#d8d8d8] p-4 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset]"
                style={{ backgroundColor: card.bg }}
              >
                <div className="flex items-start justify-between text-[12px] font-semibold text-[#222]">
                  <span>{card.rate}</span>
                  <span className="text-[14px]">🔖</span>
                </div>

                <h3 className="mt-4 whitespace-pre-line text-[43px] font-medium leading-[0.9] tracking-[-0.03em] text-[#17181b]">
                  {card.title}
                </h3>

                <div className="mt-5 flex items-center justify-between text-[#222]">
                  <span className="text-[26px]">→</span>
                  <span className="text-[32px] tracking-[0.32em] text-[#4f4f4f]">....</span>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#d7d7d9] pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-semibold text-[#141414]">{card.badge}</span>
                    <span className="text-[13px] leading-tight text-[#202124]">{card.company}</span>
                  </div>
                  <button
                    type="button"
                    className="rounded-full bg-[#0f1116] px-4 py-1.5 text-[12px] font-semibold text-white"
                  >
                    View
                  </button>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="mx-auto mt-20 w-full max-w-6xl px-1 sm:px-4">
        <article className="rounded-[28px] bg-[#d5d5d7] p-8 shadow-[0_20px_56px_rgba(70,70,82,0.18)]">
          <div className="grid gap-5 lg:grid-cols-12">
            <div className="rounded-[20px] bg-[#f2f2f2] p-4 lg:col-span-4">
              <img
                src={THREAT_CARDS[0].imageUrl}
                alt="Threat visual"
                className="h-[125px] w-full rounded-[14px] object-cover"
              />
              <p className="mt-3 inline-block rounded-full bg-[#f3e9be] px-2.5 py-1 text-[11px] font-semibold text-[#6d5b2d]">
                {THREAT_CARDS[0].chip}
              </p>
              <h3 className="mt-3 text-[38px] font-semibold leading-[0.96] tracking-[-0.03em] text-[#0e0f13]">
                {THREAT_CARDS[0].title}
              </h3>
              <p className="mt-3 text-[18px] leading-[1.22] text-[#70737a]">{THREAT_CARDS[0].summary}</p>
              <button className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#111318] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#16181d]">
                ↳ {THREAT_CARDS[0].action}
              </button>
            </div>

            <div className="rounded-[20px] bg-[#f2f2f2] p-4 lg:col-span-4">
              <img
                src={THREAT_CARDS[1].imageUrl}
                alt="Threat visual"
                className="h-[396px] w-full rounded-[14px] object-cover"
              />
            </div>

            <div className="rounded-[20px] bg-[#f2f2f2] p-4 lg:col-span-4">
              <p className="inline-block rounded-full bg-[#fde6e8] px-2.5 py-1 text-[11px] font-semibold text-[#7f3b44]">
                {THREAT_CARDS[2].chip}
              </p>
              <h3 className="mt-3 text-[52px] font-semibold leading-[0.93] tracking-[-0.03em] text-[#0e0f13]">
                {THREAT_CARDS[2].title}
              </h3>
              <p className="mt-3 text-[19px] leading-[1.24] text-[#70737a]">{THREAT_CARDS[2].summary}</p>
              <button className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#111318] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#16181d]">
                ↳ {THREAT_CARDS[2].action}
              </button>
            </div>

            <div className="rounded-[20px] bg-[#f2f2f2] p-4 lg:col-span-4">
              <img
                src={THREAT_CARDS[3].imageUrl}
                alt="Threat visual"
                className="h-[396px] w-full rounded-[14px] object-cover"
              />
            </div>

            <div className="rounded-[20px] bg-[#f2f2f2] p-4 lg:col-span-4">
              <p className="inline-block rounded-full bg-[#ececec] px-2.5 py-1 text-[11px] font-semibold text-[#4d4f56]">
                {THREAT_CARDS[3].chip}
              </p>
              <h3 className="mt-3 text-[52px] font-semibold leading-[0.93] tracking-[-0.03em] text-[#0e0f13]">
                {THREAT_CARDS[3].title}
              </h3>
              <p className="mt-3 text-[19px] leading-[1.24] text-[#70737a]">{THREAT_CARDS[3].summary}</p>
              <button className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#111318] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#16181d]">
                ↳ {THREAT_CARDS[3].action}
              </button>
            </div>

            <div className="rounded-[20px] bg-[#f2f2f2] p-4 lg:col-span-4">
              <img
                src={THREAT_CARDS[4].imageUrl}
                alt="Threat visual"
                className="h-[125px] w-full rounded-[14px] object-cover"
              />
              <p className="mt-3 inline-block rounded-full bg-[#fde6e8] px-2.5 py-1 text-[11px] font-semibold text-[#7f3b44]">
                {THREAT_CARDS[4].chip}
              </p>
              <h3 className="mt-3 text-[37px] font-semibold leading-[0.98] tracking-[-0.03em] text-[#0e0f13]">
                {THREAT_CARDS[4].title}
              </h3>
              <p className="mt-3 text-[18px] leading-[1.22] text-[#70737a]">{THREAT_CARDS[4].summary}</p>
              <button className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#111318] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#16181d]">
                ↳ {THREAT_CARDS[4].action}
              </button>
            </div>
          </div>
        </article>
      </section>

      <section className="mx-auto mt-20 w-full max-w-6xl px-1 sm:px-4">
        <div className="mx-auto w-full max-w-[360px] rounded-[30px] bg-[#060708] p-[2px] shadow-[0_14px_34px_rgba(0,0,0,0.35)]">
          <article className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,#35363b_0%,#0a0b0f_38%,#040506_100%)] p-6 text-white">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.20) 1px, transparent 1px)',
                backgroundSize: '18px 18px',
              }}
              aria-hidden="true"
            />

            <div className="relative z-10 flex min-h-[430px] flex-col">
              <div className="flex items-start justify-between">
                <div className="text-[38px] font-semibold leading-none tracking-[-0.03em] text-white">
                  ◐◑
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-white/18 bg-white/8 px-3 py-1 text-[12px] font-medium text-white/90"
                >
                  Save 🔖
                </button>
              </div>

              <div className="mt-10">
                <p className="text-[34px] font-medium leading-none text-white/95">
                  Variant-01
                  <span className="ml-3 text-[18px] font-normal text-white/55">5 days ago</span>
                </p>
                <h3 className="mt-4 text-[52px] font-semibold leading-[0.92] tracking-[-0.03em] text-white">
                  Web Designer
                </h3>

                <div className="mt-5 flex gap-2">
                  <span className="rounded-md border border-white/16 bg-white/10 px-3 py-1.5 text-[12px] font-medium text-white/88">
                    Part-Time
                  </span>
                  <span className="rounded-md border border-white/16 bg-white/10 px-3 py-1.5 text-[12px] font-medium text-white/88">
                    Remote
                  </span>
                </div>
              </div>

              <div className="mt-auto">
                <div className="h-px bg-white/18" />
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-[44px] font-semibold leading-none tracking-[-0.03em] text-white">$85-120</p>
                    <p className="mt-2 text-[18px] font-medium text-white/76">Per every hour</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-[10px] bg-white px-5 py-2.5 text-[16px] font-semibold text-[#121317]"
                  >
                    Apply now
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto mt-20 w-full max-w-6xl px-1 sm:px-4">
        <div
          className="mx-auto w-full overflow-hidden"
          style={{
            maxWidth: '760px',
            height: `${980 * getArtboardScale(760)}px`,
          }}
        >
        <article
          className="relative h-[980px] w-[760px] overflow-hidden rounded-[28px] bg-[#f7efe0] shadow-[0_22px_60px_rgba(140,120,90,0.2)]"
          style={{
            transform: `scale(${getArtboardScale(760)})`,
            transformOrigin: 'top left',
          }}
        >
          <div
            className="pointer-events-none absolute left-1/2 top-[370px] h-[360px] w-[360px] -translate-x-1/2 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(244,157,129,0.34) 0%, rgba(238,167,206,0.28) 40%, rgba(247,239,224,0.02) 78%)',
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 flex h-full flex-col px-8 pb-8 pt-14 sm:px-12">
            <div className="text-center text-[#222126]">
              <p className="text-[30px] font-medium tracking-[-0.02em] text-[#6f6a63]">◉ 11:11</p>
              <h2 className="mt-2 text-[116px] font-semibold leading-[0.84] tracking-[-0.05em]">
                Good
                <br />
                Morning
              </h2>
              <p className="mt-4 text-[36px] font-medium tracking-[-0.02em] text-[#47433f]">
                ☀ It's 28° in Gilette, France
              </p>
            </div>

            <div className="relative mx-auto mt-20 h-[370px] w-full max-w-[520px]">
              <article className="absolute bottom-0 left-[8px] w-[232px] rounded-[28px] bg-[#fffefb] p-6 shadow-[0_14px_30px_rgba(122,110,94,0.18)]">
                <p className="text-[58px] font-semibold leading-[0.85] tracking-[-0.05em] text-[#27262c]">Thursday</p>
                <p className="mt-2 text-[58px] font-medium leading-[0.85] tracking-[-0.05em] text-[#ee9cab]">Aug 8</p>
                <p className="mt-12 text-[29px] font-medium text-[#8f8a84]">◷ Today</p>
              </article>

              <article className="absolute right-[6px] top-0 w-[356px] -rotate-[2.8deg] rounded-[28px] bg-[#fffefb] p-7 shadow-[0_16px_34px_rgba(122,110,94,0.2)]">
                <h3 className="text-[62px] font-semibold leading-[0.86] tracking-[-0.045em] text-[#232228]">
                  Changelog
                  <br />
                  with GitHub
                </h3>
                <p className="mt-5 text-[43px] leading-[1.02] tracking-[-0.03em] text-[#403c39]">
                  Use GitHub's releases
                  <br />
                  as a <span className="underline">backbone</span> for
                  <br />
                  your public changelog.
                </p>
                <div className="mt-8 flex items-center justify-between text-[26px] font-medium text-[#9a948d]">
                  <span>↪ Note · 2 months ago</span>
                  <span>↗</span>
                </div>
              </article>
            </div>

            <div className="mt-auto flex justify-center">
              <nav className="inline-flex items-center gap-7 rounded-[16px] border border-[#e7d8c4] bg-[#e7d8c4]/70 px-6 py-3 text-[24px] font-semibold text-[#6d6256] backdrop-blur-sm">
                <span>◫ Apps</span>
                <span>⌘ Components</span>
                <span>⟲ Notes</span>
              </nav>
            </div>
          </div>
        </article>
        </div>
      </section>

      {/* ── Font Showcase 2×2 grid ── */}
      <section className="mx-auto mt-20 w-full max-w-6xl px-1 sm:px-4">
        <div className="mx-auto grid w-full max-w-[760px] grid-cols-1 gap-5 sm:grid-cols-2">

          {/* Card 1 – Rubik / light with purple gradient blob */}
          <article className="relative overflow-hidden rounded-[28px] bg-white p-8 shadow-[0_16px_40px_rgba(120,100,200,0.14)]">
            <div
              className="pointer-events-none absolute left-0 right-0 top-0 h-[46%]"
              style={{
                background:
                  'radial-gradient(120% 90% at 50% 0%, rgba(120,80,255,0.28) 0%, rgba(180,160,255,0.16) 42%, rgba(255,255,255,0) 76%)',
              }}
              aria-hidden="true"
            />
            <div className="relative z-10">
              <p className="flex items-center gap-1.5 text-[13px] text-[#8b84c0]">
                <span className="text-[15px]">T</span>
                Font Family #1
              </p>
              <h2 className="mt-5 text-[72px] font-black leading-[0.9] tracking-[-0.04em] text-[#0e0e18]">
                Rubik
              </h2>
              <p className="mt-2 text-[28px] font-bold text-[#6248f5]">For headers</p>
              <div className="mt-8 space-y-1 text-[14px] tracking-[0.01em] text-[#5e5e72]">
                <p>ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                <p>abcdefghijklmnopqrstuvwxyz</p>
                <p>1234567890 @#$%^&amp;*()_+−=!</p>
              </div>
            </div>
          </article>

          {/* Card 2 – dark space top-right, big Aa */}
          <article className="relative overflow-hidden rounded-[28px] bg-[#0d0f2b] shadow-[0_16px_40px_rgba(14,12,38,0.38)]">
            <div
              className="pointer-events-none absolute right-[-18px] top-[-18px] h-[170px] w-[170px] rounded-full"
              style={{
                background:
                  'radial-gradient(circle at 60% 40%, rgba(100,180,255,0.72) 0%, rgba(60,100,255,0.42) 38%, rgba(10,12,40,0) 72%)',
              }}
              aria-hidden="true"
            />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[38%]" aria-hidden="true">
              <div
                className="h-full w-full"
                style={{
                  background:
                    'radial-gradient(ellipse 90% 60% at 50% 110%, rgba(50,90,255,0.55) 0%, rgba(18,22,58,0.85) 56%, rgba(13,15,43,0) 100%)',
                }}
              />
            </div>
            <div className="relative z-10 flex h-full min-h-[320px] items-center justify-center">
              <p
                className="select-none text-[160px] font-black leading-none tracking-[-0.04em]"
                style={{
                  background: 'linear-gradient(160deg, #d4c8ff 20%, #b8a6f8 55%, #a89cf0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Aa
              </p>
            </div>
          </article>

          {/* Card 3 – dark space bottom planet, big Aa */}
          <article className="relative overflow-hidden rounded-[28px] bg-[#0b0d26] shadow-[0_16px_40px_rgba(10,10,36,0.38)]">
            <div
              className="pointer-events-none absolute bottom-[-30px] left-1/2 h-[200px] w-[320px] -translate-x-1/2 rounded-[50%]"
              style={{
                background:
                  'radial-gradient(ellipse 100% 60% at 50% 100%, rgba(28,100,255,0.76) 0%, rgba(50,60,200,0.48) 40%, rgba(10,12,38,0) 78%)',
              }}
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute bottom-[4px] left-1/2 h-[88px] w-[500px] -translate-x-1/2 rounded-[50%]"
              style={{
                background:
                  'radial-gradient(ellipse 100% 100% at 50% 100%, rgba(38,200,255,0.28) 0%, rgba(28,90,255,0.22) 42%, rgba(10,12,38,0) 72%)',
              }}
              aria-hidden="true"
            />
            {/* tiny UFO icon */}
            <div className="pointer-events-none absolute bottom-[52px] left-[56px] z-20 text-[22px]" aria-hidden="true">🛸</div>
            <div className="relative z-10 flex h-full min-h-[320px] items-center justify-center">
              <p
                className="select-none text-[160px] font-black leading-none tracking-[-0.04em]"
                style={{
                  background: 'linear-gradient(160deg, #d4c8ff 20%, #b8a6f8 55%, #a89cf0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Aa
              </p>
            </div>
          </article>

          {/* Card 4 – Inter / light with pink blob */}
          <article className="relative overflow-hidden rounded-[28px] bg-white p-8 shadow-[0_16px_40px_rgba(200,100,140,0.12)]">
            <div
              className="pointer-events-none absolute right-[-14px] top-[-14px] h-[160px] w-[160px] rounded-full blur-[38px]"
              style={{ background: 'rgba(255,130,160,0.42)' }}
              aria-hidden="true"
            />
            <div className="relative z-10">
              <p className="flex items-center gap-1.5 text-[13px] text-[#8b84c0]">
                <span className="text-[15px]">T</span>
                Font Family #2
              </p>
              <h2 className="mt-5 text-[72px] font-black leading-[0.9] tracking-[-0.04em] text-[#0e0e18]">
                Inter
              </h2>
              <p className="mt-2 text-[28px] font-bold text-[#6248f5]">For body text</p>
              <div className="mt-8 space-y-1 text-[14px] tracking-[0.01em] text-[#5e5e72]">
                <p>ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                <p>abcdefghijklmnopqrstuvwxyz</p>
                <p>1234567890 @#$%^&amp;*()+-=!</p>
              </div>
            </div>
          </article>

        </div>
      </section>

      {/* ── ChatGPT / UX Design promo card ── */}
      <section className="mx-auto mt-20 w-full max-w-6xl px-1 sm:px-4">
        <div
          className="mx-auto w-full overflow-hidden"
          style={{
            maxWidth: '480px',
            height: `${580 * getArtboardScale(480)}px`,
          }}
        >
        <article
          className="relative w-[480px] overflow-hidden rounded-[28px] bg-[#f4f4f6] shadow-[0_20px_52px_rgba(80,80,110,0.16)]"
          style={{
            minHeight: '580px',
            transform: `scale(${getArtboardScale(480)})`,
            transformOrigin: 'top left',
          }}
        >

          {/* subtle top-left radial glow */}
          <div
            className="pointer-events-none absolute left-0 top-0 h-[260px] w-[260px] rounded-full"
            style={{
              background:
                'radial-gradient(circle at 20% 20%, rgba(200,190,255,0.28) 0%, rgba(244,244,246,0) 72%)',
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 flex min-h-[580px] flex-col px-8 pb-8 pt-10">

            {/* headline */}
            <div className="max-w-[360px]">
              <h2 className="text-[62px] font-black leading-[0.92] tracking-[-0.035em] text-[#111115]">
                How do I use
                <br />
                ChatGPT for
                <br />
                <span className="text-[#8aba2a]">UX Design?</span>
              </h2>
            </div>

            {/* CTA block */}
            <div className="mt-10 flex flex-col gap-3">
              <p className="text-[18px] font-bold uppercase tracking-[0.08em] text-[#111115]">
                Try these
              </p>

              <div className="flex items-center gap-4">
                {/* pill button */}
                <span className="inline-flex items-center rounded-[10px] bg-[#111115] px-5 py-2 text-[20px] font-black uppercase tracking-[0.06em] text-white shadow-[0_4px_14px_rgba(0,0,0,0.38)]">
                  Prompts!
                </span>
              </div>

              {/* arrow */}
              <div className="mt-1 flex items-center gap-2 text-[#111115]">
                <span className="inline-block h-[10px] w-[10px] rounded-full border-[2.5px] border-[#111115]" />
                <svg width="48" height="12" viewBox="0 0 48 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <line x1="0" y1="6" x2="40" y2="6" stroke="#111115" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M36 2L42 6L36 10" stroke="#111115" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* 3D character illustration placeholder */}
            <div
              className="pointer-events-none absolute bottom-[52px] right-0 h-[300px] w-[220px]"
              aria-hidden="true"
            >
              {/* stylised avatar stand-in — gradient silhouette */}
              <div
                className="h-full w-full"
                style={{
                  background:
                    'radial-gradient(ellipse 80% 90% at 60% 80%, rgba(180,200,100,0.18) 0%, rgba(244,244,246,0) 72%)',
                }}
              />
              <span
                className="absolute bottom-[32px] right-[28px] select-none text-[148px] leading-none"
                role="img"
                aria-label="Person with glasses"
              >
                🧑‍💻
              </span>
            </div>

            {/* author row */}
            <div className="mt-auto flex items-center gap-3 pt-44">
              <span className="flex h-[38px] w-[38px] items-center justify-center overflow-hidden rounded-full bg-[#c8b8a2] text-[18px] font-bold text-white">
                F
              </span>
              <div className="leading-[1.1]">
                <p className="text-[15px] font-semibold text-[#111115]">Felix</p>
                <p className="text-[13px] text-[#888892]">@ux.by.felix</p>
              </div>
            </div>
          </div>
        </article>
        </div>
      </section>

      {/* ── Motivational glow quote card ── */}
      <section className="mx-auto mt-20 w-full max-w-6xl px-1 sm:px-4">
        <div
          className="mx-auto w-full overflow-hidden"
          style={{
            maxWidth: '760px',
            height: `${750 * getArtboardScale(760)}px`,
          }}
        >
          <article
            className="relative h-[750px] w-[760px] overflow-hidden rounded-[26px] shadow-[0_26px_70px_rgba(46,18,6,0.5)]"
            style={{
              transform: `scale(${getArtboardScale(760)})`,
              transformOrigin: 'top left',
              background:
                'radial-gradient(120% 80% at 50% 0%, rgba(244,210,150,0.56) 0%, rgba(138,46,16,0.82) 24%, rgba(20,7,6,0.96) 52%, rgba(80,20,4,0.94) 76%, rgba(230,190,130,0.66) 100%)',
            }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(42% 32% at 20% 10%, rgba(255,210,150,0.4) 0%, rgba(0,0,0,0) 70%), radial-gradient(36% 28% at 85% 12%, rgba(255,210,150,0.42) 0%, rgba(0,0,0,0) 72%), radial-gradient(52% 46% at 48% 56%, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.7) 46%, rgba(0,0,0,0) 100%), radial-gradient(40% 30% at 12% 92%, rgba(255,210,140,0.36) 0%, rgba(0,0,0,0) 72%), radial-gradient(44% 34% at 86% 92%, rgba(255,180,120,0.34) 0%, rgba(0,0,0,0) 72%)',
              }}
              aria-hidden="true"
            />

            <div className="relative z-10 flex h-full flex-col px-9 pb-8 pt-10 text-white">
              <div className="flex items-start justify-between">
                <div className="leading-tight">
                  <p className="text-[36px] font-medium">Afzal Ahmed</p>
                  <p className="mt-1 text-[22px] text-white/75">Founder, Stayez</p>
                </div>
                <span className="text-[44px] leading-none text-white/92">↙</span>
              </div>

              <div className="mt-6 h-px bg-white/75" />

              <div className="mt-44 max-w-[600px] leading-[0.95] tracking-[-0.03em] text-white">
                <p className="text-[86px] font-light">If you want</p>
                <p className="text-[86px] font-light">change, stop</p>
                <p className="flex items-end gap-3 text-[86px] font-light">
                  <span>waiting</span>
                  <span className="mb-5 inline-block h-[7px] w-[128px] rounded-full bg-white" />
                </p>
                <p className="text-[86px] font-light">take ACTION</p>
                <p className="text-[86px] font-light">now.</p>
              </div>

              <div className="mt-auto flex justify-end">
                <span className="grid h-[56px] w-[56px] place-items-center rounded-full border-2 border-white/85 text-[24px]">
                  🔖
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* ── Central red/black three-card strip ── */}
      <section className="mx-auto mt-20 w-full max-w-6xl px-1 sm:px-4">
        <div
          className="mx-auto w-full overflow-hidden rounded-[28px] bg-[#000000]"
          style={{
            maxWidth: '980px',
            height: `${360 * getArtboardScale(980)}px`,
          }}
        >
          <div
            className="relative h-[360px] w-[980px]"
            style={{
              transform: `scale(${getArtboardScale(980)})`,
              transformOrigin: 'top left',
            }}
          >
            <div className="absolute inset-0 bg-black" />

            <div className="relative z-10 flex h-full items-center justify-center gap-20 px-12">
              <div className="w-[220px]">
                <div className="mb-3 ml-3 grid h-[22px] w-[22px] place-items-center rounded-full bg-[#ff4c22] text-[12px] font-bold text-black">
                  C
                </div>
                <article className="relative h-[220px] overflow-hidden rounded-[24px] bg-[#0a0a0a]">
                  <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_10%,rgba(255,45,26,0.92)_0%,rgba(190,20,10,0.95)_38%,rgba(50,0,0,0.95)_76%,rgba(8,8,8,1)_100%)]" />
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[70px] bg-black/45" />
                  <div className="absolute left-1/2 top-[86px] h-[66px] w-[320px] -translate-x-1/2 rotate-[-12deg] bg-[linear-gradient(180deg,rgba(255,55,35,0.8)_0%,rgba(115,0,0,0.65)_100%)]" />
                  <div className="absolute left-1/2 top-[106px] h-[66px] w-[320px] -translate-x-1/2 rotate-[12deg] bg-[linear-gradient(180deg,rgba(160,0,0,0.8)_0%,rgba(20,0,0,0.75)_100%)]" />
                  <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white">
                    <p className="text-[13px] font-semibold tracking-[0.04em] text-white/90">CENTRAL</p>
                    <p className="mt-3 text-[42px] font-semibold leading-[0.88]">The best</p>
                    <p className="text-[42px] font-semibold leading-[0.88]">investment</p>
                    <p className="text-[42px] font-semibold leading-[0.88]">for you</p>
                    <p className="mt-3 text-[9px] text-white/80">www.central.com ?</p>
                  </div>
                </article>

                <div className="mt-8 flex items-center justify-between px-4 text-[#ff4c22]">
                  <span>♡</span>
                  <span>◌</span>
                  <span>✈</span>
                  <span className="ml-auto">⌖</span>
                </div>
              </div>

              <div className="w-[220px]">
                <div className="mb-3 ml-3 grid h-[22px] w-[22px] place-items-center rounded-full bg-[#ff4c22] text-[12px] font-bold text-black">
                  C
                </div>
                <article className="relative h-[220px] overflow-hidden rounded-[24px] bg-[#f6f6f6]">
                  <div className="absolute inset-0 bg-[radial-gradient(100%_70%_at_80%_85%,rgba(255,50,24,0.95)_0%,rgba(120,10,3,0.85)_34%,rgba(245,245,245,0)_62%)]" />
                  <div className="absolute right-[-26px] top-[56px] h-[90px] w-[180px] rotate-[-24deg] rounded-[28px] border border-[#ececec] bg-[linear-gradient(180deg,#ffffff_0%,#f8f8f8_100%)]" />
                  <div className="absolute right-[26px] top-[18px] h-[176px] w-[110px] rotate-[16deg] rounded-[36px] border border-[#efefef] bg-[linear-gradient(180deg,#fefefe_0%,#f0f0f0_100%)] opacity-90" />
                  <div className="relative z-10 p-8 text-[#181818]">
                    <p className="text-[13px] font-bold tracking-[0.06em]">CENTRAL</p>
                    <p className="mt-8 max-w-[150px] text-[13px] font-bold leading-[1.2]">
                      A WIDE RANGE OF CONSTRUCTION SERVICES, FROM DESIGN TO COMMISSIONING
                    </p>
                    <p className="mt-7 max-w-[140px] text-[9px] leading-[1.25] text-black/60">
                      The quality you deserve and the reliability you can count on
                    </p>
                    <span className="mt-7 inline-flex rounded-[3px] bg-black px-2 py-1 text-[8px] font-semibold text-white">
                      Learn more
                    </span>
                  </div>
                </article>

                <div className="mt-8 flex items-center justify-between px-4 text-[#ff4c22]">
                  <span>♡</span>
                  <span>◌</span>
                  <span>✈</span>
                  <span className="ml-auto">⌖</span>
                </div>
              </div>

              <div className="w-[220px]">
                <div className="mb-3 ml-3 grid h-[22px] w-[22px] place-items-center rounded-full bg-[#ff4c22] text-[12px] font-bold text-black">
                  C
                </div>
                <article className="relative h-[220px] overflow-hidden rounded-[24px] bg-[#120606]">
                  <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'linear-gradient(30deg, rgba(255,70,45,0.3) 25%, transparent 25%, transparent 50%, rgba(255,70,45,0.3) 50%, rgba(255,70,45,0.3) 75%, transparent 75%, transparent)', backgroundSize: '34px 34px' }} />
                  <div className="absolute inset-0 bg-[radial-gradient(130%_95%_at_58%_100%,rgba(255,50,25,0.5)_0%,rgba(42,10,8,0.45)_40%,rgba(15,4,4,0.95)_80%)]" />
                  <div className="relative z-10 p-8 text-white">
                    <p className="text-[13px] font-bold tracking-[0.06em]">CENTRAL</p>
                    <p className="mt-8 text-[68px] font-medium leading-none text-[#cf4b2a]">20</p>
                    <p className="mt-1 text-[22px] font-semibold leading-[1]">YEARS OF EXPERIENCE</p>
                    <p className="mt-6 max-w-[170px] text-[11px] leading-[1.28] text-white/80">
                      Our experience allows us to design the most comfortable home, taking into account all nuances of your lifestyle and wishes for a country holiday.
                    </p>
                  </div>
                </article>

                <div className="mt-8 flex items-center justify-between px-4 text-[#ff4c22]">
                  <span>♡</span>
                  <span>◌</span>
                  <span>✈</span>
                  <span className="ml-auto">⌖</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Monochrome perspective card ── */}
      <section className="mx-auto mt-20 w-full max-w-6xl px-1 sm:px-4">
        <div
          className="mx-auto w-full overflow-hidden"
          style={{
            maxWidth: `${monochromeDesignWidth}px`,
            height: `${monochromeDesignHeight * getArtboardScale(monochromeDesignWidth)}px`,
          }}
        >
          <div
            className={`relative flex items-start gap-5 ${monochromeStacked ? 'h-[1868px] w-[520px] flex-col' : 'h-[924px] w-[1060px]'}`}
            style={{
              transform: `scale(${getArtboardScale(monochromeDesignWidth)})`,
              transformOrigin: 'top left',
            }}
          >
            {MONOCHROME_PROMPT_CARDS.map((card) => {
              const isLight = card.theme === 'light';

              return (
                <article
                  key={card.id}
                  className={`relative flex h-[924px] w-[520px] flex-col overflow-hidden rounded-[40px] px-10 pb-10 pt-9 ${
                    isLight
                      ? 'bg-[#dfdfdc] text-[#1f2126] shadow-[0_22px_56px_rgba(70,70,70,0.24)]'
                      : 'bg-[#17181b] text-[#e2e2e5] shadow-[0_22px_56px_rgba(0,0,0,0.4)]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`inline-flex overflow-hidden rounded-[10px] ${
                        isLight ? 'border border-[#cfcfcb]' : 'border border-white/12'
                      }`}
                    >
                      {(isLight
                        ? ['#2d2d31', '#47474b', '#646468', '#7f7f83', '#99999d', '#b9b9bc', '#ececed']
                        : ['#2a2b2f', '#3a3b40', '#4b4c51', '#5f6065', '#7f8086', '#a2a3a8', '#e6e6e7']
                      ).map((tone, index) => (
                        <span
                          key={`${card.id}-tone-${index}`}
                          className="grid h-[34px] w-[34px] place-items-center"
                          style={{ backgroundColor: tone }}
                        >
                          {index === 6 ? (
                            <span className={`text-[15px] ${isLight ? 'text-[#3d3d40]' : 'text-[#2e3035]'}`}>✧</span>
                          ) : null}
                        </span>
                      ))}
                    </div>

                    <p className={`text-[58px] font-bold leading-none ${isLight ? 'text-[#303237]' : 'text-[#f0f0f2]'}`}>
                      ”
                    </p>
                  </div>

                  <h2 className={`mt-11 text-[74px] font-bold leading-[0.9] tracking-[-0.04em] ${isLight ? 'text-[#222429]' : 'text-[#f0f0f2]'}`}>
                    {card.titleLines.map((line) => (
                      <span key={`${card.id}-${line}`}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </h2>

                  <p className={`mt-11 text-[18px] font-semibold uppercase tracking-[0.02em] ${isLight ? 'text-[#33353a]' : 'text-[#f0f0f2]'}`}>
                    {card.category}
                  </p>

                  <p className={`mt-11 text-[17px] leading-[1.24] tracking-[-0.01em] ${isLight ? 'text-[#1f2126]' : 'text-[#e2e2e5]'}`}>
                    {card.previewTop}
                  </p>

                  <p className={`mt-4 text-[17px] leading-[1.24] tracking-[-0.01em] ${isLight ? 'text-[#1f2126]' : 'text-[#e2e2e5]'}`}>
                    {card.previewBottom}
                  </p>

                  <div className={`mt-auto flex items-end justify-between pt-12 ${isLight ? 'text-[#181a1f]' : 'text-[#f0f0f2]'}`}>
                    <p className="text-[14px] font-semibold leading-[1.05]">
                      SuperPrompt
                      <br />
                      Prompt Preview
                    </p>
                    <p className="text-right text-[14px] font-semibold leading-[1.05]">
                      Prompt Card
                      <br />
                      {card.theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes hue-spin {
          0% {
            filter: hue-rotate(0deg);
          }
          100% {
            filter: hue-rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}
