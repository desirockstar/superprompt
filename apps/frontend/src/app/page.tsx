'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { BottomSearchBar } from '@/components/bottom-search-bar';
import { CircularScore } from '@/components/circular-score';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/components/theme-provider';
import type { Prompt } from '@/lib/types';

const CATEGORIES = ['All', 'Business Communication', 'Content Marketing', 'Developer Tools', 'Productivity', 'Marketing', 'Product Marketing', 'Customer Success', 'Content Creation', 'Corporate Communications', 'Video Production'];
const TIERS = ['All', 'starter', 'builder', 'pro', 'super'];
const DATES = ['All', 'newest', 'oldest'];

type PromptWithPreview = Prompt & {
    preview?: string;
};

type RenderCard = {
    id: string;
    titleLines: string[];
    category: string;
    previewTop: string;
    tags: string[];
    score: number;
};

function splitPreview(preview?: string): { top: string; bottom: string } {
    const content = preview?.trim() || '';
    if (!content) {
        return {
            top: 'No preview available for this prompt yet.',
            bottom: '',
        };
    }

    const maxChars = 150;
    let top = content.slice(0, maxChars);
    
    if (content.length > maxChars) {
        const lastSpace = top.lastIndexOf(' ');
        if (lastSpace > maxChars * 0.7) {
            top = top.slice(0, lastSpace);
        }
        top += '...';
    }

    return {
        top,
        bottom: content.length > maxChars ? content.slice(maxChars) : '',
    };
}

function titleToLines(title: string): string[] {
    const words = title.trim().split(/\s+/).filter(Boolean);
    if (words.length <= 2) return [title];

    const lines: string[] = [];
    const chunk = Math.ceil(words.length / 3);
    for (let i = 0; i < words.length; i += chunk) {
        lines.push(words.slice(i, i + chunk).join(' '));
    }

    return lines.slice(0, 4);
}

function OpenAILogo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 2406 2406"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className={className}
        >
            <path id="a" d="M1107.3 299.1c-197.999 0-373.9 127.3-435.2 315.3L650 743.5v427.9c0 21.4 11 40.4 29.4 51.4l344.5 198.515V833.3h.1v-27.9L1372.7 604c33.715-19.52 70.44-32.857 108.47-39.828L1447.6 450.3C1361 353.5 1237.1 298.5 1107.3 299.1zm0 117.5-.6.6c79.699 0 156.3 27.5 217.6 78.4-2.5 1.2-7.4 4.3-11 6.1L952.8 709.3c-18.4 10.4-29.4 30-29.4 51.4V1248l-155.1-89.4V755.8c-.1-187.099 151.601-338.9 339-339.2z" fill="currentColor"/>
            <use xlinkHref="#a" transform="rotate(60 1203 1203)"/>
            <use xlinkHref="#a" transform="rotate(120 1203 1203)"/>
            <use xlinkHref="#a" transform="rotate(180 1203 1203)"/>
            <use xlinkHref="#a" transform="rotate(240 1203 1203)"/>
            <use xlinkHref="#a" transform="rotate(300 1203 1203)"/>
        </svg>
    );
}

