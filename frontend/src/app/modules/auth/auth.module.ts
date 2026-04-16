import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AuthPanelComponent } from './components/auth-panel/auth-panel.component';

@NgModule({
  declarations: [LoginComponent, RegisterComponent, AuthPanelComponent],
  imports: [SharedModule, AuthRoutingModule],
})
export class AuthModule {}
