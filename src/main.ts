import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './routes';

const applicationConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideRouter(routes)],
};

bootstrapApplication(App, applicationConfig).catch((err) => console.error(err));
