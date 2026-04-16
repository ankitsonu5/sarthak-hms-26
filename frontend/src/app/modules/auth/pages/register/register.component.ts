import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, MasterRole } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: false,
  host: { class: 'block min-h-screen' },
})
export class RegisterComponent implements OnInit {
  form: FormGroup;
  roles: MasterRole[] = [];
  loading = false;
  error = '';
  success = '';
  showPassword = false;
  showConfirm = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group(
      {
        full_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
        email: ['', [Validators.required, Validators.email]],
        phone: [''],
        role_id: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    this.auth.getRoles().subscribe({
      next: (res) => {
        if (res.success) this.roles = res.data;
      },
    });
  }

  passwordMatchValidator(group: AbstractControl): { [key: string]: boolean } | null {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const { confirmPassword, ...payload } = this.form.value;
    payload.role_id = Number(payload.role_id);

    this.auth.register(payload).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.success = 'Account created successfully! Redirecting to login...';
          setTimeout(() => this.router.navigate(['/auth/login']), 2000);
        } else {
          this.error = res.message || 'Registration failed';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Server error. Please try again.';
      },
    });
  }

  get f() {
    return this.form.controls;
  }
}
