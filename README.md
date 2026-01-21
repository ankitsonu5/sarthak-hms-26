# SarthakHms26

## Project Structure Overview
### src/app folder (frontend)

**src/app/** – Is folder me ek single Angular/React app ka main code hota hai. Agar aapka project ek hi app hai (jaise ek hospital portal), to saara UI code yahin hota hai. Lekin agar aapke paas multiple modules/apps hain (doctor, nurse, patient-portal, etc.), to har ek ke liye alag folder frontend/ ke andar hota hai, aur src/app sirf ek default app ke liye use hota hai.

### Why keep frontend separate?

**Mono repo me frontend alag rakhne ke fayde:**
- Har user role/module (doctor, nurse, admin, patient, vendor) ka apna UI code hota hai, jo easily manage ho sakta hai.
- Scalability: Naye modules add karna easy ho jata hai, bina purane code ko touch kiye.
- Team collaboration: Alag teams apne module par kaam kar sakti hain, bina code conflict ke.
- Reusability: Shared folder me common components/services rakh sakte hain, jo sab modules use kar sakte hain.
- Deployment: Alag-alag apps/modules ko independently build & deploy kar sakte hain.

**Summary:**
src/app ek single app ke liye hai. Agar aapka HMS multi-module hai, to frontend/ ke andar har module ka apna folder hona chahiye. Isse project maintainable, scalable aur professional banta hai.

**frontend/** – Contains all frontend modules/apps (doctor, nurse, patient-portal, vendor-panel, hospital-admin, shared components)
**hospital-backend/** – Main backend codebase (API, integrations, jobs, security, etc.)
**public/** – Static public assets
**src/** – Main Angular/React app entry point and configuration
**dist/** – Build output directory
**node_modules/** – Installed dependencies
**.vscode/**, **.editorconfig**, **.gitignore** – Configuration and settings files
**angular.json**, **package.json**, **tsconfig.json** – Project configuration files

### hospital-backend/ subfolders
**docker/** – Docker and deployment files
**gateway/** – API gateway, authentication, rate limiting
**monitoring/** – Health checks, error logs
**scripts/** – Automation scripts
**sql/** – Database scripts (functions, migrations, procedures, triggers, views, seed data)
**src/** – Main backend source code
	- **api/** – Controllers, routes, validators
	- **config/** – Configuration files
	- **core/** – Core backend modules (auth, cache, notification, queue)
	- **domains/** – Business domains (admin, clinical, finance, hr, operations)
	- **integrations/** – External integrations (abdm, insurance, payment, sms-email)
	- **jobs/** – Scheduled jobs
	- **middlewares/** – Express middlewares
	- **security/** – Security policies and utilities
	- **vendor/** – Vendor-specific modules
	- **uploads/** – File uploads

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.6.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
