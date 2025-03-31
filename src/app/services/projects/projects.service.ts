import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private projectBaseUrl = 'http://18.139.82.238:4000/database/projects'; // Base URL
  private phaseBaseUrl = 'http://18.139.82.238:4000/database/project_phase';
  private milestoneBaseUrl = 'http://18.139.82.238:4000/database/phase_milestones';

  headers = new HttpHeaders()
    .set('Authorization', `Basic ${btoa('admin:h@n@')}`) // Basic Auth
    .set('Content-Type', 'application/json');

  constructor(private http: HttpClient) {}

  // Fetch all projects
  getProjects(): Observable<any> {
    return this.http.get(`${this.projectBaseUrl}/_all_docs?include_docs=true`, { headers: this.headers });
  }


  
  

  // Create a new project
  createProject(projectData: any): Observable<any> {
    return this.http.post(this.projectBaseUrl, projectData, { headers: this.headers });
  }




  // Save Milestone(create form)
  createMilestone(milestoneData: any): Observable<any> {
    return this.http.post(this.milestoneBaseUrl, milestoneData, { headers: this.headers });
  }

// ✅ DELETE PROJECT BY projectId
  deleteProjectByProjectId(projectId: string): Observable<any> {
    const findUrl = `${this.projectBaseUrl}/_find`;
    const requestBody = {
      selector: { projectId: projectId },
      fields: ["_id", "_rev"]
    };

    return this.http.post(findUrl, requestBody, { headers: this.headers }).pipe(
      switchMap((response: any) => {
        if (response.docs.length > 0) {
          const project = response.docs[0]; // Assuming one project per projectId
          const deleteUrl = `${this.projectBaseUrl}/${project._id}?rev=${project._rev}`;
          return this.http.delete(deleteUrl, { headers: this.headers });
        } else {
          return of(null);
        }
      })
    );
  }

  







  // Fetch phases with Project ID
  getPhases(projectId: string): Observable<any> {
    const url = `${this.phaseBaseUrl}/_find`;
    const requestBody = {
      selector: {
        projectId: projectId
      },
      fields: ["_id", "phaseName", "startDate", "deadline", "percentage", "amountToBill","progress", "projectId", "milestones"]
    };
  
    return this.http.post(url, requestBody, { headers: this.headers });
  }



  // ✅ DELETE PHASES BY projectId
  deletePhasesByProjectId(projectId: string): Observable<any> {
    const findUrl = `${this.phaseBaseUrl}/_find`;
    const requestBody = {
      selector: { projectId: projectId },
      fields: ["_id", "_rev"]
    };

    return this.http.post(findUrl, requestBody, { headers: this.headers }).pipe(
      switchMap((response: any) => {
        if (response.docs.length > 0) {
          const deleteRequests = response.docs.map((phase: any) => {
            const deleteUrl = `${this.phaseBaseUrl}/${phase._id}?rev=${phase._rev}`;
            return this.http.delete(deleteUrl, { headers: this.headers });
          });

          return forkJoin(deleteRequests);
        } else {
          return of(null);
        }
      })
    );
  }

    // Save a new phase
  createPhase(phaseData: any) {
    return this.http.post(this.phaseBaseUrl, phaseData, { headers: this.headers });
  }


  // Update a phase
  updatePhase(phase: any): Observable<any> {
    return this.http.put(`${this.phaseBaseUrl}/${phase._id}`, phase, { headers: this.headers });
  }
  //get phases by ID for updating
  getPhaseById(phaseId: string): Observable<any> {
    return this.http.get(`${this.phaseBaseUrl}/${phaseId}`, { headers: this.headers });
  }




  // Fetch a milestone by ID
  getMilestoneById(milestoneId: string): Observable<any> {
    return this.http.get(`${this.milestoneBaseUrl}/${milestoneId}`, { headers: this.headers });
  }

  
  // Update milestone
  updateMilestone(milestone: any): Observable<any> {
    return this.http.put(`${this.milestoneBaseUrl}/${milestone._id}`, milestone, { headers: this.headers });
  }
  
  
  

}