function ClaudeLogo({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <svg
            viewBox="0 0 1200 1200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className={className}
            style={style}
        >
            <path fill="currentColor" d="M233.96 800.21L468.64 668.54L472.59 657.1L468.64 650.74L457.21 650.74L417.99 648.32L283.89 644.7L167.6 639.87L54.93 633.83L26.58 627.79L0 592.75L2.74 575.28L26.58 559.25L60.72 562.23L136.19 567.38L249.42 575.19L331.57 580.03L453.26 592.67L472.59 592.67L475.33 584.86L468.72 580.03L463.57 575.19L346.39 495.79L219.54 411.87L153.1 363.54L117.18 339.06L99.06 316.11L91.25 266.01L123.87 230.09L167.68 233.07L178.87 236.05L223.25 270.2L318.04 343.57L441.83 434.74L459.95 449.8L467.19 444.64L468.08 441.02L459.95 427.41L392.62 305.72L320.78 181.93L288.81 130.63L280.35 99.87C277.37 87.22 275.19 76.59 275.19 63.62L312.32 13.21L332.86 6.6L382.39 13.21L403.25 31.33L434.01 101.72L483.87 212.54L561.18 363.22L583.81 407.92L595.89 449.32L600.4 461.96L608.21 461.96L608.21 454.71L614.58 369.83L626.34 265.61L637.77 131.52L641.72 93.75L660.4 48.48L697.53 24L726.52 37.85L750.36 72L747.06 94.07L732.89 186.2L705.1 330.52L686.98 427.17L697.53 427.17L709.61 415.09L758.5 350.17L840.64 247.49L876.89 206.74L919.17 161.72L946.31 140.3L997.61 140.3L1035.38 196.43L1018.47 254.42L965.64 321.42L921.83 378.2L859.01 462.77L819.79 530.42L823.41 535.81L832.75 534.93L974.66 504.72L1051.33 490.87L1142.82 475.17L1184.21 494.5L1188.72 514.15L1172.46 554.34L1074.6 578.5L959.84 601.45L788.94 641.88L786.85 643.41L789.26 646.39L866.26 653.64L899.19 655.41L979.81 655.41L1129.93 666.6L1169.15 692.54L1192.67 724.27L1188.72 748.43L1128.32 779.19L1046.82 759.87L856.59 714.6L791.36 698.34L782.34 698.34L782.34 703.73L836.7 756.89L936.32 846.85L1061.07 962.82L1067.44 991.49L1051.41 1014.12L1034.5 1011.7L924.89 929.23L882.6 892.11L786.85 811.49L780.48 811.49L780.48 819.95L802.55 852.24L919.09 1027.41L925.13 1081.13L916.67 1098.6L886.47 1109.15L853.29 1103.11L785.07 1007.36L714.68 899.52L657.91 802.87L650.98 806.82L617.48 1167.7L601.77 1186.15L565.53 1200L535.33 1177.05L519.3 1139.92L535.33 1066.55L554.66 970.79L570.36 894.68L584.54 800.13L592.99 768.72L592.43 766.63L585.5 767.52L514.23 865.37L405.83 1011.87L320.05 1103.68L299.52 1111.81L263.92 1093.37L267.22 1060.43L287.11 1031.11L405.83 880.11L477.42 786.52L523.65 732.48L523.33 724.67L520.59 724.67L205.29 929.4L149.15 936.64L124.99 914.01L127.97 876.89L139.41 864.81L234.2 799.57L233.88 799.89Z"/>
        </svg>
    );
}

function GeminiLogo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className={className}
        >
            <path d="M16 8.016A8.522 8.522 0 008.016 16h-.032A8.521 8.521 0 000 8.016v-.032A8.521 8.521 0 007.984 0h.032A8.522 8.522 0 0016 7.984v.032z" fill="currentColor"/>
        </svg>
    );
}

function CopilotLogo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className={className}
        >
            <path d="M22.9253 4.97196C22.5214 3.79244 21.4126 3 20.1658 3L18.774 3C17.3622 3 16.1532 4.01106 15.9033 5.40051L14.4509 13.4782L15.0163 11.5829C15.3849 10.347 16.5215 9.5 17.8112 9.5L23.0593 9.5L25.3054 10.809L27.4705 9.5H26.5598C25.313 9.5 24.2042 8.70756 23.8003 7.52804L22.9253 4.97196Z" fill="currentColor"/>
            <path d="M9.39637 27.0147C9.79613 28.2011 10.9084 29 12.1604 29H14.5727C16.1772 29 17.4805 27.704 17.4893 26.0995L17.5315 18.4862L16.9699 20.4033C16.6058 21.6461 15.4659 22.5 14.1708 22.5H8.88959L6.96437 21.0214L4.88007 22.5H5.78013C7.03206 22.5 8.14435 23.299 8.54411 24.4853L9.39637 27.0147Z" fill="currentColor"/>
            <path d="M19.7501 3H8.81266C5.68767 3 3.81268 7.08916 2.56269 11.1783C1.08177 16.0229 -0.856044 22.5021 4.75017 22.5021H9.66051C10.9615 22.5021 12.105 21.6415 12.4657 20.3915C13.2784 17.5759 14.7501 12.4993 15.9014 8.65192C16.4758 6.73249 16.9543 5.08404 17.6886 4.05749C18.1003 3.48196 18.7864 3 19.7501 3Z" fill="currentColor"/>
            <path d="M12.2478 29H23.1852C26.3102 29 28.1852 24.9103 29.4352 20.8207C30.9161 15.9755 32.854 9.49548 27.2477 9.49548H22.3375C21.0364 9.49548 19.893 10.3562 19.5322 11.6062C18.7196 14.4221 17.2479 19.4994 16.0965 23.3474C15.5221 25.2671 15.0436 26.9157 14.3093 27.9424C13.8976 28.518 13.2115 29 12.2478 29Z" fill="currentColor"/>
        </svg>
    );
}

