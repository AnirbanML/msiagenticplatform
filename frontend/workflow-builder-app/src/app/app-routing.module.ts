import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WorkflowLandingComponent } from './workflow-landing/workflow-landing.component';
import { WorkflowBuilderComponent } from './workflow-builder/workflow-builder.component';

const routes: Routes = [
  { path: '', component: WorkflowLandingComponent },
  { path: 'pipeline', component: WorkflowBuilderComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
