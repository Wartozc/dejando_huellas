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

// Chat
import { ChatComponent } from './features/chat/chat.component';

// Admin
import { AdminDashboardComponent } from './features/admin/dashboard/admin-dashboard.component';
import { AdminMembersComponent } from './features/admin/members/admin-members.component';
import { AdminCommunitiesComponent } from './features/admin/communities/admin-communities.component';
import { AdminPublicationsComponent } from './features/admin/publications/admin-publications.component';
import { AdminContactComponent } from './features/admin/contact/admin-contact.component';
import { AdminHabeasDataComponent } from './features/admin/habeas-data/admin-habeas-data.component';
import { AdminReportComponent } from './features/admin/report/admin-report.component';
import { AdminChatBotComponent } from './features/admin/chatbot/admin-chatbot.component';

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
      { path: 'comunidad', component: ChatComponent, canActivate: [authGuard] },
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
    component: RegisterComponent
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
      { path: 'communities', component: AdminCommunitiesComponent },
      { path: 'publications', component: AdminPublicationsComponent },
      { path: 'contact', component: AdminContactComponent },
      { path: 'habeas-data', component: AdminHabeasDataComponent },
      { path: 'chatbot', component: AdminChatBotComponent },
      { path: 'report', component: AdminReportComponent },
    ]
  },
  
  // Wildcard redirect
  { path: '**', redirectTo: '' }
];