function GrokLogo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className={className}
        >
            <path d="M6.469 8.776L16.512 23h-4.464L2.005 8.776H6.47zm-.004 7.9l2.233 3.164L6.467 23H2l4.465-6.324zM22 2.582V23h-3.659V7.764L22 2.582zM22 1l-9.952 14.095-2.233-3.163L17.533 1H22z" fill="currentColor"/>
        </svg>
    );
}

function PerplexityLogo({ className }: { className?: string }) {
    return (
        <svg
            fill="currentColor"
            fillRule="evenodd"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className={className}
        >
            <path d="M19.785 0v7.272H22.5V17.62h-2.935V24l-7.037-6.194v6.145h-1.091v-6.152L4.392 24v-6.465H1.5V7.188h2.884V0l7.053 6.494V.19h1.09v6.49L19.786 0zm-7.257 9.044v7.319l5.946 5.234V14.44l-5.946-5.397zm-1.099-.08l-5.946 5.398v7.235l5.946-5.234V8.965zm8.136 7.58h1.844V8.349H13.46l6.105 5.54v2.655zm-8.982-8.28H2.59v8.195h1.8v-2.576l6.192-5.62zM5.475 2.476v4.71h5.115l-5.115-4.71zm13.219 0l-5.115 4.71h5.115v-4.71z"/>
        </svg>
    );
}

function DeepSeekLogo({ className }: { className?: string }) {
    return (
        <svg
            fill="currentColor"
            fillRule="evenodd"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className={className}
        >
            <path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z"/>
        </svg>
    );
}

export default function TestPromptsPage() {
    const searchParams = useSearchParams();
    const urlSearch = searchParams.get('search') || '';
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';
    
    const [prompts, setPrompts] = useState<PromptWithPreview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);

