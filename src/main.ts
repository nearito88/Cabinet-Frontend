import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { publicRoutes, protectedRoutes } from './app/app.routes';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

// Combine all routes
const routes = [
  ...publicRoutes,
  ...protectedRoutes,
  { path: '**', redirectTo: '/home' } // Redirect to home for unknown routes
];

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes), // Provide your routes to the router
    ...appConfig.providers, 
    provideCharts(withDefaultRegisterables())
  ]
})
  .catch((err) => console.error(err));
