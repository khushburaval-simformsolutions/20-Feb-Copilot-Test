import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { HealthComponent } from './components/health/health.component';
import { TaskListComponent } from './components/task-list/task-list.component';
import { TaskFormComponent } from './components/task-form/task-form.component';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from './shared/components/error-message/error-message.component';
import { SyncStatusComponent } from './shared/components/sync-status/sync-status.component';
import { TaskService } from './core/services/task.service';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HealthComponent,
    TaskListComponent,
    LoadingSpinnerComponent,
    ErrorMessageComponent,
    SyncStatusComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    DragDropModule,
    AppRoutingModule,
    TaskFormComponent
  ],
  providers: [TaskService],
  bootstrap: [AppComponent]
})
export class AppModule { }
