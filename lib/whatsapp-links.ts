export interface DomainWhatsAppLinks {
    technical: string;
    design: string;
    marketing: string;
    management: string;
    content: string;
    general: string;
    [key: string]: string;
}

export const DEFAULT_WHATSAPP_LINKS: DomainWhatsAppLinks = {
    technical: 'https://chat.whatsapp.com/ecell-jec-technical',
    design: 'https://chat.whatsapp.com/ecell-jec-design',
    marketing: 'https://chat.whatsapp.com/ecell-jec-marketing',
    management: 'https://chat.whatsapp.com/ecell-jec-management',
    content: 'https://chat.whatsapp.com/ecell-jec-content',
    general: 'https://chat.whatsapp.com/ecell-jec-community',
};

const STORAGE_KEY = 'ecell_portal_domain_whatsapp_links';

export function getStoredWhatsAppLinks(): DomainWhatsAppLinks {
    if (typeof window === 'undefined') return DEFAULT_WHATSAPP_LINKS;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return { ...DEFAULT_WHATSAPP_LINKS, ...parsed };
        }
    } catch (e) {
        console.error('Error reading whatsapp links from localStorage:', e);
    }
    return DEFAULT_WHATSAPP_LINKS;
}

export function saveStoredWhatsAppLinks(links: DomainWhatsAppLinks): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
    } catch (e) {
        console.error('Error saving whatsapp links to localStorage:', e);
    }
}

export function resolveDomainKey(domain: string): keyof DomainWhatsAppLinks {
    const d = (domain || '').toLowerCase().trim();
    if (d.includes('tech') || d.includes('web') || d.includes('code') || d.includes('app')) return 'technical';
    if (d.includes('design') || d.includes('ui') || d.includes('ux') || d.includes('video') || d.includes('media')) return 'design';
    if (d.includes('market') || d.includes('growth') || d.includes('social') || d.includes('sponsor')) return 'marketing';
    if (d.includes('manage') || d.includes('pr') || d.includes('public') || d.includes('lead')) return 'management';
    if (d.includes('content') || d.includes('write') || d.includes('editorial') || d.includes('copy')) return 'content';
    return 'general';
}

export function getLinkForDomain(domain: string, links?: DomainWhatsAppLinks): string {
    const currentLinks = links || (typeof window !== 'undefined' ? getStoredWhatsAppLinks() : DEFAULT_WHATSAPP_LINKS);
    const key = resolveDomainKey(domain);
    return currentLinks[key] || currentLinks.general || DEFAULT_WHATSAPP_LINKS.general;
}
