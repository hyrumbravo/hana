import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin, catchError } from 'rxjs';
import { switchMap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private projectBaseUrl = 'http://18.139.82.238:4000/database/projects'; // Base URL
  private phaseBaseUrl = 'http://18.139.82.238:4000/database/project_phase';




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







  updatePhase(phase: any): Observable<any> {
    const totalMilestones = phase.milestones.length;
    const progressPerMilestone = 100 / totalMilestones; // This is the percentage each milestone represents
    
    // Distribute the phase progress to the milestones
    let progressRemaining = phase.progress; // This is the overall phase progress
    
    phase.milestones = phase.milestones.map((milestone, index) => {
      let milestoneProgress = 0;
  
      if (progressRemaining > 0) {
        // Calculate the percentage for each milestone
        if (progressRemaining >= progressPerMilestone) {
          milestoneProgress = 100; // This milestone gets full progress
          progressRemaining -= progressPerMilestone; // Subtract the progress taken by this milestone
        } else {
          milestoneProgress = (progressRemaining / progressPerMilestone) * 100; // Partial progress for this milestone
          progressRemaining = 0; // No more remaining progress
        }
      }
  
      return {
        ...milestone,
        previous: milestoneProgress, // Set the milestone progress based on phase progress
      };
    });
  
    return this.http.put(`${this.phaseBaseUrl}/${phase._id}`, phase, { headers: this.headers });
  }
  


  
  //get phases by ID for updating
  getPhaseById(phaseId: string): Observable<any> {
    return this.http.get(`${this.phaseBaseUrl}/${phaseId}`, { headers: this.headers });
  }







  updateProjectProgress(projectId: string): Observable<any> {
    const findUrl = `${this.projectBaseUrl}/_find`;
    const requestBody = {
      selector: { projectId: projectId },
      fields: ["_id", "_rev", "progress", "projectName", "projectDescription", "clientName", "startDate", "deadline", "totalAmount", "downPayment", "projectId"]
    };
  
    return this.http.post(findUrl, requestBody, { headers: this.headers }).pipe(
      switchMap((response: any) => {
        if (response.docs.length > 0) {
          const project = response.docs[0]; // Get the project document
  
          // Fetch all phases for the project
          return this.getPhases(projectId).pipe(
            switchMap((phaseResponse: any) => {
              let totalProgress = 0;
  
              if (phaseResponse.docs.length > 0) {
                phaseResponse.docs.forEach((phase: any) => {
                  const phaseContribution = (phase.progress / 100) * phase.percentage;
                  totalProgress += phaseContribution;
                });
              }
  
              const newProgress = Math.round(totalProgress);
  
              // Update the project's progress
              const updateUrl = `${this.projectBaseUrl}/${project._id}?rev=${project._rev}`;
              const updatedProject = { ...project, progress: newProgress };
  
              return this.http.put(updateUrl, updatedProject, { headers: this.headers });
            })
          );
        } else {
          return of(null);
        }
      })
    );
  }

  
  updateMilestone(phaseId: string, milestone: any): Observable<any> {
    const phaseUrl = `${this.phaseBaseUrl}/${phaseId}`;
    
    return this.http.get(phaseUrl, { headers: this.headers }).pipe(
      switchMap((phase: any) => {
        // Find the milestone index in the phase milestones array
        const milestoneIndex = phase.milestones.findIndex(m => m._id === milestone._id);
        
        if (milestoneIndex !== -1) {
          // Ensure that we are updating the correct milestone in the array
          const updatedPhase = { ...phase }; // Make a shallow copy of the phase
          updatedPhase.milestones = [...phase.milestones]; // Make a shallow copy of the milestones array
  
          // Update the specific milestone in the copied array
          updatedPhase.milestones[milestoneIndex] = { ...milestone }; // Ensure a deep copy of the updated milestone
  
          // Save the updated phase back to the database
          return this.http.put(`${this.phaseBaseUrl}/${updatedPhase._id}?rev=${updatedPhase._rev}`, updatedPhase, { headers: this.headers });
        }
        
        return of(null); // If the milestone doesn't exist
      })
    );
  }
  
  







}
