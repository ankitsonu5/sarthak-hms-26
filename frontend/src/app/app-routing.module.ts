import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    loadChildren: () => import('./modules/admin/admin.module').then((m) => m.AdminModule),
  },
  {
    path: 'doctor',
    canActivate: [AuthGuard],
    loadChildren: () => import('./modules/doctor/doctor.module').then((m) => m.DoctorModule),
  },
  {
    path: 'nurse',
    canActivate: [AuthGuard],
    loadChildren: () => import('./modules/nurse/nurse.module').then((m) => m.NurseModule),
  },
  {
    path: 'patient',
    canActivate: [AuthGuard],
    loadChildren: () => import('./modules/patient/patient.module').then((m) => m.PatientModule),
  },
  {
    path: 'pharmacy',
    canActivate: [AuthGuard],
    loadChildren: () => import('./modules/pharmacy/pharmacy.module').then((m) => m.PharmacyModule),
  },
  {
    path: 'lab',
    canActivate: [AuthGuard],
    loadChildren: () => import('./modules/lab/lab.module').then((m) => m.LabModule),
  },
  {
    path: 'billing',
    canActivate: [AuthGuard],
    loadChildren: () => import('./modules/billing/billing.module').then((m) => m.BillingModule),
  },
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
