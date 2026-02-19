import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { WorkflowLandingComponent } from './workflow-landing/workflow-landing.component';
import { WorkflowBuilderComponent } from './workflow-builder/workflow-builder.component';
import { WorkflowTestingComponent } from './workflow-testing/workflow-testing.component';
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [
    AppComponent,
    WorkflowLandingComponent,
    WorkflowBuilderComponent,
    WorkflowTestingComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }  