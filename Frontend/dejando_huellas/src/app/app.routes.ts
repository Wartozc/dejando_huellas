import { Routes } from '@angular/router';
import { authGuard, adminGuard, publicGuard } from './core/guards';

// Layouts
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';

// Auth
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';

// Public
import { HomeComponent } from './features/public/home/home.component';
import { AboutComponent } from './features/public/about/about.component';
import { ActivitiesComponent } from './features/public/activities/activities.component';
import { ActivityDetailComponent } from './features/public/activities/activity-detail.component';
import { ContactComponent } from './features/public/contact/contact.component';

// Admin
import { AdminDashboardComponent } from './features/admin/dashboard/admin-dashboard.component';
import { AdminMembersComponent } from './features/admin/members/admin-members.component';
import { AdminPublicationsComponent } from './features/admin/publications/admin-publications.component';
import { AdminContactComponent } from './features/admin/contact/admin-contact.component';

export const routes: Routes = [
  // Public Layout Routes
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'nosotros', component: AboutComponent },
      { path: 'actividades', component: ActivitiesComponent },
      { path: 'actividades/:id', component: ActivityDetailComponent },
      { path: 'contacto', component: ContactComponent },
    ]
  },
  
  // Auth Routes (no layout)
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [publicGuard]
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [publicGuard]
  },
  
  // Admin Layout Routes
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'members', component: AdminMembersComponent },
      { path: 'publications', component: AdminPublicationsComponent },
      { path: 'contact', component: AdminContactComponent },
    ]
  },
  
  // Wildcard redirect
  { path: '**', redirectTo: '' }
];
