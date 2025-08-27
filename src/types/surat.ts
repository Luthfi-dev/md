
export interface SuratField {
  id: string;
  label: string;
}

export interface CarouselItem {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  status: 'draft' | 'published';
}


export interface Template {
  id: string;
  title: string;
  content: string;
  fields: SuratField[];
  isPro: boolean;
  ads: {
    banner: AdSetting;
    poster: AdSetting;
  };
  lastModified: string; // ISO string
  status: 'public' | 'private'; // New status field
}

export interface AdSetting {
  enabled: boolean;
  type: 'platform' | 'manual';
  value: string; // Ad ID for platform, image data URL for manual
}

export interface TemplateDataToShare {
  template: string;
  fields: SuratField[];
  isPro: boolean;
}
