import { Component } from '@angular/core';

@Component({
  selector: 'app-auth-panel',
  templateUrl: './auth-panel.component.html',
  standalone: false,
  host: { class: 'hidden lg:block w-1/2' },
})
export class AuthPanelComponent {}
