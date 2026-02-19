import { Injectable } from '@angular/core';

export interface HospitalConfig {
  hospitalId?: string;
  hospitalName: string;
  themeId: string;
  logoUrl?: string;
  primaryColor?: string;
}

@Injectable({ providedIn: 'root' })
export class HospitalConfigService {
  private config: HospitalConfig | null = null;

  async loadConfig(): Promise<HospitalConfig> {
    if (this.config) return this.config;
    try {
      const res = await fetch('/config/hospital-config.json');
      this.config = await res.json();
      return this.config!;
    } catch {
      this.config = { hospitalName: 'HMS', themeId: 'default' };
      return this.config;
    }
  }

  getConfig(): HospitalConfig | null {
    return this.config;
  }
}