const [search, setSearch] = useState(urlSearch);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Sync search with URL when URL changes
    useEffect(() => {
        setSearch(urlSearch);
    }, [urlSearch]);
    const [category, setCategory] = useState('All');
    const [tier, setTier] = useState('All');
    const [date, setDate] = useState('All');
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Keyboard shortcuts mapping
    const paletteUrls = ['https://claude.ai', 'https://chatgpt.com', 'https://gemini.google.com', 'https://copilot.microsoft.com', 'https://grok.x.com', 'https://www.perplexity.ai', 'https://www.deepseek.com/en'];
    const keyboardShortcuts: Record<string, string> = {
        'c': paletteUrls[0], // Claude
        'g': paletteUrls[1], // ChatGPT
        'm': paletteUrls[2], // Gemini
        'o': paletteUrls[3], // Copilot
        'k': paletteUrls[4], // Grok
        'p': paletteUrls[5], // Perplexity
        'd': paletteUrls[6], // DeepSeek
    };

    const loadPrompts = useCallback(async (pageNum = 1, reset = true) => {
        if (pageNum === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        setError('');
        try {
            const params: Record<string, string | number | undefined> = {
                page: pageNum,
                limit: 20,
            };
            if (category !== 'All') params.category = category;
            if (tier !== 'All') params.tier = tier;
            if (date !== 'All') params.date = date;
            if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

            const response = await api.get<{ prompts: PromptWithPreview[] }>('/prompts', params);

            const newPrompts = response.prompts || [];
            
            if (reset) {
                setPrompts(newPrompts);
            } else {
                setPrompts(prev => [...prev, ...newPrompts]);
            }

            setHasMore(newPrompts.length >= 20);
            setPage(pageNum);
        } catch (err) {
            console.error('Failed to load prompts:', err);
            setError(err instanceof Error ? err.message : 'Failed to load prompts');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [category, tier, date, debouncedSearch]);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500); // 500ms debounce
        
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        loadPrompts(1, true);
    }, [loadPrompts, category, tier, date, debouncedSearch]);

    // Keyboard shortcuts listener
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();

            // Disable all shortcuts while typing in editable controls.
            const eventTarget = event.target as HTMLElement | null;
            const activeElement = document.activeElement as HTMLElement | null;
            const isTypingContext = Boolean(
                eventTarget?.closest('input, textarea, [contenteditable="true"], [role="textbox"]') ||
                activeElement?.matches('input, textarea, [contenteditable="true"], [role="textbox"]')
            );
            if (isTypingContext) {
                return;
            }
            
            // Handle arrow keys for card navigation (always work)
            if (
                event.key === 'ArrowUp' ||
                event.key === 'ArrowDown' ||
                event.key === 'ArrowLeft' ||
                event.key === 'ArrowRight'
            ) {
                event.preventDefault();
                
                setSelectedCardIndex((prev) => {
                    const cardsCount = renderCards.length;
                    if (cardsCount === 0) return prev;
                    
                    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
                        if (prev === null) return cardsCount - 1;
                        return prev === 0 ? cardsCount - 1 : prev - 1;
                    } else {
                        if (prev === null) return 0;
                        return (prev + 1) % cardsCount;
                    }
                });
            }
            
            // Handle model shortcuts - only when NOT typing in input
            // if (keyboardShortcuts[key]) {
            //     window.open(keyboardShortcuts[key], '_blank');
            // }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [keyboardShortcuts]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    loadPrompts(page + 1, false);
                }
            },
            { threshold: 0, rootMargin: '0px 0px 300px 0px' }
        );
        
        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }
        
        return () => observer.disconnect();
    }, [page, hasMore, loadingMore, loading, loadPrompts]);

    // Scroll to selected card
    useEffect(() => {
        if (selectedCardIndex !== null) {
            const cardElement = document.querySelector(`[data-card-index="${selectedCardIndex}"]`);
            if (cardElement) {
                cardElement.scrollIntoView({ behavior: 'auto', block: 'nearest' });
            }
        }
    }, [selectedCardIndex]);

    const hasActiveFilters = category !== 'All' || tier !== 'All' || date !== 'All' || search.trim() !== '';

    function clearFilters() {
        setCategory('All');
        setTier('All');
        setDate('All');
        setSearch('');
    }

    function removeFilter(type: 'category' | 'tier' | 'date') {
        switch (type) {
            case 'category': setCategory('All'); break;
            case 'tier': setTier('All'); break;
            case 'date': setDate('All'); break;
        }
    }

    const renderCards = useMemo(() => {
        const DUMMY_TAGS = ['AI', 'Prompt', 'Automation', 'Productivity', 'Creative', 'Expert', 'Advanced', 'Template'];

    return prompts.map<RenderCard>((prompt: PromptWithPreview, index: number) => {
            const split = splitPreview(prompt.preview);
            // Generate pseudo-random score based on prompt ID (deterministic demo data)
            const scoreOptions = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];
            const score = scoreOptions[index % scoreOptions.length];

            return {
                id: prompt.id,
                titleLines: titleToLines(prompt.title),
                category: prompt.category,
                previewTop: split.top,
                tags: (prompt as any).tags?.slice(0, 3) || DUMMY_TAGS.slice(0, 3),
                score: score,
            };
        });
    }, [prompts]);

    return (
        <main className="min-h-[calc(100vh-4rem)] pt-20 px-2 py-12 sm:px-3 lg:px-4 xl:px-6 pb-40">
            <section className="mx-auto w-full max-w-[1720px]">
                <div className="mb-6">
                    {error ? <p className="text-sm text-[#a33b3b]">{error}</p> : null}
                </div>

                {loading && renderCards.length === 0 ? (
                    <div className="py-12 text-center text-[#2b2d32]">Loading prompt cards...</div>
                ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))' }}>
                    {renderCards.map((card: RenderCard, index: number) => {
                        const isLight = !isDarkMode;
                        const isSelected = selectedCardIndex === index;

                        return (
                            <div
                                key={card.id}
                                className="w-full"
                                data-card-index={index}
                            >
                                <article
                                    style={isSelected ? {
                                        boxShadow: `0 0 0 4px #f3eed9, 0 0 0 8px #0080FF, 0 0 20px 12px rgba(102, 51, 255, 0.3)`
                                    } : undefined}
                                    className={`relative flex h-[540px] w-full flex-col overflow-hidden rounded-[30px] px-6 pb-6 pt-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow ${isSelected ? '-translate-y-0.5 shadow' : ''} ${
                                        isLight
                                            ? 'bg-[#dfdfdc] text-[#1f2126]'
                                            : 'bg-[#17181b] text-[#e2e2e5] shadow-black/40 hover:ring-white/20 hover:shadow-black/60'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <TooltipProvider delay={200}>
                                        <div
                                            className={`inline-flex overflow-hidden rounded-[10px] ${isLight ? 'border border-[#cfcfcb]' : 'border border-white/12'
                                                }`}
                                        >
                                            {(isLight
                                                ? ['#2d2d31', '#47474b', '#646468', '#7f7f83', '#99999d', '#b9b9bc', '#ececed']
                                                : ['#2a2b2f', '#3a3b40', '#4b4c51', '#5f6065', '#7f8086', '#a2a3a8', '#e6e6e7']
                                            ).map((tone, toneIndex) => {
                                                const paletteIcons = [ClaudeLogo, null, GeminiLogo, CopilotLogo, GrokLogo, PerplexityLogo, DeepSeekLogo];
                                                const paletteNames = ['Claude', 'ChatGPT', 'Gemini', 'Copilot', 'Grok', 'Perplexity', 'DeepSeek'];
                                                const paletteBrands = ['#D97757', '#10A37F', '#4285F4', '#B95FC2', '#000000', '#000000', '#3964fe'];
                                                const paletteUrls = ['https://claude.ai', 'https://chatgpt.com', 'https://gemini.google.com', 'https://copilot.microsoft.com', 'https://grok.x.com', 'https://www.perplexity.ai', 'https://www.deepseek.com/en'];
                                                const paletteKeys = ['C', 'G', 'M', 'O', 'K', 'P', 'D'];
                                                const Icon = paletteIcons[toneIndex];
                                                const isOpenAI = toneIndex === 1;
                                                const modelName = paletteNames[toneIndex];
                                                const brandColor = paletteBrands[toneIndex];
                                                const modelUrl = paletteUrls[toneIndex];
                                                const shortcutKey = paletteKeys[toneIndex];

                                                return (
                                                    <Tooltip key={`${card.id}-tone-${toneIndex}`}>
                                                        <TooltipTrigger
                                                            className="grid h-[34px] w-[34px] place-items-center transition-colors duration-200 cursor-pointer"
                                                            style={{ backgroundColor: tone }}
                                                            onMouseEnter={e => {
                                                                e.currentTarget.style.backgroundColor = brandColor;
                                                                const icon = e.currentTarget.querySelector('.icon') as HTMLElement;
                                                                if (icon) icon.style.color = '#ffffff';
                                                            }}
                                                            onMouseLeave={e => {
                                                                e.currentTarget.style.backgroundColor = tone;
                                                                const icon = e.currentTarget.querySelector('.icon') as HTMLElement;
                                                                if (icon) icon.style.color = (toneIndex === 5 || toneIndex === 6) ? '#111111' : '#f7f7f8';
                                                            }}
                                                            onFocus={e => {
                                                                e.currentTarget.style.backgroundColor = brandColor;
                                                                const icon = e.currentTarget.querySelector('.icon') as HTMLElement;
                                                                if (icon) icon.style.color = '#ffffff';
                                                            }}
                                                            onBlur={e => {
                                                                e.currentTarget.style.backgroundColor = tone;
                                                                const icon = e.currentTarget.querySelector('.icon') as HTMLElement;
                                                                if (icon) icon.style.color = (toneIndex === 5 || toneIndex === 6) ? '#111111' : '#f7f7f8';
                                                            }}
                                                            onClick={() => window.open(modelUrl, '_blank')}
                                                            aria-label={`Open ${modelName}`}
                                                        >
                                                            {isOpenAI ? (
                                                                <OpenAILogo className="icon h-[14px] w-[14px] text-[#f7f7f8]" />
                                                            ) : toneIndex === 0 ? (
                                                                <ClaudeLogo className="icon h-[12px] w-[12px] text-[#f7f7f8]" />
                                                            ) : toneIndex === 2 ? (
                                                                <GeminiLogo className="icon h-[14px] w-[14px] text-[#f7f7f8]" />
                                                            ) : toneIndex === 3 ? (
                                                                <CopilotLogo className="icon h-[14px] w-[14px] text-[#f7f7f8]" />
                                                            ) : toneIndex === 4 ? (
                                                                <GrokLogo className="icon h-[14px] w-[14px] text-[#f7f7f8]" />
                                                            ) : toneIndex === 5 ? (
                                                                <PerplexityLogo className="icon h-[14px] w-[14px] text-[#111111]" />
                                                            ) : toneIndex === 6 ? (
                                                                <DeepSeekLogo className="icon h-[14px] w-[14px] text-[#111111]" />
                                                            ) : Icon ? (
                                                                <Icon
                                                                    size={14}
                                                                    strokeWidth={2.3}
                                                                    className={`icon ${toneIndex === 6 ? 'text-[#111111]' : 'text-[#f7f7f8]'}`}
                                                                />
                                                            ) : null}
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="flex items-center gap-2">
                                                            <span>Open {modelName}</span>
                                                            {/* <Kbd>{shortcutKey}</Kbd> */}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                );
                                            })}
                                        </div>
                                        </TooltipProvider>

                                        <p className={`text-[44px] font-bold leading-none ${isLight ? 'text-[#303237]' : 'text-[#f0f0f2]'}`}>”</p>
                                    </div>

                                    <h2 className={`mt-8 text-[46px] font-bold leading-[0.9] tracking-[-0.04em] ${isLight ? 'text-[#222429]' : 'text-[#f0f0f2]'}`}>
                                        {card.titleLines.map((line: string) => (
                                            <span key={`${card.id}-${line}`}>
                                                {line}
                                                <br />
                                            </span>
                                        ))}
                                    </h2>

                                    <Button
                                        variant="link"
                                        size="sm"
                                        className={`mt-6 pl-0 justify-start text-[13px] font-semibold uppercase tracking-[0.05em] h-auto py-1.5 ${isLight
                                                ? 'text-[#33353a] border-[#d0d0cc]'
                                                : 'text-[#f0f0f2] border-white/10'
                                            // : 'bg-white/5 text-[#f0f0f2] border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        {card.category}
                                    </Button>

                                    <p className={`mt-6 text-[14px] leading-[1.3] tracking-[-0.01em] ${isLight ? 'text-[#1f2126]' : 'text-[#e2e2e5]'}`}>
                                        {card.previewTop}
                                    </p>

                                    <div className={`mt-3 flex flex-wrap gap-2`}>
                                        {card.tags.map((tag: string) => (
                                            <span
                                                key={`${card.id}-tag-${tag}`}
                                                className={`inline-flex text-[11px] font-medium uppercase tracking-[0.03em] px-2 py-1 rounded ${isLight
                                                        ? 'bg-[#f0f0f0] text-[#666666]'
                                                        : 'bg-white/8 text-[#b0b0b5]'
                                                    }`}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className={`mt-auto flex items-center justify-between pt-8 ${isLight ? 'text-[#181a1f]' : 'text-[#f0f0f2]'}`}>
                                        <CircularScore score={card.score} isLight={isLight} />
                                    </div>
                                </article>
                            </div>
                        );
                    })}
                </div>
                )}

                {/* Infinite scroll trigger (placed after cards so it activates near the end) */}
                <div ref={loadMoreRef} className="mt-8 flex min-h-6 justify-center">
                    {loadingMore && (
                        <div className="text-center text-[#44474f]">Loading more prompts...</div>
                    )}
                </div>
            </section>

            {/* Bottom Search Bar */}
            <BottomSearchBar
                search={search}
                setSearch={setSearch}
                category={category}
                setCategory={setCategory}
                tier={tier}
                setTier={setTier}
                date={date}
                setDate={setDate}
                onClearAll={clearFilters}
            />
        </main>
    );
}
